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
    <link type="text/css" rel="stylesheet" href="assets/css/apiidee.ol.min.css" />
    <link href="plugins/printermap/printermap.ol.min.css" rel="stylesheet" />
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
        <label for="inputServerUrl">Parámetro serverUrl</label>
        <input type="text" name="serverUrlValue" id="inputServerUrl" list="serverUrlValueSug">
        <datalist id="serverUrlValueSug">
            <option value="https://componentes.cnig.es/geoprint"></option>
        </datalist>
        <label for="inputPrintTemplateUrl">Parámetro printTemplateUrl</label>
        <input type="text" name="printTemplateUrlValue" id="inputPrintTemplateUrl" list="printTemplateUrlValueSug">
        <datalist id="printTemplateUrlValueSug">
            <option value="https://componentes.cnig.es/geoprint/print/CNIG"></option>
        </datalist>
        <label for="inputPrintTemplateGeoUrl">Parámetro printTemplateGeoUrl</label>
        <input type="text" name="printTemplateGeoUrlValue" id="inputPrintTemplateGeoUrl" list="printTemplateGeoUrlValueSug">
        <datalist id="printTemplateGeoUrlValueSug">
            <option value="https://componentes.cnig.es/geoprint/print/status"></option>
        </datalist>
        <label for="inputPrintStatusUrl">Parámetro printStatusUrl</label>
        <input type="text" name="printStatusUrlValue" id="inputPrintStatusUrl" list="printStatusUrlValueSug">
        <datalist id="printStatusUrlValueSug">
            <option value="https://componentes.cnig.es/geoprint/print/status"></option>
        </datalist>
        <label for="inputTooltip">Parámetro tooltip</label>
        <input type="text" id="inputTooltip" value="Impresión del mapa" />
        <label for="inputHeaderlegend">Parámetro headerlegend</label>
        <input type="text" id="inputHeaderlegend" value="https://centrodedescargas.cnig.es/CentroDescargas/imgCdD/escudoInstitucional.png"/>
        <label for="inputLogo">Parámetro logo</label>
        <input type="text" id="inputLogo" value="https://www.ign.es/IGNCNIG/Imagenes/Contenidos/IGN-Header-Tittle.png"/>
        <label for="inputCredits">Parámetro credits</label>
        <input type="text" id="inputCredits" value="Impresión generada desde Fototeca Digital http://fototeca.cnig.es/" />
        <label for="selectGeorefActive">Parámetro georefActive</label>
        <select name="selectGeorefActive" id="selectGeorefActive">
            <option value=true>true</option>
            <option value=false>false</option>
        </select>
        <label for="selectFototeca">Parámetro fototeca</label>
        <select name="selectFototeca" id="selectFototeca">
            <option value=true>true</option>
            <option value=false>false</option>
        </select>
        <label for="inputFilterTemplates">Parámetro filterTemplates (separado por ,)</label>
        <input type="text" name="filterTemplates" id="inputFilterTemplates" value="A3 Horizontal"/>
        <input type="button" value="Eliminar Plugin" name="eliminar" id="botonEliminar">
    </div>
    <div id="mapjs" class="m-container"></div>
    <script type="text/javascript" src="vendor/browser-polyfill.js"></script>
    <script type="text/javascript" src="js/apiidee.ol.min.js"></script>
    <script type="text/javascript" src="js/configuration.js"></script>
    <script type="text/javascript" src="plugins/printermap/printermap.ol.min.js"></script>
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
            center: [-467062.8225, 4683459.6216],
        });

        const layerinicial = new IDEE.layer.WMS({
            url: 'http://www.ign.es/wms-inspire/unidades-administrativas?',
            name: 'AU.AdministrativeBoundary',
            legend: 'Limite administrativo',
            tiled: false,
        }, {});

        const campamentos = new IDEE.layer.GeoJSON({
            name: 'Campamentos',
            url: 'http://geostematicos-sigc.juntadeandalucia.es/geoserver/sepim/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=sepim:campamentos&outputFormat=application/json&',
            extract: true,
        });
        map.addLayers([layerinicial, campamentos]);

        let mp;
        let posicion, collapsed, collapsible, serverUrl, printTemplateUrl, printTemplateGeoUrl, printStatusUrl;
        crearPlugin({
            position: posicion,
            collapsed: collapsed,
            collapsible: collapsible,
            serverUrl: serverUrl,
            printTemplateUrl: printTemplateUrl,
            printTemplateGeoUrl: printTemplateGeoUrl,
            printStatusUrl: printStatusUrl,
        });

        const selectPosicion = document.getElementById("selectPosicion");
        const selectCollapsed = document.getElementById("selectCollapsed");
        const selectCollapsible = document.getElementById("selectCollapsible");
        const inputServerUrl = document.getElementById("inputServerUrl");
        const inputPrintTemplateUrl = document.getElementById("inputPrintTemplateUrl");
        const inputPrintTemplateGeoUrl = document.getElementById("inputPrintTemplateGeoUrl");
        const inputPrintStatusUrl = document.getElementById("inputPrintStatusUrl");
        const inputTooltip = document.getElementById("inputTooltip");
        const inputHeaderlegend = document.getElementById("inputHeaderlegend");
        const inputLogo = document.getElementById("inputLogo");
        const inputCredits = document.getElementById("inputCredits");
        const selectGeorefActive = document.getElementById("selectGeorefActive");
        const selectFototeca = document.getElementById("selectFototeca");
        const inputFilterTemplates = document.getElementById("inputFilterTemplates");
        

        selectPosicion.addEventListener('change', cambiarTest);
        selectCollapsed.addEventListener('change', cambiarTest);
        selectCollapsible.addEventListener('change', cambiarTest);
        inputServerUrl.addEventListener('change', cambiarTest);
        inputPrintTemplateUrl.addEventListener('change', cambiarTest);
        inputPrintTemplateGeoUrl.addEventListener('change', cambiarTest);
        inputPrintStatusUrl.addEventListener('change', cambiarTest);
        inputTooltip.addEventListener('change', cambiarTest);
        inputHeaderlegend.addEventListener('change', cambiarTest);
        inputLogo.addEventListener('change', cambiarTest);
        inputCredits.addEventListener('change', cambiarTest);
        selectGeorefActive.addEventListener('change', cambiarTest);
        selectFototeca.addEventListener('change', cambiarTest);
        inputFilterTemplates.addEventListener('change', cambiarTest);
        

        function cambiarTest() {
            let objeto = {};
            objeto.position = selectPosicion.options[selectPosicion.selectedIndex].value;
            objeto.collapsed = (selectCollapsed.options[selectCollapsed.selectedIndex].value == 'true');
            objeto.collapsible = (selectCollapsible.options[selectCollapsible.selectedIndex].value == 'true');
            serverUrl = inputServerUrl.value != "" ? objeto.serverUrl = inputServerUrl.value : "";
            printTemplateUrl = inputPrintTemplateUrl.value != "" ? objeto.printTemplateUrl = inputPrintTemplateUrl.value : "";
            printTemplateGeoUrl = inputPrintTemplateGeoUrl.value != "" ? objeto.printTemplateGeoUrl = inputPrintTemplateGeoUrl.value : "";
            printStatusUrl = inputPrintStatusUrl.value != "" ? objeto.printStatusUrl = inputPrintStatusUrl.value : "";
            tooltip = inputTooltip.value != "" ? objeto.tooltip = inputTooltip.value : "";
            headerLegend = inputHeaderlegend.value != "" ? objeto.headerLegend = inputHeaderlegend.value : "";
            logo = inputLogo.value != "" ? objeto.logo = inputLogo.value : "";
            credits = inputCredits.value != "" ? objeto.credits = inputCredits.value : "";
            objeto.georefActive = (selectGeorefActive.options[selectGeorefActive.selectedIndex].value == 'true');
            objeto.fototeca = (selectFototeca.options[selectFototeca.selectedIndex].value == 'true');
         	// Para convertirlo en array se utiliza el metodo .split (valores separados por ",").
            (inputFilterTemplates.value != "") ? objeto.filterTemplates = inputFilterTemplates.value.split(',') : ['A3 Horizontal']; 
            map.removePlugins(mp);
            crearPlugin(objeto);
        }

        function crearPlugin(propiedades) {
            mp = new IDEE.plugin.PrinterMap(propiedades);
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
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-19NTRSBP21');
</script>

</html>
