package es.api_idee.builder;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.zip.DataFormatException;
import java.util.zip.Inflater;

import org.apache.commons.lang3.StringUtils;
import org.apache.log4j.Logger;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import es.api_idee.parameter.Parameters;
import es.api_idee.parameter.PluginAPI;
import es.api_idee.parameter.PluginAPIParam;

public class JSBuilder {

	private static final Logger log = Logger.getLogger(JSBuilder.class);

	private static final String LEGACY_BASE64 = "base64=";

	private static final String BASE64_PREFIX = "base64~";

	private static final String DEFLATE_PREFIX = "deflate~";

	private static final int MAX_INFLATED_SIZE = 1024 * 1024;

	/**
	 * Generates the code to create a map with the specified parameters
	 * 
	 * @param parameters parameters specified by the user
	 * @param plugins
	 * @param callbackFn the name of the javascript function to execute as callback
	 * @param impl       the implementation to use
	 * 
	 * @return the javascript code
	 */
	public static String build(Parameters parameters, List<String> plugins) {
		return build(parameters, plugins, null, null, null);
	}

	/**
	 * Generates the code to create a map with the specified parameters, controls,
	 * plugins, configuration and layers
	 * 
	 * @param parameters    parameters specified by the user
	 * @param plugins       list of plugins
	 * @param controls      list of controls
	 * @param layers        list of layers
	 * @param configuration JSONObject with IDEE.config assignments
	 * 
	 * @return the javascript code
	 */
	public static String build(Parameters parameters, List<String> plugins, List<String> controls, List<String> layers,
			JSONObject configuration) {
		StringBuilder codeJS = new StringBuilder();

		// Add IDEE.config assignments dynamically
		if (configuration != null && configuration.length() > 0) {
			java.util.Iterator<String> keys = configuration.keys();
			while (keys.hasNext()) {
				String key = keys.next();
				Object value = configuration.get(key);
				codeJS.append("IDEE.config.").append(key).append("=");

				if (value instanceof String) {
					codeJS.append("\"").append(value).append("\"");
				} else if (value instanceof Boolean || value instanceof Number) {
					codeJS.append(value);
				} else if (value instanceof JSONObject || value instanceof JSONArray) {
					codeJS.append(value.toString());
				} else {
					codeJS.append("\"").append(value.toString()).append("\"");
				}

				codeJS.append(";");
			}
		}

		// Build the map params JSON, merging quoted controls/layers into the JSON object.
		// Quoted strings (starting with '"') are GET star-format entries → go inside IDEE.map({}).
		// JS expressions (starting with 'new') are POST-built objects → stay as .addControls()/.addLayers() chains.
		JSONObject paramsJSON = parameters.toJSON();

		List<String> chainControls = new ArrayList<>();
		if (controls != null && !controls.isEmpty()) {
			JSONArray controlsArr = paramsJSON.has("controls")
					? paramsJSON.getJSONArray("controls") : new JSONArray();
			for (String control : controls) {
				if (control.startsWith("\"") && control.endsWith("\"")) {
					controlsArr.put(control.substring(1, control.length() - 1));
				} else {
					chainControls.add(control);
				}
			}
			if (controlsArr.length() > 0) {
				paramsJSON.put("controls", controlsArr);
			}
		}

		List<String> chainLayers = new ArrayList<>();
		if (layers != null && !layers.isEmpty()) {
			JSONArray layersArr = paramsJSON.has("layers")
					? paramsJSON.getJSONArray("layers") : new JSONArray();
			for (String layer : layers) {
				if (layer.startsWith("\"") && layer.endsWith("\"")) {
					layersArr.put(layer.substring(1, layer.length() - 1));
				} else {
					chainLayers.add(layer);
				}
			}
			if (layersArr.length() > 0) {
				paramsJSON.put("layers", layersArr);
			}
		}

		codeJS.append("IDEE.map(").append(paramsJSON).append(")");

		// add plugins with .addPlugin(...)
		if (plugins != null) {
			for (String plugin : plugins) {
				addPlugin(codeJS, plugin);
			}
		}

		// add POST JS-expression controls with .addControls(...)
		for (String control : chainControls) {
			addControls(codeJS, control);
		}

		// add POST JS-expression layers with .addLayers([...])
		if (!chainLayers.isEmpty()) {
			codeJS.append(".addLayers([");
			for (int i = 0; i < chainLayers.size(); i++) {
				if (i > 0) {
					codeJS.append(",");
				}
				codeJS.append(chainLayers.get(i));
			}
			codeJS.append("])");
		}

		wrapCallback(codeJS, parameters.getCallbackFn());

		return codeJS.toString();
	}

	private static void addPlugin(StringBuilder codeJS, String plugin) {
		codeJS.append(".addPlugin(").append(plugin).append(")");
	}

	private static void addControls(StringBuilder codeJS, String control) {
		codeJS.append(".addControls(").append(control).append(")");
	}

	/**
	 * Wraps the javascript code to execute it as parameter of the specified
	 * function
	 * 
	 * @param code       the javascript code to execute it as parameter
	 * 
	 * @param callbackFn the name of the javascript function to execute as callback
	 * 
	 * @return the execution of the callback with the javascript code as parameter
	 */
	public static void wrapCallback(StringBuilder code, String callbackFn) {
		// if no callback function was specified do not wrap the code
		if (!StringUtils.isEmpty(callbackFn)) {
			code.insert(0, "(").insert(0, callbackFn);
			code.append(");");
		}
	}

	/**
	 * Wraps the JSON array to execute it as parameter of the specified function
	 * 
	 * @param jsonArray  the JSON array to execute it as parameter
	 * 
	 * @param callbackFn the name of the javascript function to execute as callback
	 * 
	 * @return the execution of the callback with the JSON array as parameter
	 */
	public static String wrapCallback(JSONArray jsonArray, String callbackFn) {
		return wrapCallback(jsonArray.toString(), callbackFn);
	}

	/**
	 * Wraps the JSON to execute it as parameter of the specified function
	 * 
	 * @param json       the JSON to execute it as parameter
	 * 
	 * @param callbackFn the name of the javascript function to execute as callback
	 * 
	 * @return the execution of the callback with the JSON as parameter
	 */
	public static String wrapCallback(JSONObject json, String callbackFn) {
		return wrapCallback(json.toString(), callbackFn);
	}

	/**
	 * Wraps the javascript code to execute it as parameter of the specified
	 * function
	 * 
	 * @param code       the javascript code to execute it as parameter
	 * 
	 * @param callbackFn the name of the javascript function to execute as callback
	 * 
	 * @return the execution of the callback with the javascript code as parameter
	 */
	public static String wrapCallback(String code, String callbackFn) {
		String wrappedCode = code;
		// if no callback function was specified do not wrap the code
		if (!StringUtils.isEmpty(callbackFn)) {
			StringBuilder wrapBuilder = new StringBuilder();
			wrapBuilder.append(callbackFn).append("(").append(code).append(");");
			wrappedCode = wrapBuilder.toString();
		}
		return wrappedCode;
	}

	public static String createPlugin(PluginAPI plugin) {
		return createPlugin(plugin, (String) null);
	}

	public static String createPlugin(PluginAPI plugin, String paramValue) {
		if (!StringUtils.isEmpty(paramValue) && paramValue.matches("(?s)\\w+=.*")
				&& !paramValue.startsWith(LEGACY_BASE64)) {
			Map<String, String> params = new java.util.LinkedHashMap<>();
			for (String pair : paramValue.split(";")) {
				int eqIdx = pair.indexOf('=');
				if (eqIdx > 0) {
					params.put(pair.substring(0, eqIdx).trim(), pair.substring(eqIdx + 1).trim());
				}
			}
			return createPlugin(plugin, params);
		}

		StringBuilder pluginBuilder = new StringBuilder();

		String[] paramValues = null;
		String separator = plugin.getSeparator();
		if (!StringUtils.isEmpty(paramValue) && (separator != null)) {
			paramValues = paramValue.split(separator);
		} else if (!StringUtils.isEmpty(paramValue)) {
			paramValues = new String[1];
			paramValues[0] = paramValue;
		}

		pluginBuilder.append("new ").append(plugin.getConstructor());
		pluginBuilder.append("(");
		
		boolean founded = false;
		int index = 0;
		if (paramValues != null) {
			int i = 0;
			while (!founded && i < paramValues.length) {
				if (paramValues[i].contains("base64=")) {
					founded = true;
					index = i;
				}
				i++;
			}
		}

		if (founded) {
			String base64 = paramValues[index].replace(LEGACY_BASE64, "").replace(' ', '+');
			try {
				byte[] decodedBytes = Base64.getDecoder().decode(base64);
				pluginBuilder.append(new JSONObject(new String(decodedBytes, StandardCharsets.UTF_8)));
			} catch (IllegalArgumentException | JSONException e) {
				log.warn("Invalid base64 parameters of plugin '" + plugin.getName() + "'", e);
			}
		} else {
			List<PluginAPIParam> pluginAPIParams = plugin.getParameters();
			if (pluginAPIParams != null) {
				for (int i = 0; i < pluginAPIParams.size(); i++) {
					PluginAPIParam pluginAPIParam = pluginAPIParams.get(i);
					pluginBuilder.append(readPluginParameter(pluginAPIParam, paramValues));
					if (i < (pluginAPIParams.size() - 1)) {
						pluginBuilder.append(",");
					}
				}
			}
		}

		pluginBuilder.append(")");

		return pluginBuilder.toString();
	}

	private static Object readPluginParameter(PluginAPIParam pluginAPIParam, String[] paramValues) {
		Object pluginParam = null;

		int position = pluginAPIParam.getPosition();
		String value = pluginAPIParam.getValue();
		List<PluginAPIParam> properties = pluginAPIParam.getProperties();

		String type = pluginAPIParam.getType();
		if (type.equalsIgnoreCase(PluginAPIParam.OBJECT)) {
			pluginParam = new JSONObject();
			if (properties != null) {
				for (PluginAPIParam property : properties) {
					Object propertyValue = readPluginParameter(property, paramValues);
					if (propertyValue != null) {
						if (property.getType().equals(PluginAPIParam.NUMBER)) {
							String val = propertyValue.toString();
							try {
								((JSONObject) pluginParam).put(property.getName(),
										Double.parseDouble(val));
							} catch (NumberFormatException e) {
							}
						} else if (property.getType().equals(PluginAPIParam.BOOLEAN)) {
							((JSONObject) pluginParam).put(property.getName(),
									Boolean.parseBoolean(propertyValue.toString()));
						} else {
							((JSONObject) pluginParam).put(property.getName(), propertyValue);
						}

					}
				}
			}
		} else if (type.equalsIgnoreCase(PluginAPIParam.ARRAY)) {
			pluginParam = new JSONArray();
			if (properties != null) {
				for (int i = 0; i < properties.size(); i++) {
					PluginAPIParam property = properties.get(i);
					Object elementValue = readPluginParameter(property, paramValues);
					if (elementValue != null) {
						((JSONArray) pluginParam).put(elementValue);
					}
				}
			}
		} else if (type.equalsIgnoreCase(PluginAPIParam.SIMPLE)) {
			if (value != null) {
				pluginParam = value;
			} else if ((position != -1) && (paramValues != null) && (paramValues.length > position)) {
				pluginParam = paramValues[position];
			}
		} else if (type.equalsIgnoreCase(PluginAPIParam.NUMBER)) {
			if (value != null) {
				pluginParam = value;
			} else if ((position != -1) && (paramValues != null) && (paramValues.length > position)) {
				pluginParam = paramValues[position];
			}
		} else if (type.equalsIgnoreCase(PluginAPIParam.BOOLEAN)) {
			if (value != null) {
				pluginParam = value;
			} else if ((position != -1) && (paramValues != null) && (paramValues.length > position)) {
				pluginParam = paramValues[position];
			}
		}

		return pluginParam;
	}

	/**
	 * Creates a plugin using OpenAPI key=value style parameters.
	 * Example URL: ?layerswitcher.position=BL&layerswitcher.collapsed=true
	 *
	 * @param plugin       the plugin API definition
	 * @param keyValueParams map of paramName->value extracted from URL
	 * @return plugin instantiation code
	 */
	public static String createPlugin(PluginAPI plugin, Map<String, String> keyValueParams) {
		StringBuilder pluginBuilder = new StringBuilder();
		pluginBuilder.append("new ").append(plugin.getConstructor()).append("(");

		if (keyValueParams != null && !keyValueParams.isEmpty()) {
			Map<String, String> paramTypes = getParamTypes(plugin);
			JSONObject paramsObj = new JSONObject();

			for (Map.Entry<String, String> entry : keyValueParams.entrySet()) {
				String paramName = entry.getKey();
				String paramType = paramTypes.containsKey(paramName) ? paramTypes.get(paramName) : null;
				try {
					paramsObj.put(paramName, toParamValue(entry.getValue(), paramType));
				} catch (IllegalArgumentException | JSONException e) {
					log.warn("Invalid parameter '" + paramName + "' of plugin '" + plugin.getName() + "'", e);
				}
			}

			pluginBuilder.append(paramsObj.toString());
		}

		pluginBuilder.append(")");
		return pluginBuilder.toString();
	}

	/**
	 * Returns a quoted star-format string so client-side buildLayer() resolves and instantiates the layer.
	 *
	 * @param layerEntry star-format string (e.g. "WMTS*url=http://...;name=MTN")
	 * @return quoted JS string for client-side buildLayer()
	 */
	public static String createLayerWithParams(String layerEntry) {
		return "\"" + layerEntry.trim() + "\"";
	}

	/**
	 * Builds a JS control instantiation from a star-format entry.
	 *
	 * Format: "controlName*key=val;key=val"
	 * Example: "timeline*order=2;paramsDate=yr"
	 *
	 * Returns a quoted string so client-side buildControl() resolves the class name,
	 * which owns the control name→class mapping via ControlClass.NAME constants.
	 *
	 * @param controlEntry star-format string (e.g. "timeline*order=2;collapsed=false")
	 * @return quoted JS string for client-side buildControl()
	 */
	public static String createControlWithParams(String controlEntry) {
		return "\"" + controlEntry.trim() + "\"";
	}

	/**
	 * Converts a key=value parameter of a plugin to the type of its API definition
	 * (boolean, number or array) or, if the type is unknown, to the type that the
	 * value itself indicates (see parseRestValue).
	 *
	 * @param rawValue value of the URL
	 * @param paramType type of the API definition, or null
	 * @return value for the plugin options
	 * @throws IllegalArgumentException if an encoded value cannot be decoded
	 */
	private static Object toParamValue(String rawValue, String paramType) {
		Object value = parseRestValue(rawValue);
		if (PluginAPIParam.BOOLEAN.equalsIgnoreCase(paramType)
				&& !(value instanceof Boolean || value instanceof JSONObject || value instanceof JSONArray)) {
			value = Boolean.parseBoolean(value.toString());
		} else if (PluginAPIParam.NUMBER.equalsIgnoreCase(paramType) && !(value instanceof Number)) {
			try {
				value = Double.parseDouble(value.toString());
			} catch (NumberFormatException e) {
			}
		} else if (PluginAPIParam.ARRAY.equalsIgnoreCase(paramType) && !(value instanceof JSONArray)) {
			value = parseArrayValue(value.toString());
		}
		return value;
	}

	/**
	 * Parses a REST value with the same grammar as the client (parseValueByType of
	 * IDEE.utils), so that the values written by IDEE.utils.serializeUrlParams are
	 * restored with their type:
	 *   "base64~..."         → base64 (UTF-8) of a value, parsed again
	 *   "deflate~..."        → base64 of a deflate (zlib) compressed value, parsed again
	 *   "'text'"             → string (a quoted value is never a boolean or a number)
	 *   "true"/"false"       → boolean
	 *   "{\"k\":\"v\"}"      → JSONObject (inline JSON)
	 *   "[a, b, c]"          → JSONArray (JSON when it comes encoded, otherwise a plain list)
	 *   numeric string       → number
	 *   anything else        → string
	 *
	 * @param rawValue value of the URL
	 * @return parsed value
	 * @throws IllegalArgumentException if an encoded value cannot be decoded
	 */
	private static Object parseRestValue(String rawValue) {
		String trimmed = rawValue.trim();
		Object value = rawValue;
		if (trimmed.startsWith(BASE64_PREFIX) || trimmed.startsWith(DEFLATE_PREFIX)) {
			String decoded = decodeRestValue(trimmed);
			value = null;
			if (decoded.trim().startsWith("[")) {
				try {
					value = new JSONArray(decoded.trim());
				} catch (JSONException e) {
				}
			}
			if (value == null) {
				value = parseRestValue(decoded);
			}
		} else if (trimmed.length() >= 2 && trimmed.startsWith("'") && trimmed.endsWith("'")) {
			value = trimmed.substring(1, trimmed.length() - 1);
		} else if ("true".equalsIgnoreCase(trimmed) || "false".equalsIgnoreCase(trimmed)) {
			value = Boolean.parseBoolean(trimmed);
		} else if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
			try {
				value = new JSONObject(trimmed);
			} catch (JSONException e) {
			}
		} else if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
			value = parseArrayValue(trimmed);
		} else {
			try {
				if (trimmed.matches("-?\\d+")) {
					value = Integer.parseInt(trimmed);
				} else if (Double.isFinite(Double.parseDouble(trimmed))) {
					value = Double.parseDouble(trimmed);
				}
			} catch (NumberFormatException e) {
			}
		}
		return value;
	}

	/**
	 * Decodes a 'base64~' or 'deflate~' REST value. A '+' of the base64 that arrives as
	 * a space (not encoded in the URL) is restored.
	 *
	 * @param value encoded value, with its prefix
	 * @return decoded text
	 * @throws IllegalArgumentException if the value cannot be decoded
	 */
	private static String decodeRestValue(String value) {
		boolean compressed = value.startsWith(DEFLATE_PREFIX);
		String encoded = value.substring((compressed ? DEFLATE_PREFIX : BASE64_PREFIX).length())
				.replace(' ', '+');
		byte[] bytes = Base64.getDecoder().decode(encoded);
		return compressed ? inflate(bytes) : new String(bytes, StandardCharsets.UTF_8);
	}

	/**
	 * Decompresses a deflate (zlib) value, up to MAX_INFLATED_SIZE bytes.
	 *
	 * @param compressed compressed bytes
	 * @return decompressed UTF-8 text
	 * @throws IllegalArgumentException if the value is not valid or too large
	 */
	private static String inflate(byte[] compressed) {
		Inflater inflater = new Inflater();
		inflater.setInput(compressed);
		ByteArrayOutputStream output = new ByteArrayOutputStream();
		byte[] buffer = new byte[4096];
		try {
			while (!inflater.finished()) {
				int count = inflater.inflate(buffer);
				if (count == 0 && (inflater.needsInput() || inflater.needsDictionary())) {
					throw new IllegalArgumentException("Truncated deflate~ value");
				}
				output.write(buffer, 0, count);
				if (output.size() > MAX_INFLATED_SIZE) {
					throw new IllegalArgumentException("Too large deflate~ value");
				}
			}
		} catch (DataFormatException e) {
			throw new IllegalArgumentException("Invalid deflate~ value", e);
		} finally {
			inflater.end();
		}
		return new String(output.toByteArray(), StandardCharsets.UTF_8);
	}

	/**
	 * Parses a comma-separated array value, with or without surrounding brackets.
	 * Handles: [legend,style,delete] | legend,style,delete | ["a","b"] | [1,2,3]
	 * Each element is trimmed and surrounding quotes are stripped.
	 */
	private static JSONArray parseArrayValue(String value) {
		String trimmed = value.trim();
		if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
			trimmed = trimmed.substring(1, trimmed.length() - 1);
		}
		JSONArray arr = new JSONArray();
		for (String element : trimmed.split(",")) {
			String el = element.trim();
			// Strip surrounding quotes if present
			if (el.length() >= 2
					&& ((el.startsWith("\"") && el.endsWith("\""))
					|| (el.startsWith("'") && el.endsWith("'")))) {
				el = el.substring(1, el.length() - 1);
			}
			if ("true".equalsIgnoreCase(el) || "false".equalsIgnoreCase(el)) {
				arr.put(Boolean.parseBoolean(el));
			} else {
				try {
					arr.put(Double.parseDouble(el));
				} catch (NumberFormatException e) {
					arr.put(el);
				}
			}
		}
		return arr;
	}

	/**
	 * Builds a flat map of paramName -> paramType from a plugin's API definition.
	 * Recurses into OBJECT-type parameters to extract their properties.
	 */
	private static Map<String, String> getParamTypes(PluginAPI plugin) {
		Map<String, String> types = new HashMap<>();
		List<PluginAPIParam> params = plugin.getParameters();
		if (params != null) {
			for (PluginAPIParam param : params) {
				if (PluginAPIParam.OBJECT.equalsIgnoreCase(param.getType())) {
					List<PluginAPIParam> properties = param.getProperties();
					if (properties != null) {
						for (PluginAPIParam prop : properties) {
							if (prop.getName() != null) {
								types.put(prop.getName(), prop.getType());
							}
						}
					}
				} else if (param.getName() != null) {
					types.put(param.getName(), param.getType());
				}
			}
		}
		return types;
	}

	/**
	 * Creates a plugin from JSON configuration
	 * 
	 * @param pluginJson JSON object with plugin configuration
	 * @return plugin code string
	 */
	public static String createPluginFromJSON(JSONObject pluginJson) {
		StringBuilder pluginBuilder = new StringBuilder();

		String type = pluginJson.optString("type", "");
		JSONObject params = pluginJson.optJSONObject("params");

		pluginBuilder.append("new IDEE.plugin.").append(type).append("(");

		if (params != null) {
			pluginBuilder.append(params.toString());
		} else {
			pluginBuilder.append("{}");
		}

		pluginBuilder.append(")");

		return pluginBuilder.toString();
	}

	/**
	 * Creates a control from JSON configuration
	 * 
	 * @param controlJson JSON object with control configuration
	 * @return control code string
	 */
	public static String createControlFromJSON(JSONObject controlJson) {
		StringBuilder controlBuilder = new StringBuilder();

		String type = controlJson.optString("type", "");
		JSONObject params = controlJson.optJSONObject("params");

		// Capitalize first letter of control type
		String controlClass = type.substring(0, 1).toUpperCase() + type.substring(1);

		controlBuilder.append("new IDEE.control.").append(controlClass).append("(");

		if (params != null) {
			controlBuilder.append(params.toString());
		}

		controlBuilder.append(")");

		return controlBuilder.toString();
	}

	/**
	 * Creates a layer from JSON configuration
	 * 
	 * @param layerJson JSON object with layer configuration
	 * @return layer code string
	 */
	public static String createLayerFromJSON(JSONObject layerJson) {
		StringBuilder layerBuilder = new StringBuilder();

		String type = layerJson.optString("type", "");

		layerBuilder.append("new IDEE.layer.").append(type).append("(");

		if (layerJson.has("source")) {
			Object sourceObj = layerJson.get("source");

			if (sourceObj instanceof String) {
				layerBuilder.append("\"").append(sourceObj).append("\"");
			} else if (sourceObj instanceof JSONObject) {
				JSONObject source = (JSONObject) sourceObj;

				if (source.has("params")) {
					layerBuilder.append(source.getJSONObject("params").toString());
				}

				if (source.has("options")) {
					layerBuilder.append(",").append(source.getJSONObject("options").toString());
				}

				if (source.has("vendorOptions")) {
					JSONObject vendorOptions = source.getJSONObject("vendorOptions");
					layerBuilder.append(",{");

					java.util.Iterator<String> keys = vendorOptions.keys();
					boolean first = true;
					while (keys.hasNext()) {
						String key = keys.next();
						Object value = vendorOptions.get(key);

						if (!first) {
							layerBuilder.append(",");
						}
						first = false;

						layerBuilder.append(key).append(":");

						if (value instanceof String) {
							String strValue = (String) value;
							layerBuilder.append(strValue);
						} else {
							layerBuilder.append(value.toString());
						}
					}

					layerBuilder.append("}");
				}
			}
		}

		layerBuilder.append(")");

		if (layerJson.has("style")) {
			Object styleObj = layerJson.get("style");

			if (styleObj instanceof String) {
				layerBuilder.append(".setStyle(").append(styleObj).append(")");
			} else if (styleObj instanceof JSONObject) {
				JSONObject style = (JSONObject) styleObj;
				String styleType = style.optString("type", "");

				layerBuilder.append(".setStyle(new IDEE.style.").append(styleType).append("(");

				if (style.has("params")) {
					Object paramsObj = style.get("params");
					if (paramsObj instanceof JSONArray) {
						JSONArray paramsArray = (JSONArray) paramsObj;
						layerBuilder.append("[");
						for (int i = 0; i < paramsArray.length(); i++) {
							if (i > 0)
								layerBuilder.append(",");
							Object param = paramsArray.get(i);
							if (param instanceof String) {
								String paramStr = (String) param;
								if (paramStr.startsWith("M.") || paramStr.startsWith("IDEE.")
										|| paramStr.contains("(")) {
									layerBuilder.append(paramStr);
								} else {
									layerBuilder.append("\"").append(paramStr).append("\"");
								}
							} else if (param instanceof JSONArray) {
								layerBuilder.append(param.toString());
							} else {
								layerBuilder.append(param.toString());
							}
						}
						layerBuilder.append("]");
					} else {
						layerBuilder.append(paramsObj.toString());
					}
				}

				layerBuilder.append("))");
			}
		}

		if (layerJson.has("filter")) {
			String filter = layerJson.getString("filter");
			layerBuilder.append(".setFilter(").append(filter).append(")");
		}

		return layerBuilder.toString();
	}
}
