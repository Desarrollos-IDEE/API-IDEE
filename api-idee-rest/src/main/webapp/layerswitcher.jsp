<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ page import="es.api_idee.plugins.PluginsManager"%>
<%@ page import="java.util.Map"%>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="idee" content="yes">
    <title>Visor base</title>
    <link type="text/css" rel="stylesheet" href="assets/css/apiidee.ol.min.css">
    <link href="plugins/layerswitcher/layerswitcher.ol.min.css" rel="stylesheet" />
    <link href="plugins/stylemanager/stylemanager.ol.min.css" rel="stylesheet" />
    <link href="plugins/sharemap/sharemap.ol.min.css" rel="stylesheet" />
    </link>
    <style type="text/css">
        html,
        body {
            margin: 0;
            padding: 0;
            height: 100%;
            overflow: auto;
        }
    </style>
    <%
      Map<String, String[]> parameterMap = request.getParameterMap();
      PluginsManager.init (getServletContext());
      String[] cssfiles = PluginsManager.getCSSFiles(parameterMap);
      for (int i = 0; i < cssfiles.length; i++) {
         String cssfile = cssfiles[i];
   %>
    <link type="text/css" rel="stylesheet" href="plugins/<%=cssfile%>">
    </link>
    <%
      } %>
</head>

<body>

    <div class="m-api-idee-test-form-frame">
        <div class="m-test-form">
            <div>
                <label for="selectPosition" title="Posición del plugin sobre el mapa. Por defecto: right">Posición "position"</label>
                <select name="position" id="selectPosition">
                    <option value="" selected="selected"></option>
                    <option value="left">Izquierda</option>
                    <option value="right">Derecha</option>
                </select>
            </div>
            <div>
                <label for="selectCollapsed" title="Indica si el plugin viene colapsado de entrada (true/false). Por defecto: true">Colapsado "collapsed"</label>
                <select name="collapsedValue" id="selectCollapsed">
                    <option value="" selected="selected"></option>
                    <option value="true">true</option>
                    <option value="false">false</option>
                </select>
            </div>
            <div>
                <label for="inputOrder"
                    title="Define en que posición del panel debe aparecer en el conjunto de controles o plugins">Orden
                    entre controles / plugins "order"</label>
                <input type="number" name="order" id="inputOrder" list="orderSug" value="-1">
            </div>
            <div>
                <label for="inputTooltip" title="Texto que se muestra al dejar el ratón encima del plugin. Por defecto: Gestor de capas">Título de la herramienta "tooltip"</label>
                <input type="text" name="tooltip" id="inputTooltip" list="tooltipSug">
                <datalist id="tooltipSug">
                    <option value="Gestor de capas"></option>
                </datalist>
            </div>
            <div>
                <label for="selectStatusLayers" title="Permite añadir la funcionalidad de mostrar/ocultar todas las capas. Solo aplica cuando modeSelectLayers es 'eyes'. Por defecto: true">Estado de capas "statusLayers"</label>
                <select name="statusValue" id="selectStatusLayers">
                    <option value="" selected="selected"></option>
                    <option value="true">true</option>
                    <option value="false">false</option>
                </select>
            </div>
            <div>
                <label for="selectAddLayers" title="Permite insertar la funcionalidad de añadir capas. Por defecto: true">Añadir capas "addLayers"</label>
                <select name="addValue" id="selectAddLayers">
                    <option value="" selected="selected"></option>
                    <option value="true">true</option>
                    <option value="false">false</option>
                </select>
            </div>
            <div>
                <label for="inputTools" title="Lista de herramientas disponibles para cada capa separadas por coma. Valores: transparency, zoom, legend, information, style, delete">Herramientas "tools"</label>
                <input type="text" name="tools" id="inputTools" list="toolsSug" value="transparency, zoom, legend, information, style, delete">
                <datalist id="toolsSug">
                    <option value="transparency, zoom, legend, information, style, delete"></option>
                    <option value="transparency, zoom, legend, information"></option>
                    <option value="transparency, zoom"></option>
                </datalist>
            </div>
            <div>
                <label for="isMoveLayers" title="Permite reordenar las capas arrastrándolas en el panel. Por defecto: false">Mover capas "isMoveLayers"</label>
                <select name="moveLayerValue" id="isMoveLayers">
                    <option value="" selected="selected"></option>
                    <option value="true">true</option>
                    <option value="false">false</option>
                </select>
            </div>
            <div>
                <label for="modeSelectLayers" title="Modo de selección de capas: eyes (visibilidad múltiple) o radio (selección única). Por defecto: eyes">Modo de selección "modeSelectLayers"</label>
                <select name="modeSelectLayersValue" id="modeSelectLayers">
                    <option value="" selected="selected"></option>
                    <option value="eyes">eyes</option>
                    <option value="radio">radio</option>
                </select>
            </div>
            <div>
                <label for="inputPrecharged" title="Objeto JSON con servicios y grupos precargados en el catálogo de capas. Si se deja vacío se usan los servicios por defecto">Servicios precargados "precharged"</label>
                <input type="text" name="precharged" id="inputPrecharged" list="prechargedSug">
                <datalist id="prechargedSug">
                    <option value='Un grupo de servicios y un servicio individual' data-precharged='{"services": [{"type":"WMS","name":"Camino de Santiago","url":"https://www.ign.es/wms-inspire/camino-santiago"}],"groups":[{"name":"Cartografía","services":{"type":"WMTS","name": "Mapas","url":"https://www.ign.es/wmts/mapa-raster?"}}]}'></option>
                    <option value='Dos servicios con estilos únicos sin serializar' data-precharged='{"services":[{"type":"WMS","name":"Unidades administrativas","url":"https://www.ign.es/wms-inspire/unidades-administrativas?","styles":["ua-comparador"]},{"type":"GeoJSON","name":"Estaciones GNSS","url":"https://www.ign.es/resources/geodesia/GNSS/SPTR_geo.json","styles":[{"name":"Rojo","point":{"radius":6,"fill":{"color":"red"},"stroke":{"color":"white","width":1}}}]}]}'></option>
                    <option value='Dos servicios con estilos únicos serializados' data-precharged='{"services":[{"type":"WMS","name":"Unidades administrativas","url":"https://www.ign.es/wms-inspire/unidades-administrativas?","styles":["ua-EscalaGris"]},{"type":"GeoJSON","name":"Estaciones GNSS","url":"https://www.ign.es/resources/geodesia/GNSS/SPTR_geo.json","styles":["eyJwYXJhbWV0ZXJzIjpbeyJuYW1lIjoiQXp1bCBzZXJpYWxpemFkbyIsInBvaW50Ijp7InJhZGl1cyI6NiwiZmlsbCI6eyJjb2xvciI6ImJsdWUifSwic3Ryb2tlIjp7ImNvbG9yIjoid2hpdGUiLCJ3aWR0aCI6MX19fV0sImRlc2VyaWFsaXplZE1ldGhvZCI6Iigoc2VyaWFsaXplZFBhcmFtZXRlcnMpID0+IElERUUuc3R5bGUuU2ltcGxlLmRlc2VyaWFsaXplKHNlcmlhbGl6ZWRQYXJhbWV0ZXJzLCAnSURFRS5zdHlsZS5HZW5lcmljJykpIn0="]}]}'></option>
                    <option value='Dos servicios con varios estilos sin serializar' data-precharged='{"services":[{"type":"WMS","name":"Unidades administrativas","url":"https://www.ign.es/wms-inspire/unidades-administrativas?","styles":["UnidadesAdministrativas","ua-comparador","ua-EscalaGris"]},{"type":"GeoJSON","name":"Estaciones GNSS","url":"https://www.ign.es/resources/geodesia/GNSS/SPTR_geo.json","styles":[{"name":"Rojo","point":{"radius":6,"fill":{"color":"red"},"stroke":{"color":"white","width":1}}},{"name":"Verde","point":{"radius":8,"fill":{"color":"green"},"stroke":{"color":"white","width":1}}},{"name":"Naranja","point":{"radius":10,"fill":{"color":"orange"},"stroke":{"color":"white","width":1}}}]}]}'></option>
                    <option value='Dos servicios con varios estilos serializados' data-precharged='{"services":[{"type":"WMS","name":"Unidades administrativas","url":"https://www.ign.es/wms-inspire/unidades-administrativas?","styles":["ccaa-gris","provincias-gris","municipios-gris"]},{"type":"GeoJSON","name":"Estaciones GNSS","url":"https://www.ign.es/resources/geodesia/GNSS/SPTR_geo.json","styles":["eyJwYXJhbWV0ZXJzIjpbeyJuYW1lIjoiQXp1bCBzZXJpYWxpemFkbyIsInBvaW50Ijp7InJhZGl1cyI6NiwiZmlsbCI6eyJjb2xvciI6ImJsdWUifSwic3Ryb2tlIjp7ImNvbG9yIjoid2hpdGUiLCJ3aWR0aCI6MX19fV0sImRlc2VyaWFsaXplZE1ldGhvZCI6Iigoc2VyaWFsaXplZFBhcmFtZXRlcnMpID0+IElERUUuc3R5bGUuU2ltcGxlLmRlc2VyaWFsaXplKHNlcmlhbGl6ZWRQYXJhbWV0ZXJzLCAnSURFRS5zdHlsZS5HZW5lcmljJykpIn0=","eyJwYXJhbWV0ZXJzIjpbeyJuYW1lIjoiTW9yYWRvIHNlcmlhbGl6YWRvIiwicG9pbnQiOnsicmFkaXVzIjo4LCJmaWxsIjp7ImNvbG9yIjoicHVycGxlIn0sInN0cm9rZSI6eyJjb2xvciI6IndoaXRlIiwid2lkdGgiOjF9fX1dLCJkZXNlcmlhbGl6ZWRNZXRob2QiOiIoKHNlcmlhbGl6ZWRQYXJhbWV0ZXJzKSA9PiBJREVFLnN0eWxlLlNpbXBsZS5kZXNlcmlhbGl6ZShzZXJpYWxpemVkUGFyYW1ldGVycywgJ0lERUUuc3R5bGUuR2VuZXJpYycpKSJ9","eyJwYXJhbWV0ZXJzIjpbeyJuYW1lIjoiTmVncm8gc2VyaWFsaXphZG8iLCJwb2ludCI6eyJyYWRpdXMiOjQsImZpbGwiOnsiY29sb3IiOiJibGFjayJ9LCJzdHJva2UiOnsiY29sb3IiOiJ3aGl0ZSIsIndpZHRoIjoxfX19XSwiZGVzZXJpYWxpemVkTWV0aG9kIjoiKChzZXJpYWxpemVkUGFyYW1ldGVycykgPT4gSURFRS5zdHlsZS5TaW1wbGUuZGVzZXJpYWxpemUoc2VyaWFsaXplZFBhcmFtZXRlcnMsICdJREVFLnN0eWxlLkdlbmVyaWMnKSkifQ=="]}]}'></option>
                    <option value='Dos servicios en base64, cada uno con estilo único sin serializar' data-precharged='eyJzZXJ2aWNlcyI6W3sidHlwZSI6IldNUyIsIm5hbWUiOiJVbmlkYWRlcyBhZG1pbmlzdHJhdGl2YXMiLCJ1cmwiOiJodHRwczovL3d3dy5pZ24uZXMvd21zLWluc3BpcmUvdW5pZGFkZXMtYWRtaW5pc3RyYXRpdmFzPyIsInN0eWxlcyI6WyJ1YS1jb21wYXJhZG9yIl19LHsidHlwZSI6Ikdlb0pTT04iLCJuYW1lIjoiRXN0YWNpb25lcyBHTlNTIiwidXJsIjoiaHR0cHM6Ly93d3cuaWduLmVzL3Jlc291cmNlcy9nZW9kZXNpYS9HTlNTL1NQVFJfZ2VvLmpzb24iLCJzdHlsZXMiOlt7Im5hbWUiOiJSb2pvIiwicG9pbnQiOnsicmFkaXVzIjo2LCJmaWxsIjp7ImNvbG9yIjoicmVkIn0sInN0cm9rZSI6eyJjb2xvciI6IndoaXRlIiwid2lkdGgiOjF9fX1dfV19'></option>
                    <option value='Dos servicios en base64, cada uno con varios estilos serializados' data-precharged='eyJzZXJ2aWNlcyI6W3sidHlwZSI6IldNUyIsIm5hbWUiOiJVbmlkYWRlcyBhZG1pbmlzdHJhdGl2YXMiLCJ1cmwiOiJodHRwczovL3d3dy5pZ24uZXMvd21zLWluc3BpcmUvdW5pZGFkZXMtYWRtaW5pc3RyYXRpdmFzPyIsInN0eWxlcyI6WyJjY2FhLWdyaXMiLCJwcm92aW5jaWFzLWdyaXMiLCJtdW5pY2lwaW9zLWdyaXMiXX0seyJ0eXBlIjoiR2VvSlNPTiIsIm5hbWUiOiJFc3RhY2lvbmVzIEdOU1MiLCJ1cmwiOiJodHRwczovL3d3dy5pZ24uZXMvcmVzb3VyY2VzL2dlb2Rlc2lhL0dOU1MvU1BUUl9nZW8uanNvbiIsInN0eWxlcyI6WyJleUp3WVhKaGJXVjBaWEp6SWpwYmV5SnVZVzFsSWpvaVFYcDFiQ0J6WlhKcFlXeHBlbUZrYnlJc0luQnZhVzUwSWpwN0luSmhaR2wxY3lJNk5pd2labWxzYkNJNmV5SmpiMnh2Y2lJNkltSnNkV1VpZlN3aWMzUnliMnRsSWpwN0ltTnZiRzl5SWpvaWQyaHBkR1VpTENKM2FXUjBhQ0k2TVgxOWZWMHNJbVJsYzJWeWFXRnNhWHBsWkUxbGRHaHZaQ0k2SWlnb2MyVnlhV0ZzYVhwbFpGQmhjbUZ0WlhSbGNuTXBJRDArSUVsRVJVVXVjM1I1YkdVdVUybHRjR3hsTG1SbGMyVnlhV0ZzYVhwbEtITmxjbWxoYkdsNlpXUlFZWEpoYldWMFpYSnpMQ0FuU1VSRlJTNXpkSGxzWlM1SFpXNWxjbWxqSnlrcEluMD0iLCJleUp3WVhKaGJXVjBaWEp6SWpwYmV5SnVZVzFsSWpvaVRXOXlZV1J2SUhObGNtbGhiR2w2WVdSdklpd2ljRzlwYm5RaU9uc2ljbUZrYVhWeklqbzRMQ0ptYVd4c0lqcDdJbU52Ykc5eUlqb2ljSFZ5Y0d4bEluMHNJbk4wY205clpTSTZleUpqYjJ4dmNpSTZJbmRvYVhSbElpd2lkMmxrZEdnaU9qRjlmWDFkTENKa1pYTmxjbWxoYkdsNlpXUk5aWFJvYjJRaU9pSW9LSE5sY21saGJHbDZaV1JRWVhKaGJXVjBaWEp6S1NBOVBpQkpSRVZGTG5OMGVXeGxMbE5wYlhCc1pTNWtaWE5sY21saGJHbDZaU2h6WlhKcFlXeHBlbVZrVUdGeVlXMWxkR1Z5Y3l3Z0owbEVSVVV1YzNSNWJHVXVSMlZ1WlhKcFl5Y3BLU0o5IiwiZXlKd1lYSmhiV1YwWlhKeklqcGJleUp1WVcxbElqb2lUbVZuY204Z2MyVnlhV0ZzYVhwaFpHOGlMQ0p3YjJsdWRDSTZleUp5WVdScGRYTWlPalFzSW1acGJHd2lPbnNpWTI5c2IzSWlPaUppYkdGamF5SjlMQ0p6ZEhKdmEyVWlPbnNpWTI5c2IzSWlPaUozYUdsMFpTSXNJbmRwWkhSb0lqb3hmWDE5WFN3aVpHVnpaWEpwWVd4cGVtVmtUV1YwYUc5a0lqb2lLQ2h6WlhKcFlXeHBlbVZrVUdGeVlXMWxkR1Z5Y3lrZ1BUNGdTVVJGUlM1emRIbHNaUzVUYVcxd2JHVXVaR1Z6WlhKcFlXeHBlbVVvYzJWeWFXRnNhWHBsWkZCaGNtRnRaWFJsY25Nc0lDZEpSRVZGTG5OMGVXeGxMa2RsYm1WeWFXTW5LU2tpZlE9PSJdfV19'></option>
                    <option value='Servicio MVT con estilo único sin serializar' data-precharged='{"services":[{"type":"MVT","name":"Unidades administrativas (MVT)","url":"https://vt-unidades-administrativas.ign.es/1.0.0/uadministrativa/{z}/{x}/{y}.pbf","styles":[{"name":"Contorno rojo","polygon":{"fill":{"color":"red","opacity":0.1},"stroke":{"color":"red","width":2}}}]}]}'></option>
                    <option value='Servicio MVT con varios estilos serializados' data-precharged='{"services":[{"type":"MVT","name":"Unidades administrativas (MVT)","url":"https://vt-unidades-administrativas.ign.es/1.0.0/uadministrativa/{z}/{x}/{y}.pbf","styles":["eyJwYXJhbWV0ZXJzIjpbeyJuYW1lIjoiQ29udG9ybm8gYXp1bCBzZXJpYWxpemFkbyIsInBvbHlnb24iOnsiZmlsbCI6eyJjb2xvciI6ImJsdWUiLCJvcGFjaXR5IjowLjF9LCJzdHJva2UiOnsiY29sb3IiOiJibHVlIiwid2lkdGgiOjJ9fX1dLCJkZXNlcmlhbGl6ZWRNZXRob2QiOiIoKHNlcmlhbGl6ZWRQYXJhbWV0ZXJzKSA9PiBJREVFLnN0eWxlLlNpbXBsZS5kZXNlcmlhbGl6ZShzZXJpYWxpemVkUGFyYW1ldGVycywgJ0lERUUuc3R5bGUuR2VuZXJpYycpKSJ9","eyJwYXJhbWV0ZXJzIjpbeyJuYW1lIjoiUmVsbGVubyB2ZXJkZSBzZXJpYWxpemFkbyIsInBvbHlnb24iOnsiZmlsbCI6eyJjb2xvciI6ImdyZWVuIiwib3BhY2l0eSI6MC40fSwic3Ryb2tlIjp7ImNvbG9yIjoiZ3JlZW4iLCJ3aWR0aCI6MX19fV0sImRlc2VyaWFsaXplZE1ldGhvZCI6Iigoc2VyaWFsaXplZFBhcmFtZXRlcnMpID0+IElERUUuc3R5bGUuU2ltcGxlLmRlc2VyaWFsaXplKHNlcmlhbGl6ZWRQYXJhbWV0ZXJzLCAnSURFRS5zdHlsZS5HZW5lcmljJykpIn0=","eyJwYXJhbWV0ZXJzIjpbeyJuYW1lIjoiQ29udG9ybm8gbmVncm8gZ3J1ZXNvIHNlcmlhbGl6YWRvIiwicG9seWdvbiI6eyJmaWxsIjp7ImNvbG9yIjoiYmxhY2siLCJvcGFjaXR5IjowfSwic3Ryb2tlIjp7ImNvbG9yIjoiYmxhY2siLCJ3aWR0aCI6NH19fV0sImRlc2VyaWFsaXplZE1ldGhvZCI6Iigoc2VyaWFsaXplZFBhcmFtZXRlcnMpID0+IElERUUuc3R5bGUuU2ltcGxlLmRlc2VyaWFsaXplKHNlcmlhbGl6ZWRQYXJhbWV0ZXJzLCAnSURFRS5zdHlsZS5HZW5lcmljJykpIn0="]}]}'></option>
                    <option value='Servicio WFS con varios estilos sin serializar' data-precharged='{"services":[{"type":"WFS","name":"Redes geodésicas (WFS)","url":"https://www.ign.es/wfs/redes-geodesicas","styles":[{"name":"Puntos rojos","point":{"radius":6,"fill":{"color":"red"},"stroke":{"color":"white","width":1}}},{"name":"Puntos azules grandes","point":{"radius":10,"fill":{"color":"blue"},"stroke":{"color":"white","width":1}}},{"name":"Puntos amarillos con borde negro","point":{"radius":7,"fill":{"color":"yellow"},"stroke":{"color":"black","width":2}}}]}]}'></option>
                    <option value='Servicio KML con varios estilos sin serializar' data-precharged='{"services":[{"type":"KML","name":"Delegaciones del IGN (KML)","url":"https://www.ign.es/web/resources/delegaciones/delegacionesIGN.kml","styles":[{"name":"Puntos verdes","point":{"radius":7,"fill":{"color":"green"},"stroke":{"color":"white","width":1}}},{"name":"Puntos morados grandes","point":{"radius":11,"fill":{"color":"purple"},"stroke":{"color":"white","width":1}}},{"name":"Puntos naranjas con borde negro","point":{"radius":8,"fill":{"color":"orange"},"stroke":{"color":"black","width":2}}}]}]}'></option>
                </datalist>
            </div>
            <div>
                <label for="isHttp" title="Permite añadir capas con URL HTTP en el catálogo. Por defecto: true">HTTP "http"</label>
                <select name="isHttpValue" id="isHttp">
                    <option value="" selected="selected"></option>
                    <option value="true">true</option>
                    <option value="false">false</option>
                </select>
            </div>
            <div>
                <label for="isHttps" title="Permite añadir capas con URL HTTPS en el catálogo. Por defecto: true">HTTPS "https"</label>
                <select name="isHttpsValue" id="isHttps">
                    <option value="" selected="selected"></option>
                    <option value="true">true</option>
                    <option value="false">false</option>
                </select>
            </div>
            <div>
                <label for="isShowCatalog" title="Muestra el botón de catálogo para buscar y añadir servicios externos. Por defecto: false">Mostrar catálogo "showCatalog"</label>
                <select name="isShowCatalogValue" id="isShowCatalog">
                    <option value="" selected="selected"></option>
                    <option value="true">true</option>
                    <option value="false">false</option>
                </select>
            </div>
            <div>
                <label for="selectProxy" title="Utiliza proxy para las peticiones de capas. Por defecto: true">Proxy "useProxy"</label>
                <select name="proxyValue" id="selectProxy">
                    <option value="" selected="selected"></option>
                    <option value="true">true</option>
                    <option value="false">false</option>
                </select>
            </div>
            <div>
                <label for="selectDisplay" title="Muestra la etiqueta con el tipo de capa (WMS, TMS, GeoJSON...). Por defecto: false">Etiqueta de tipo "displayLabel"</label>
                <select name="displayValue" id="selectDisplay">
                    <option value="" selected="selected"></option>
                    <option value="true">true</option>
                    <option value="false">false</option>
                </select>
            </div>
            <div>
                <label for="selectUseAttributions" title="Muestra las atribuciones de las nuevas capas añadidas desde el catálogo o desde los servicios precargados. Es necesario haber instanciado e insertado el control 'attributions' en el mapa. Por defecto: false">Atribuciones "useAttributions"</label>
                <select name="attributionsValue" id="selectUseAttributions">
                    <option value="" selected="selected"></option>
                    <option value="true">true</option>
                    <option value="false">false</option>
                </select>
            </div>
        </div>
        <div class="m-test-buttons">
            <button name="eliminar" class="m-test-button" id="removeButton">Eliminar Plugin</button>
        </div>
    </div>

    <div id="mapjs" class="m-container"></div>
    <script type="text/javascript" src="vendor/browser-polyfill.js"></script>
    <script type="text/javascript" src="js/apiidee.ol.min.js"></script>
    <script type="text/javascript" src="js/configuration.js"></script>
    <script type="text/javascript" src="plugins/layerswitcher/layerswitcher.ol.min.js"></script>
    <script type="text/javascript" src="plugins/stylemanager/stylemanager.ol.min.js"></script>
    <script type="text/javascript" src="plugins/sharemap/sharemap.ol.min.js"></script>
    <%
      String[] jsfiles = PluginsManager.getJSFiles(parameterMap);
      for (int i = 0; i < jsfiles.length; i++) {
         String jsfile = jsfiles[i];
   %>
    <script type="text/javascript" src="plugins/<%=jsfile%>"></script>

    <%
      }
   %>
    <script type="text/javascript">
        const urlParams = new URLSearchParams(window.location.search);
        IDEE.language.setLang(urlParams.get('language') || 'es');

        const map = IDEE.map({
            container: 'mapjs',
            zoom: 5,
            maxZoom: 20,
            minZoom: 2,
            center: [-467062.8225, 4783459.6216],
            controls: ['attributions']
        });
        window.map = map;

        const capaGeoJSON = new IDEE.layer.GeoJSON({
            name: 'Capa GeoJSON',
            url: 'https://www.ign.es/resources/geodesia/GNSS/SPTR_geo.json',
            extract: false,
        });

        map.addLayers(capaGeoJSON);

        const capaWMS = new IDEE.layer.WMS({
            url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
            name: 'AU.AdministrativeUnit',
            legend: 'Capa WMS',
        });

        map.addLayers(capaWMS);

        const stylemanager = new IDEE.plugin.StyleManager();
        map.addPlugin(stylemanager);

        let mp = null;

        const createPlugin = (options) => {
            mp = new IDEE.plugin.Layerswitcher(options);
            window.mp = mp;
            map.addPlugin(mp);
        };

        const removePlugin = () => {
            if (mp) map.removePlugins(mp);
        };

        const removeButton = document.getElementById('removeButton');
        removeButton.addEventListener('click', () => { removePlugin(); });

        const selectPosition = document.getElementById('selectPosition');
        const selectCollapsed = document.getElementById('selectCollapsed');
        const inputTooltip = document.getElementById('inputTooltip');
        const inputOrder = document.getElementById('inputOrder');
        const selectAdd = document.getElementById('selectAddLayers');
        const selectStatus = document.getElementById('selectStatusLayers');
        const inputTools = document.getElementById('inputTools');
        const selectMoveLayer = document.getElementById('isMoveLayers');
        const selectModeSelectLayers = document.getElementById('modeSelectLayers');
        const inputPrecharged = document.getElementById('inputPrecharged');
        const selectHttp = document.getElementById('isHttp');
        const selectHttps = document.getElementById('isHttps');
        const selectShowCatalog = document.getElementById('isShowCatalog');
        const selectProxy = document.getElementById('selectProxy');
        const selectDisplay = document.getElementById('selectDisplay');
        const selectUseAttributions = document.getElementById('selectUseAttributions');

        const boolVal = (select, defaultVal = true) => {
            const v = select.options[select.selectedIndex].value;
            if (v === '') return defaultVal;
            return v === 'true';
        };

        const updatePlugin = () => {
            const options = {};
            options.position = selectPosition.options[selectPosition.selectedIndex].value;
            options.collapsed = selectCollapsed.options[selectCollapsed.selectedIndex].value === '' || selectCollapsed.options[selectCollapsed.selectedIndex].value === 'true';
            options.order = Number(inputOrder.value);
            options.addLayers = boolVal(selectAdd, true);
            options.statusLayers = boolVal(selectStatus, true);
            options.tooltip = inputTooltip.value || '';
            options.tools = inputTools.value !== '' ? inputTools.value.split(', ') : [];
            options.isMoveLayers = boolVal(selectMoveLayer, false);
            options.modeSelectLayers = selectModeSelectLayers.options[selectModeSelectLayers.selectedIndex].value || 'eyes';
            const prechargedOption = [...document.querySelectorAll('#prechargedSug option')]
                .find((option) => option.value === inputPrecharged.value);
            if (prechargedOption) inputPrecharged.value = prechargedOption.dataset.precharged;
            options.precharged = inputPrecharged.value.trim() || undefined;
            options.http = boolVal(selectHttp, true);
            options.https = boolVal(selectHttps, true);
            options.showCatalog = boolVal(selectShowCatalog, false);
            options.useProxy = boolVal(selectProxy, true);
            options.displayLabel = boolVal(selectDisplay, false);
            options.useAttributions = boolVal(selectUseAttributions, false);

            removePlugin();
            createPlugin(options);
        };

        [
            selectPosition,
            selectCollapsed,
            inputOrder,
            inputTooltip,
            selectAdd,
            selectStatus,
            inputTools,
            selectMoveLayer,
            selectModeSelectLayers,
            inputPrecharged,
            selectHttp,
            selectHttps,
            selectShowCatalog,
            selectProxy,
            selectDisplay,
            selectUseAttributions,
        ].forEach((ctrl) => {
            ctrl.addEventListener('change', updatePlugin);
        });

        updatePlugin();
        const mp2 = new IDEE.plugin.ShareMap({
            baseUrl: window.location.href.substring(0, window.location.href.indexOf('api-idee')) + "api-idee/",
            position: "right",
        });
        map.addPlugin(mp2);
    </script>
</body>

<!-- Global site tag (gtag.js) - Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-19NTRSBP21"></script>
<script>
    window.dataLayer = window.dataLayer || [];

    function gtag() {
        dataLayer.push(arguments);
    }
    gtag('js', new Date());
    gtag('config', 'G-19NTRSBP21');
</script>

</html>
