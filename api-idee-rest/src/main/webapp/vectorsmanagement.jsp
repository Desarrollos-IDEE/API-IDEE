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
    <link href="plugins/vectorsmanagement/vectorsmanagement.ol.min.css" rel="stylesheet" />
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
        <!-- Controles -->
        <label for="selection">selection</label>
        <select name="collapsible" id="selection">
            <option value=""></option>
            <option value="true" selected="selected">true</option>
            <option value="false">false</option>
        </select>
        <label for="addLayer">addLayer</label>
        <select name="collapsible" id="addLayer">
            <option value=""></option>
            <option value="true" selected="selected">true</option>
            <option value="false">false</option>
        </select>
        <label for="analysis">analysis</label>
        <select name="collapsible" id="analysis">
            <option value=""></option>
            <option value="true" selected="selected">true</option>
            <option value="false">false</option>
        </select>
        <label for="creation">creation</label>
        <select name="collapsible" id="creation">
            <option value=""></option>
            <option value="true" selected="selected">true</option>
            <option value="false">false</option>
        </select>
        <label for="download">download</label>
        <select name="collapsible" id="download">
            <option value=""></option>
            <option value="true" selected="selected">true</option>
            <option value="false">false</option>
        </select>
        <label for="edition">edition</label>
        <select name="collapsible" id="edition">
            <option value=""></option>
            <option value="true" selected="selected">true</option>
            <option value="false">false</option>
        </select>
        <label for="help">help</label>
        <select name="collapsible" id="help">
            <option value=""></option>
            <option value="true" selected="selected">true</option>
            <option value="false">false</option>
        </select>
        <label for="style">style</label>
        <select name="collapsible" id="style">
            <option value=""></option>
            <option value="true" selected="selected">true</option>
            <option value="false">false</option>
        </select>
        <input type="button" value="Eliminar Plugin" name="eliminar" id="botonEliminar" />
    </div>
    <div id="mapjs" class="m-container"></div>
    <script type="text/javascript" src="vendor/browser-polyfill.js"></script>
    <script type="text/javascript" src="js/apiidee.ol.min.js"></script>
    <script type="text/javascript" src="js/configuration.js"></script>
    <script type="text/javascript" src="plugins/vectorsmanagement/vectorsmanagement.ol.min.js"></script>
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
        let mp,collapsed,collapsible;
        crearPlugin({});
        const selectPosicion = document.getElementById("selectPosicion");
        const selectCollapsed = document.getElementById("selectCollapsed");
        const selectCollapsible = document.getElementById("selectCollapsible");
        const selectionInput = document.getElementById("selection");
        const addLayerInput = document.getElementById("addLayer");
        const analysisInput = document.getElementById("analysis");
        const creationInput = document.getElementById("creation");
        const downloadInput = document.getElementById("download");
        const editionInput = document.getElementById("edition");
        const helpInput = document.getElementById("help");
        const styleInput = document.getElementById("style");

        selectPosicion.addEventListener('change',cambiarTest);
        selectCollapsed.addEventListener('change',cambiarTest);
        selectCollapsible.addEventListener('change',cambiarTest);
        selectionInput.addEventListener('change',cambiarTest);
        addLayerInput.addEventListener('change',cambiarTest);
        analysisInput.addEventListener('change',cambiarTest);
        creationInput.addEventListener('change',cambiarTest);
        downloadInput.addEventListener('change',cambiarTest);
        editionInput.addEventListener('change',cambiarTest);
        helpInput.addEventListener('change',cambiarTest);
        styleInput.addEventListener('change',cambiarTest);

        function cambiarTest(){
            let objeto = {}
            objeto.position = selectPosicion.options[selectPosicion.selectedIndex].value;
            let collapsedValor = selectCollapsed.options[selectCollapsed.selectedIndex].value;
            collapsed = collapsedValor != "" ? objeto.collapsed = (collapsedValor == "true" || collapsedValor == true) : "true";
            let collapsibleValor = selectCollapsible.options[selectCollapsible.selectedIndex].value;
            collapsible = collapsibleValor != "" ? objeto.collapsible = (collapsibleValor == "true" || collapsibleValor == true) : "true";

            let selectionValor = selectionInput.options[selectionInput.selectedIndex].value;
            if (selectionValor) {
                objeto.selection = selectionValor === "true" ? true : false;
            }
            let addLayerValor = addLayerInput.options[addLayerInput.selectedIndex].value;
            if (addLayerValor) {
                objeto.addlayer = addLayerValor === "true" ? true : false;
            }
            let analysisValor = analysisInput.options[analysisInput.selectedIndex].value;
            if (analysisValor) {
                objeto.analysis = analysisValor === "true" ? true : false;
            }
            let creationValor = creationInput.options[creationInput.selectedIndex].value;
            if (creationValor) {
                objeto.creation = creationValor === "true" ? true : false;
            }
            let downloadValor = downloadInput.options[downloadInput.selectedIndex].value;
            if (downloadValor) {
                objeto.download = downloadValor === "true" ? true : false;
            }
            let editionValor = editionInput.options[editionInput.selectedIndex].value;
            if (editionValor) {
                objeto.edition = editionValor === "true" ? true : false;
            }
            let helpValor = helpInput.options[helpInput.selectedIndex].value;
            if (helpValor) {
                objeto.help = helpValor === "true" ? true : false;
            }
            let styleValor = styleInput.options[styleInput.selectedIndex].value;
            if (styleValor) {
                objeto.style = styleValor === "true" ? true : false;
            }
            
            map.removePlugins(mp);
            crearPlugin(objeto);
        }

        function crearPlugin(propiedades){
            mp = new IDEE.plugin.VectorsManagement(propiedades);
            map.addPlugin(mp);
        }
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
