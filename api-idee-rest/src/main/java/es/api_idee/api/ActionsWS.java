package es.api_idee.api;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.ResourceBundle;

import javax.servlet.ServletContext;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.json.JSONArray;
import org.json.JSONObject;

import es.api_idee.builder.JSBuilder;
import es.api_idee.parameter.PluginAPI;
import es.api_idee.plugins.PluginsManager;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.io.IOException;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

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
	 * # services services=${services}
	 * # projection projection=${api-idee.proj.default}
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
		actions.put("/projection");
		actions.put("/plugins");
		actions.put("/plugins/external");
		actions.put("/plugins/external/reload");
		actions.put("/resourcesPlugins");
		actions.put("/versions");
		actions.put("/resources/svg");
		actions.put("/resources/geodata");

		actions.put("/../../doc");
		actions.put("/../../doc/ol");
		actions.put("/../../doc/cesium");

		// actions.put("/apk");

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
	 * Returns the list of available external plugins
	 * 
	 * @param callbackFn the name of the javascript function to execute as callback
	 * 
	 * @return the javascript code with external plugins info
	 */
	@GET
	@Path("/plugins/external")
	public String showAvailableExternalPlugins(@QueryParam("callback") String callbackFn) {
		JSONArray pluginsJSON = new JSONArray();

		PluginsManager.init(context);
		for (String pluginName : PluginsManager.getAvailableExternalPlugins()) {
			pluginsJSON.put(pluginName);
		}

		return JSBuilder.wrapCallback(pluginsJSON, callbackFn);
	}

	/**
	 * Reloads the list of available external plugins from the remote repository.
	 * This endpoint forces a refresh of the external plugins list.
	 * 
	 * @param callbackFn the name of the javascript function to execute as callback
	 * 
	 * @return the javascript code with the reload result
	 */
	@GET
	@Path("/plugins/external/reload")
	public String reloadExternalPlugins(@QueryParam("callback") String callbackFn) {
		PluginsManager.init(context);

		int count = PluginsManager.reloadExternalPlugins();

		JSONObject result = new JSONObject();
		result.put("success", true);
		result.put("message", "Lista de plugins externos recargada correctamente");
		result.put("count", count);

		return JSBuilder.wrapCallback(result, callbackFn);
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

		version.put("number-cesium", versionProperties.getString("number-cesium"));
		version.put("number-ol", versionProperties.getString("number-ol"));
		version.put("number", versionProperties.getString("number"));
		version.put("date", versionProperties.getString("date"));

		return JSBuilder.wrapCallback(version, callbackFn);
	}

	/**
	 * Provides SVG collections
	 * 
	 * @param callbackFn the name of the javascript function to execute as callback
	 * @param name       name collection
	 * 
	 * @return the javascript code
	 */
	@GET
	@Path("/resources/svg")
	public String resourceSVG(@QueryParam("callback") String callbackFn, @QueryParam("name") String name) {
		JSONObject result = new JSONObject();
		try {
			String file = new String(
					Files.readAllBytes(Paths.get(context.getRealPath("/WEB-INF/classes/resources_svg.json"))));

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

	/**
	 * Provides GeoData collections
	 * 
	 * @param callbackFn the name of the javascript function to execute as callback
	 * @param name       name of the collection
	 * 
	 * @return the javascript code
	 */
	@GET
	@Path("/resources/geodata")
	public String resourceGeoData(@QueryParam("callback") String callbackFn, @QueryParam("name") String name) {
		JSONObject result = new JSONObject();
		try {
			String file = new String(
					Files.readAllBytes(Paths.get(context.getRealPath("/WEB-INF/classes/resources_geodata.json"))));

			JSONArray allCollectionsGeoData = (JSONArray) new JSONObject(file).get("collections");
			JSONObject collectionGeoData = null;

			Boolean showAllCollections = false;
			if (name == null) {
				showAllCollections = true;
			}
			JSONArray arrayCollections = new JSONArray();
			for (int i = 0; i < allCollectionsGeoData.length(); i++) {
				collectionGeoData = (JSONObject) allCollectionsGeoData.get(i);
				String nameCollection = (String) collectionGeoData.get("name");
				boolean findCollection = !showAllCollections && name.equals(nameCollection);
				if (showAllCollections || findCollection) {
					JSONObject aux = new JSONObject();
					aux.put("name", nameCollection);
					JSONArray data = new JSONArray();
					JSONArray resources = (JSONArray) collectionGeoData.get("resources");
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

	/**
	 * Provides the JS and CSS resources of the plugins for each version of API_IDEE
	 * 
	 * @param callbackFn the name of the javascript function to execute as callback
	 * @param name       plugin name to filter
	 * @param version    version number API_IDEE to filter
	 * @param type       file type to filter 'css' or 'js', only used when both name
	 *                   and version are not null.
	 *                   While 'api-idee' shows version this plugin is attached to.
	 * 
	 * @return the resources available for the plugins
	 */
	@GET
	@Path("/resourcesPlugins")
	public Response getResourcesPlugins(
			@QueryParam("callback") String callbackFn,
			@QueryParam("name") String name,
			@QueryParam("version") String version,
			@QueryParam("type") String type) {

		Response response = null;

		try {
			String file = new String(
					Files.readAllBytes(Paths.get(context.getRealPath("/WEB-INF/classes/resourcesPlugins.json"))));
			String fileExt = null;
			try {
				String urlBase = configProperties.getString("plugins.external.base.url");
				URL url = new URL(urlBase + "/data/resourcesPlugins.json");
				HttpURLConnection conn = (HttpURLConnection) url.openConnection();
				conn.setRequestMethod("GET");

				BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream()));
				StringBuilder res = new StringBuilder();
				String line;
				while ((line = br.readLine()) != null) {
					res.append(line);
				}
				fileExt = res.toString();

			} catch (Exception e) {
				e.printStackTrace();
			}

			JSONArray intPlugins = (JSONArray) new JSONObject(file).get("plugins");
			JSONArray extPlugins1 = (JSONArray) new JSONObject(fileExt).get("plugins");
			List<JSONObject> allPlugins = new ArrayList<>();
			for (int i = 0; i < extPlugins1.length(); i++) {
				allPlugins.add(extPlugins1.getJSONObject(i));
			}
			for (int i = 0; i < intPlugins.length(); i++) {
				allPlugins.add(intPlugins.getJSONObject(i));
			}
			allPlugins.sort(Comparator.comparing(o -> o.getString("name")));

			JSONArray arrayResults = new JSONArray();
			JSONObject plugin = null;

			Boolean showAllPlugins = name == null;
			Boolean showAllVersions = version == null;

			for (int i = 0; i < allPlugins.size(); i++) {
				plugin = (JSONObject) allPlugins.get(i);
				String namePlugin = (String) plugin.get("name");
				boolean findPlugin = !showAllPlugins && name.equals(namePlugin);
				if (showAllPlugins || findPlugin) {

					JSONArray versions = (JSONArray) plugin.get("versions");
					JSONObject aux = new JSONObject();
					aux.put("name", namePlugin);
					aux.put("obsolete", (String)plugin.get("obsolete"));
					JSONArray links = new JSONArray();

					for (int j = 0; j < versions.length(); j++) {
						JSONObject resources = (JSONObject) versions.get(j);
						String versionAPI_IDEE = (String) resources.get("api-idee");
						boolean findVersion = !showAllVersions && version.equals(versionAPI_IDEE);
						if (showAllVersions || findVersion) {
							links.put(resources);
							if (findVersion) {
								break;
							}
						}
					}
					aux.put("resources", links);
					arrayResults.put(aux);
					
					if (findPlugin) {
						break;
					}
				}
			}

			if (name != null && version != null && type != null) {
				// Expected "api-idee,css,js" types from
				// api-idee-rest/src/main/resources/properties/resourcesPlugins.json
				String resourceType = (String) (((JSONArray) arrayResults
						.getJSONObject(0).get("resources")).getJSONObject(0))
						.get(type); // Values of Type that are not "js", "css" or "api-idee" cause "not found error"
				if (type.equals("api-idee")) {
					// Avoid type "api-idee" version being interpreted as protocol
					response = Response.ok(resourceType, MediaType.TEXT_HTML).build();
				} else {
					String mediaType;
					if (type.equals("css")) {
						mediaType = "text/css";
					} else if (type.equals("js")) {
						mediaType = "application/javascript";
					} else {
						throw new Exception("Type " + type + " doesn't exist.");
					}
					URL url = new URL(resourceType);
					HttpURLConnection connection = (HttpURLConnection) url.openConnection();
					connection.setRequestMethod("GET");

					BufferedReader rd = new BufferedReader(new InputStreamReader(connection.getInputStream()));
					StringBuilder content = new StringBuilder();
					String line;

					while ((line = rd.readLine()) != null) {
						content.append(line+"\r\n");
					}

					response = Response.ok(content.toString(), mediaType).build();
				}
			} else {
				response = Response.ok(arrayResults.toString(), MediaType.APPLICATION_JSON).build();
			}

		} catch (Exception e) {
			e.printStackTrace();
			response = Response.status(400).entity("An error has occurred " + e.toString()).build();
		}

		return response;

	}

	/**
	 * Provides legacy versions available of the current build
	 * 
	 * @param callbackFn the name of the javascript function to execute as callback
	 * 
	 * @return the javascript code
	 */
	@GET
	@Path("/versions")
	public String showVersions(@QueryParam("callback") String callbackFn) {
		JSONObject versionsJSON = new JSONObject();

		// "versions" from api-idee-rest/.../configuration.properties of
		// "versions.names" from api-idee-parent/.../*.properties
		String[] versions = configProperties.getString("versions").split(",");

		// URLs to tiles
		String urlJS = "/js/apiidee";
		String urlConfig = "/js/configuration";
		String urlCSS = "/assets/css/apiidee";

		String ol = ".ol";
		String cesium = ".cesium";

		// Types of files
		String typeJS = ".min.js";
		String typeConfig = ".js";
		String typeCSS = ".min.css";

		for (String version : versions) {

			// Versions file names overrides
			String auxVersion = "";
			if (!version.equals("latest")) {
				auxVersion = "-" + version;
			}

			// All URLs to version dependent files
			JSONObject versionJSON = new JSONObject();
			// OpenLayers object
			JSONObject olJSON = new JSONObject();
			olJSON.put("js", urlJS + auxVersion + ol + typeJS);
			olJSON.put("config", urlConfig + auxVersion + typeConfig);
			olJSON.put("css", urlCSS + auxVersion + ol + typeCSS);
			versionJSON.put("ol", olJSON);

			// Cesium object
			JSONObject cesiumJSON = new JSONObject();
			cesiumJSON.put("js", urlJS + auxVersion + cesium + typeJS);
			cesiumJSON.put("config", urlConfig + auxVersion + typeConfig);
			cesiumJSON.put("css", urlCSS + auxVersion + cesium + typeCSS);
			versionJSON.put("cesium", cesiumJSON);

			// Prepared for versions list
			versionsJSON.put(version, versionJSON);
		}

		return JSBuilder.wrapCallback(versionsJSON, callbackFn);
	}
}