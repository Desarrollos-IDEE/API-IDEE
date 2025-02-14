package es.cnig.mapea.database.service;

import java.util.List;
import java.util.Map;

import es.cnig.mapea.database.persistence.domain.Pagina;
import es.cnig.mapea.database.utils.CustomDatasource;
import es.cnig.mapea.database.utils.CustomPagination;

public interface DatabaseService {

	public List<CustomDatasource> obtenerDatasources();
	
	public Pagina obtenerTablasGeometricasDataSource(String dataSourceName, CustomPagination paginacion, boolean token);
	
	public Pagina obtenerColumnasTabla(String dataSourceName, String schema, String table, CustomPagination paginacion, boolean token);
	
	public Pagina obtenerDatosFiltrados(String dataSourceName, String schema, String table, Map<String, List<String>> filtros, CustomPagination paginacion, boolean token);
	
	public Pagina obtenerDatosPersonalizados(String dataSourceName, String schema, String table, Map<String, List<String>> params, CustomPagination paginacion, boolean token);
	
	public Pagina obtenerDatosPersonalizados(String dataSourceName, Map<String, List<String>> params, CustomPagination paginacion, boolean token);
	
	public Pagina obtenerDatosLayer(String dataSourceName, String schema, Map<String, List<String>> params, CustomPagination paginacion, boolean token);
	
	public List<String> obtenerValoresDominio(String dataSourceName, String schema, String table, String columna, boolean token);
	
	public boolean validateDatasource(String datasourceName, boolean token);
}
