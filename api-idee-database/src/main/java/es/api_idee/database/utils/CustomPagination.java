package es.api_idee.database.utils;

public class CustomPagination {

	private int page;
	private int limit;
	private int offset;
	private int size;
	private String error;
	private String formato;

	public CustomPagination(int page, int limit, int offset, int size,
			String error, String formato) {
		this.page = page;
		this.limit = limit;
		this.offset = offset;
		this.size = size;
		this.error = error;
		this.formato = formato;
	}

	public CustomPagination() {
		this.page = 1;
		this.limit = Constants.DEFAULT_LIMIT;
		this.offset = 0;
		this.size = 0;
		this.error = "";
	}

	public int getPage() {
		return page;
	}

	public void setPage(int page) {
		this.page = page;
	}

	public void setLimit(int limit) {
		if(limit < Constants.MIN_LIMIT){
			this.limit = Constants.MIN_LIMIT;
		}else if(limit > Constants.MAX_LIMIT){
			limit = Constants.MAX_LIMIT;
		}else{
			this.limit = limit;
		}
	}

	public int getLimit() {
		return limit;
	}
	
	public void setOffset(int offset) {
		this.offset = offset;
	}

	public int getOffset() {
		return offset;
	}
	
	public void setSize(int size) {
		this.size = size;
	}

	public int getSize() {
		return size;
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
	
}
