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
    <link type="text/css" rel="stylesheet" href="assets/css/apiidee.ol.min.css" />
    <link href="plugins/attributions/attributions.ol.min.css" rel="stylesheet" />
    <link href="plugins/sharemap/sharemap.ol.min.css" rel="stylesheet" />
    <style type="text/css">
        html,
        body {
            margin: 0;
            padding: 0;
            height: 100%;
            overflow: auto;
        }

        #divModo {
            display: contents;
        }

        #divModo.oculto {
            display: none;
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
            <option value="TR">Arriba Derecha (TR)</option>
            <option value="BR">Abajo Derecha (BR)</option>
            <option value="BL" selected="selected">Abajo Izquierda (BL)</option>
        </select>
        <label for="inputTooltip">Parámetro tooltip</label>
        <input type="text" name="tooltip" id="inputTooltip" list="tooltipSug" value="Reconocimientos">
        <datalist id="tooltipSug">
            <option value="Reconocimientos"></option>
        </datalist>
        <label for="selectMode">Selector de Modo</label>
        <select name="mode" id="selectMode">
            <option value="1" selected="selected">1</option>
            <option value="2">2</option>
        </select>
        <label for="inputURLAttribute">Parámetro urlAttribute</label>
        <input type="text" name="urlAttribute" id="inputURLAttribute" list="urlattributeSug" value="Gobierno de España">
        <datalist id="urlattributeSug">
            <option value="Gobierno de España"></option>
        </datalist>
        <label for="inputScale">Parámetro scale</label>
        <input type="text" name="scale" id="inputScale" list="scaleSug" value="10000">
        <datalist id="scaleSug">
            <option value="10000"></option>
        </datalist>
        <label for="inputDefaultURL">Parámetro defaultURL</label>
        <input type="text" name="defaultURL" id="inputDefaultURL" list="defaultURLSug" value="https://www.ign.es/">
        <datalist id="defaultURLSug">
            <option value="https://www.ign.es/"></option>
        </datalist>
        <label for="inputDefaultAttribution">Parámetro defaultAttribution</label>
        <input type="text" name="defaultAttribution" id="inputDefaultAttribution" list="defaultAttributionSug" value="Instituto Geográfico Nacional">
        <datalist id="defaultAttributionSug">
            <option value="Instituto Geográfico Nacional"></option>
        </datalist>
        <label for="inputMinWidth">Parámetro minWidth</label>
        <input type="number" id="inputMinWidth" value="100">
        <label for="inputMaxWidth">Parámetro maxWidth</label>
        <input type="number" id="inputMaxWidth" value="200">
        <div id="divModo">
            <label for="inputUrl">Parámetro url</label>
            <input type="text" name="url" id="inputUrl" list="urlSug" value="${api-idee.static_resources.url}/Datos/reconocimientos/WMTS_PNOA_20170220/atribucionPNOA_Url.kml">
            <datalist id="urlSug">
                <option value="${api-idee.static_resources.url}/Datos/reconocimientos/WMTS_PNOA_20170220/atribucionPNOA_Url.kml"></option>
            </datalist>
            <label for="selectType">Selector de tipo</label>
            <select name="type" id="selectType">
                <option value="kml" selected="selected">kml</option>
                <option value="geojson">geojson</option>
            </select>
            <label for="inputLayerName">Parámetro layerName</label>
            <input type="text" name="layerName" id="inputLayerName" list="layerNameSug" value="attributions">
            <datalist id="layerNameSug">
                <option value="attributions"></option>
            </datalist>
            <label for="inputAttributionParam">Parámetro attributionParam</label>
            <input type="text" name="attributionParam" id="inputAttributionParam" list="attributionParamSug" value="atribucion">
            <datalist id="attributionParamSug">
                <option value="atribucion"></option>
            </datalist>
            <label for="inputUrlParam">Parámetro urlParam</label>
            <input type="text" name="urlParam" id="inputUrlParam" list="urlParamSug" value="url">
            <datalist id="urlParamSug">
                <option value="url"></option>
            </datalist>
        </div>
        <input type="button" value="Eliminar Plugin" name="eliminar" id="botonEliminar">
    </div>
    <div id="mapjs" class="m-container"></div>
    <script type="text/javascript" src="vendor/browser-polyfill.js"></script>
    <script type="text/javascript" src="js/apiidee.ol.min.js"></script>
    <script type="text/javascript" src="js/configuration.js"></script>
    <script type="text/javascript" src="plugins/attributions/attributions.ol.min.js"></script>
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
            zoom: 5,
            maxZoom: 20,
            minZoom: 4,
            center: [-467062.8225, 4783459.6216],
        });

        let mp;
        let position, mode, tooltip, urlAttribute, scale, defaultURL, defaultAttribution, minWidth, maxWidth,
            url, type, layerName, attributionParam, urlParam;
        crearPlugin({
            mode: 1,
            scale: 10000,
            tooltip: "Reconocimientos"
        });
        const divModo = document.getElementById("divModo");
        const selectPosicion = document.getElementById("selectPosicion");
        const selectMode = document.getElementById("selectMode");
        const inputTooltip = document.getElementById("inputTooltip");
        const inputScale = document.getElementById("inputScale");
        const inputURLAttribute = document.getElementById("inputURLAttribute");
        const inputDefaultURL = document.getElementById("inputDefaultURL");
        const inputDefaultAttribution = document.getElementById("inputDefaultAttribution");
        const inputUrl = document.getElementById("inputUrl");
        const selectType = document.getElementById("selectType");
        const inputLayerName = document.getElementById("inputLayerName");
        const inputAttributionParam = document.getElementById("inputAttributionParam");
        const inputUrlParam = document.getElementById("inputUrlParam");
        const inputMinWidth = document.getElementById("inputMinWidth");
        const inputMaxWidth = document.getElementById("inputMaxWidth");
        
        selectPosicion.addEventListener('change', cambiarTest);
        selectMode.addEventListener('change', function() {
            divModo.classList.toggle("oculto")
        });
        inputTooltip.addEventListener('change', cambiarTest);
        inputScale.addEventListener('change', cambiarTest);
        inputURLAttribute.addEventListener('change', cambiarTest);
        inputDefaultURL.addEventListener('change', cambiarTest);
        inputDefaultAttribution.addEventListener('change', cambiarTest);
        inputUrl.addEventListener('change', cambiarTest);
        selectType.addEventListener('change', cambiarTest);
        inputLayerName.addEventListener('change', cambiarTest);
        inputAttributionParam.addEventListener('change', cambiarTest);
        inputUrlParam.addEventListener('change', cambiarTest);
        inputMinWidth.addEventListener('change', cambiarTest);
        inputMaxWidth.addEventListener('change', cambiarTest);

        function cambiarTest() {
            let objeto = {};
            objeto.position = selectPosicion.options[selectPosicion.selectedIndex].value;
            mode = selectMode.options[selectMode.selectedIndex].value;
            objeto.mode = parseInt(mode);
            tooltip = inputTooltip.value != "" ? objeto.tooltip = inputTooltip.value : "";
            (inputMinWidth.value != "") ? objeto.minWidth = inputMinWidth.value : 100;
            (inputMaxWidth.value != "") ? objeto.maxWidth = inputMaxWidth.value : 200;
            scale = inputScale.value != "" ? objeto.scale = inputScale.value : "";
            urlAttribute = inputURLAttribute.value != "" ? objeto.urlAttribute = inputURLAttribute.value : "";
            defaultURL = inputDefaultURL.value != "" ? objeto.defaultURL = inputDefaultURL.value : "";
            defaultAttribution = inputDefaultAttribution.value != "" ? objeto.defaultAttribution = inputDefaultAttribution.value : "";
            if (mode == 1) {
                url = inputUrl.value != "" ? objeto.url = inputUrl.value : "";
                type = selectType.options[selectType.selectedIndex].value;
                objeto.type = type;
                layerName = inputLayerName.value != "" ? objeto.layerName = inputLayerName.value : "";
                attributionParam = inputAttributionParam.value != "" ? objeto.attributionParam = inputAttributionParam.value : "";
                urlParam = inputUrlParam.value != "" ? objeto.urlParam = inputUrlParam.value : "";
            }
            map.removePlugins(mp);
            crearPlugin(objeto);
        }

        function crearPlugin(propiedades) {
            for (let i = 0, ilen = map.getLayers().length - 1; i < ilen; i += 1) {
                if (map.getLayers()[i].name.includes('attributions')) {
                    map.removeLayers(map.getLayers()[i]);
                }
            }
            mp = new IDEE.plugin.Attributions(propiedades);

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
