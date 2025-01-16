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
    <meta name="idee" content="yes">
    <title>Visor base</title>
    <link type="text/css" rel="stylesheet" href="assets/css/apiidee.ol.min.css" />
    <link href="plugins/rescale/rescale.ol.min.css" rel="stylesheet" />
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
        <label for="inputTooltip">Parámetro tooltip</label>
        <input type="text" id="inputTooltip" value="Cambiar escala" />
        <input type="button" value="Eliminar Plugin" name="eliminar" id="botonEliminar">
    </div>
    <div id="mapjs" class="m-container"></div>
    <script type="text/javascript" src="vendor/browser-polyfill.js"></script>
    <script type="text/javascript" src="js/apiideee.ol.min.js"></script>
    <script type="text/javascript" src="js/configuration.js"></script>
    <script type="text/javascript" src="plugins/rescale/rescale.ol.min.js"></script>
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
            center: [-467062.8225, 4683459.6216],
        });

        const layerinicial = new M.layer.WMS({
            url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
            name: 'AU.AdministrativeBoundary',
            legend: 'Limite administrativo',
            tiled: false,
        }, {});

        const layerUA = new M.layer.WMS({
            url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
            name: 'AU.AdministrativeUnit',
            legend: 'Unidad administrativa',
            tiled: false
        }, {});

        map.addLayers([layerinicial, layerUA]);

        let mp;
        let collapsed, posicion, collapsible;
        crearPlugin(collapsed, posicion, collapsible);

        const selectPosicion = document.getElementById("selectPosicion");
        const selectCollapsed = document.getElementById("selectCollapsed");
        const selectCollapsible = document.getElementById("selectCollapsible");
        const inputTooltip = document.getElementById("inputTooltip");

        selectPosicion.addEventListener('change', cambiarTest);
        selectCollapsed.addEventListener('change', cambiarTest);
        selectCollapsible.addEventListener('change', cambiarTest);
        inputTooltip.addEventListener('change', cambiarTest);

        function cambiarTest() {
            posicion = selectPosicion.options[selectPosicion.selectedIndex].value;
            collapsed = (selectCollapsed.options[selectCollapsed.selectedIndex].value == 'true');
            collapsible = (selectCollapsible.options[selectCollapsible.selectedIndex].value == 'true');
            tooltip = inputTooltip.value;
            map.removePlugins(mp);
            crearPlugin(posicion, collapsed, collapsible, tooltip);
        }

        function crearPlugin(position, collapsed, collapsible, tooltip) {
            mp = new M.plugin.Rescale({
            	position: position,
                collapsed: collapsed,
                collapsible: collapsible,
                tooltip: tooltip,
            });

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
<script async src="https://www.googletagmanager.com/gtag/js?id=G-CTLHMMB5YT"></script>
<script>
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-CTLHMMB5YT');
</script>

</html>
