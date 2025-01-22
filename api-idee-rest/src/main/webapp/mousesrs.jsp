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
    <link href="plugins/mousesrs/mousesrs.ol.min.css" rel="stylesheet" />
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
        <label for="inputTooltip">Parámetro tooltip</label>
        <input type="text" name="tooltip" id="inputTooltip" value="Coordenadas" />
        <label for="inputSrs">Parámetro srs</label>
        <input type="text" name="srs" id="inputSrs" value="EPSG:4326" />
        <label for="inputLabel">Parámetro label</label>
        <input type="text" name="Label" id="inputLabel" value="WGS84" />
        <label for="inputPrecision">Parámetro precision</label>
        <input type="number" name="precision" id="inputPrecision" value="4" />
        <label for="inputGeoDecimalDigits">Parámetro geoDecimalDigits</label>
        <input type="number" name="geoDecimalDigits" id="inputGeoDecimalDigits" value="3" />
        <label for="inputUtmDecimalDigits">Parámetro utmDecimalDigits</label>
        <input type="number" name="utmDecimalDigits" id="inputUtmDecimalDigits" value="2" />
        <label for="selectActiveZ">Selector de activeZ</label>
        <select name="activeZ" id="selectActiveZ">
            <option value="false" selected="selected">false</option>
            <option value="true">true</option>
        </select>
        <label for="epsgFormat">Selector de epsgFormat</label>
        <select name="epsgFormat" id="epsgFormat">
            <option value="false" selected="selected">false</option>
            <option value="true">true</option>
        </select>
        <label for="mode">Selector de mode</label>
        <select name="mode" id="mode">
            <option value="wcs" selected="selected">wcs</option>
            <option value="ogcapicoverage">ogcapicoverage</option>
        </select><label for="coveragePrecissions">coveragePrecissions</label>
        <textarea name="coveragePrecission" id="coveragePrecissions" rows="4">[
            {
              "url": "https://api-coverages.idee.es/collections/EL.ElevationGridCoverage_4326_1000/coverage",
              "minzoom": 0,
              "maxzoom": 11
            },
            {
              "url": "https://api-coverages.idee.es/collections/EL.ElevationGridCoverage_4326_500/coverage",
              "minzoom": 12,
              "maxzoom": 28
            }
          ]</textarea>
        <label for="draggableDialog">Mover dialog</label>
        <select name="draggableDialog" id="draggableDialog">
            <option value="false" selected="selected">false</option>
            <option value="true">true</option>
        </select>
        <label for="helpUrl">Parámetro helpUrl</label>
        <input type="text" name="helpUrl" id="inputHelpUrl" list="helpUrl">
        <datalist id="helpUrl">
            <option value="https://www.ign.es/">Ayuda</option>
        </datalist>
        <input type="button" value="Eliminar Plugin" name="eliminar" id="botonEliminar" />
    </div>
    <div id="mapjs" class="m-container"></div>
    <script type="text/javascript" src="vendor/browser-polyfill.js"></script>
    <script type="text/javascript" src="js/apiidee.ol.min.js"></script>
    <script type="text/javascript" src="js/configuration.js"></script>
    <script type="text/javascript" src="plugins/mousesrs/mousesrs.ol.min.js"></script>
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
        let mp;
        let tooltip, psrs, label, precision, geoDecimalDigits, utmDecimalDigits, activeZ, helpUrl, epsgFormat, draggableDialog;
        crearPlugin({
            tooltip: "Muestra coordenadas",
            srs: "EPSG:4326",
            label: "WGS84",
            precision: 4,
            geoDecimalDigits: 3,
            utmDecimalDigits: 2,
            activeZ: false,
            helpUrl: helpUrl,
            epsgFormat: false,
            draggableDialog: false
        });

        const inputTooltip = document.getElementById("inputTooltip");
        const inputSrs = document.getElementById("inputSrs");
        const inputLabel = document.getElementById("inputLabel");
        const inputPrecision = document.getElementById("inputPrecision");
        const inputGeoDecimalDigits = document.getElementById("inputGeoDecimalDigits");
        const inputUtmDecimalDigits = document.getElementById("inputUtmDecimalDigits");
        const selectActiveZ = document.getElementById("selectActiveZ");
        const selectMode = document.getElementById("mode");
        const inputCoveragePrecissions = document.getElementById("coveragePrecissions");
        const epsgFormatElement = document.getElementById("epsgFormat");
        const draggableDialogElement = document.getElementById("draggableDialog");
        const inputHelpUrl = document.getElementById("inputHelpUrl");

        inputTooltip.addEventListener('change', cambiarTest);
        inputSrs.addEventListener('change', cambiarTest);
        inputLabel.addEventListener('change', cambiarTest);
        inputPrecision.addEventListener('change', cambiarTest);
        inputGeoDecimalDigits.addEventListener('change', cambiarTest);
        inputUtmDecimalDigits.addEventListener('change', cambiarTest);
        selectActiveZ.addEventListener('change', cambiarTest);
        selectMode.addEventListener('change', cambiarTest);
        inputCoveragePrecissions.addEventListener('change', cambiarTest);
        epsgFormatElement.addEventListener('change', cambiarTest);
        draggableDialogElement.addEventListener('change', cambiarTest);
        inputHelpUrl.addEventListener('change', cambiarTest);

        function cambiarTest() {
            let objeto = {}
            tooltip = inputTooltip.value != "" ? objeto.tooltip = inputTooltip.value : "";
            psrs = inputSrs.value != "" ? objeto.srs = inputSrs.value : "";
            label = inputLabel.value != "" ? objeto.label = inputLabel.value : "";
            precision = inputPrecision.value != "" ? objeto.precision = inputPrecision.value : "";
            geoDecimalDigits = inputGeoDecimalDigits.value != "" ? objeto.geoDecimalDigits = inputGeoDecimalDigits.value : "";
            utmDecimalDigits = inputUtmDecimalDigits.value != "" ? objeto.utmDecimalDigits = inputUtmDecimalDigits.value : "";
            activeZ = selectActiveZ.value != "" && (selectActiveZ.value == "true" || selectActiveZ.value == true) ? objeto.activeZ = true : objeto.activeZ = false;
            epsgFormat = epsgFormatElement.value != "" && (epsgFormatElement.value == "true" || epsgFormatElement.value == true) ? objeto.epsgFormat = true : objeto.epsgFormat = false;
            objeto.mode = selectMode.value;
            objeto.coveragePrecissions = JSON.parse(inputCoveragePrecissions.value);
            helpUrl = inputHelpUrl.value != "" ? objeto.helpUrl = inputHelpUrl.value : "";
            draggableDialog = draggableDialogElement.value != "" && (draggableDialogElement.value == "true" || draggableDialogElement.value == true) ? objeto.draggableDialogElement = true : objeto.draggableDialogElement = false;
            map.removePlugins(mp);
            crearPlugin(objeto);
        }

        function crearPlugin(propiedades) {
            mp = new IDEE.plugin.MouseSRS(propiedades);
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