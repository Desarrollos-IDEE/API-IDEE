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
    <link href="plugins/layerswitcher/layerswitcher.ol.min.css" rel="stylesheet" />
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
        <label for="selectPosition">Selector de posición del plugin</label>
        <select name="position" id="selectPosition">
            <option value="TL">Arriba Izquierda (TL)</option>
            <option value="TR" selected="selected">Arriba Derecha (TR)</option>
            <option value="BR">Abajo Derecha (BR)</option>
            <option value="BL">Abajo Izquierda (BL)</option>
        </select>
        <label for="selectCollapsed">Selector collapsed</label>
        <select name="collapsedValue" id="selectCollapsed">
            <option value=true>true</option>
            <option value=false>false</option>
        </select>
        <label for="selectStatusLayers">Funcionalidad estado capas</label>
        <select name="statusValue" id="selectStatusLayers">
            <option value=true>true</option>
            <option value=false>false</option>
        </select>
        <label for="selectAddLayers">Funcionalidad estado capas</label>
        <select name="addValue" id="selectAddLayers">
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
        <label for="inputTools">Herramientas</label>
        <input type="text" name="tools" id="inputTools" value="transparency, zoom, legend, information, style, delete">
        <label for="isDraggable">isDraggable</label>
        <select name="draggableValue" id="isDraggable">
            <option value=true>true</option>
            <option value=false>false</option>
        </select>
        <label for="isMoveLayers">isMoveLayers</label>
        <select name="moveLayerValue" id="isMoveLayers">
            <option value=true>true</option>
            <option value=false>false</option>
        </select>
        <label for="modeSelectLayers">modeSelectLayers</label>
        <select name="modeSelectLayersValue" id="modeSelectLayers">
            <option value=eyes>eyes</option>
            <option value=radio>radio</option>
        </select>
        <label for="inputPrecharged">Precharged</label>
        <input type="text" name="precharged" id="inputPrecharged">
        <label for="isHttp">isHttp</label>
        <select name="isHttpValue" id="isHttp">
            <option value=true>true</option>
            <option value=false>false</option>
        </select>
        <label for="isHttps">isHttps</label>
        <select name="isHttpsValue" id="isHttps">
            <option value=true>true</option>
            <option value=false>false</option>
        </select>
        <label for="isShowCatalog">isShowCatalog</label>
        <select name="isShowCatalogValue" id="isShowCatalog">
            <option value=true>true</option>
            <option value=false>false</option>
        </select>
        <label for="selectProxy">Proxy</label>
        <select name="proxyValue" id="selectProxy">
            <option value=true>true</option>
            <option value=false>false</option>
        </select>
        <label for="selectDisplay">displayLabel</label>
        <select name="displayValue" id="selectDisplay">
            <option value=true>true</option>
            <option value=false>false</option>
        </select>
        <input type="button" value="Eliminar Plugin" name="eliminar" id="botonEliminar">
    </div>

    <div id="mapjs" class="m-container"></div>
    <script type="text/javascript" src="vendor/browser-polyfill.js"></script>
    <script type="text/javascript" src="js/apiidee.ol.min.js"></script>
    <script type="text/javascript" src="js/configuration.js"></script>
    <script type="text/javascript" src="plugins/layerswitcher/layerswitcher.ol.min.js"></script>
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
        IDEE.language.setLang(urlParams.get('language') || 'es');

        const map = IDEE.map({
            container: 'mapjs',
            zoom: 5,
            maxZoom: 20,
            minZoom: 2,
            center: [-467062.8225, 4783459.6216],
        });

        let mp = null;

        let mp2 = new IDEE.plugin.ShareMap({
            baseUrl: window.location.href.substring(0, window.location.href.indexOf('api-idee')) + "api-idee/",
            position: "TR",
        });
        map.addPlugin(mp2);

        const capaGeoJSON = new IDEE.layer.GeoJSON({
            name: 'Capa GeoJSON',
            url: 'http://www.ign.es/resources/geodesia/GNSS/SPTR_geo.json',
            extract: false,
        });

        const capaWMS = new IDEE.layer.WMS({
            url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
            name: 'AU.AdministrativeUnit',
            legend: 'Capa WMS',
        });
        map.addLayers(capaGeoJSON);
        map.addLayers(capaWMS);

        const selectPosition = document.getElementById("selectPosition");
        const selectCollapsed = document.getElementById("selectCollapsed");
        const selectAdd = document.getElementById("selectAddLayers");
        const selectStatus = document.getElementById("selectStatusLayers");
        const selectCollapsible = document.getElementById("selectCollapsible");
        const inputTooltip = document.getElementById("inputTooltip");
        const inputTools = document.getElementById("inputTools");
        const selectDraggable = document.getElementById("isDraggable");
        const selectMoveLayer = document.getElementById("isMoveLayers");
        const selectModeSelectLayers = document.getElementById("modeSelectLayers");
        const inputPrecharged = document.getElementById("inputPrecharged");
        const selectHttp = document.getElementById("isHttp");
        const selectHttps = document.getElementById("isHttps");
        const selectShowCatalog = document.getElementById("isShowCatalog");
        const selectProxy = document.getElementById("selectProxy");
        const selectDisplay = document.getElementById("selectDisplay");

        const botonEliminar = document.getElementById("botonEliminar");

        selectPosition.addEventListener('change', cambiarTest);
        selectCollapsed.addEventListener('change', cambiarTest);
        selectAdd.addEventListener('change', cambiarTest);
        selectStatus.addEventListener('change', cambiarTest);
        selectCollapsible.addEventListener('change', cambiarTest);
        inputTooltip.addEventListener('change', cambiarTest);
        inputTools.addEventListener('change', cambiarTest);
        selectDraggable.addEventListener('change', cambiarTest);
        selectMoveLayer.addEventListener('change', cambiarTest);
        selectModeSelectLayers.addEventListener('change', cambiarTest);
        inputPrecharged.addEventListener('change', cambiarTest);
        selectHttp.addEventListener('change', cambiarTest);
        selectHttps.addEventListener('change', cambiarTest);
        selectShowCatalog.addEventListener('change', cambiarTest);
        selectProxy.addEventListener('change', cambiarTest);
        selectDisplay.addEventListener('change', cambiarTest);
        botonEliminar.addEventListener("click", function() {
            map.removePlugins(mp);
        });


        function cambiarTest() {
            let objeto = {};
            objeto.position = selectPosition.options[selectPosition.selectedIndex].value;
            objeto.collapsed = (selectCollapsed.options[selectCollapsed.selectedIndex].value == 'true');
            objeto.addLayers = (selectAdd.options[selectAdd.selectedIndex].value == 'true');
            objeto.statusLayers = (selectStatus.options[selectStatus.selectedIndex].value == 'true');
            objeto.collapsible = (selectCollapsible.options[selectCollapsible.selectedIndex].value == 'true');
            inputTooltip.value !== "" ? objeto.tooltip = inputTooltip.value : objeto.tooltip = "";
            inputTools.value !== "" ? objeto.tools = inputTools.value.split(', ') : objeto.tools = [];
            objeto.isDraggable = (selectDraggable.options[selectDraggable.selectedIndex].value == 'true');
            objeto.isMoveLayers = (selectMoveLayer.options[selectMoveLayer.selectedIndex].value == 'true');
            objeto.modeSelectLayers = selectModeSelectLayers.options[selectModeSelectLayers.selectedIndex].value;
            inputPrecharged.value !== "" ? objeto.precharged = inputPrecharged.value : objeto.precharged = "";
            objeto.http = (selectHttp.options[selectHttp.selectedIndex].value == 'true');
            objeto.https = (selectHttps.options[selectHttps.selectedIndex].value == 'true');
            objeto.showCatalog = (selectShowCatalog.options[selectShowCatalog.selectedIndex].value == 'true');
            objeto.useProxy = (selectProxy.options[selectProxy.selectedIndex].value == 'true');
            objeto.displayLabel = (selectDisplay.options[selectDisplay.selectedIndex].value == 'true');
            if (mp !== null) {
                map.removePlugins(mp);
            }
            crearPlugin(objeto);
        }

        function crearPlugin(propiedades) {
            mp = new IDEE.plugin.Layerswitcher(propiedades);
            map.addPlugin(mp);
        }

        cambiarTest();
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
