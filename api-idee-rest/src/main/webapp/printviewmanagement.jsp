<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ page import="es.cnig.mapea.plugins.PluginsManager"%>
<%@ page import="es.cnig.mapea.parameter.adapter.ParametersAdapterV3ToV4"%>
<%@ page import="java.util.Map"%>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="mapea" content="yes">
    <title>Visor base</title>
    <link type="text/css" rel="stylesheet" href="assets/css/apiign.ol.min.css" />
    <link href="plugins/printviewmanagement/printviewmanagement.ol.min.css" rel="stylesheet" />
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
        <label for="tooltipInput">Parámetro Tooltip</label>
        <input type="text" value="Impresión del mapa" id="tooltipInput"/>
        <label for="selectIsdraggable">Parámetro isDraggable</label>
        <select name="isdraggable" id="selectIsdraggable">
            <option value=""></option>
            <option value="true">true</option>
            <option value="false" selected="selected">false</option>
        </select>

        <label for="defaultOpenControl">Parámetro defaultOpenControl</label>
        <input type="number" value="0" id="defaultOpenControl" min="0" max="3" step="1">
        
        <label for="selectUseProxy">Parámetro useProxy</label>
        <select name="useProxy" id="selectUseProxy">
            <option value=""></option>
            <option value="true" selected="selected">true</option>
            <option value="false">false</option>
        </select>
        
        
        <label for="inputOrder">Parámetro order</label>
        <input type="text" name="orderValue" id="inputOrder" list="orderValueSug">
        <label for="inputServerUrl">Parámetro serverUrl</label>
        <input type="text" name="serverUrlValue" id="inputServerUrl" list="serverUrlValueSug">
        <label for="inputPrintStatusUrl">Parámetro printStatusUrl</label>
        <input type="text" name="printStatusUrlValue" id="inputPrintStatusUrl" list="printStatusUrlValueSug">

    	<label for="georefImageEpsgInput">Parámetro georefImageEpsg</label>
        <input type="text" id="georefImageEpsgInput"/>
        <label for="georefImageInput">Parámetro georefImage</label>
        <input type="text" id="georefImageInput"/>
        <label for="printermapInput">Parámetro printermap</label>
        <input type="text" id="printermapInput"/>
        
        <input type="button" value="Eliminar Plugin" name="eliminar" id="botonEliminar">        
    </div>
    <div id="mapjs" class="m-container"></div>
    <script type="text/javascript" src="vendor/browser-polyfill.js"></script>
    <script type="text/javascript" src="js/apiign.ol.min.js"></script>
    <script type="text/javascript" src="js/configuration.js"></script>
    <script type="text/javascript" src="plugins/printviewmanagement/printviewmanagement.ol.min.js"></script>
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

		const DEFAULT_serverUrl = "https://componentes.cnig.es/geoprint";
		const DEFAULT_printStatusUrl = "https://componentes.cnig.es/geoprint/print/status";
        
        const DEFAULT_georefImageEpsg = '{"tooltip": "Georeferenciar imagen","layers": [{"url": "http://www.ign.es/wms-inspire/mapa-raster?","name": "mtn_rasterizado","format": "image/jpeg","legend": "Mapa ETRS89 UTM"},{"url": "http://www.ign.es/wms-inspire/pnoa-ma?","name": "OI.OrthoimageCoverage","format": "image/jpeg","legend": "Imagen (PNOA) ETRS89 UTM"}]}';
        const DEFAULT_georefImage = '{"tooltip": "Georeferenciar imagen","printTemplateUrl": "https://componentes.cnig.es/geoprint/print/mapexport","printSelector": true}';
        const DEFAULT_printermap = '{"printTemplateUrl": "https://componentes.cnig.es/geoprint/print/CNIG","headerLegend": "https://www.idee.es/csw-codsi-idee/images/cabecera-CODSI.png","filterTemplates": ["A3 Horizontal"],"logo": "https://www.idee.es/csw-codsi-idee/images/cabecera-CODSI.png"}';
        
        const map = M.map({
            container: 'mapjs',
            zoom: 5,
            maxZoom: 20,
            minZoom: 4,
            center: [-467062.8225, 4683459.6216],
        });

        const layerinicial = new M.layer.WMS({
            url: 'http://www.ign.es/wms-inspire/unidades-administrativas?',
            name: 'AU.AdministrativeBoundary',
            legend: 'Limite administrativo',
            tiled: false,
        }, {});

        const campamentos = new M.layer.GeoJSON({
            name: 'Campamentos',
            url: 'http://geostematicos-sigc.juntadeandalucia.es/geoserver/sepim/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=sepim:campamentos&outputFormat=application/json&',
            extract: true,
        });
        map.addLayers([layerinicial, campamentos]);

        let mp;
        let position, collapsed, collapsible, tooltip, isDraggable, order, useProxy,
        	serverUrl = DEFAULT_serverUrl,
        	printStatusUrl = DEFAULT_printStatusUrl,
        	georefImageEpsg = JSON.parse(DEFAULT_georefImageEpsg),
        	georefImage = JSON.parse(DEFAULT_georefImage),
        	printermap = JSON.parse(DEFAULT_printermap);
        crearPlugin({
        	position,
        	collapsed,
        	collapsible,
        	tooltip,
        	isDraggable,
            useProxy,
			order,
			serverUrl,
			printStatusUrl,
			georefImageEpsg,
			georefImage,
			printermap,
        });

        const selectPosition = document.getElementById("selectPosition");
        const selectCollapsed = document.getElementById("selectCollapsed");
        const selectCollapsible = document.getElementById("selectCollapsible");
        const tooltipInput = document.getElementById("tooltipInput");
        const defaultOpenControlInput = document.getElementById("defaultOpenControl");
        const selectIsdraggable = document.getElementById("selectIsdraggable");
        const selectUseProxy = document.getElementById("selectUseProxy");
        const inputOrder = document.getElementById("inputOrder");
        const inputServerUrl = document.getElementById("inputServerUrl");
        const inputPrintStatusUrl = document.getElementById("inputPrintStatusUrl");
        const georefImageEpsgInput = document.getElementById("georefImageEpsgInput");
        const georefImageInput = document.getElementById("georefImageInput");
        const printermapInput = document.getElementById("printermapInput");

        georefImageEpsgInput.value = DEFAULT_georefImageEpsg;
       	georefImageInput.value = DEFAULT_georefImage;
   		printermapInput.value = DEFAULT_printermap;
   		inputServerUrl.value = DEFAULT_serverUrl;
   		inputPrintStatusUrl.value = DEFAULT_printStatusUrl;
        
        selectPosition.addEventListener('change', cambiarTest);
        selectCollapsed.addEventListener('change', cambiarTest);
        selectCollapsible.addEventListener('change', cambiarTest);
        tooltipInput.addEventListener('change',cambiarTest);
        defaultOpenControlInput.addEventListener('change',cambiarTest);
        selectIsdraggable.addEventListener('change',cambiarTest);
        selectUseProxy.addEventListener('change',cambiarTest);
        inputOrder.addEventListener('change', cambiarTest);
        inputServerUrl.addEventListener('change', cambiarTest);
        inputPrintStatusUrl.addEventListener('change', cambiarTest);
        georefImageEpsgInput.addEventListener('change',cambiarTest);
        georefImageInput.addEventListener('change',cambiarTest);
        printermapInput.addEventListener('change',cambiarTest);
        

        function cambiarTest() {
            let objeto = {};
            objeto.position = selectPosition.options[selectPosition.selectedIndex].value;
            objeto.collapsed = (selectCollapsed.options[selectCollapsed.selectedIndex].value == 'true');
            objeto.collapsible = (selectCollapsible.options[selectCollapsible.selectedIndex].value == 'true');
            objeto.tooltip = tooltipInput.value != "" ? tooltipInput.value : "";
            objeto.defaultOpenControl = Number(defaultOpenControlInput.value);
            let isDraggableValor = selectIsdraggable.options[selectIsdraggable.selectedIndex].value;
            isdraggable = isDraggableValor != "" ? objeto.isDraggable = (isDraggableValor == "true" || isDraggableValor == true) : "true";
            let useProxyValor = selectUseProxy.options[selectUseProxy.selectedIndex].value;
            useProxy = useProxyValor != "" ? objeto.useProxy = (useProxyValor == "true" || useProxyValor == true) : "true";
            objeto.order = inputOrder.value != "" ? inputOrder.value : "";
            objeto.serverUrl = inputServerUrl.value != "" ? inputServerUrl.value : "";
            objeto.printStatusUrl = inputPrintStatusUrl.value != "" ? inputPrintStatusUrl.value : "";
            objeto.georefImageEpsg = georefImageEpsgInput.value != "" ? JSON.parse(georefImageEpsgInput.value) : "";
            objeto.georefImage = georefImageInput.value != "" ? JSON.parse(georefImageInput.value) : "";
            objeto.printermap = printermapInput.value != "" ? JSON.parse(printermapInput.value) : "";

            map.removePlugins(mp);
            crearPlugin(objeto);
        }

        function crearPlugin(propiedades) {
            mp = new M.plugin.PrintViewManagement(propiedades);
            map.addPlugin(mp);
        }
        let mp2 = new M.plugin.ShareMap({
            baseUrl: window.location.href.substring(0, window.location.href.indexOf('api-core')) + "api-core/",
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
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-CTLHMMB5YT');
</script>

</html>
