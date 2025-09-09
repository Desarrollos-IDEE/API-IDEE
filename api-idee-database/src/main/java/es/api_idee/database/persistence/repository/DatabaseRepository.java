package es.api_idee.database.persistence.repository;

import java.util.List;
import java.util.Map;

import es.api_idee.database.persistence.domain.Columna;
import es.api_idee.database.persistence.domain.DatosTabla;
import es.api_idee.database.persistence.domain.Tabla;
import es.api_idee.database.utils.CustomPagination;

public interface DatabaseRepository {

	public List<Tabla> getGeomTables(CustomPagination paginacion);
	
	public List<Columna> getTableColumns(String schema, String table, CustomPagination paginacion);
	
	public List<DatosTabla> getFilteredData(String schema, String table, Map<String, List<String>> filtros, CustomPagination paginacion);
	
	public List<DatosTabla> getCustomQueryData(String schema, String table, Map<String, List<String>> params, CustomPagination paginacion);
	
	public List<DatosTabla> getNativeQueryData(Map<String, List<String>> params, CustomPagination paginacion);
	
	public List<DatosTabla> getLayerQueryData(Map<String, List<String>> params, CustomPagination paginacion);
	
	public List<String> getDomainValues(String schema, String table, String columna);
}
