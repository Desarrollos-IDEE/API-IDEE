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
    <link href="plugins/infocoordinates/infocoordinates.ol.min.css" rel="stylesheet" />
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
        <label for="selectPosicion">Selector de posición del plugin</label>
        <select name="position" id="selectPosicion">
            <option value="TL">Arriba Izquierda (TL)</option>
            <option value="TR" selected="selected">Arriba Derecha (TR)</option>
            <option value="BR">Abajo Derecha (BR)</option>
            <option value="BL">Abajo Izquierda (BL)</option>
        </select>
 		<label for="selectCollapsed">Selector de collapsed</label>
        <select name="collapsed" id="selectCollapsed">
            <option value=''></option>
            <option value="true" selected="selected">true</option>
            <option value="false">false</option>
        </select>

     	<label for="selectCollapsible">Selector de collapsible</label>
        <select name="collapsible" id="selectCollapsible">
            <option value=''></option>
            <option value="true" selected="selected">true</option>
            <option value="false">false</option>
        </select>

   		<label for="inputTooltip">Parámetro tooltip</label>
        <input type="text" name="tooltip" id="inputTooltip" list="tooltipSug" value="Información Coordenadas">
        <datalist id="tooltipSug">
            <option value="Información Coordenadas"></option>
        </datalist>

		<label for="helpUrl">Parámetro helpUrl</label>
        <input type="text" name="helpUrl" id="inputHelpUrl" list="helpUrl">
        <datalist id="helpUrl">
            <option value="https://www.ign.es/">Ayuda</option>
		</datalist>
		
        <label for="inputDecimalGEOcoord">Parámetro decimalGEOcoord</label>
        <input id="inputDecimalGEOcoord" type="number" value="4" min="0" max="10"></input>
        <label for="inputDecimalUTMcoord">Parámetro decimalUTMcoord</label>
        <input id="inputDecimalUTMcoord" type="number" value=2 min="0" max="5">
        <label for="selectOutputDownloadFormat">Selector de outputDownloadFormat</label>
        <select name="selectOutputDownloadFormat" id="selectOutputDownloadFormat">
            <option value="txt" selected>txt</option>
            <option value="csv">csv</option>
        </select>
        <input type="button" value="Eliminar Plugin" name="eliminar" id="botonEliminar">
    </div>

    <div id="mapjs" class="m-container"></div>
    <script type="text/javascript" src="vendor/browser-polyfill.js"></script>
    <script type="text/javascript" src="js/apiidee.ol.min.js"></script>
    <script type="text/javascript" src="js/configuration.js"></script>
    <script type="text/javascript" src="plugins/infocoordinates/infocoordinates.ol.min.js"></script>
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
            zoom: 5.5,
            maxZoom: 20,
            minZoom: 4,
            center: [-467062.8225, 4683459.6216],
        });
        let mp2 = new IDEE.plugin.ShareMap({
            baseUrl: window.location.href.substring(0, window.location.href.indexOf('api-idee')) + "api-idee/",
            position: "TR",
        });
        map.addPlugin(mp2);

        const selectPosicion = document.getElementById("selectPosicion");
        const inputDecimalGEOcoord = document.getElementById("inputDecimalGEOcoord");
        const inputDecimalUTMcoord = document.getElementById("inputDecimalUTMcoord");
        const selectCollapsed = document.getElementById("selectCollapsed");
        const selectCollapsible = document.getElementById("selectCollapsible");
        const inputTooltip = document.getElementById("inputTooltip");
        const inputHelpUrl = document.getElementById("inputHelpUrl");
        const selectOutputDownloadFormat = document.getElementById("selectOutputDownloadFormat");

        let mp;
        let posicion = selectPosicion.value;
        let valueDecimalGEOcoord = inputDecimalGEOcoord.value;
        let valueDecimalUTMcoord = inputDecimalUTMcoord.value;
		let valueTooltip = inputTooltip.value;
		let helpUrl = inputHelpUrl.value;
        crearPlugin({
            position: posicion,
            decimalGEOcoord: valueDecimalGEOcoord,
            decimalUTMcoord: valueDecimalUTMcoord,
			collapsed: true,
			collapsible: true,
			tooltip: valueTooltip,
			helpUrl: "https://www.ign.es/"
        });
        selectPosicion.addEventListener("change", cambiarTest);
        inputDecimalGEOcoord.addEventListener("change", cambiarTest);
        inputDecimalUTMcoord.addEventListener("change", cambiarTest);
      	selectCollapsible.addEventListener('change',cambiarTest);
		selectCollapsed.addEventListener('change', cambiarTest);
		inputTooltip.addEventListener('change', cambiarTest);
		inputHelpUrl.addEventListener('change', cambiarTest);
		selectOutputDownloadFormat.addEventListener('change', cambiarTest);
		

        function cambiarTest() {
            let objeto = {}
            objeto.position = selectPosicion.options[selectPosicion.selectedIndex].value;
			collapsible = selectCollapsible.options[selectCollapsible.selectedIndex].value;
            collapsible != '' ? objeto.collapsible = (collapsible === "true") : '';
	        collapsed = selectCollapsed.options[selectCollapsed.selectedIndex].value;
            collapsed != '' ? objeto.collapsed = (collapsed === "true") : '';
            objeto.decimalGEOcoord = inputDecimalGEOcoord.value;
            objeto.decimalUTMcoord = inputDecimalUTMcoord.value;
			objeto.tooltip = inputTooltip.value;
			objeto.outputDownloadFormat = selectOutputDownloadFormat.options[selectOutputDownloadFormat.selectedIndex].value;
			helpUrl = inputHelpUrl.value != "" ? objeto.helpUrl = inputHelpUrl.value : "";
   			

            map.removePlugins(mp);
            crearPlugin(objeto);
        }
        function crearPlugin(propiedades) {
            mp = new IDEE.plugin.Infocoordinates(propiedades);
            map.addPlugin(mp);
        }
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