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
    <link href="plugins/information/information.ol.min.css" rel="stylesheet" />
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
        </select>
        <label for="inputTooltip">Parámetro tooltip</label>
        <input type="text" name="tooltip" id="inputTooltip" list="tooltipSug">
        <datalist id="tooltipSug">
            <option value="Consultar Capas"></option>
        </datalist>
        <label for="inputFormat">Parámetro format</label>
        <input type="text" name="format" id="inputFormat" list="formatSug">
        <datalist id="formatSug">
            <option value="html"></option>
        </datalist>
        <label for="inputFeatureCount">Parámetro featureCount</label>
        <input type="number" name="featureCount" id="inputFeatureCount" list="featureCountSug">
        <datalist id="featureCountSug">
            <option value="5"></option>
        </datalist>
        <label for="inputBuffer">Parámetro buffer (px)</label>
        <input type="number" name="buffer" id="inputBuffer" list="bufferSug">
        <datalist id="bufferSug">
            <option value="5"></option>
        </datalist>
        <label for="selectOpened">Selector de opened del plugin</label>
        <select name="opened" id="selectOpened">
            <option value="closed" selected="selected">closed</option>
            <option value="all">all</option>
            <option value="one">one</option>
        </select>
        <input type="button" value="Eliminar Plugin" name="eliminar" id="botonEliminar">
    </div>
    <div id="mapjs" class="m-container"></div>
    <script type="text/javascript" src="vendor/browser-polyfill.js"></script>
    <script type="text/javascript" src="js/apiidee.ol.min.js"></script>
    <script type="text/javascript" src="js/configuration.js"></script>
    <script type="text/javascript" src="plugins/information/information.ol.min.js"></script>
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
            minZoom: 4,
            center: [-467062.8225, 4783459.6216],
        });
        let mp, mp2;

        const layerinicial = new IDEE.layer.WMS({
            url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
            name: 'AU.AdministrativeBoundary',
            legend: 'Limite administrativo',
            tiled: false,
        }, {});

        const layerUA = new IDEE.layer.WMS({
            url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
            name: 'AU.AdministrativeUnit',
            legend: 'Unidad administrativa',
            tiled: false
        }, {});

        const hidrografia = new IDEE.layer.WMS({
            url: 'http://servicios.idee.es/wms-inspire/hidrografia?',
            name: 'HY.PhysicalWaters.HydroPointOfInterest',
            legend: 'Hidrografía',
        });

        map.addLayers([layerinicial, layerUA, hidrografia]);
        mp2 = new IDEE.plugin.ShareMap({
            baseUrl: window.location.href.substring(0, window.location.href.indexOf('api-idee')) + "api-idee/",
            position: "TR",
        });
        map.addPlugin(mp2);

        let posicion = "TL",
            tooltip, formato = 'html',
            featureCount = 5,
            buffer = 5,
            opened = 'closed';

        const properties = {
          position: posicion,
          tooltip,
          format: formato,
          featureCount,
          buffer,
          opened,
        };

        crearPlugin(properties);
        const selectPosicion = document.getElementById("selectPosicion");
        const inputTooltip = document.getElementById("inputTooltip");
        const inputFormat = document.getElementById("inputFormat");
        const inputFeatureCount = document.getElementById("inputFeatureCount");
        const inputBuffer = document.getElementById("inputBuffer");
        const selectOpened = document.getElementById("selectOpened");

        selectPosicion.addEventListener('change', cambiarTest);
        inputTooltip.addEventListener('change', cambiarTest);
        inputFormat.addEventListener('change', cambiarTest);
        inputFeatureCount.addEventListener('change', cambiarTest);
        inputBuffer.addEventListener('change', cambiarTest);
        selectOpened.addEventListener('change', cambiarTest);

        function cambiarTest() {
            let objeto = {}
            objeto.position = selectPosicion.options[selectPosicion.selectedIndex].value;
            objeto.tooltip = inputTooltip.value != "" ? objeto.tooltip = inputTooltip.value : "";
            objeto.format = inputFormat.value != "" ? objeto.format = inputFormat.value : "";
            objeto.featureCount = inputFeatureCount.value != "" ? objeto.featureCount = inputFeatureCount.value : "";
            objeto.buffer = inputBuffer.value != "" ? objeto.buffer = inputBuffer.value : "";
            objeto.opened = selectOpened.options[selectOpened.selectedIndex].value;
            map.removePlugins(mp);
            crearPlugin(objeto);
        }

        function crearPlugin(propiedades) {
            mp = new IDEE.plugin.Information(propiedades);
            map.addPlugin(mp);
        }
        mp2 = new IDEE.plugin.ShareMap({
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
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-19NTRSBP21');
</script>

</html>
