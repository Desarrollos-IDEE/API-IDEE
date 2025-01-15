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
    <link href="plugins/lyrcompare/lyrcompare.ol.min.css" rel="stylesheet" />
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
        <label for="inputLayer">Parámetro layer</label>
        <input type="text" name="layer" id="inputLayer" value="WMS*SIGPAC*https://www.ign.es/wms/pnoa-historico*SIGPAC,WMS*OLISTAT*https://www.ign.es/wms/pnoa-historico*OLISTAT,WMS*Nacional_1981-1986*https://www.ign.es/wms/pnoa-historico*Nacional_1981-1986,WMS*Interministerial_1973-1986*https://www.ign.es/wms/pnoa-historico*Interministerial_1973-1986">
        <label for="selectStaticDivision">Selector de staticDivision</label>
        <select name="staticDivision" id="selectStaticDivision">
            <option value="0">0 - Dinámico</option>
            <option value="1">1 - Estático</option>
            <option value="2">2 - Mixto</option>
        </select>
        <label for="inputOpacityVal">Parámetro opacityVal</label>
        <input type="number" min="0" max="100" step="1" name="opacityVal" id="inputOpacityVal" list="opacityValSug">
        <datalist id="opacityValSug"><option value="50"></option></datalist>
        <label for="selectComparisonMode">Selector de comparisonMode</label>
        <select name="comparisonMode" id="selectComparisonMode">
            <option value="0">0 - Modo de comparación apagado</option>
            <option value="1">1 - Modo de comparación cortina vertical</option>
            <option value="2">2 - Modo de comparación de cortina horizontal</option>
            <option value="3">3 - Modo de comparación múltiple de cuatro capas</option>
        </select>
        <label for="inputDefaultLyrA">Parámetro defaultLyrA</label>
        <input type="number" value="0" min="0" name="defaultLyrA" id="inputDefaultLyrA">
        <label for="inputDefaultLyrB">Parámetro defaultLyrB</label>
        <input type="number" value="1" min="0" name="defaultLyrB" id="inputDefaultLyrB">
        <label for="inputDefaultLyrC">Parámetro defaultLyrC</label>
        <input type="number" value="2" min="0" name="defaultLyrC" id="inputDefaultLyrC">
        <label for="inputDefaultLyrD">Parámetro defaultLyrD</label>
        <input type="number" value="3" min="0" name="defaultLyrD" id="inputDefaultLyrD">
        <input type="button" value="Eliminar Plugin" name="eliminar" id="botonEliminar">
    </div>
    <div id="mapjs" class="m-container"></div>
    <script type="text/javascript" src="vendor/browser-polyfill.js"></script>
    <script type="text/javascript" src="js/apiign.ol.min.js"></script>
    <script type="text/javascript" src="js/configuration.js"></script>
    <script type="text/javascript" src="plugins/lyrcompare/lyrcompare.ol.min.js"></script>
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
        let mp,collapsed,collapsible,
        layersPlugin = [
        	'WMS*SIGPAC*https://www.ign.es/wms/pnoa-historico*SIGPAC',
            'WMS*OLISTAT*https://www.ign.es/wms/pnoa-historico*OLISTAT',
            'WMS*Nacional_1981-1986*https://www.ign.es/wms/pnoa-historico*Nacional_1981-1986',
            'WMS*Interministerial_1973-1986*https://www.ign.es/wms/pnoa-historico*Interministerial_1973-1986'],
            staticDivision, opacityVal, comparisonMode, defaultLyrA, defaultLyrB, defaultLyrC, defaultLyrD,interface;
        crearPlugin({
            layers: layersPlugin
        });

        const selectPosicion = document.getElementById("selectPosicion");
        const selectCollapsed = document.getElementById("selectCollapsed");
        const selectCollapsible = document.getElementById("selectCollapsible");
        const inputLayer = document.getElementById("inputLayer");
        const selectStaticDivision = document.getElementById("selectStaticDivision");
        const inputOpacityVal = document.getElementById("inputOpacityVal");
        const selectComparisonMode = document.getElementById("selectComparisonMode");
        const inputDefaultLyrA = document.getElementById("inputDefaultLyrA");
        const inputDefaultLyrB = document.getElementById("inputDefaultLyrB");
        const inputDefaultLyrC = document.getElementById("inputDefaultLyrC");
        const inputDefaultLyrD = document.getElementById("inputDefaultLyrD");

        selectPosicion.addEventListener('change', cambiarTest);
        selectCollapsed.addEventListener('change', cambiarTest);
        selectCollapsible.addEventListener('change', cambiarTest);
        inputLayer.addEventListener('change', cambiarTest);
        selectStaticDivision.addEventListener('change', cambiarTest);
        inputOpacityVal.addEventListener('change', cambiarTest);
        selectComparisonMode.addEventListener('change', cambiarTest);
        inputDefaultLyrA.addEventListener('change', cambiarTest);
        inputDefaultLyrB.addEventListener('change', cambiarTest);
        inputDefaultLyrC.addEventListener('change', cambiarTest);
        inputDefaultLyrD.addEventListener('change', cambiarTest);

        function cambiarTest() {
            let objeto = {}
            objeto.position = selectPosicion.options[selectPosicion.selectedIndex].value;
            let collapsedValor = selectCollapsed.options[selectCollapsed.selectedIndex].value;
            collapsed = collapsedValor != "" ? objeto.collapsed = (collapsedValor == "true") : "";
            let collapsibleValor = selectCollapsible.options[selectCollapsible.selectedIndex].value;
            collapsible = collapsibleValor != "" ? objeto.collapsible = (collapsibleValor == "true") : "";
            objeto.layers = (inputLayer.value !== "" && inputLayer.value.includes("*")) ? inputLayer.value.split(',') : ['WMS*SIGPAC*https://www.ign.es/wms/pnoa-historico*SIGPAC',
                'WMS*OLISTAT*https://www.ign.es/wms/pnoa-historico*OLISTAT',
                'WMS*Nacional_1981-1986*https://www.ign.es/wms/pnoa-historico*Nacional_1981-1986',
                'WMS*Interministerial_1973-1986*https://www.ign.es/wms/pnoa-historico*Interministerial_1973-1986'];
            objeto.staticDivision = selectStaticDivision.options[selectStaticDivision.selectedIndex].value;
            opacityVal = inputOpacityVal.value != "" ? objeto.opacityVal = inputOpacityVal.value : "";
            objeto.comparisonMode = selectComparisonMode.options[selectComparisonMode.selectedIndex].value;
            defaultLyrA = inputDefaultLyrA.value != "" ? objeto.defaultLyrA = inputDefaultLyrA.value : "";
            defaultLyrB = inputDefaultLyrB.value != "" ? objeto.defaultLyrB = inputDefaultLyrB.value : "";
            defaultLyrC = inputDefaultLyrC.value != "" ? objeto.defaultLyrC = inputDefaultLyrC.value : "";
            defaultLyrD = inputDefaultLyrD.value != "" ? objeto.defaultLyrD = inputDefaultLyrD.value : "";

            map.removePlugins(mp);
            crearPlugin(objeto);
        }

        function crearPlugin(propiedades){
            mp = new M.plugin.LyrCompare(propiedades);
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
