package es.api_idee.plugins;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.Iterator;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.ResourceBundle;

import javax.servlet.ServletContext;
import javax.ws.rs.core.MultivaluedMap;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.io.IOUtils;
import org.apache.log4j.Logger;
import org.json.JSONArray;
import org.json.JSONObject;

import es.api_idee.builder.JSBuilder;
import es.api_idee.exception.InvalidAPIException;
import es.api_idee.parameter.PluginAPI;
import es.api_idee.parameter.PluginAPIParam;
import es.api_idee.parameter.parser.ParametersParser;

public abstract class PluginsManager {

	private static Path pluginsDir;

	private static Map<String, PluginAPI> availablePlugins;

	private static final Logger log = Logger.getLogger(PluginsManager.class);
	
	private static String EXTERNAL_PLUGINS_BASE_URL;
	
	// Lista de plugins externos disponibles
	private static java.util.Set<String> AVAILABLE_EXTERNAL_PLUGINS;

	public static Collection<PluginAPI> getAllPlugins() {
		// Filtrar solo los plugins internos (no externos)
		List<PluginAPI> internalPlugins = new LinkedList<PluginAPI>();
		for (PluginAPI plugin : availablePlugins.values()) {
			if (!plugin.isExternal()) {
				internalPlugins.add(plugin);
			}
		}
		return internalPlugins;
	}

	public static List<String> getPlugins(MultivaluedMap<String, String> queryParams) {
		List<String> plugins = new LinkedList<String>();
		if (availablePlugins != null) {
			// searchs plugins by name
			for (String paramName : queryParams.keySet()) {
				PluginAPI plugin = availablePlugins.get(paramName);
				if (plugin == null) {
					// Intentar cargar plugin externo
					plugin = loadExternalPlugin(paramName);
				}
				if (plugin != null) {
					String paramValue = queryParams.getFirst(paramName);
					String pluginStr = JSBuilder.createPlugin(plugin, paramValue);
					plugins.add(pluginStr);
				}
			}
			// search plugins in "plugins" parameter
			String pluginsParam = queryParams.getFirst("plugins");
			if (pluginsParam != null) {
				String[] pluginNames = pluginsParam.split(",");
				for (String pluginName : pluginNames) {
					PluginAPI plugin = availablePlugins.get(pluginName);
					if (plugin == null) {
						// Intentar cargar plugin externo
						plugin = loadExternalPlugin(pluginName);
					}
					if (plugin != null) {
						String pluginStr = JSBuilder.createPlugin(plugin);
						plugins.add(pluginStr);
					}
				}
			}
		}
		return plugins;
	}

	public static List<PluginAPI> getPluginsAPI(MultivaluedMap<String, String> queryParams) {
		List<PluginAPI> pluginsAPI = new LinkedList<PluginAPI>();
		if (availablePlugins != null) {
			// searchs plugins by name
			for (String paramName : queryParams.keySet()) {
				PluginAPI plugin = availablePlugins.get(paramName);
				if (plugin == null) {
					// Intentar cargar plugin externo
					plugin = loadExternalPlugin(paramName);
				}
				if (plugin != null) {
					pluginsAPI.add(plugin);
				}
			}
			// search plugins in "plugins" parameter
			String pluginsParam = queryParams.getFirst("plugins");
			if (pluginsParam != null) {
				String[] pluginNames = pluginsParam.split(",");
				for (String pluginName : pluginNames) {
					PluginAPI plugin = availablePlugins.get(pluginName);
					if (plugin == null) {
						// Intentar cargar plugin externo
						plugin = loadExternalPlugin(pluginName);
					}
					if (plugin != null) {
						pluginsAPI.add(plugin);
					}
				}
			}
		}
		return pluginsAPI;
	}

	public static String[] getJSFiles(Map<String, String[]> queryParams) {
		List<String> jsfiles = new LinkedList<String>();
		String impl = ParametersParser.getImplementation(queryParams);
		// searchs plugins by name
		for (String paramName : queryParams.keySet()) {
			PluginAPI plugin = availablePlugins.get(paramName);
			if (plugin == null) {
				// Intentar cargar plugin externo solo si no es un parámetro del sistema
				plugin = loadExternalPlugin(paramName);
			}
			if (plugin != null) {
				jsfiles.addAll(plugin.getJSFiles(impl));
			}
		}
		// search plugins in "plugins" parameter
		String[] pluginsParams = queryParams.get("plugins");
		if (pluginsParams != null) {
			String pluginsParam = pluginsParams[0];
			String[] pluginNames = pluginsParam.split(",");
			for (String pluginName : pluginNames) {
				PluginAPI plugin = availablePlugins.get(pluginName);
				if (plugin == null) {
					// Intentar cargar plugin externo
					plugin = loadExternalPlugin(pluginName);
				}
				if (plugin != null) {
					jsfiles.addAll(plugin.getJSFiles(impl));
				}
			}
		}
		return jsfiles.toArray(new String[jsfiles.size()]);
	}

	public static String[] getCSSFiles(Map<String, String[]> queryParams) {
		List<String> cssfiles = new LinkedList<String>();
		String impl = ParametersParser.getImplementation(queryParams);
		// searchs plugins by name
		for (String paramName : queryParams.keySet()) {
			PluginAPI plugin = availablePlugins.get(paramName);
			if (plugin == null) {
				// Intentar cargar plugin externo solo si no es un parámetro del sistema
				plugin = loadExternalPlugin(paramName);
			}
			if (plugin != null) {
				cssfiles.addAll(plugin.getCSSFiles(impl));
			}
		}
		// search plugins in "plugins" parameter
		String[] pluginsParams = queryParams.get("plugins");
		if (pluginsParams != null) {
			String pluginsParam = pluginsParams[0];
			String[] pluginNames = pluginsParam.split(",");
			for (String pluginName : pluginNames) {
				PluginAPI plugin = availablePlugins.get(pluginName);
				if (plugin == null) {
					// Intentar cargar plugin externo
					plugin = loadExternalPlugin(pluginName);
				}
				if (plugin != null) {
					cssfiles.addAll(plugin.getCSSFiles(impl));
				}
			}
		}
		return cssfiles.toArray(new String[cssfiles.size()]);
	}

	public static void readPlugins() {
		availablePlugins = new HashMap<String, PluginAPI>();
		File pluginsFolder = pluginsDir.toFile();
		String[] plugins = pluginsFolder.list();
		if (plugins != null) {
			for (String pluginName : plugins) {
				File pluginFolder = new File(pluginsFolder, pluginName);
				if (pluginFolder.isDirectory()) {
					for (File file : pluginFolder.listFiles()) {
						String relativeFile = pluginsDir.relativize(file.toPath()).toString();
						if (FilenameUtils.getBaseName(relativeFile).equalsIgnoreCase("api")) {
							try {
								PluginAPI plugin = readPluginFromApi(file, null);
								availablePlugins.put(plugin.getName(), plugin);
								break;
							} catch (IOException e) {
								log.error("Error occurred reading plugins directory", e);
							} catch (InvalidAPIException e) {
								log.error("Invalid JSON API from plugin '" + e.getPluginName() + "'", e);
							}
						}
					}
				}
			}
		}
	}

	private static PluginAPI readPluginFromApi(File apiJSONFile, JSONObject apiJSONContent) throws IOException, InvalidAPIException {
		PluginAPI pluginAPI = null;
		JSONObject apiJSON = null;
		if (apiJSONFile != null) {
			apiJSON = readApiJSONFile(apiJSONFile);
		} else {
			apiJSON = apiJSONContent;
		}
				
		List<PluginAPIParam> parameters = new LinkedList<PluginAPIParam>();

		String name = readStringProperty("url.name", apiJSON);
		String separator = readStringProperty("url.separator", apiJSON);
		String constructor = readStringProperty("constructor", apiJSON);

		if (name == null || constructor == null) {
			throw new InvalidAPIException((name == null || name.isEmpty() ? apiJSONFile.getParent() : name),
					"Invalid ApiJSON file format: name or constructor cannot be null or empty");
		}

		if (apiJSON.has("parameters") && !apiJSON.isNull("parameters")
				&& apiJSON.get("parameters") instanceof JSONArray) {
			JSONArray jsonParameters = apiJSON.getJSONArray("parameters");
			for (int i = 0; i < jsonParameters.length(); i++) {
				parameters.add(readPluginParameter(jsonParameters.getJSONObject(i)));
			}
		}

		pluginAPI = new PluginAPI(name, separator, constructor, parameters);

		// Determinar si es externo
		boolean isExternal = apiJSONContent != null;

		if (apiJSON.has("files") && !apiJSON.isNull("files") && apiJSON.get("files") instanceof JSONObject) {
			JSONObject files = apiJSON.getJSONObject("files");
			@SuppressWarnings("unchecked")
			Iterator<String> keys = (Iterator<String>) files.keys();

			while (keys.hasNext()) {
				String impl = keys.next();
				List<String> scripts = readJSONArray("files.".concat(impl).concat(".scripts"), apiJSON);
				List<String> styles = readJSONArray("files.".concat(impl).concat(".styles"), apiJSON);
				if (scripts != null) {
					for (String script : scripts) {
						if (isExternal) {
							String externalUrlJS = EXTERNAL_PLUGINS_BASE_URL + "/plugins/" + pluginAPI.getName() + "/dist/" + script;
							pluginAPI.addJSFile(impl, externalUrlJS);
						} else {
							// Para plugins locales, guardar con la ruta completa
							pluginAPI.addJSFile(impl, pluginAPI.getName().concat(File.separator).concat(script));
						}
					}
				}
				if (styles != null) {
					for (String style : styles) {
						if (isExternal) {
							String externalUrlCSS = EXTERNAL_PLUGINS_BASE_URL + "/plugins/" + pluginAPI.getName() + "/dist/" + style;
							pluginAPI.addCSSFile(impl, externalUrlCSS);
						} else {
							// Para plugins locales, guardar con la ruta completa
							pluginAPI.addCSSFile(impl, pluginAPI.getName().concat(File.separator).concat(style));
						}
					}
				}
			}
		}

		return pluginAPI;
	}

	private static String readStringProperty(String property, JSONObject object) {
		JSONObject obj = getNestedJSONObject(property, object);
		if (obj == null) {
			return null;
		}
		return obj.getString(property.substring(property.lastIndexOf('.') + 1, property.length()));
	}

	private static List<String> readJSONArray(String property, JSONObject object) {
		JSONArray array = getNestedJSONObject(property, object)
				.getJSONArray(property.substring(property.lastIndexOf(".") + 1, property.length()));
		List<String> resultList = new ArrayList<>();
		if (array == null) {
			return null;
		}
		for (int i = 0; i < array.length(); i++) {
			resultList.add(array.getString(i));
		}
		return resultList;
	}

	private static JSONObject getNestedJSONObject(String property, JSONObject object) {
		String[] splitted = property.split("\\.");
		String prop = splitted[0];
		if (!object.has(prop) || object.isNull(prop)) {
			return null;
		}
		if (splitted.length > 0 && object.get(prop) instanceof JSONObject) {
			return getNestedJSONObject(
					property.substring(property.indexOf(prop) + prop.length() + 1, property.length()),
					object.getJSONObject(prop));
		}
		return object;
	}

	private static PluginAPIParam readPluginParameter(JSONObject parameterJSON) {
		PluginAPIParam pluginParam = null;
		String value = null;
		String name = null;
		int position = -1;
		List<PluginAPIParam> properties = new LinkedList<PluginAPIParam>();
		String type = parameterJSON.getString("type");
		if (type.equalsIgnoreCase(PluginAPIParam.OBJECT)) {
			// name
			if (parameterJSON.has("name")) {
				name = parameterJSON.getString("name");
			}
			// properties
			if (parameterJSON.has("properties")) {
				JSONArray propertiesArr = parameterJSON.getJSONArray("properties");
				for (int i = 0; i < propertiesArr.length(); i++) {
					JSONObject propertyJSON = propertiesArr.getJSONObject(i);
					PluginAPIParam property = readPluginParameter(propertyJSON);
					properties.add(property);
				}
			}
			pluginParam = new PluginAPIParam(type, name, properties);
		} else if (type.equalsIgnoreCase(PluginAPIParam.ARRAY)) {
			// properties
			if (parameterJSON.has("properties")) {
				JSONArray propertiesArr = parameterJSON.getJSONArray("properties");
				for (int i = 0; i < propertiesArr.length(); i++) {
					JSONObject propertyJSON = propertiesArr.getJSONObject(i);
					PluginAPIParam property = readPluginParameter(propertyJSON);
					properties.add(property);
				}
			}
			pluginParam = new PluginAPIParam(type, properties);
		} else if (type.equalsIgnoreCase(PluginAPIParam.SIMPLE)) {
			// name
			if (parameterJSON.has("name")) {
				name = parameterJSON.getString("name");
			}
			// value
			if (parameterJSON.has("value")) {
				value = parameterJSON.getString("value");
			}
			// position
			if (parameterJSON.has("position")) {
				position = parameterJSON.getInt("position");
			}
			pluginParam = new PluginAPIParam(type, name, position, value);
		} else if (type.equalsIgnoreCase(PluginAPIParam.NUMBER)) {
			// name
			if (parameterJSON.has("name")) {
				name = parameterJSON.getString("name");
			}
			// value
			if (parameterJSON.has("value")) {
				value = parameterJSON.getString("value");
			}
			// position
			if (parameterJSON.has("position")) {
				position = parameterJSON.getInt("position");
			}
			pluginParam = new PluginAPIParam(type, name, position, value);
		} else if (type.equalsIgnoreCase(PluginAPIParam.BOOLEAN)) {
			// name
			if (parameterJSON.has("name")) {
				name = parameterJSON.getString("name");
			}
			// value
			if (parameterJSON.has("value")) {
				value = parameterJSON.getString("value");
			}
			// position
			if (parameterJSON.has("position")) {
				position = parameterJSON.getInt("position");
			}
			pluginParam = new PluginAPIParam(type, name, position, value);
		}
		return pluginParam;

	}

	private static JSONObject readApiJSONFile(File apijsonFile) throws IOException {
		JSONObject apiJSON = null;
		String apijson = FileUtils.readFileToString(apijsonFile);
		apiJSON = new JSONObject(apijson);
		return apiJSON;
	}
	
	/**
	 * Intenta cargar un plugin desde la URL externa
	 * @param pluginName nombre del plugin
	 * @return PluginAPI si se encuentra, null en caso contrario
	 */
	private static PluginAPI loadExternalPlugin(String pluginName) {
		if (availablePlugins == null) {
			return null;
		}
		
		// Si ya está cargado, devolverlo
		PluginAPI plugin = availablePlugins.get(pluginName);
		if (plugin != null) {
			return plugin;
		}
		
		// Verificar si el plugin está en la lista de plugins externos disponibles
		if (pluginName == null || !AVAILABLE_EXTERNAL_PLUGINS.contains(pluginName.toLowerCase())) {
			return null;
		}
		
		// Intentar cargar desde URL externa
		String apiUrl = EXTERNAL_PLUGINS_BASE_URL + "/plugins/" + pluginName + "/dist/api.json";
		try {
			// Descargar el JSON desde la URL
			URL url = new URL(apiUrl);
			HttpURLConnection connection = (HttpURLConnection) url.openConnection();
			connection.setRequestMethod("GET");
			connection.setConnectTimeout(5000);
			connection.setReadTimeout(5000);
			
			InputStream inputStream = connection.getInputStream();
			String jsonContent = IOUtils.toString(inputStream, StandardCharsets.UTF_8.name());
			JSONObject jsonResponse = new JSONObject(jsonContent);
			
			// Usar readPluginFromApi con el archivo temporal
			plugin = readPluginFromApi(null, jsonResponse);
			plugin.setExternalBaseUrl(EXTERNAL_PLUGINS_BASE_URL + "/plugins");
			// Guardar en el mapa para futuras referencias
			availablePlugins.put(pluginName, plugin);
			return plugin;
		} catch (IOException e) {
			log.debug("No se pudo cargar plugin externo '" + pluginName + "' desde " + apiUrl + ": " + e.getMessage());
		} catch (InvalidAPIException e) {
			log.error("API JSON inválido para plugin externo '" + pluginName + "'", e);
		} catch (Exception e) {
			log.error("Error al cargar plugin externo '" + pluginName + "'", e);
		}
		return null;
	}
	
	/**
	 * Lee la lista de plugins externos disponibles desde la URL
	 * @return Set con los nombres de los plugins no obsoletos
	 */
	private static java.util.Set<String> loadAvailableExternalPlugins() {
		java.util.Set<String> plugins = new java.util.HashSet<String>();
		try {
			// Leer la URL base de plugins externos desde el archivo de configuración
			ResourceBundle configProperties = ResourceBundle.getBundle("configuration");
			EXTERNAL_PLUGINS_BASE_URL = configProperties.getString("plugins.external.base.url");
			
			// Cargar la lista de plugins externos disponibles desde la URL
			String pluginsListUrl = EXTERNAL_PLUGINS_BASE_URL + "/data/plugins.json";
			URL url = new URL(pluginsListUrl);
			HttpURLConnection connection = (HttpURLConnection) url.openConnection();
			connection.setRequestMethod("GET");
			connection.setConnectTimeout(5000);
			connection.setReadTimeout(5000);
			
			try (InputStream inputStream = connection.getInputStream()) {
				String jsonContent = IOUtils.toString(inputStream, StandardCharsets.UTF_8.name());
				// El JSON es un array directamente
				JSONArray pluginsArray = new JSONArray(jsonContent);
				for (int i = 0; i < pluginsArray.length(); i++) {
					JSONObject pluginObj = pluginsArray.getJSONObject(i);
					// Solo agregar plugins que no estén obsoletos
					if (!pluginObj.getBoolean("obsolete")) {
						if (pluginObj.has("name")) {
							String pluginName = pluginObj.getString("name");
							// Guardar en minúsculas para comparaciones case-insensitive
							plugins.add(pluginName.toLowerCase());
						}
					}
				}
			} finally {
				connection.disconnect();
			}
			log.info("Lista de plugins externos cargada correctamente. Total: " + plugins.size() + " plugins.");
		} catch (Exception e) {
			log.warn("No se pudieron cargar plugins externos. La lista está vacía.");
		}
		AVAILABLE_EXTERNAL_PLUGINS = plugins;
		return plugins;
	}
	
	/**
	 * Recarga la lista de plugins externos disponibles desde el repositorio remoto.
	 * También limpia los plugins externos previamente cargados del mapa de availablePlugins.
	 * @return número de plugins externos disponibles después de la recarga
	 */
	public static int reloadExternalPlugins() {
		log.info("Recargando lista de plugins externos...");
		
		// Guardar los nombres de plugins externos actualmente cargados
		java.util.Set<String> previousExternalPlugins = AVAILABLE_EXTERNAL_PLUGINS != null 
			? new java.util.HashSet<>(AVAILABLE_EXTERNAL_PLUGINS) 
			: new java.util.HashSet<>();
		
		// Recargar la lista desde el repositorio remoto
		java.util.Set<String> newPlugins = loadAvailableExternalPlugins();
		
		// Eliminar del mapa los plugins externos que ya estaban cargados
		// para forzar que se recarguen con la nueva configuración si se solicitan
		if (availablePlugins != null) {
			for (String pluginName : previousExternalPlugins) {
				PluginAPI plugin = availablePlugins.get(pluginName);
				if (plugin != null && plugin.getExternalBaseUrl() != null) {
					availablePlugins.remove(pluginName);
					log.debug("Plugin externo eliminado del caché: " + pluginName);
				}
			}
		}
		
		return newPlugins.size();
	}
	
	/**
	 * Devuelve la lista de plugins externos disponibles
	 * @return Set con los nombres de los plugins externos disponibles
	 */
	public static java.util.Set<String> getAvailableExternalPlugins() {
		return AVAILABLE_EXTERNAL_PLUGINS != null 
			? java.util.Collections.unmodifiableSet(AVAILABLE_EXTERNAL_PLUGINS) 
			: java.util.Collections.emptySet();
	}
	
	public static void init(ServletContext context) {
		if (availablePlugins == null) {
			loadAvailableExternalPlugins();
			pluginsDir = Paths.get(context.getRealPath("plugins"));
			readPlugins();
			WatchPluginDir.watch(pluginsDir);
		}
	}
}