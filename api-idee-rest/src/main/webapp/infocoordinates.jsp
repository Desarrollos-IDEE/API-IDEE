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
    <%
      Map<String, String[]> parameterMap = request.getParameterMap();
      PluginsManager.init (getServletContext());
      String[] cssfiles = PluginsManager.getCSSFiles(parameterMap);
      for (int i = 0; i < cssfiles.length; i++) {
         String cssfile = cssfiles[i];
        %>
        <link type="text/css" rel="stylesheet" href="plugins/<%=cssfile%>" />
        <%
    } %>
</head>

<body>
    <div class="m-api-idee-test-form-frame">
        <div class="m-test-form">
            <div>
                <label for="selectPosicion" title="Posición del plugin en el mapa (left, right)">Posición "position"</label>
                <select name="position" id="selectPosicion">
                    <option value="" selected="selected"></option>
                    <option value="left">Izquierda</option>
                    <option value="right">Derecha</option>
                </select>
            </div>
            <div>
                <label for="selectCollapsed" title="Indica si el panel del plugin aparece colapsado al cargarse">Colapsado "collapsed"</label>
                <select name="collapsed" id="selectCollapsed">
                    <option value="" selected="selected"></option>
                    <option value="true">true</option>
                    <option value="false">false</option>
                </select>
            </div>
            <div>
                <label for="inputOrder"
                    title="Define en que posición del panel debe aparecer en el conjunto de controles o plugins">Orden
                    entre controles / plugins "order"</label>
                <input type="number" name="order" id="inputOrder" list="orderSug" value="-1">
            </div>
            <div>
                <label for="inputTooltip" title="Texto que aparece al pasar el ratón sobre el botón del plugin.">Título de la herramienta "tooltip"</label>
                <input type="text" name="tooltip" id="inputTooltip" list="tooltipSug">
                <datalist id="tooltipSug">
                    <option value="Información Coordenadas"></option>
                </datalist>
            </div>
            <div>
                <label for="inputHelpUrl" title="URL de la página de ayuda del plugin al consultar información en el selector de proyección. Por defecto: https://www.ign.es/">Ayuda SRC a consultar "helpUrl"</label>
                <input type="text" name="helpUrl" id="inputHelpUrl" list="helpUrlSug" value="https://www.ign.es/">
                <datalist id="helpUrlSug">
                    <option value="https://www.ign.es/"></option>
                </datalist>
            </div>
            <div>
                <label for="inputDecimalGEOcoord" title="Número de decimales para las coordenadas geográficas (0-10). Por defecto: 4">Decimales GEO "decimalGEOcoord"</label>
                <input type="number" id="inputDecimalGEOcoord" value="4" min="0" max="10">
            </div>
            <div>
                <label for="inputDecimalUTMcoord" title="Número de decimales para las coordenadas UTM (0-5). Por defecto: 2">Decimales UTM "decimalUTMcoord"</label>
                <input type="number" id="inputDecimalUTMcoord" value="2" min="0" max="5">
            </div>
            <div>
                <label for="selectOutputDownloadFormat" title="Formato del fichero de descarga de coordenadas (txt, csv). Por defecto: txt">Formato "outputDownloadFormat"</label>
                <select name="outputDownloadFormat" id="selectOutputDownloadFormat">
                    <option value="txt" selected>txt</option>
                    <option value="csv">csv</option>
                </select>
            </div>
            <div>
                <label for="inputEpsgResults" title="Códigos EPSG separados por comas para mostrar simultáneamente. Si es nulo se utiliza por defecto el EPSG del mapa y se muestra el selector CRS. Por defecto nulo">Resultados multi-EPSG "epsgResults"</label>
                <input type="text" name="epsgResults" id="inputEpsgResults" list="epsgResultsSug">
                <datalist id="epsgResultsSug">
                    <option value="25831,4326,4258,3857"></option>
                </datalist>
            </div>
        </div>
        <div class="m-test-buttons">
            <button name="eliminar" class="m-test-button" id="botonEliminar">Eliminar Plugin</button>
        </div>
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

        let mp = null;

        const selectPosicion = document.getElementById('selectPosicion');
        const selectCollapsed = document.getElementById('selectCollapsed');
        const inputOrder = document.getElementById('inputOrder');
        const inputTooltip = document.getElementById('inputTooltip');
        const inputHelpUrl = document.getElementById('inputHelpUrl');
        const inputDecimalGEOcoord = document.getElementById('inputDecimalGEOcoord');
        const inputDecimalUTMcoord = document.getElementById('inputDecimalUTMcoord');
        const selectOutputDownloadFormat = document.getElementById('selectOutputDownloadFormat');
        const inputEpsgResults = document.getElementById('inputEpsgResults');
        const botonEliminar = document.getElementById('botonEliminar');

        [
            selectPosicion,
            selectCollapsed,
            inputOrder,
            inputTooltip,
            inputHelpUrl,
            inputDecimalGEOcoord,
            inputDecimalUTMcoord,
            selectOutputDownloadFormat,
            inputEpsgResults,
        ].forEach((ctrl) => ctrl.addEventListener('change', cambiarTest));

        botonEliminar.addEventListener('click', function () {
            map.removePlugins(mp);
        });

        function cambiarTest() {
            const objeto = {};
            objeto.position = selectPosicion.options[selectPosicion.selectedIndex].value;
            objeto.collapsed = selectCollapsed.options[selectCollapsed.selectedIndex].value === '' || selectCollapsed.options[selectCollapsed.selectedIndex].value === 'true';
            objeto.order = Number(inputOrder.value);
            objeto.tooltip = inputTooltip.value;
            objeto.helpUrl = inputHelpUrl.value;
            objeto.decimalGEOcoord = Number(inputDecimalGEOcoord.value);
            objeto.decimalUTMcoord = Number(inputDecimalUTMcoord.value);
            objeto.outputDownloadFormat = selectOutputDownloadFormat.options[selectOutputDownloadFormat.selectedIndex].value;
            objeto.epsgResults = inputEpsgResults.value;

            if (mp !== null) map.removePlugins(mp);
            crearPlugin(objeto);
        }

        function crearPlugin(propiedades) {
            mp = new IDEE.plugin.Infocoordinates(propiedades);
            map.addPlugin(mp);
        }

        cambiarTest();
        const mp2 = new IDEE.plugin.ShareMap({
            baseUrl: window.location.href.substring(0, window.location.href.indexOf('api-idee')) + "api-idee/",
            position: "right",
        });
        map.addPlugin(mp2);
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