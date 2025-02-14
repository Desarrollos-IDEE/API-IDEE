package es.cnig.mapea.database.persistence.domain;

public class Columna {
	
	private String nombre;
	
	private String tipoDato;

	public Columna(){
		
	}
	
	public Columna(String nombre, String tipoDato) {
		super();
		this.nombre = nombre;
		this.tipoDato = tipoDato;
	}

	public String getNombre() {
		return nombre;
	}

	public void setNombre(String nombre) {
		this.nombre = nombre;
	}

	public String getTipoDato() {
		return tipoDato;
	}

	public void setTipoDato(String tipoDato) {
		this.tipoDato = tipoDato;
	}

}
