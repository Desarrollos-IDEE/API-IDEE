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
    <link type="text/css" rel="stylesheet" href="assets/css/apiign.ol.min.css">
    <link href="plugins/measurebar/measurebar.ol.min.css" rel="stylesheet" />
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
        <label for="selectPosicion">Selector de posición del plugin</label>
        <select name="position" id="selectPosicion">
            <option value="TL" selected="selected">Arriba Izquierda (TL)</option>
            <option value="TR">Arriba Derecha (TR)</option>
            <option value="BR">Abajo Derecha (BR)</option>
            <option value="BL">Abajo Izquierda (BL)</option>
        </select>

     	<label for="selectCollapsed">Parámetro de collapsed</label>
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
        <input type="text" name="tooltip" id="inputTooltip" list="tooltipSug" value="Herramientas de medición">
        <datalist id="tooltipSug">
            <option value="Herramientas de medición"></option>
        </datalist>
        <input type="button" value="Eliminar Plugin" name="eliminar" id="botonEliminar">
    </div>
    <div id="mapjs" class="m-container"></div>
    <script type="text/javascript" src="vendor/browser-polyfill.js"></script>
    <script type="text/javascript" src="js/apiign.ol.min.js"></script>
    <script type="text/javascript" src="js/configuration.js"></script>
    <script type="text/javascript" src="plugins/measurebar/measurebar.ol.min.js"></script>
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

        const map = M.map({
            container: 'mapjs',
            zoom: 5,
            maxZoom: 20,
            minZoom: 4,
            center: [-467062.8225, 4783459.6216],
        });
        //let mp;
        let mp, posicion, collapsible, collapsed, tooltip;
        crearPlugin({
		position:posicion,
		collapsible: collapsible,
		collapsed: collapsed,
		tooltip: tooltip
		});

      	const selectCollapsed = document.getElementById("selectCollapsed");
        const selectCollapsible = document.getElementById("selectCollapsible");
        const inputTooltip = document.getElementById("inputTooltip");
       	const selectPosicion = document.getElementById("selectPosicion");

		inputTooltip.addEventListener('change', cambiarTest);
		selectCollapsible.addEventListener('change', cambiarTest);
		selectCollapsed.addEventListener('change', cambiarTest);
        selectPosicion.addEventListener('change', cambiarTest);
 		function cambiarTest() {
			let objeto = {}
            objeto.position = selectPosicion.options[selectPosicion.selectedIndex].value;
			collapsible = selectCollapsible.options[selectCollapsible.selectedIndex].value;
            collapsible != '' ? objeto.collapsible = (collapsible === "true") : '';
	        collapsed = selectCollapsed.options[selectCollapsed.selectedIndex].value;
            collapsed != '' ? objeto.collapsed = (collapsed === "true") : '';
   			tooltip = inputTooltip.value != "" ? objeto.tooltip = inputTooltip.value : "";
            map.removePlugins(mp);
            crearPlugin(objeto);
        };

     function crearPlugin(propiedades) {
            mp = new M.plugin.MeasureBar(propiedades);
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
