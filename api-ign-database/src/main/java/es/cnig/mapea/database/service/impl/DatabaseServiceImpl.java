package es.cnig.mapea.database.service.impl;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import javax.sql.DataSource;

import es.cnig.mapea.database.config.DataSourceConfiguration;
import es.cnig.mapea.database.persistence.domain.Columna;
import es.cnig.mapea.database.persistence.domain.DatosTabla;
import es.cnig.mapea.database.persistence.domain.Pagina;
import es.cnig.mapea.database.persistence.domain.Tabla;
import es.cnig.mapea.database.persistence.repository.DatabaseRepository;
import es.cnig.mapea.database.persistence.repository.impl.DatabaseRepositoryImpl;
import es.cnig.mapea.database.service.DatabaseService;
import es.cnig.mapea.database.utils.CustomDatasource;
import es.cnig.mapea.database.utils.CustomPagination;
import org.apache.commons.codec.binary.Base64;

import com.zaxxer.hikari.HikariDataSource;

public class DatabaseServiceImpl implements DatabaseService{
	
	DataSourceConfiguration datasourceConfiguration;
	
	public DatabaseServiceImpl(){
		this.datasourceConfiguration = new DataSourceConfiguration();
	}

	@Override
	public Pagina obtenerTablasGeometricasDataSource(String dataSourceName, CustomPagination paginacion, boolean token) {
		DataSource ds = token ? getDataSourceEncrypt(dataSourceName) : getDataSource(dataSourceName);
		Pagina pagina = new Pagina();
		List<Tabla> tablas = getDatabaseRepository(ds).getGeomTables(paginacion);
		pagina.setResults(tablas);
		pagina.setTamPagina(paginacion.getLimit());
		pagina.setNumPagina(paginacion.getPage());
		pagina.setTotalElementos(paginacion.getSize());
		pagina.setError(paginacion.getError());
		((HikariDataSource)ds).close();
		return pagina;
	}

	@Override
	public List<CustomDatasource> obtenerDatasources() {
		return datasourceConfiguration.getDataSources();
	}

	@Override
	public Pagina obtenerColumnasTabla(String dataSourceName, String schema, String table,
			CustomPagination paginacion, boolean token) {
		DataSource ds = token ? getDataSourceEncrypt(dataSourceName) : getDataSource(dataSourceName);
		Pagina pagina = new Pagina();
		pagina.setNumPagina(paginacion.getPage());
		List<Columna> columnas = getDatabaseRepository(ds).getTableColumns(schema, table, paginacion);
		pagina.setTamPagina(paginacion.getLimit());
		pagina.setResults(columnas);
		pagina.setTotalElementos(paginacion.getSize());
		pagina.setError(paginacion.getError());
		((HikariDataSource)ds).close();
		return pagina;
	}

	@Override
	public Pagina obtenerDatosFiltrados(String dataSourceName, String schema, String table,
			Map<String, List<String>> filtros, CustomPagination paginacion, boolean token) {
		DataSource ds = token ? getDataSourceEncrypt(dataSourceName) : getDataSource(dataSourceName);
		Pagina pagina = new Pagina();
		List<DatosTabla> datos = getDatabaseRepository(ds).getFilteredData(schema, table, filtros, paginacion);
		pagina.setResults(datos);
		pagina.setTamPagina(paginacion.getLimit());
		pagina.setTotalElementos(paginacion.getSize());
		pagina.setNumPagina(paginacion.getPage());
		pagina.setFormato(paginacion.getFormato());
		pagina.setError(paginacion.getError());
		((HikariDataSource)ds).close();
		return pagina;
	}
	
	@Override
	public Pagina obtenerDatosPersonalizados(String dataSourceName, String schema, String table,
			Map<String, List<String>> params, CustomPagination paginacion, boolean token){
		DataSource ds = token ? getDataSourceEncrypt(dataSourceName) : getDataSource(dataSourceName);
		Pagina pagina = new Pagina();
		List<DatosTabla> datos = getDatabaseRepository(ds).getCustomQueryData(schema, table, params, paginacion);
		pagina.setResults(datos);
		pagina.setTamPagina(paginacion.getLimit());
		pagina.setTotalElementos(paginacion.getSize());
		pagina.setNumPagina(paginacion.getPage());
		pagina.setError(paginacion.getError());
		pagina.setFormato(paginacion.getFormato());
		((HikariDataSource)ds).close();
		return pagina;
	}
	
	@Override
	public Pagina obtenerDatosPersonalizados(String dataSourceName, Map<String, List<String>> params, CustomPagination paginacion, boolean token){
		DataSource ds = token ? getDataSourceEncrypt(dataSourceName) : getDataSource(dataSourceName);
		Pagina pagina = new Pagina();
		List<DatosTabla> datos = getDatabaseRepository(ds).getNativeQueryData(params, paginacion);
		pagina.setResults(datos);
		pagina.setTamPagina(paginacion.getLimit());
		pagina.setTotalElementos(paginacion.getSize());
		pagina.setNumPagina(paginacion.getPage());
		pagina.setError(paginacion.getError());
		pagina.setFormato(paginacion.getFormato());
		((HikariDataSource)ds).close();
		return pagina;
	}
	
	@Override
	public Pagina obtenerDatosLayer(String dataSourceName, String schema, Map<String, List<String>> params, CustomPagination paginacion, boolean token){
		DataSource ds = token ? getDataSourceEncrypt(dataSourceName) : getDataSource(dataSourceName);
		Pagina pagina = new Pagina();
		int tamPagina = -1;
		if(params.containsKey("limit")){
			tamPagina = Integer.parseInt(params.get("limit").get(0));
		}
		List<DatosTabla> datos = getDatabaseRepository(ds).getLayerQueryData(params, paginacion);
		pagina.setResults(datos);
		if(tamPagina < 0){
			tamPagina = paginacion.getSize();
		}
		pagina.setTamPagina(tamPagina);
		pagina.setTotalElementos(paginacion.getSize());
		pagina.setNumPagina(paginacion.getPage());
		pagina.setError(paginacion.getError());
		pagina.setFormato(paginacion.getFormato());
		((HikariDataSource)ds).close();
		return pagina;
	}
	
	@Override
	public List<String> obtenerValoresDominio(String dataSourceName, String schema, String table, String columna, boolean token){
		DataSource ds = token ? getDataSourceEncrypt(dataSourceName) : getDataSource(dataSourceName);
		List<String> result = getDatabaseRepository(ds).getDomainValues(schema, table, columna);
		((HikariDataSource)ds).close();
		return result;
	}
	
	public boolean validateDatasource(String datasourceName, boolean token){
		boolean result = false;
		DataSource ds = null;
		if(token){
			ds = getDataSourceEncrypt(datasourceName);
		}else{
			ds = getDataSource(datasourceName);
		}
		result = ds != null;
		if(result){
			((HikariDataSource)ds).close();
		}
		return result;
	}
	
	private DataSource getDataSource(String dataSourceName){
		DataSource ds = null;
		if(dataSourceName != null && !"".equals(dataSourceName)){
			ds = datasourceConfiguration.getDataSource(dataSourceName);
		}else{
			ds = datasourceConfiguration.getDefaultDataSource();
		}
		return ds;
	}
	
	private DataSource getDataSourceEncrypt(String token){
		byte[] enc = Base64.decodeBase64(token);
		String decrypted = new String(enc, StandardCharsets.UTF_8);
		return datasourceConfiguration.createDataSourceByToken(decrypted);
	}
	
	private DatabaseRepository getDatabaseRepository(DataSource ds){
		return new DatabaseRepositoryImpl(ds);
	}

}
