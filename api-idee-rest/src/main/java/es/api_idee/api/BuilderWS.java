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
   public String js(@Context UriInfo uriInfo) {
      MultivaluedMap<String, String> queryParams = uriInfo.getQueryParameters();

      Parameters parameters = ParametersParser.parse(queryParams);
      
      // plugins
      PluginsManager.init(context);
      List<String> plugins = PluginsManager.getPlugins(queryParams);
      
      String codeJS = JSBuilder.build(parameters, plugins);

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
   public String jsPost(@Context UriInfo uriInfo, String jsonBody) {
      try {
         // Parse JSON body
         JSONObject json = new JSONObject(jsonBody);

         // Parse map parameters
         Parameters parameters = ParametersParser.parseFromJSON(jsonBody);

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
}
