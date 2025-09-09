package es.api_idee.database.config;

import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.ResourceBundle;

import javax.sql.DataSource;

import com.zaxxer.hikari.HikariDataSource;

import es.api_idee.database.utils.CustomDatasource;

public class DataSourceConfiguration {

	private List<CustomDatasource> listDatasources;
	
	private String driverClassName;
	
	private int maxPoolSize;
	
	public DataSourceConfiguration(){
		listDatasources = new LinkedList<CustomDatasource>();
		initDataSource();
	}
	
	public void initDataSource(){
		ResourceBundle bundle = ResourceBundle.getBundle("config-databases");
		String [] nombres = bundle.getString("datasource.names").split(";");
		String[] hosts = bundle.getString("datasource.hosts").split(";");
		String[] puertos = bundle.getString("datasource.ports").split(";");
		String[] bds = bundle.getString("datasource.bds").split(";");
		String[] usuarios = bundle.getString("datasource.usernames").split(";");
		String[] passwords = bundle.getString("datasource.passwords").split(";");
		this.driverClassName = bundle.getString("datasource.driverClassName");
		this.maxPoolSize = Integer.parseInt(bundle.getString("datasource.maxPoolSize"));
		for (int i = 0; i < nombres.length; i++){
			CustomDatasource cds = new CustomDatasource();
			cds.setHost(hosts[i]);
			cds.setNombre(nombres[i]);
			cds.setNombreBd(bds[i]);
			cds.setPassword(passwords[i]);
			cds.setPuerto(puertos[i]);
			cds.setUsuario(usuarios[i]);
			listDatasources.add(cds);
		}
	}
	
	public List<CustomDatasource> getDataSources(){
		return this.listDatasources;
	}
	
	public DataSource getDataSource(String name){
		DataSource result = null;
		for (CustomDatasource cds : listDatasources){
			if(cds.getNombre().equals(name)){
				result = createDataSource(cds);
				break;
			}
		}
		return result;
	}
	
	public DataSource getDefaultDataSource(){
		return createDataSource(listDatasources.get(0));
	}
	
	public DataSource createDataSourceByToken(String token){
		Map<String, String> mapConnection = createMapByToken(token);
		CustomDatasource cds = new CustomDatasource();
		cds.setHost(mapConnection.get("host"));
//		cds.setNombre(mapConnection.get("name"));
		cds.setNombreBd(mapConnection.get("name"));
		cds.setPassword(mapConnection.get("password"));
		cds.setPuerto(mapConnection.get("port"));
		cds.setUsuario(mapConnection.get("user"));
		return createDataSource(cds);
	}
	
	public Map<String, String> createMapByToken(String token){
		Map<String, String> result = new HashMap<String, String>(); 
		String[] datos = token.split("&");
		for(int i = 0; i < datos.length; i++){
			String[] field = datos[i].split("=");
			result.put(field[0], field[1]);
		}
		return result;
	}
	
	public DataSource createDataSource(CustomDatasource customDatasource){
		HikariDataSource hikariDataSource = new HikariDataSource();
		hikariDataSource.setJdbcUrl("jdbc:postgresql://"+customDatasource.getHost()+":"+customDatasource.getPuerto()+"/"+customDatasource.getNombreBd());
		hikariDataSource.setUsername(customDatasource.getUsuario());
		hikariDataSource.setPassword(customDatasource.getPassword());
		hikariDataSource.setDriverClassName(driverClassName);
		hikariDataSource.setMaximumPoolSize(this.maxPoolSize);
		hikariDataSource.setReadOnly(true);
		return hikariDataSource;
	}
}
