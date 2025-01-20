package es.api_idee.database.utils;

public class CustomDatasource {

	private String nombre;
	
	private String host;
	
	private String puerto;
	
	private String nombreBd;
	
	private String usuario;
	
	private String password;
	
	public CustomDatasource(){
		
	}

	public CustomDatasource(String nombre, String host, String puerto, String nombreBd, String usuario,
			String password) {
		super();
		this.nombre = nombre;
		this.host = host;
		this.puerto = puerto;
		this.nombreBd = nombreBd;
		this.usuario = usuario;
		this.password = password;
	}

	public String getNombre() {
		return nombre;
	}

	public void setNombre(String nombre) {
		this.nombre = nombre;
	}

	public String getHost() {
		return host;
	}

	public void setHost(String host) {
		this.host = host;
	}

	public String getPuerto() {
		return puerto;
	}

	public void setPuerto(String puerto) {
		this.puerto = puerto;
	}

	public String getNombreBd() {
		return nombreBd;
	}

	public void setNombreBd(String nombreBd) {
		this.nombreBd = nombreBd;
	}

	public String getUsuario() {
		return usuario;
	}

	public void setUsuario(String usuario) {
		this.usuario = usuario;
	}

	public String getPassword() {
		return password;
	}

	public void setPassword(String password) {
		this.password = password;
	}
	
}
