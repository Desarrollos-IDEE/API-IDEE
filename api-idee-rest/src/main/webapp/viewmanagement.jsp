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
    <link href="plugins/viewmanagement/viewmanagement.ol.min.css" rel="stylesheet" />
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
    <link type="text/css" rel="stylesheet" href="plugins/<%=cssfile%>"></link>
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
        <label for="selectCollapsed">Selector de collapsed</label>
        <select name="collapsed" id="selectCollapsed">
            <option value=""></option>
            <option value="true" selected="selected">true</option>
            <option value="false">false</option>
        </select>
        <label for="selectCollapsible">Selector de collapsible</label>
        <select name="collapsible" id="selectCollapsible">
            <option value=""></option>
            <option value="true" selected="selected">true</option>
            <option value="false">false</option>
        </select>
        <label for="tooltipInput">Tooltip</label>
        <input type="text" value="Gestión de la vista" id="tooltipInput"/>
        <label for="selectIsdraggable">Parámetro isDraggable</label>
        <select name="isdraggable" id="selectIsdraggable">
            <option value=""></option>
            <option value="true">true</option>
            <option value="false" selected="selected">false</option>
        </select>
        <label for="selectPredefinedZoom">Parámetro predefinedZoom</label>
        <select name="predefinedZoom" id="selectPredefinedZoom">
            <option value=""></option>
            <option value="true" selected="selected">true</option>
            <option value="false">false</option>
        </select>
        <label for="selectZoomExtent">Parámetro zoomExtent</label>
        <select name="zoomExtent" id="selectZoomExtent">
            <option value=""></option>
            <option value="true" selected="selected">true</option>
            <option value="false">false</option>
        </select>
        <label for="selectViewHistory">Parámetro viewhistory</label>
        <select name="viewhistory" id="selectViewHistory">
            <option value=""></option>
            <option value="true" selected="selected">true</option>
            <option value="false">false</option>
        </select>
        <label for="selectZoomPanel">Parámetro zoompanel</label>
        <select name="zoompanel" id="selectZoomPanel">
            <option value=""></option>
            <option value="true" selected="selected">true</option>
            <option value="false">false</option>
        </select>
        <input type="button" value="Eliminar Plugin" name="eliminar" id="botonEliminar"/>
    </div>
    <div id="mapjs" class="m-container"></div>
    <script type="text/javascript" src="vendor/browser-polyfill.js"></script>
    <script type="text/javascript" src="js/apiidee.ol.min.js"></script>
    <script type="text/javascript" src="js/configuration.js"></script>
    <script type="text/javascript" src="plugins/viewmanagement/viewmanagement.ol.min.js"></script>
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
        });
        let mp,collapsed,collapsible,isdraggable,zoomextent,viewhistory,zoompanel,predefinedzoom;
        crearPlugin({});
        const selectPosicion = document.getElementById("selectPosicion");
        const selectCollapsed = document.getElementById("selectCollapsed");
        const selectCollapsible = document.getElementById("selectCollapsible");
        const tooltipInput = document.getElementById("tooltipInput");
        const selectIsdraggable = document.getElementById("selectIsdraggable");
        const selectPredefinedZoom = document.getElementById("selectPredefinedZoom");
        const selectZoomExtent = document.getElementById("selectZoomExtent");
        const selectViewHistory = document.getElementById("selectViewHistory");
        const selectZoomPanel = document.getElementById("selectZoomPanel");
        selectPosicion.addEventListener('change',cambiarTest);
        selectCollapsed.addEventListener('change',cambiarTest);
        selectCollapsible.addEventListener('change',cambiarTest);
        tooltipInput.addEventListener('change',cambiarTest);
        selectIsdraggable.addEventListener('change',cambiarTest);
        selectPredefinedZoom.addEventListener('change',cambiarTest);
        selectZoomExtent.addEventListener('change',cambiarTest);
        selectViewHistory.addEventListener('change',cambiarTest);
        selectZoomPanel.addEventListener('change',cambiarTest);

        function cambiarTest(){
            let objeto = { }
            objeto.position = selectPosicion.options[selectPosicion.selectedIndex].value;
            let collapsedValor = selectCollapsed.options[selectCollapsed.selectedIndex].value;
            collapsed = collapsedValor != "" ? objeto.collapsed = (collapsedValor == "true" || collapsedValor == true) : "true";
            let collapsibleValor = selectCollapsible.options[selectCollapsible.selectedIndex].value;
            collapsible = collapsibleValor != "" ? objeto.collapsible = (collapsibleValor == "true" || collapsibleValor == true) : "true";
            objeto.tooltip = tooltipInput.value;
            let isDraggableValor = selectIsdraggable.options[selectIsdraggable.selectedIndex].value;
            isdraggable = isDraggableValor != "" ? objeto.isDraggable = (isDraggableValor == "true" || isDraggableValor == true) : "true";
            let zoomExtentValor = selectZoomExtent.options[selectZoomExtent.selectedIndex].value;
            zoomextent = zoomExtentValor != "" ? objeto.zoomExtent = (zoomExtentValor == "true" || zoomExtentValor == true) : "true";
            let viewHistoryValor = selectViewHistory.options[selectViewHistory.selectedIndex].value;
            viewhistory = viewHistoryValor != "" ? objeto.viewhistory = (viewHistoryValor == "true" || viewHistoryValor == true) : "true";
            let zoomPanelValor = selectZoomPanel.options[selectZoomPanel.selectedIndex].value;
            zoompanel = zoomPanelValor != "" ? objeto.zoompanel = (zoomPanelValor == "true" || zoomPanelValor == true) : "true";
            let predefinedZoomValor = selectPredefinedZoom.options[selectPredefinedZoom.selectedIndex].value;
            predefinedzoom = predefinedZoomValor != "" ? objeto.predefinedZoom = (predefinedZoomValor == "true" || predefinedZoomValor == true) : "true";
            map.removePlugins(mp);
            crearPlugin(objeto);
        }

        function crearPlugin(propiedades){
            mp = new IDEE.plugin.ViewManagement(propiedades);
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
