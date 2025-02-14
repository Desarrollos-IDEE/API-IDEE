package es.cnig.mapea.database.persistence.domain;

public class Tabla {

	private String schema;
	
	private String nombre;

	public Tabla(){
		
	}
	
	public Tabla(String schema, String nombre) {
		super();
		this.schema = schema;
		this.nombre = nombre;
	}

	public String getSchema() {
		return schema;
	}

	public void setSchema(String schema) {
		this.schema = schema;
	}

	public String getNombre() {
		return nombre;
	}

	public void setNombre(String nombre) {
		this.nombre = nombre;
	}

}
