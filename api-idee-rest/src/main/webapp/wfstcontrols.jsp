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
    <link href="plugins/wfstcontrols/wfstcontrols.ol.min.css" rel="stylesheet" />
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
        </select>

        <label>Herramientas</label>
        <label><input type="checkbox" class="feat" value="drawfeature" checked> drawfeature</label>
        <label><input type="checkbox" class="feat" value="modifyfeature" checked> modifyfeature</label>
        <label><input type="checkbox" class="feat" value="deletefeature" checked> deletefeature</label>
        <label><input type="checkbox" class="feat" value="editattribute" checked> editattribute</label>

        <label for="layername">Layer name</label>
        <input type="text" id="layername" value="RED_REGENTE" />

        <label for="geometry">Geometry</label>
        <select id="geometry">
            <option value="POINT" selected>POINT</option>
            <option value="LINE">LINE</option>
            <option value="POLYGON">POLYGON</option>
        </select>

        <input type="button" value="Eliminar Plugin" name="eliminar" id="botonEliminar">
    </div>

    <div id="mapjs" class="m-container"></div>
    <script type="text/javascript" src="vendor/browser-polyfill.js"></script>
    <script type="text/javascript" src="js/apiidee.ol.min.js"></script>
    <script type="text/javascript" src="js/configuration.js"></script>
    <script type="text/javascript" src="plugins/wfstcontrols/wfstcontrols.ol.min.js"></script>
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
            center: [-467062.8225, 4683459.6216],
        });

        // Crear la capa WFS (ejemplo del README)
        const wfsLayer = new IDEE.layer.WFS({
            url: 'https://www.ign.es/wfs/redes-geodesicas?',
            legend: 'Red Geodésica Nacional por Técnicas Espaciales (REGENTE)',
            name: 'RED_REGENTE',
            geometry: 'POINT',
            extract: true
        });
        map.addWFS(wfsLayer);

        let mp;
        const selectPosicion = document.getElementById("selectPosicion");
        const botonEliminar = document.getElementById("botonEliminar");
        const layernameInput = document.getElementById('layername');
        const geometrySelect = document.getElementById('geometry');
        const featuresInputs = Array.from(document.querySelectorAll('.feat'));

        selectPosicion.addEventListener('change', cambiarTest);
        layernameInput.addEventListener('change', cambiarTest);
        geometrySelect.addEventListener('change', cambiarTest);
        featuresInputs.forEach(chk => chk.addEventListener('change', cambiarTest));

        crearPlugin(getOptions());

        function cambiarTest() {
            const opciones = getOptions();
            map.removePlugins(mp);
            crearPlugin(opciones);
        }

        function crearPlugin(propiedades) {
            mp = new IDEE.plugin.WFSTControls(propiedades);
            map.addPlugin(mp);
        }

        function getOptions() {
            const position = selectPosicion.options[selectPosicion.selectedIndex].value;
            const features = featuresInputs.filter(chk => chk.checked).map(chk => chk.value).join(',');
            const layername = layernameInput.value || 'RED_REGENTE';
            const geometry = geometrySelect.value || 'POINT';
            return {
                position: position,
                features: features,
                layername: layername,
                geometry: geometry,
                proxy: { status: true, disable: false }
            };
        }

        let mp2 = new IDEE.plugin.ShareMap({
            baseUrl: window.location.href.substring(0, window.location.href.indexOf('api-idee')) + "api-idee/",
            position: "TR",
        });
        map.addPlugin(mp2);
        botonEliminar.addEventListener("click", function() {
            map.removePlugins(mp);
        });

    </script>
</body>

<!-- Global site tag (gtag.js) - Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-19NTRSBP21"></script>
<script>
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-19NTRSBP21');
</script>

</html>
