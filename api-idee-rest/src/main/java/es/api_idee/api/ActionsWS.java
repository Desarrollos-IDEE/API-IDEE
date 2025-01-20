package es.api_idee.api;

import java.util.ResourceBundle;

import javax.servlet.ServletContext;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;

import org.json.JSONArray;
import org.json.JSONObject;

import es.api_idee.builder.JSBuilder;
import es.api_idee.parameter.PluginAPI;
import es.api_idee.plugins.PluginsManager;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.io.IOException;

/**
 * This class manages the available actions an user can execute
 * 
 * @author Guadaltel S.A.
 */
@Path("/actions")
@Produces("application/javascript")
public class ActionsWS {

	@Context
	private ServletContext context;

	private ResourceBundle versionProperties = ResourceBundle.getBundle("version");
	private ResourceBundle configProperties = ResourceBundle.getBundle("configuration");

	/*
	 * # services services=${services} # theme theme.urls=${theme.urls}
	 * theme.names=${theme.names} # projection projection=${api-idee.proj.default}
	 */

	/**
	 * The available actions the user can execute
	 * 
	 * @param callbackFn the name of the javascript function to execute as callback
	 * 
	 * @return the javascript code
	 */
	@GET
	public String showAvailableActions(@QueryParam("callback") String callbackFn) {
		JSONArray actions = new JSONArray();

		actions.put("/controls");
		actions.put("/services");
		actions.put("/version");
		actions.put("/themes");
		actions.put("/projection");
		actions.put("/plugins");
		actions.put("/resources/svg");

		actions.put("/../../doc/ol");
		actions.put("/../../doc/cesium");

//      actions.put("/apk");

		return JSBuilder.wrapCallback(actions, callbackFn);
	}

	/**
	 * The available controls the user can use
	 * 
	 * @param callbackFn the name of the javascript function to execute as callback
	 * 
	 * @return the javascript code
	 */
	@GET
	@Path("/controls")
	public String showAvailableControls(@QueryParam("callback") String callbackFn) {
		String controlsRaw = configProperties.getString("controls");
		String[] controls = controlsRaw.split(",");

		JSONArray controlsJSON = new JSONArray();

		for (String control : controls) {
			controlsJSON.put(control);
		}

		return JSBuilder.wrapCallback(controlsJSON, callbackFn);
	}

	/**
	 * Returns the available services for the user
	 * 
	 * @param callbackFn the name of the javascript function to execute as callback
	 * 
	 * @return the javascript code
	 */
	@GET
	@Path("/services")
	public String showAvailableServices(@QueryParam("callback") String callbackFn) {
		String servicesRaw = configProperties.getString("services");
		String[] services = servicesRaw.split(",");

		JSONArray servicesJSON = new JSONArray();

		for (String service : services) {
			servicesJSON.put(service);
		}

		return JSBuilder.wrapCallback(servicesJSON, callbackFn);
	}

	/**
	 * Returns the available themes for the user
	 * 
	 * @param callbackFn the name of the javascript function to execute as callback
	 * 
	 * @return the javascript code
	 */
	@GET
	@Path("/themes")
	public String showAvailableThemes(@QueryParam("callback") String callbackFn) {
		String themesRaw = configProperties.getString("themes");
		String[] themes = themesRaw.split(",");

		JSONArray themesJSON = new JSONArray();

		for (String theme : themes) {
			themesJSON.put(theme);
		}

		return JSBuilder.wrapCallback(themesJSON, callbackFn);
	}

	/**
	 * Returns the default projection for maps
	 * 
	 * @param callbackFn the name of the javascript function to execute as callback
	 * 
	 * @return the javascript code
	 */
	@GET
	@Path("/projection")
	public String showDefaultProjection(@QueryParam("callback") String callbackFn) {
		String projectionRaw = configProperties.getString("projection");
		String[] projection = projectionRaw.split("\\*");

		JSONObject projectionJSON = new JSONObject();
		projectionJSON.put("code", projection[0]);
		projectionJSON.put("units", projection[1]);

		return JSBuilder.wrapCallback(projectionJSON, callbackFn);
	}

	/**
	 * Returns the available plugins for api-idee
	 * 
	 * @param callbackFn the name of the javascript function to execute as callback
	 * 
	 * @return the javascript code
	 */
	@GET
	@Path("/plugins")
	public String showAvailablePlugins(@QueryParam("callback") String callbackFn) {
		JSONArray pluginsJSON = new JSONArray();

		PluginsManager.init(context);
		for (PluginAPI plugin : PluginsManager.getAllPlugins()) {
			pluginsJSON.put(plugin.getName());
		}

		return JSBuilder.wrapCallback(pluginsJSON, callbackFn);
	}

	/**
	 * Provides the version number and date of the current build
	 * 
	 * @param callbackFn the name of the javascript function to execute as callback
	 * 
	 * @return the javascript code
	 */
	@GET
	@Path("/version")
	public String showVersion(@QueryParam("callback") String callbackFn) {

		JSONObject version = new JSONObject();

		version.put("number-ol", versionProperties.getString("number-ol"));
		version.put("number", versionProperties.getString("number"));
		version.put("date", versionProperties.getString("date"));

		return JSBuilder.wrapCallback(version, callbackFn);
	}

	/**
	 * Provides SVG collections
	 * 
	 * @param callbackFn the name of the javascript function to execute as callback
	 * @param name name collection
	 * 
	 * @return the javascript code
	 */
	@GET
	@Path("/resources/svg")
	public String resourceSVG(@QueryParam("callback") String callbackFn, @QueryParam("name") String name) {
		JSONObject result = new JSONObject();
		try {
			String file = new String(Files.readAllBytes(Paths.get(context.getRealPath("/WEB-INF/classes/resources_svg.json"))));

			JSONArray allCollectionsSVG = (JSONArray) new JSONObject(file).get("collections");
			JSONObject collectionSVG = null;

			Boolean showAllCollections = false;
			if (name == null) {
				showAllCollections = true;
			}
			JSONArray arrayCollections = new JSONArray();
			for (int i = 0; i < allCollectionsSVG.length(); i++) {
				collectionSVG = (JSONObject) allCollectionsSVG.get(i);
				String nameCollection = (String) collectionSVG.get("name");
				boolean findCollection = !showAllCollections && name.equals(nameCollection);
				if (showAllCollections || findCollection) {
					JSONObject aux = new JSONObject();
					aux.put("name", nameCollection);
					JSONArray data = new JSONArray();
					JSONArray resources = (JSONArray) collectionSVG.get("resources");
					data.put(resources);
					aux.put("resources", data);
					arrayCollections.put(aux);
					if (findCollection) {
						break;
					}
				}
			}
			result.put("collections", arrayCollections);
		} catch (IOException e) {
			e.printStackTrace();
		}

		return JSBuilder.wrapCallback(result, callbackFn);

	}
}
