package es.api_idee.parameter.parser;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import java.util.Arrays;
import java.util.LinkedList;

import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.Test;

import es.api_idee.builder.JSBuilder;
import es.api_idee.parameter.Parameters;

public class ParametersParserGeoPackageTest {

   private static final String POSITIONAL =
      "GeoPackage*Lugares*https://datos.example.org/datos.gpkg*lugares*range";

   private static final String NAMED =
      "GeoPackage*url=https://datos.example.org/datos.gpkg;name=m;legend=Mixto;"
         + "options=base64~eyJ0aWxlZCI6dHJ1ZSwidGFibGVzIjp7InBsYWNlcyI6eyJvcGFjaXR5IjowLjV9fX0=";

   private static final String GROUP =
      "LayerGroup*name=g;legend=Grupo;layers=base64~WyJHZW9QYWNrYWdlKnVybD1odHRwczovL2EvYi5ncGtnIl0=";

   @Test
   public void keepsPositionalGeoPackageLayers () {
      assertEquals(Arrays.asList(POSITIONAL, "OSM"),
         ParametersParser.parseLayers(POSITIONAL + ",OSM"));
   }

   @Test
   public void keepsNamedGeoPackageLayersWithEncodedOptions () {
      assertEquals(Arrays.asList("OSM", NAMED, POSITIONAL),
         ParametersParser.parseLayers("OSM, " + NAMED + " ," + POSITIONAL));
   }

   @Test
   public void keepsGeoPackageInsideANamedGroup () {
      assertEquals(Arrays.asList(GROUP, NAMED),
         ParametersParser.parseLayers(GROUP + "," + NAMED));
   }

   @Test
   public void passesGeoPackageLayersToTheGeneratedViewer () {
      Parameters parameters = new Parameters();
      parameters.addContainer("map");
      parameters.addLayers(POSITIONAL + "," + NAMED);
      JSONArray layers = parameters.toJSON().getJSONArray("layers");

      assertEquals(2, layers.length());
      assertEquals(POSITIONAL, layers.getString(0));
      assertEquals(NAMED, layers.getString(1));
      assertEquals("\"" + NAMED + "\"", JSBuilder.createLayerWithParams(" " + NAMED + " "));

      String code = JSBuilder.build(parameters, new LinkedList<String>());
      assertTrue(code.contains(JSONObject.quote(POSITIONAL)));
      assertTrue(code.contains(JSONObject.quote(NAMED)));
   }
}
