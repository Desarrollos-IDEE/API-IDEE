package es.cnig.mapea.database.persistence.domain;

import java.util.HashMap;
import java.util.Map;

public class DatosTabla {

	private Map<String, Object> mapAttributes;
	
	public DatosTabla(){
		mapAttributes = new HashMap<String, Object>();
	}

	public Map<String, Object> getMapAttributes() {
		return mapAttributes;
	}

	public void setMapAttributes(Map<String, Object> mapAttributes) {
		this.mapAttributes = mapAttributes;
	}
	
	public void addToMap(String key, Object value){
		mapAttributes.put(key, value);
	}
}
