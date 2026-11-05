package es.api_idee.api;

import java.util.ArrayList;
import java.util.List;

import javax.servlet.ServletContext;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MultivaluedMap;
import javax.ws.rs.core.UriInfo;

import org.json.JSONArray;
import org.json.JSONObject;

import es.api_idee.builder.JSBuilder;
import es.api_idee.parameter.Parameters;
import es.api_idee.parameter.parser.ParametersParser;
import es.api_idee.plugins.PluginsManager;

@Produces("application/javascript; charset=UTF-8")
@Path("/")
public class BuilderWS {

   @Context
   private ServletContext context;
   
   /**
    * Provides the code to build a map using the Javascript
    * API through GET method
    * 
    * @param callbackFn the name of the javascript
    * function to execute as callback
    * 
    * @return the javascript code
    */
   @GET
   @Path("/js")
   @Produces("text/plain; charset=UTF-8")
   public String js(@Context UriInfo uriInfo) {
      MultivaluedMap<String, String> queryParams = uriInfo.getQueryParameters();

      Parameters parameters = ParametersParser.parse(queryParams);

      // plugins
      PluginsManager.init(context);
      List<String> plugins = PluginsManager.getPlugins(queryParams);

      List<String> controls = detectKeyValueControls(queryParams);
      List<String> layers = detectKeyValueLayers(queryParams);

      // When detect functions handle controls/layers (any format), remove them from
      // parameters to avoid client-side duplication with IDEE.map({controls/layers:[...]})
      if (!controls.isEmpty()) {
         parameters.clearControls();
      }
      if (!layers.isEmpty()) {
         parameters.clearLayers();
      }

      String codeJS = JSBuilder.build(parameters, plugins,
            controls.isEmpty() ? null : controls,
            layers.isEmpty() ? null : layers,
            null);

      return codeJS;
   }

   /**
    * Provides the code to build a map using the Javascript
    * API through POST method
    * 
    * @param jsonBody the JSON body with the configuration
    * 
    * @return the javascript code
    */
   @POST
   @Path("/js")
   @Consumes("application/json")
   @Produces("text/plain; charset=UTF-8")
   public String jsPost(@Context UriInfo uriInfo, String jsonBody) {
      try {
         // Parse JSON body
         JSONObject json = new JSONObject(jsonBody);

         // Parse map parameters
         Parameters parameters = ParametersParser.parseFromJSON(jsonBody);
         // Ensure container defaults to "map" when no map config is present in the body
         if (parameters.toJSON().optString("container", "").isEmpty()) {
            parameters.addContainer("map");
         }

         // Parse plugins
         List<String> plugins = new ArrayList<>();
         if (json.has("plugins")) {
            JSONArray pluginsArray = json.getJSONArray("plugins");
            for (int i = 0; i < pluginsArray.length(); i++) {
               JSONObject pluginJson = pluginsArray.getJSONObject(i);
               String pluginCode = JSBuilder.createPluginFromJSON(pluginJson);
               plugins.add(pluginCode);
            }
         }

         // Parse controls
         List<String> controls = new ArrayList<>();
         if (json.has("controls")) {
            JSONArray controlsArray = json.getJSONArray("controls");
            for (int i = 0; i < controlsArray.length(); i++) {
               JSONObject controlJson = controlsArray.getJSONObject(i);
               String controlCode = JSBuilder.createControlFromJSON(controlJson);
               controls.add(controlCode);
            }
         }

         // Parse layers
         List<String> layers = new ArrayList<>();
         if (json.has("layers")) {
            JSONArray layersArray = json.getJSONArray("layers");
            for (int i = 0; i < layersArray.length(); i++) {
               JSONObject layerJson = layersArray.getJSONObject(i);
               String layerCode = JSBuilder.createLayerFromJSON(layerJson);
               layers.add(layerCode);
            }
         }

         // Parse configuration for IDEE.config assignments
         JSONObject configuration = null;
         if (json.has("configuration")) {
            configuration = json.getJSONObject("configuration");
         }

         String codeJS = JSBuilder.build(parameters, plugins, controls, layers, configuration);

         return codeJS;
      } catch (Exception e) {
         e.printStackTrace();
         return "// Error processing JSON: " + e.getMessage();
      }
   }

   /**
    * Reads the star-format layers param and returns each entry as a quoted JS string
    * for client-side processing via buildLayer.
    *
    * Format: layers=TYPE*key=val;key=val,...
    * Example: layers=WMTS*url=http://...;name=MTN,WMS*url=http://...;name=capas
    */
   private List<String> detectKeyValueLayers(MultivaluedMap<String, String> queryParams) {
      List<String> layers = new ArrayList<>();
      String layersParam = queryParams.getFirst("layers");
      if (layersParam != null) {
         for (String entry : ParametersParser.parseLayers(layersParam)) {
            layers.add(JSBuilder.createLayerWithParams(entry));
         }
      }
      return layers;
   }

   /**
    * Reads the star-format controls param and returns each entry as a JS object.
    *
    * Format: controls=name*key=val;key=val,...
    * Example: controls=scale,timeline*order=2,attributions*position=down
    */
   private List<String> detectKeyValueControls(MultivaluedMap<String, String> queryParams) {
      List<String> controls = new ArrayList<>();
      String controlsParam = queryParams.getFirst("controls");
      if (controlsParam != null) {
         for (String entry : controlsParam.split(",")) {
            entry = entry.trim();
            if (!entry.isEmpty()) {
               controls.add(JSBuilder.createControlWithParams(entry));
            }
         }
      }
      return controls;
   }
}
