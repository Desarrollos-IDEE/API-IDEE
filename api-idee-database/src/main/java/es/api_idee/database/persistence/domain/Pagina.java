package es.api_idee.database.persistence.domain;

import java.util.List;

public class Pagina {

	private int numPagina;
	
	private int tamPagina;
	
	private int totalElementos;
	
	private String error;
	
	private String formato;
	
	private List results;
	
	public Pagina(){
		
	}

	public Pagina(int numPagina, int tamPagina, int totalElementos, String error, String formato, List results) {
		this.numPagina = numPagina;
		this.tamPagina = tamPagina;
		this.totalElementos = totalElementos;
		this.error = error;
		this.formato = formato;
		this.results = results;
	}

	public int getNumPagina() {
		return numPagina;
	}

	public void setNumPagina(int numPagina) {
		this.numPagina = numPagina;
	}

	public int getTamPagina() {
		return tamPagina;
	}

	public void setTamPagina(int tamPagina) {
		this.tamPagina = tamPagina;
	}

	public int getTotalElementos() {
		return totalElementos;
	}

	public void setTotalElementos(int totalElementos) {
		this.totalElementos = totalElementos;
	}

	public String getError() {
		return error;
	}

	public void setError(String error) {
		this.error = error;
	}

	public String getFormato() {
		return formato;
	}

	public void setFormato(String formato) {
		this.formato = formato;
	}

	public List getResults() {
		return results;
	}

	public void setResults(List results) {
		this.results = results;
	}

}
