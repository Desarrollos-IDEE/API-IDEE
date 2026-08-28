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
    <link href="plugins/magnify/magnify.ol.min.css" rel="stylesheet" />
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

    <div>
        <label for="selectPosition">Selector de posición del plugin</label>
        <select name="position" id="selectPosition">
            <option value="TL">Arriba Izquierda (TL)</option>
            <option value="TR" selected="selected">Arriba Derecha (TR)</option>
            <option value="BR">Abajo Derecha (BR)</option>
            <option value="BL">Abajo Izquierda (BL)</option>
        </select>
        <label for="inputLayers">Layers</label>
        <input type="text" name="layers" id="inputLayers" value="OI.OrthoimageCoverage">
        <label for="inputZoomMax">Zoom Max</label>
        <input type="number" name="zoomMax" id="inputZoomMax" value="16">
        <label for="inputZoom">Zoom</label>
        <input type="number" name="zoom" id="inputZoom" value="5">
        <input type="button" value="Eliminar Plugin" name="eliminar" id="botonEliminar">
    </div>

    <div id="mapjs" class="m-container"></div>
    <script type="text/javascript" src="vendor/browser-polyfill.js"></script>
    <script type="text/javascript" src="js/apiidee.ol.min.js"></script>
    <script type="text/javascript" src="js/configuration.js"></script>
    <script type="text/javascript" src="plugins/magnify/magnify.ol.min.js"></script>
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
            layers: ['OSM', 'WMTS*https://www.ign.es/wmts/pnoa-ma?*OI.OrthoimageCoverage*EPSG:25830*imagen*true*image/jpeg&projection=EPSG:25830&magnify=TL*OI.OrthoimageCoverage*16'],
            projection: 'EPSG:25830',
            bbox: [-2595076.7019215897, 3568596.502104186, 2066485.2270033162, 4625706.608821015],
        });

        let mp = null;

        let mp2 = new IDEE.plugin.ShareMap({
            baseUrl: window.location.href.substring(0, window.location.href.indexOf('api-idee')) + "api-idee/",
            position: "TR",
        });
        map.addPlugin(mp2);

        const inputLayers = document.getElementById("inputLayers");
        const inputZoomMax = document.getElementById("inputZoomMax");
        const inputZoom = document.getElementById("inputZoom");
        const selectPosition = document.getElementById("selectPosition");
        const botonEliminar = document.getElementById("botonEliminar");

        inputLayers.addEventListener('change', cambiarTest);
        inputZoomMax.addEventListener('change', cambiarTest);
        inputZoom.addEventListener('change', cambiarTest);
        selectPosition.addEventListener('change', cambiarTest);
        botonEliminar.addEventListener("click", function() {
            map.removePlugins(mp);
        });


        function cambiarTest() {
            let objeto = {};
            objeto.layers = inputLayers.value;
            objeto.zoomMax = parseInt(inputZoomMax.value);
            objeto.zoom = parseInt(inputZoom.value);
            objeto.position = selectPosition.options[selectPosition.selectedIndex].value;
            if (mp !== null) {
                map.removePlugins(mp);
            }
            crearPlugin(objeto);
        }

        function crearPlugin(propiedades) {
            mp = new IDEE.plugin.Magnify(propiedades);
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

