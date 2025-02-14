package es.cnig.mapea.api;

import java.io.File;
import java.io.FileInputStream;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.util.Arrays;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.ResourceBundle;

import javax.servlet.ServletContext;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.HeaderParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.ResponseBuilder;
import javax.ws.rs.core.UriInfo;

import org.json.JSONArray;
import org.json.JSONObject;

import es.cnig.mapea.builder.JSBuilder;
import es.cnig.mapea.database.persistence.domain.Columna;
import es.cnig.mapea.database.persistence.domain.DatosTabla;
import es.cnig.mapea.database.persistence.domain.Pagina;
import es.cnig.mapea.database.persistence.domain.Tabla;
import es.cnig.mapea.database.service.DatabaseService;
import es.cnig.mapea.database.service.impl.DatabaseServiceImpl;
import es.cnig.mapea.database.utils.CustomDatasource;
import es.cnig.mapea.database.utils.CustomPagination;

/**
 * This class manages the available actions for database connection an user can
 * execute
 * 
 * @author Guadaltel S.A.
 */
@Path("/database")
public class DatabaseWS {

	@Context
	private ServletContext context;

	private String defaultFormat = "wkt";

	@GET
	@Produces({ MediaType.APPLICATION_JSON })
	@Path("/conformance")
	public Response conformance() {
		JSONObject response = new JSONObject();
		JSONArray conformanceTo = new JSONArray();
		conformanceTo.put("http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/core");
		conformanceTo.put("http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/geojson");
		conformanceTo.put("http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/gmlsf0");
		conformanceTo.put("http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/gmlsf2");
		response.put("conformanceTo", conformanceTo);
		return Response.ok(JSBuilder.wrapCallback(response, null)).build();
	}

	/**
	 * The available databases
	 * 
	 * @param callbackFn the name of the javascript
	 *                   function to execute as callback
	 * 
	 * @return the javascript code
	 */
	@GET
	@Produces({ MediaType.APPLICATION_JSON })
	public Response showAvailableDatabases(@QueryParam("callback") String callbackFn,
			@HeaderParam("Origin") String origin) {
		if (validateOrigin(origin, false)) {
			String urlService = callbackFn != null && !callbackFn.isEmpty() ? "?callback=" + callbackFn : "";
			JSONArray links = addLinksToReponse(urlService, null);
			JSONArray databases = new JSONArray();
			List<CustomDatasource> datasources = new DatabaseServiceImpl().obtenerDatasources();
			for (CustomDatasource ds : datasources) {
				JSONObject dsJson = new JSONObject();
				dsJson.put("Nombre", ds.getNombre());
				dsJson.put("Host", ds.getHost());
				dsJson.put("Puerto", ds.getPuerto());
				dsJson.put("NombreBD", ds.getNombreBd());
				databases.put(dsJson);
			}
			JSONObject response = new JSONObject();
			response.put("links", links);
			response.put("results", databases);
			return Response.ok(JSBuilder.wrapCallback(response, callbackFn)).build();
		} else {
			return Response.status(401).build();
		}
	}

	/**
	 * The available tables
	 * 
	 * @param callbackFn the name of the javascript
	 *                   function to execute as callback *
	 * @param databaase  the name of database
	 * 
	 * @return the javascript code
	 */
	@GET
	@Path("/{database}/collections")
	@Produces({ MediaType.APPLICATION_JSON })
	public Response showAvailableTables(@PathParam("database") String database,
			@Context UriInfo uriInfo, @HeaderParam("Origin") String origin) {
		Map<String, List<String>> params = uriInfo.getQueryParameters();
		boolean token = false;
		if (params.containsKey("token")) {
			token = Boolean.valueOf(params.get("token").get(0));
			params.remove("token");
		}
		if (validateOrigin(origin, token)) {
			String callbackFn = null;
			String urlService = "/" + database + "/collections" + getUrlParams(params);
			if (params.containsKey("callback")) {
				callbackFn = params.get("callback").get(0);
				params.remove("callback");
			}
			DatabaseService dbService = new DatabaseServiceImpl();
			if (!dbService.validateDatasource(database, token)) {
				return Response.status(400).entity("La conexión indicada no es válida").build();
			}
			Pagina pagina = dbService.obtenerTablasGeometricasDataSource(database, obtenerPaginacion(params), token);
			JSONArray links = addLinksToReponse(urlService, null);
			List<Tabla> listTables = pagina.getResults();
			JSONArray tablesJSON = new JSONArray();
			for (Tabla tabla : listTables) {
				JSONObject json = new JSONObject();
				json.put("Nombre", tabla.getNombre());
				json.put("Schema", tabla.getSchema());
				tablesJSON.put(json);
			}
			if (pagina.getError() != null && !"".equals(pagina.getError())) {
				String[] errorSplit = pagina.getError().split(";");
				int code = Integer.parseInt(errorSplit[0]);
				return Response.status(code).entity(createErrorResponse(code, errorSplit[1], callbackFn)).build();
			} else {
				JSONObject jsonPagina = getJsonPagina(pagina);
				jsonPagina.put("links", links);
				jsonPagina.put("results", tablesJSON);
				return Response.ok(JSBuilder.wrapCallback(jsonPagina, callbackFn)).build();
			}
		} else {
			return Response.status(401).build();
		}
	}

	/**
	 * The attributes of table
	 * 
	 * @param callbackFn the name of the javascript
	 *                   function to execute as callback
	 * @param database   the name of database
	 * @param table      the name of the table
	 * 
	 * @return the javascript code
	 */
	@GET
	@Path("/{database}/attributes/{tabla}")
	@Produces({ MediaType.APPLICATION_JSON })
	public Response showAttributes(@PathParam("database") String database, @PathParam("tabla") String tabla,
			@Context UriInfo uriInfo, @HeaderParam("Origin") String origin) {
		Map<String, List<String>> params = uriInfo.getQueryParameters();
		boolean token = false;
		if (params.containsKey("token")) {
			token = Boolean.valueOf(params.get("token").get(0));
			params.remove("token");
		}
		if (validateOrigin(origin, token)) {
			JSONArray attributesJSON = new JSONArray();
			String schema = "public";
			String callbackFn = null;
			String urlService = "/" + database + "/attributes/" + tabla + getUrlParams(params);
			if (params.containsKey("schema")) {
				schema = params.get("schema").get(0);
				params.remove("schema");
			}
			if (params.containsKey("callback")) {
				callbackFn = params.get("callback").get(0);
				params.remove("callback");
			}
			DatabaseService dbService = new DatabaseServiceImpl();
			if (!dbService.validateDatasource(database, token)) {
				return Response.status(400).entity("La conexión indicada no es válida").build();
			}
			Pagina pagina = dbService.obtenerColumnasTabla(database, schema, tabla, obtenerPaginacion(params), token);
			JSONArray links = addLinksToReponse(urlService, null);
			List<Columna> listAttributes = pagina.getResults();
			for (Columna col : listAttributes) {
				JSONObject json = new JSONObject();
				json.put("Nombre", col.getNombre());
				json.put("TipoDato", col.getTipoDato());
				attributesJSON.put(json);
			}
			if (pagina.getError() != null && !"".equals(pagina.getError())) {
				String[] errorSplit = pagina.getError().split(";");
				int code = Integer.parseInt(errorSplit[0]);
				return Response.status(code).entity(createErrorResponse(code, errorSplit[1], callbackFn)).build();
			} else {
				JSONObject jsonPagina = getJsonPagina(pagina);
				jsonPagina.put("links", links);
				jsonPagina.put("results", attributesJSON);
				return Response.ok(JSBuilder.wrapCallback(jsonPagina, callbackFn)).build();
			}
		} else {
			return Response.status(401).build();
		}
	}

	/**
	 * Returns the filtered records from table
	 * 
	 * @param callbackFn the name of the javascript
	 *                   function to execute as callback
	 * @param database   the name of database
	 * @param table      the name of table
	 * 
	 * @return the javascript code
	 */
	@GET
	@Path("/{database}/collections/{tabla}/items")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML, MediaType.APPLICATION_OCTET_STREAM })
	public Response showRowsFiltered(@PathParam("database") String database, @PathParam("tabla") String tabla,
			@Context UriInfo uriInfo, @HeaderParam("Origin") String origin) {
		Map<String, List<String>> params = uriInfo.getQueryParameters();
		boolean token = false;
		if (params.containsKey("token")) {
			token = Boolean.valueOf(params.get("token").get(0));
			params.remove("token");
		}
		if (validateOrigin(origin, token)) {
			JSONArray rowsJSON = new JSONArray();
			String schema = "public";
			defaultFormat = "wkt";
			String callbackFn = null;
			boolean consumible = false;
			String urlService = "/" + database + "/collections/" + tabla + "/items" + getUrlParams(params);
			if (params.containsKey("schema")) {
				schema = params.get("schema").get(0);
				params.remove("schema");
			}
			if (params.containsKey("callback")) {
				callbackFn = params.get("callback").get(0);
				params.remove("callback");
			}
			if (params.containsKey("consumible")) {
				consumible = Boolean.valueOf(params.get("consumible").get(0));
				params.remove("consumible");
			}
			DatabaseService dbService = new DatabaseServiceImpl();
			if (!dbService.validateDatasource(database, token)) {
				return Response.status(400).build();
			}
			CustomPagination paginacion = obtenerPaginacion(params);
			Pagina pagina = dbService.obtenerDatosFiltrados(database, schema, tabla, params, paginacion, token);
			JSONArray links = addLinksToReponse(urlService, paginacion.getFormato());
			List<DatosTabla> data = pagina.getResults();
			for (DatosTabla dt : data) {
				rowsJSON.put(datosTablaToJson(dt));
			}
			if (pagina.getError() != null && !"".equals(pagina.getError())) {
				String[] errorSplit = pagina.getError().split(";");
				int code = Integer.parseInt(errorSplit[0]);
				return Response.status(code).entity(createErrorResponse(code, errorSplit[1], callbackFn))
						.header("Content-Type", MediaType.APPLICATION_JSON).build();
			} else {
				if ("mvt".equals(pagina.getFormato())) {// formato mvt siempre es consumible
					JSONObject row = (JSONObject) rowsJSON.get(0);
					String rutaFile = row.getString(pagina.getFormato());
					File mvtFile = new File(rutaFile);
					return Response.ok(mvtFile)
							.header("Content-Disposition", "attachment; filename=\"mvt-cnig.mvt\"")
							.header("Content-Type", MediaType.APPLICATION_OCTET_STREAM)
							.build();
				} else if (consumible) {
					if ("wkt".equals(pagina.getFormato())) {
						return Response.ok(JSBuilder.wrapCallback(rowsJSON, callbackFn))
								.header("Content-Type", MediaType.APPLICATION_JSON).build();
					} else {
						JSONObject row = (JSONObject) rowsJSON.get(0);
						String result = row.getString(pagina.getFormato());
						ResponseBuilder rb = null;
						if ("kml".equals(pagina.getFormato()) || "gml".equals(pagina.getFormato())) {
							rb = Response.ok(JSBuilder.wrapCallback(result, callbackFn));
							rb.header("Content-Type", MediaType.APPLICATION_XML);
						} else {
							JSONObject response = new JSONObject(result);
							response.put("links", links);
							response.put("numberMatched", pagina.getTotalElementos());
							response.put("numberReturned", pagina.getTamPagina());
							rb = Response.ok(JSBuilder.wrapCallback(response, callbackFn));
							rb.header("Content-Type", MediaType.APPLICATION_JSON);
						}
						return rb.build();
					}
				} else {
					JSONObject jsonPagina = getJsonPagina(pagina);
					jsonPagina.put("links", links);
					jsonPagina.put("results", rowsJSON);
					return Response.ok(JSBuilder.wrapCallback(jsonPagina, callbackFn))
							.header("Content-Type", MediaType.APPLICATION_JSON).build();
				}
			}
		} else {
			return Response.status(401).build();
		}
	}

	@GET
	@Path("/{database}/{tabla}/sql")
	@Produces({ MediaType.APPLICATION_JSON })
	public Response customQuery(@PathParam("database") String database, @PathParam("tabla") String tabla,
			@Context UriInfo uriInfo, @HeaderParam("Origin") String origin) {
		Map<String, List<String>> params = uriInfo.getQueryParameters();
		boolean token = false;
		if (params.containsKey("token")) {
			token = Boolean.valueOf(params.get("token").get(0));
			params.remove("token");
		}
		if (validateOrigin(origin, token)) {
			JSONArray rowsJSON = new JSONArray();
			String schema = "public";
			String callbackFn = null;
			String urlService = "/" + database + "/" + tabla + "/sql" + getUrlParams(params);
			if (params.containsKey("schema")) {
				schema = params.get("schema").get(0);
				params.remove("schema");
			}
			if (params.containsKey("callback")) {
				callbackFn = params.get("callback").get(0);
				params.remove("callback");
			}
			DatabaseService dbService = new DatabaseServiceImpl();
			if (!dbService.validateDatasource(database, token)) {
				return Response.status(400).entity("La conexión indicada no es válida").build();
			}
			JSONArray links = addLinksToReponse(urlService, null);
			Pagina pagina = dbService.obtenerDatosPersonalizados(database, schema, tabla, params,
					new CustomPagination(), token);
			if (pagina.getError() != null && !"".equals(pagina.getError())) {
				String[] errorSplit = pagina.getError().split(";");
				int code = Integer.parseInt(errorSplit[0]);
				return Response.status(code).entity(createErrorResponse(code, errorSplit[1], callbackFn))
						.header("Content-Type", MediaType.APPLICATION_JSON).build();
			} else {
				List<DatosTabla> data = pagina.getResults();
				for (DatosTabla dt : data) {
					rowsJSON.put(datosTablaToJson(dt));
				}
				JSONObject jsonPagina = getJsonPagina(pagina);
				jsonPagina.put("links", links);
				jsonPagina.put("results", rowsJSON);
				return Response.ok(JSBuilder.wrapCallback(jsonPagina, callbackFn))
						.header("Content-Type", MediaType.APPLICATION_JSON).build();
			}
		} else {
			return Response.status(401).build();
		}
	}

	@GET
	@Path("/{database}")
	@Produces({ MediaType.APPLICATION_JSON })
	public Response nativeQuery(@PathParam("database") String database, @Context UriInfo uriInfo,
			@HeaderParam("Origin") String origin) {
		Map<String, List<String>> params = uriInfo.getQueryParameters();
		boolean token = false;
		if (params.containsKey("token")) {
			token = Boolean.valueOf(params.get("token").get(0));
			params.remove("token");
		}
		if (validateOrigin(origin, token)) {
			JSONArray rowsJSON = new JSONArray();
			String callbackFn = null;
			String urlService = "/" + database + getUrlParams(params);
			if (params.containsKey("callback")) {
				callbackFn = params.get("callback").get(0);
				params.remove("callback");
			}
			DatabaseService dbService = new DatabaseServiceImpl();
			if (!dbService.validateDatasource(database, token)) {
				return Response.status(400).entity("La conexión indicada no es válida").build();
			}
			JSONArray links = addLinksToReponse(urlService, null);
			Pagina pagina = dbService.obtenerDatosPersonalizados(database, params, new CustomPagination(), token);
			if (pagina.getError() != null && !"".equals(pagina.getError())) {
				String[] errorSplit = pagina.getError().split(";");
				int code = Integer.parseInt(errorSplit[0]);
				return Response.status(code).entity(createErrorResponse(code, errorSplit[1], callbackFn))
						.header("Content-Type", MediaType.APPLICATION_JSON).build();
			} else {
				List<DatosTabla> data = pagina.getResults();
				for (DatosTabla dt : data) {
					rowsJSON.put(datosTablaToJson(dt));
				}
				JSONObject jsonPagina = getJsonPagina(pagina);
				jsonPagina.put("links", links);
				jsonPagina.put("results", rowsJSON);
				return Response.ok(JSBuilder.wrapCallback(jsonPagina, callbackFn))
						.header("Content-Type", MediaType.APPLICATION_JSON).build();
			}
		} else {
			return Response.status(401).build();
		}
	}

	@GET
	@Path("/{database}/layerfilter")
	@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML, MediaType.APPLICATION_OCTET_STREAM })
	public Response layerQuery(@PathParam("database") String database, @Context UriInfo uriInfo,
			@HeaderParam("Origin") String origin) {
		Map<String, List<String>> params = uriInfo.getQueryParameters();
		boolean token = false;
		if (params.containsKey("token")) {
			token = Boolean.valueOf(params.get("token").get(0));
			params.remove("token");
		}
		if (validateOrigin(origin, token)) {
			JSONArray rowsJSON = new JSONArray();
			defaultFormat = "geojson";
			String schema = "public";
			String callbackFn = null;
			String urlService = "/" + database + "/layerfilter" + getUrlParams(params);
			if (params.containsKey("callback")) {
				callbackFn = params.get("callback").get(0);
				params.remove("callback");
			}
			DatabaseService dbService = new DatabaseServiceImpl();
			if (!dbService.validateDatasource(database, token)) {
				return Response.status(400).entity("La conexión indicada no es válida").build();
			}
			CustomPagination paginacion = obtenerPaginacion(params);
			JSONArray links = addLinksToReponse(urlService, paginacion.getFormato());
			Pagina pagina = dbService.obtenerDatosLayer(database, schema, params, paginacion, token);
			if (pagina.getError() != null && !"".equals(pagina.getError())) {
				String[] errorSplit = pagina.getError().split(";");
				int code = Integer.parseInt(errorSplit[0]);
				return Response.status(code).entity(createErrorResponse(code, errorSplit[1], callbackFn))
						.header("Content-Type", MediaType.APPLICATION_JSON).build();
			} else {
				List<DatosTabla> data = pagina.getResults();
				for (DatosTabla dt : data) {
					rowsJSON.put(datosTablaToJson(dt));
				}

				if ("mvt".equals(pagina.getFormato())) {
					JSONObject row = (JSONObject) rowsJSON.get(0);
					String rutaFile = row.getString(pagina.getFormato());
					File mvtFile = new File(rutaFile);
					return Response.ok(mvtFile)
							.header("Content-Disposition", "attachment; filename=\"mvt-cnig.mvt\"")
							.header("Content-Type", MediaType.APPLICATION_OCTET_STREAM)
							.build();
				} else if ("wkt".equals(pagina.getFormato())) {
					JSONObject response = new JSONObject();
					response.put("links", links);
					response.put("results", rowsJSON);
					return Response.ok(JSBuilder.wrapCallback(response, callbackFn))
							.header("Content-Type", MediaType.APPLICATION_JSON).build();
				} else {
					JSONObject row = (JSONObject) rowsJSON.get(0);
					String result = row.getString(pagina.getFormato());
					ResponseBuilder rb = null;
					if ("kml".equals(pagina.getFormato()) || "gml".equals(pagina.getFormato())) {
						rb = Response.ok(JSBuilder.wrapCallback(result, callbackFn));
						rb.header("Content-Type", MediaType.APPLICATION_XML);
					} else {
						JSONObject response = new JSONObject(result);
						response.put("links", links);
						rb = Response.ok(JSBuilder.wrapCallback(response, callbackFn));
						rb.header("Content-Type", MediaType.APPLICATION_JSON);
					}
					return rb.build();
				}
			}
		} else {
			return Response.status(401).build();
		}
	}

	/**
	 * Returns the domain values from table column
	 * 
	 * @param callbackFn the name of the javascript
	 *                   function to execute as callback
	 * @param database   the name of database
	 * @param table      the name of table
	 * 
	 * @return the javascript code
	 */
	@GET
	@Path("/{database}/{tabla}/domain/{columna}")
	@Produces({ MediaType.APPLICATION_JSON })
	public Response showDomainValues(@PathParam("database") String database, @PathParam("tabla") String tabla,
			@PathParam("columna") String columna, @Context UriInfo uriInfo, @HeaderParam("Origin") String origin) {
		Map<String, List<String>> params = uriInfo.getQueryParameters();
		boolean token = false;
		if (params.containsKey("token")) {
			token = Boolean.valueOf(params.get("token").get(0));
			params.remove("token");
		}
		if (validateOrigin(origin, token)) {
			JSONArray domainJson = new JSONArray();
			String schema = "public";
			String callbackFn = null;
			String urlService = "/" + database + "/" + tabla + "/domain/" + columna + getUrlParams(params);
			if (params.containsKey("schema")) {
				schema = params.get("schema").get(0);
				params.remove("schema");
			}
			if (params.containsKey("callback")) {
				callbackFn = params.get("callback").get(0);
				params.remove("callback");
			}
			DatabaseService dbService = new DatabaseServiceImpl();
			if (!dbService.validateDatasource(database, token)) {
				return Response.status(400).entity("La conexión indicada no es válida").build();
			}
			List<String> domains = dbService.obtenerValoresDominio(database, schema, tabla, columna, token);
			for (String d : domains) {
				domainJson.put(d);
			}
			JSONArray links = addLinksToReponse(urlService, null);
			JSONObject response = new JSONObject();
			response.put("links", links);
			response.put("results", domainJson);
			return Response.ok(JSBuilder.wrapCallback(response, callbackFn)).build();
		} else {
			return Response.status(401).build();
		}
	}

	private CustomPagination obtenerPaginacion(Map<String, List<String>> params) {
		CustomPagination paginacion = new CustomPagination();
		if (params.containsKey("limit")) {
			String limit = params.get("limit").get(0);
			paginacion.setLimit(Integer.parseInt(limit));
			params.remove("limit");
		}
		if (params.containsKey("offset")) {
			String offset = params.get("offset").get(0);
			paginacion.setOffset(Integer.parseInt(offset));
			params.remove("offset");
		}
		if (params.containsKey("formato")) {
			String formato = params.get("formato").get(0);
			validateFormatGeom(formato);
			paginacion.setFormato(formato);
			params.remove("formato");
		} else {
			paginacion.setFormato(defaultFormat);
		}
		return paginacion;
	}

	private JSONObject getJsonPagina(Pagina pagina) {
		JSONObject jsonPagina = new JSONObject();
		jsonPagina.put("numPagina", pagina.getNumPagina());
		jsonPagina.put("tamPagina", pagina.getTamPagina());
		jsonPagina.put("totalElementos", pagina.getTotalElementos());
		// jsonPagina.put("error", pagina.getError());
		return jsonPagina;
	}

	private JSONObject datosTablaToJson(DatosTabla dt) {
		JSONObject json = new JSONObject();
		Map<String, Object> mapAttributes = dt.getMapAttributes();
		Iterator<String> itKeys = mapAttributes.keySet().iterator();
		while (itKeys.hasNext()) {
			String key = itKeys.next();
			Object value = mapAttributes.get(key);
			json.put(key, value);
		}
		return json;
	}

	private void validateFormatGeom(String formato) {
		if (formato != null && !"".equals(formato)) {
			if (!"wkt".equalsIgnoreCase(formato) || !"geojson".equalsIgnoreCase(formato) ||
					!"kml".equalsIgnoreCase(formato) || !"mvt".equalsIgnoreCase(formato) ||
					!"gml".equalsIgnoreCase(formato)) {
				formato = defaultFormat;
			}
		} else {
			formato = defaultFormat;
		}
	}

	private String createErrorResponse(int code, String description, String callbackFn) {
		JSONObject response = new JSONObject();
		response.put("code", code);
		response.put("description", description);
		return JSBuilder.wrapCallback(response, callbackFn);
	}

	private JSONArray addLinksToReponse(String url, String formato) {
		ResourceBundle configProperties = ResourceBundle.getBundle("configuration");
		String mapeaUrl = configProperties.getString("mapea.url") + "api/database";
		JSONArray links = new JSONArray();
		links.put(createLink(mapeaUrl + url, "self", getTypeLinkByFormato(formato), "this document"));
		addAlternateLinks(links, mapeaUrl + url, formato);

		return links;
	}

	private void addAlternateLinks(JSONArray links, String url, String formato) {
		if (formato != null && !formato.isEmpty()) {
			String rel = "alternate";
			String urlAlternate = "";
			boolean containsFormat = url.contains("formato=" + formato);
			boolean urlParams = url.contains("?");
			if (!"wkt".equals(formato)) {
				if (containsFormat) {
					urlAlternate = url.replace("formato=" + formato, "formato=wkt");
				} else if (urlParams) {
					urlAlternate = url.concat("&formato=wkt");
				} else {
					urlAlternate = url.concat("?formato=wkt");
				}
				links.put(createLink(urlAlternate, rel, MediaType.APPLICATION_JSON, "this document as json"));
			}
			if (!"geojson".equals(formato)) {
				links.put(createLink(urlAlternate, rel, MediaType.APPLICATION_JSON, "this document as geojson"));
			}
			if (!"gml".equals(formato)) {
				if (containsFormat) {
					urlAlternate = url.replace("formato=" + formato, "formato=gml");
				} else if (urlParams) {
					urlAlternate = url.concat("&formato=gml");
				} else {
					urlAlternate = url.concat("?formato=gml");
				}
				links.put(createLink(urlAlternate, rel, MediaType.APPLICATION_XML, "this document as gml"));
			}
			if (!"kml".equals(formato)) {
				if (containsFormat) {
					urlAlternate = url.replace("formato=" + formato, "formato=kml");
				} else if (urlParams) {
					urlAlternate = url.concat("&formato=kml");
				} else {
					urlAlternate = url.concat("?formato=kml");
				}
				links.put(createLink(urlAlternate, rel, MediaType.APPLICATION_XML, "this document as kml"));
			}
			if (!"mvt".equals(formato)) {
				if (containsFormat) {
					urlAlternate = url.replace("formato=" + formato, "formato=mvt");
				} else if (urlParams) {
					urlAlternate = url.concat("&formato=mvt");
				} else {
					urlAlternate = url.concat("?formato=mvt");
				}
				links.put(createLink(urlAlternate, rel, MediaType.APPLICATION_OCTET_STREAM, "this document as mvt"));
			}
		}
	}

	private JSONObject createLink(String href, String rel, String type, String title) {
		JSONObject link = new JSONObject();
		link.put("href", href);
		link.put("rel", rel);
		link.put("type", type);
		link.put("title", title);
		return link;
	}

	private String getTypeLinkByFormato(String formato) {
		String result = "";
		if ("wkt".equals(formato) || "geojson".equals(formato)) {
			result = MediaType.APPLICATION_JSON;
		} else if ("gml".equals(formato) || "kml".equals(formato)) {
			result = MediaType.APPLICATION_XML;
		} else if ("mvt".equals(formato)) {
			result = MediaType.APPLICATION_OCTET_STREAM;
		} else {
			result = MediaType.APPLICATION_JSON;
		}
		return result;
	}

	private String getUrlParams(Map<String, List<String>> params) {
		StringBuilder result = new StringBuilder("?");
		if (params != null && !params.isEmpty()) {
			Iterator<String> it = params.keySet().iterator();
			while (it.hasNext()) {
				String key = it.next();
				String value = params.get(key).get(0);
				if ("layer".equals(key)) {
					try {
						String valueEncode = URLEncoder.encode(value, "UTF-8");
						result.append(key + "=" + valueEncode + "&");
					} catch (UnsupportedEncodingException e) {
						result.append(key + "=" + value + "&");
						e.printStackTrace();
					}
				} else {
					result.append(key + "=" + value + "&");
				}
			}
			return result.substring(0, result.length() - 1);
		}
		return "";
	}

	private boolean validateOrigin(String origin, boolean token) {
		boolean result = false;
		ResourceBundle configProperties = ResourceBundle.getBundle("configuration");
		String list = configProperties.getString("database.list");
		if ("white".equals(list)) {
			result = validateOriginByWhiteList(origin, token);
		} else if ("black".equals(list)) {
			result = validateOriginByBlackList(origin);
		}
		return result;
	}

	private boolean validateOriginByWhiteList(String origin, boolean token) {
		boolean result = false;
		if (token) {
			return true;
		} else if (origin == null) {
			return result;
		} else {
			origin = origin.replace("https://", "").replace("http://", "");
		}
		ResourceBundle configProperties = ResourceBundle.getBundle("configuration");
		String whiteListProp = configProperties.getString("database.whitelist");
		if (whiteListProp != null && !whiteListProp.isEmpty()) {
			List<String> whiteList = Arrays.asList(whiteListProp.split(";"));
			result = whiteList.contains(origin);
		}
		return result;
	}

	private boolean validateOriginByBlackList(String origin) {
		boolean result = true;
		if (origin == null) {
			return result;
		} else {
			origin = origin.replace("https://", "").replace("http://", "");
		}
		ResourceBundle configProperties = ResourceBundle.getBundle("configuration");
		String blackListProp = configProperties.getString("database.blacklist");
		if (blackListProp != null && !blackListProp.isEmpty()) {
			List<String> blackList = Arrays.asList(blackListProp.split(";"));
			result = !blackList.contains(origin);
		}
		return result;
	}
}
