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
    <link href="plugins/locatorscn/locatorscn.ol.min.css" rel="stylesheet" />
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
        <label for="inputAddendum">addendum</label>
        <input type="text" name="addendum" id="inputAddendum" value="iderioja">
        <label for="inputSize">size</label>
        <input type="text" name="size" id="inputSize">
        <label for="inputLayers">layers</label>
        <input type="text" name="layers" id="inputLayers" value="address,street,venue">
        <label for="inputSources">sources</label>
        <input type="text" name="sources" id="inputSources" value="calrj">
        <label for="inputRadius">radius</label>
        <input type="text" name="radius" id="inputRadius">
        <label for="inputUrlAutocomplete">urlAutocomplete</label>
        <input type="text" name="urlAutocomplete" id="inputUrlAutocomplete">
        <label for="inputUrlReverse">urlReverse</label>
        <input type="text" name="urlReverse" id="inputUrlReverse">
        <input type="button" value="Eliminar Plugin" name="eliminar" id="botonEliminar">
    </div>
    <div id="mapjs" class="m-container"></div>
    <script type="text/javascript" src="vendor/browser-polyfill.js"></script>
    <script type="text/javascript" src="js/apiidee.ol.min.js"></script>
    <script type="text/javascript" src="js/configuration.js"></script>
    <script type="text/javascript" src="plugins/locatorscn/locatorscn.ol.min.js"></script>
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
        let posicion, collapsed = true,
            collapsible = true,
            tooltip, zoomL,
            pointStyle, isdraggable,
            searchOptions = {
                addendum: 'iderioja',
                layers: 'address,street,venue',
                sources: 'calrj',
            };
        crearPlugin({
            position: posicion,
            collapsed: collapsed,
            collapsible: collapsible,
            tooltip: tooltip,
            zoom: zoomL,
            pointStyle: pointStyle,
            isDraggable: isdraggable,
            searchOptions: searchOptions,
        });
        const selectPosicion = document.getElementById("selectPosicion");
        const selectCollapsed = document.getElementById("selectCollapsed");
        const selectCollapsible = document.getElementById("selectCollapsible");
        const selectProxy = document.getElementById("selectProxy");
        const inputTooltip = document.getElementById("inputTooltip");
        const inputZoom = document.getElementById("inputZoom");
        const selectPointStyle = document.getElementById("selectPointStyle");
        const selectDraggable = document.getElementById("selectIsdraggable");
        const inputAddendum = document.getElementById("inputAddendum");
        const inputSize = document.getElementById("inputSize");
        const inputLayers = document.getElementById("inputLayers");
        const inputSources = document.getElementById("inputSources");
        const inputRadius = document.getElementById("inputRadius");
        const inputUrlAutocomplete = document.getElementById("inputUrlAutocomplete");
        const inputUrlReverse = document.getElementById("inputUrlReverse");
        selectPosicion.addEventListener('change', cambiarTest);
        selectCollapsed.addEventListener('change', cambiarTest);
        selectCollapsible.addEventListener('change', cambiarTest);
        selectProxy.addEventListener('change', cambiarTest);
        inputTooltip.addEventListener('change', cambiarTest);
        inputZoom.addEventListener('change', cambiarTest);
        selectPointStyle.addEventListener('change', cambiarTest);
        selectDraggable.addEventListener('change', cambiarTest);
        inputAddendum.addEventListener('change', cambiarTest);
        inputSize.addEventListener('change', cambiarTest);
        inputLayers.addEventListener('change', cambiarTest);
        inputSources.addEventListener('change', cambiarTest);
        inputRadius.addEventListener('change', cambiarTest);
        inputUrlAutocomplete.addEventListener('change', cambiarTest);
        inputUrlReverse.addEventListener('change', cambiarTest);

        function cambiarTest() {
            let objeto = {};
            objeto.position = selectPosicion.options[selectPosicion.selectedIndex].value;
            objeto.collapsed = (selectCollapsed.options[selectCollapsed.selectedIndex].value == 'true');
            objeto.collapsible = (selectCollapsible.options[selectCollapsible.selectedIndex].value == 'true');
            objeto.useProxy = (selectProxy.options[selectProxy.selectedIndex].value == 'true');
            inputTooltip.value !== "" ? objeto.tooltip = inputTooltip.value : objeto.tooltip = "";
            inputZoom.value !== "" ? objeto.zoom = inputZoom.value : objeto.zoom = "16";
            objeto.pointStyle = selectPointStyle.options[selectPointStyle.selectedIndex].value;
            objeto.isDraggable = (selectDraggable.options[selectDraggable.selectedIndex].value == 'true');
            objeto.searchOptions = {
                addendum: inputAddendum.value || undefined,
                size: inputSize.value || undefined,
                layers: inputLayers.value || undefined,
                sources: inputSources.value || undefined,
                radius: inputRadius.value || undefined,
                urlAutocomplete: inputUrlAutocomplete.value || undefined,
                urlReverse: inputUrlReverse.value || undefined,
            };
            map.removePlugins(mp);
            crearPlugin(objeto);
        }

        function crearPlugin(propiedades) {
            mp = new IDEE.plugin.Locatorscn(propiedades);
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