<%@ page language="java" contentType="text/html; charset=UTF-8"
	pageEncoding="UTF-8"%>
<%@ page import="es.api_idee.plugins.PluginsManager"%>
<%@ page
	import="es.api_idee.parameter.adapter.ParametersAdapterV3ToV4"%>
<%@ page import="java.util.Map"%>

<!DOCTYPE html>
<html lang="en">

<head>
<meta charset="UTF-8">
<meta name="viewport"
	content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<meta name="idee" content="yes">
<title>Visor base</title>

<link type="text/css" rel="stylesheet" href="assets/css/apiidee.ol.min.css">
<link href="plugins/backimglayer/backimglayer.ol.min.css" rel="stylesheet" />
<link href="plugins/sharemap/sharemap.ol.min.css" rel="stylesheet" />
</link>
<style type="text/css">
html, body {
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
		<label for="selectPosicion">Selector de posición del plugin</label> <select
			name="position" id="selectPosicion">
			<option value="TL">Arriba Izquierda (TL)</option>
			<option value="TR" selected="selected">Arriba Derecha (TR)</option>
			<option value="BR">Abajo Derecha (BR)</option>
			<option value="BL">Abajo Izquierda (BL)</option>
		</select> 
		<label for="inputTooltip">Parámetro tooltip</label>
        <input type="text" name="tooltip" id="inputTooltip" list="tooltipSug" value="Capas de fondo">
        <datalist id="tooltipSug">
            <option value="Capas de fondo"></option>
        </datalist>
		
		<label for="selectCollapsed">Selector collapsed</label> <select
			name="httpValue" id="selectCollapsed">
			<option value=true>true</option>
			<option value=false>false</option>
		</select> 
		<label for="selectCollapsible">Selector collapsible</label> <select
			name="httpValue" id="selectCollapsible">
			<option value=true>true</option>
			<option value=false>false</option>
		</select> 
		<label for="selectVisibility">Selector layerVisibility</label> <select
			name="httpValue" id="selectVisibility">
			<option value=true>true</option>
			<option value=false>false</option>
		</select> 
		
		<label for="selectEmpty">Selector empty</label> <select
			name="empty" id="selectEmpty">
			<option value=true>true</option>
			<option value=false selected="selected">false</option>
		</select> 
   	
		<label for="ncolumn">Número de columnas:</label> 
		<input type="text"id="ncolumn" name="ncolumn" value="2"> 
		<input type="button" value="Eliminar Plugin" name="eliminar" id="botonEliminar">
	</div>

	<div id="mapjs" class="m-container"></div>
	<script type="text/javascript" src="vendor/browser-polyfill.js"></script>
	<script type="text/javascript" src="js/apiidee.ol.min.js"></script>
	<script type="text/javascript" src="js/configuration.js"></script>
	<script type="text/javascript" src="plugins/backimglayer/backimglayer.ol.min.js"></script>
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
			layers: ['OSM'],
            zoom: 5,
            maxZoom: 20,
            minZoom: 4,
            center: [-467062.8225, 4683459.6216],
        });

        let mp, posicion, collapsed, collapsible, visibility = true, tooltip, empty, columnas = 2;
        crearPlugin({
            collapsed: collapsed,
            collapsible: collapsible,
            position: posicion,
			layerVisibility: visibility,
			tooltip: tooltip,
            columnsNumber: columnas,
			empty: empty,
        });

        const selectPosicion = document.getElementById("selectPosicion");
        const selectCollapsed = document.getElementById("selectCollapsed");
        const selectCollapsible = document.getElementById("selectCollapsible");
        const selectVisibility = document.getElementById("selectVisibility");
        const inputTooltip = document.getElementById("inputTooltip");
        const ncolumn = document.getElementById("ncolumn");
   		const selectEmpty = document.getElementById("selectEmpty");

        selectPosicion.addEventListener('change', cambiarTest);
        selectCollapsed.addEventListener('change', cambiarTest);
        selectCollapsible.addEventListener('change', cambiarTest);
       	selectVisibility.addEventListener('change', cambiarTest);
		inputTooltip.addEventListener('change', cambiarTest);
        ncolumn.addEventListener('change', cambiarTest);
		selectEmpty.addEventListener('change', cambiarTest);

        function cambiarTest() {
            let objeto = {}
            objeto.collapsed = (selectCollapsed.options[selectCollapsed.selectedIndex].value === 'true');
            objeto.collapsible = (selectCollapsible.options[selectCollapsible.selectedIndex].value === 'true');
            objeto.layerVisibility = (selectVisibility.options[selectVisibility.selectedIndex].value === 'true');
            objeto.position = selectPosicion.options[selectPosicion.selectedIndex].value;
			objeto.tooltip = inputTooltip.value != "" ? objeto.tooltip = inputTooltip.value : "";
            objeto.columnsNumber = ncolumn.value || 2;
			//objeto.empty = objeto.empty != true ? objeto.empty : false;			
 			objeto.empty = (selectEmpty.options[selectEmpty.selectedIndex].value === 'true');


            map.removePlugins(mp);
            crearPlugin(objeto);
        }

        function crearPlugin(propiedades) {
            propiedades.layerOpts = [

		{
                    id: 'imagen',
                    title: 'Imagen',
                    preview: 'plugins/backimglayer/images/svqhibrid.png',
                    layers: [new M.layer.TMS({
                        url: 'https://tms-pnoa-ma.idee.es/1.0.0/pnoa-ma/{z}/{x}/{-y}.jpeg',
                        name: 'PNOA-MA',
                        legend: 'Mapa IGN',
                        format: 'image/jpeg',
						transparent: false,
					    displayInLayerSwitcher: false,
						visible: true,
                    })],
                },
				{
                    id: 'mapa',
 					title: 'Mapa',
                    preview: 'plugins/backimglayer/images/svqmapa.png',                   
                    layers: [new M.layer.TMS({
                        url: 'https://tms-ign-base.idee.es/1.0.0/IGNBaseTodo/{z}/{x}/{-y}.jpeg',
                        name: 'IGNBaseTodo',
                        legend: 'Mapa IGN',
                        format: 'image/jpeg',
						transparent: false,
						displayInLayerSwitcher: false,
						visible: true,
                    })],
                },
            ];
            mp = new M.plugin.BackImgLayer(propiedades);
            map.addPlugin(mp);
        }
        let mp2 = new M.plugin.ShareMap({
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
<script async
	src="https://www.googletagmanager.com/gtag/js?id=G-CTLHMMB5YT"></script>
<script>
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-CTLHMMB5YT');
</script>

</html>
