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
    <link href="plugins/ignsearchlocator/ignsearchlocator.ol.min.css" rel="stylesheet" />
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
    <div>
        <label for="selectServiceToSearch">Selector de servicio que se consulta del plugin</label>
        <select name="serviceToSearch" id="selectServiceToSearch">
            <option value="g">Consulta Geocoder</option>
            <option value="n">Consulta Topónimos</option>
            <option value="gn">Consulta Geocoder y Topónimos</option>
        </select>
        <label for="inputMaxResults">Parámetro maxResults</label>
        <input type="number" min="0" value="10" name="maxResults" id="inputMaxResults">
        <label for="selectNoProcess">Selector de noProcess del plugin</label>
        <select name="noProcess" id="selectNoProcess">
            <option value="municipio">Municipio</option>
            <option value="poblacion">Población</option>
            <option value="toponimo">Topónimo</option>
            <option value="municipio,poblacion">Municipio y Población</option>
        </select>
        <label for="selectCountryCode">Selector de countryCode</label>
        <select name="countryCode" id="selectCountryCode">
            <option value="es">Español</option>
            <option value="en">Inglés</option>
        </select>
        <label for="selectPosicion">Selector de posición del plugin</label>
        <select name="position" id="selectPosicion">
            <option value="TL" selected="selected">Arriba Izquierda (TL)</option>
            <option value="TC">Arriba Centro (TC)</option>
            <option value="TR">Arriba Derecha (TR)</option>
            <option value="BR">Abajo Derecha (BR)</option>
            <option value="BL">Abajo Izquierda (BL)</option>
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
        <label for="selectReverse">Selector reverse</label>
        <select name="reverseValue" id="selectReverse">
            <option value=true>true</option>
            <option value=false>false</option>
        </select>
        <label for="selectCadastre">Selector cadastre</label>
        <select name="reverseValue" id="selectCadastre">
            <option value=true>true</option>
            <option value=false>false</option>
        </select>
        <label for="searchCoordinatesXYZ">Selector searchCoordinatesXYZ</label>
        <select name="reverseValue" id="searchCoordinatesXYZ">
            <option value=true>true</option>
            <option value=false>false</option>
        </select>
        <label for="inputZoom">Parámetro zoom</label>
        <input type="text" name="zoom" id="inputZoom" list="zoomSug">
        <datalist id="zoomSug">
            <option value="2"></option>
        </datalist>
        <label for="selectPointStyle">Estilo del pin de búsqueda</label>
        <select name="pointStyle" id="selectPointStyle">
            <option value="pinBlanco">Blanco</option>
            <option value="pinRojo">Rojo</option>
            <option value="pinMorado">Morado</option>
        </select>
        <label for="inputSearchposition">Orden resultados de los servicios</label>
        <input type="text" name="searchposition" id="inputSearchposition" list="optionsSearchposition">
        <datalist id="optionsSearchposition">
            <option value="geocoder,nomenclator"></option>
            <option value="nomenclator,geocoder"></option>
        </datalist>
        <label for="inputUrlCandidates">Parámetro urlCandidates</label>
        <input type="text" name="urlCandidates" id="inputUrlCandidates" list="urlCandidatesSug">
        <datalist id="urlCandidatesSug">
            <option value="https://www.cartociudad.es/geocoder/api/geocoder/candidatesJsonp"></option>
        </datalist>
        <label for="inputUrlFind">Parámetro urlFind</label>
        <input type="text" name="urlFind" id="inputUrlFind" list="urlFindSug">
        <datalist id="urlFindSug">
            <option value="https://www.cartociudad.es/geocoder/api/geocoder/findJsonp"></option>
        </datalist>
        <label for="inputUrlReverse">Parámetro urlReverse</label>
        <input type="text" name="urlReverse" id="inputUrlReverse" list="urlReverseSug">
        <datalist id="urlReverseSug">
            <option value="https://www.cartociudad.es/geocoder/api/geocoder/reverseGeocode"></option>
        </datalist>
        <input type="button" value="Eliminar Plugin" name="eliminar" id="botonEliminar">
    </div>
    <div id="mapjs" class="m-container"></div>
    <script type="text/javascript" src="vendor/browser-polyfill.js"></script>
    <script type="text/javascript" src="js/apiidee.ol.min.js"></script>
    <script type="text/javascript" src="js/configuration.js"></script>
    <script type="text/javascript" src="plugins/ignsearchlocator/ignsearchlocator.ol.min.js"></script>
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
            minZoom: 4,
            center: [-467062.8225, 4783459.6216],
        });
        let mp;
        let sToSearch, mxResults, collapsed = true,
            collapsible = true,
            pzoom,
            posicion, noProcess, countryCode, reverse = true,
            urlCandidates, urlFind, urlReverse, searchposition, pointStyle;
        crearPlugin({
            servicesToSearch: sToSearch,
            maxResults: mxResults,
            noProcess: noProcess,
            countryCode: countryCode,
            isCollapsed: collapsed,
            collapsible: collapsible,
            position: posicion,
            reverse: reverse,
            zoom: pzoom,
            urlCandidates: urlCandidates,
            urlFind: urlFind,
            urlReverse: urlReverse,
            searchPosition: searchposition,
            pointStyle: pointStyle
        });
        const selectServiceToSearch = document.getElementById("selectServiceToSearch");
        const inputMaxResults = document.getElementById("inputMaxResults");
        const selectNoProcess = document.getElementById("selectNoProcess");
        const selectCountryCode = document.getElementById("selectCountryCode");
        const selectPosicion = document.getElementById("selectPosicion");
        const selectPointStyle = document.getElementById("selectPointStyle");
        const selectCollapsed = document.getElementById("selectCollapsed");
        const selectCollapsible = document.getElementById("selectCollapsible");
        const selectReverse = document.getElementById("selectReverse");
        const selectCadastre = document.getElementById("selectCadastre");
        const searchCoordinatesXYZ = document.getElementById("searchCoordinatesXYZ");
        const inputZoom = document.getElementById("inputZoom");
        const inputSearchposition = document.getElementById("inputSearchposition");
        const inputUrlCandidates = document.getElementById("inputUrlCandidates");
        const inputUrlFind = document.getElementById("inputUrlFind");
        const inputUrlReverse = document.getElementById("inputUrlReverse");

        selectServiceToSearch.addEventListener('change', cambiarTest);
        inputMaxResults.addEventListener('change', cambiarTest);
        selectNoProcess.addEventListener('change', cambiarTest);
        selectCountryCode.addEventListener('change', cambiarTest);
        selectPosicion.addEventListener('change', cambiarTest);
        selectPointStyle.addEventListener('change', cambiarTest);
        selectCollapsed.addEventListener('change', cambiarTest);
        selectCollapsible.addEventListener('change', cambiarTest);
        selectReverse.addEventListener('change', cambiarTest);
        selectCadastre.addEventListener('change', cambiarTest);
        searchCoordinatesXYZ.addEventListener('change', cambiarTest);
        inputZoom.addEventListener('change', cambiarTest);
        inputSearchposition.addEventListener('change', cambiarTest);
        inputUrlCandidates.addEventListener('change', cambiarTest);
        inputUrlFind.addEventListener('change', cambiarTest);
        inputUrlReverse.addEventListener('change', cambiarTest);

        function cambiarTest() {
            let objeto = {}
            objeto.servicesToSearch = selectServiceToSearch.options[selectServiceToSearch.selectedIndex].value;
            maxResults = inputMaxResults.value != "" ? objeto.maxResults = Number(inputMaxResults.value) : "";
            objeto.noProcess = selectNoProcess.options[selectNoProcess.selectedIndex].value;
            objeto.countryCode = selectCountryCode.options[selectCountryCode.selectedIndex].value;
            objeto.position = selectPosicion.options[selectPosicion.selectedIndex].value;
            objeto.isCollapsed = (selectCollapsed.options[selectCollapsed.selectedIndex].value == 'true');
            objeto.collapsible = (selectCollapsible.options[selectCollapsible.selectedIndex].value == 'true');
            objeto.reverse = (selectReverse.options[selectReverse.selectedIndex].value == 'true');
            objeto.cadastre = (selectCadastre.options[selectCadastre.selectedIndex].value == 'true');
            objeto.searchCoordinatesXYZ = (searchCoordinatesXYZ.options[searchCoordinatesXYZ.selectedIndex].value == 'true');
            inputZoom.value !== "" ? objeto.zoom = inputZoom.value : objeto.zoom = "16";
            searchPosition = inputSearchposition.value != "" ? objeto.searchPosition = inputSearchposition.value : "";
            urlCandidates = inputUrlCandidates.value != "" ? objeto.urlCandidates = inputUrlCandidates.value : "";
            urlFind = inputUrlFind.value != "" ? objeto.urlFind = inputUrlFind.value : "";
            urlReverse = inputUrlReverse.value != "" ? objeto.urlReverse = inputUrlReverse.value : "";
            objeto.pointStyle = selectPointStyle.options[selectPointStyle.selectedIndex].value;
            map.removePlugins(mp);
            crearPlugin(objeto);
        }

        function crearPlugin(propiedades) {
            mp = new IDEE.plugin.IGNSearchLocator(propiedades);
            map.addPlugin(mp);
        }
        let mp2 = new IDEE.plugin.ShareMap({
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