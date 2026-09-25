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
    <link href="plugins/catalogmanager/catalogmanager.ol.min.css" rel="stylesheet" />
    <link href="plugins/layerswitcher/layerswitcher.ol.min.css" rel="stylesheet" />
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

    <div>
        <label for="selectPosition">Selector de posición del plugin</label>
        <select name="position" id="selectPosition">
            <option value="TL" selected="selected">Arriba Izquierda (TL)</option>
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
        <label for="inputTooltip">Tooltip</label>
        <input type="text" name="tooltip" id="inputTooltip">
        <label for="selectProxy">Proxy</label>
        <select name="proxyValue" id="selectProxy">
            <option value=true>true</option>
            <option value=false>false</option>
        </select>
        <br/>
        <label for="inputPredefinedCatalogs">Catálogos iniciales</label>
        <textarea id="inputPredefinedCatalogs" rows="4" style="width: 50vw;">[{
            "title": "Astraea Earth",
            "url": "https://eod-catalog-svc-prod.astraea.earth",
            "public": true
        }, {
            "title": "AWS Element84",
            "url": "https://earth-search.aws.element84.com/v1",
            "public": true
        }, {
            "title": "Copernicus",
            "url": "https://stac.dataspace.copernicus.eu/v1",
            "public": true
        }, {
            "title": "GNEIS",
            "url": "http://localhost:8090",
            "authUrl": "https://gneis.desarrollo.guadaltel.es/o/custom-auth/token",
            "collectionsUrl": "https://gneis.desarrollo.guadaltel.es/o/custom-auth/collections",
            "public": true,
            "user": "",
            "password": ""
        }]</textarea>
        <input type="button" value="Eliminar Plugin" name="eliminar" id="botonEliminar">
    </div>

    <div id="mapjs" class="m-container"></div>
    <script type="text/javascript" src="vendor/browser-polyfill.js"></script>
    <script type="text/javascript" src="js/apiidee.ol.min.js"></script>
    <script type="text/javascript" src="js/configuration.js"></script>
    <script type="text/javascript" src="plugins/layerswitcher/layerswitcher.ol.min.js"></script>
    <script type="text/javascript" src="plugins/catalogmanager/catalogmanager.ol.min.js"></script>
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
        });

        let mp = null;

        let mp2 = new IDEE.plugin.Layerswitcher({
            position: "TR",
        });
        map.addPlugin(mp2);

        const selectPosition = document.getElementById("selectPosition");
        const selectCollapsed = document.getElementById("selectCollapsed");
        const selectCollapsible = document.getElementById("selectCollapsible");
        const selectProxy = document.getElementById("selectProxy");
        const inputPredefinedCatalogs = document.getElementById("inputPredefinedCatalogs");

        const botonEliminar = document.getElementById("botonEliminar");

        selectPosition.addEventListener('change', cambiarTest);
        selectCollapsed.addEventListener('change', cambiarTest);
        selectCollapsible.addEventListener('change', cambiarTest);
        inputPredefinedCatalogs.addEventListener('change', cambiarTest);
        botonEliminar.addEventListener("click", function() {
            map.removePlugins(mp);
        });

        function cambiarTest() {
            let objeto = {};
            objeto.position = selectPosition.options[selectPosition.selectedIndex].value;
            objeto.collapsed = (selectCollapsed.options[selectCollapsed.selectedIndex].value == 'true');
            objeto.collapsible = (selectCollapsible.options[selectCollapsible.selectedIndex].value == 'true');
            objeto.predefinedCatalogs = JSON.parse(inputPredefinedCatalogs.value);
            if (mp !== null) {
                map.removePlugins(mp);
            }
            crearPlugin(objeto);
        }

        function crearPlugin(propiedades) {
            mp = new IDEE.plugin.Catalogmanager(propiedades);
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
