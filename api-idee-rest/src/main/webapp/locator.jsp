<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ page import="es.api_idee.plugins.PluginsManager"%>
<%@ page import="es.api_idee.parameter.adapter.ParametersAdapterV3ToV4"%>
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
    <link href="plugins/locator/locator.ol.min.css" rel="stylesheet" />
    <link href="plugins/sharemap/sharemap.ol.min.css" rel="stylesheet" />
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
        Map<String, String[]> adaptedParams = ParametersAdapterV3ToV4.adapt(parameterMap);
        String[] cssfiles = PluginsManager.getCSSFiles(adaptedParams);
        for (int i = 0; i < cssfiles.length; i++) {
        String cssfile = cssfiles[i];
    %>
    <link type="text/css" rel="stylesheet" href="plugins/<%=cssfile%>">
    </link>
    <%
      } %>
</head>

<body>
    <div>
        <label for="selectPosicion">Selector de posición del plugin</label>
        <select name="position" id="selectPosicion">
            <option value="TL">Arriba Izquierda (TL)</option>
            <option value="TR" selected="selected">Arriba Derecha (TR)</option>
            <option value="BR">Abajo Derecha (BR)</option>
            <option value="BL">Abajo Izquierda (BL)</option>
            <option value="TC">Arriba Centro (TC)</option>
        </select>
        <label for="selectCollapsed">Selector collapsed</label>
        <select name="collapsedValue" id="selectCollapsed">
            <option value=true>true</option>
            <option value=false>false</option>
        </select>
        <label for="selectCollapsible">Selector collapsible</label>
        <select name="collapsibleValue" id="selectCollapsible">
            <option value=true>true</option>
            <option value=false>false</option>
        </select>
        <label for="inputTooltip">Tooltip</label>
        <input type="text" name="tooltip" id="inputTooltip">
        <label for="selectProxy">Proxy</label>
        <select name="proxyValue" id="selectProxy">
            <option value=true>true</option>
            <option value=false>false</option>
        </select>
        <label for="inputZoom">Zoom</label>
        <input type="text" name="zoom" id="inputZoom" value="16">
        <label for="selectPointStyle">Estilo del pin de búsqueda</label>
        <select name="pointStyle" id="selectPointStyle">
            <option value="pinAzul">Azul</option>
            <option value="pinRojo">Rojo</option>
            <option value="pinMorado">Morado</option>
        </select>
        <label for="selectIsdraggable">isDraggable</label>
        <select name="isdraggable" id="selectIsdraggable">
            <option value="true">true</option>
            <option value="false" selected="selected">false</option>
        </select>
        <label for="inputByParcelCadastre">byParcelCadastre</label>
        <textarea name="byParcelCadastre" id="inputByParcelCadastre" rows="4">{
"cadastreWMS": "http://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCoordenadas.asmx/Consulta_RCCOOR",
"CMC_url": "http://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejeroCodigos.asmx/ConsultaMunicipioCodigos",
"DNPPP_url": "http://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejeroCodigos.asmx/Consulta_DNPPP_Codigos",
"CPMRC_url": "http://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCoordenadas.asmx/Consulta_CPMRC"
}</textarea>
        <label for="inputByCoordinates">byCoordinates</label>
        <textarea name="byCoordinates" id="inputByCoordinates" rows="4">{
"projections": [
{
    "title": "ETRS89 geographic (4258) dd",
    "code": "EPSG:4258",
    "units": "d"
},
{
    "title": "ETRS89 geographic (4258) dms",
    "code": "EPSG:4258",
    "units": "dms"
}
],
"help": "https://www.google.com/"
}</textarea>
        <label for="inputByPlaceAddressPostal">byPlaceAddressPostal</label>
        <textarea name="byPlaceAddressPostal" id="inputByPlaceAddressPostal" rows="4">{
 "maxResults": 20,
 "noProcess": "poblacion",
 "countryCode": "es",
 "reverse": false,
 "resultVisibility": true,
 "urlCandidates": "http://www.cartociudad.es/geocoder/api/geocoder/candidatesJsonp",
 "urlFind": "http://www.cartociudad.es/geocoder/api/geocoder/findJsonp",
 "urlReverse": "http://www.cartociudad.es/geocoder/api/geocoder/reverseGeocode",
 "requestStreet": "https://www.cartociudad.es/geocoder/api/geocoder/findJsonp?q=Sevilla&type=provincia&tip_via=null&id=41&portal=null&extension=null"
}</textarea>
        <input type="button" value="Eliminar Plugin" name="eliminar" id="botonEliminar">
    </div>
    <div id="mapjs" class="m-container"></div>
    <script type="text/javascript" src="vendor/browser-polyfill.js"></script>
    <script type="text/javascript" src="js/apiidee.ol.min.js"></script>
    <script type="text/javascript" src="js/configuration.js"></script>
    <script type="text/javascript" src="plugins/locator/locator.ol.min.js"></script>
    <script type="text/javascript" src="plugins/sharemap/sharemap.ol.min.js"></script>
    <%
      String[] jsfiles = PluginsManager.getJSFiles(adaptedParams);
      for (int i = 0; i < jsfiles.length; i++) {
         String jsfile = jsfiles[i];
  	%>
    <script type="text/javascript" src="plugins/<%=jsfile%>"></script>

    <%
      }
   	%>
    <script type="text/javascript">
        const urlParams = new URLSearchParams(window.location.search);
        M.language.setLang(urlParams.get('language') || 'es');
        const map = M.map({
            container: 'mapjs',
            zoom: 5,
            maxZoom: 20,
            minZoom: 4,
            center: [-467062.8225, 4783459.6216],
        });
        let mp;
        const selectPosicion = document.getElementById("selectPosicion");
        const selectCollapsed = document.getElementById("selectCollapsed");
        const selectCollapsible = document.getElementById("selectCollapsible");
        const selectProxy = document.getElementById("selectProxy");
        const inputTooltip = document.getElementById("inputTooltip");
        const inputZoom = document.getElementById("inputZoom");
        const selectPointStyle = document.getElementById("selectPointStyle");
        const selectDraggable = document.getElementById("selectIsdraggable");
        const selectParcel = document.getElementById("inputByParcelCadastre");
        const selectCoordinates = document.getElementById("inputByCoordinates");
        const selectPlace = document.getElementById("inputByPlaceAddressPostal");
        selectPosicion.addEventListener('change', cambiarTest);
        selectCollapsed.addEventListener('change', cambiarTest);
        selectCollapsible.addEventListener('change', cambiarTest);
        selectProxy.addEventListener('change', cambiarTest);
        inputTooltip.addEventListener('change', cambiarTest);
        inputZoom.addEventListener('change', cambiarTest);
        selectPointStyle.addEventListener('change', cambiarTest);
        selectDraggable.addEventListener('change', cambiarTest);
        selectParcel.addEventListener('change', cambiarTest);
        selectCoordinates.addEventListener('change', cambiarTest);
        selectPlace.addEventListener('change', cambiarTest);

        
        crearPlugin(getOptions());

        function cambiarTest() {
            const objeto = getOptions();
            map.removePlugins(mp);
            crearPlugin(objeto);
        }

        function crearPlugin(propiedades) {
            mp = new M.plugin.Locator(propiedades);
            map.addPlugin(mp);
        }

        function getOptions() {
            let objeto = {};
            objeto.position = selectPosicion.options[selectPosicion.selectedIndex].value;
            objeto.collapsed = (selectCollapsed.options[selectCollapsed.selectedIndex].value == 'true');
            objeto.collapsible = (selectCollapsible.options[selectCollapsible.selectedIndex].value == 'true');
            objeto.useProxy = (selectProxy.options[selectProxy.selectedIndex].value == 'true');
            inputTooltip.value !== "" ? objeto.tooltip = inputTooltip.value : objeto.tooltip = "";
            inputZoom.value !== "" ? objeto.zoom = inputZoom.value : objeto.zoom = "16";
            objeto.pointStyle = selectPointStyle.options[selectPointStyle.selectedIndex].value;
            objeto.isDraggable = (selectDraggable.options[selectDraggable.selectedIndex].value == 'true');
            objeto.byParcelCadastre = JSON.parse(selectParcel.value);
            objeto.byCoordinates = JSON.parse(selectCoordinates.value);
            objeto.byPlaceAddressPostal = JSON.parse(selectPlace.value);
            return objeto;
        }

        let mp2 = new M.plugin.ShareMap({
            baseUrl: window.location.href.substring(0, window.location.href.indexOf('api-idee')) + "api-idee/",
            position: "TR",
        });
        map.addPlugin(mp2);
        const botonEliminar = document.getElementById("botonEliminar");
        botonEliminar.addEventListener("click", function() {
            map.removePlugins(mp);
        });
    </script>
</body>

<!-- Global site tag (gtag.js) - Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-CTLHMMB5YT"></script>
<script>
    window.dataLayer = window.dataLayer || [];

    function gtag() {
        dataLayer.push(arguments);
    }
    gtag('js', new Date());
    gtag('config', 'G-CTLHMMB5YT');
</script>

</html>