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
    <link href="plugins/mapfooter/mapfooter.ol.min.css" rel="stylesheet" />
    <link href="plugins/sharemap/sharemap.ol.min.css" rel="stylesheet" />
    <style type="text/css">
        html,
        body {
            margin: 0;
            padding: 0;
            height: 100%;
            overflow: auto;
        }
        .container {
            width: 100% !important;
            margin: 0px !important;
            padding: 0px !important;
        }
        /* Aislar el div de parámetros del CSS externo del plugin */
        #params-container,
        #params-container * {
            all: revert !important;
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
    <div id="params-container">
        <label for="selectOpen">Estado del pie de página (abierto o cerrado)</label>
        <select id="selectOpen">
            <option value="true" selected="selected">Abierto</option>
            <option value="false">Cerrado</option>
        </select>
        <label for="areaHtmlCode">Código HTML del pie de página</label>
        <textarea id="areaHtmlCode" rows="5" cols="20">
            <div class="col-12 col-m-12 displayInlineBlock txtCenter fontSize09em">
                <p class="marginBottom0">© Organismo Autónomo Centro Nacional de Información Geográfica (CNIG)</p>
                <div id="dirCnigPC" class="row paddingBottom1por">
                    <div class="col-12">
                    Calle General Ibáñez de Ibero, 3. 28003 - Madrid - España.   
                    </div>
                    <div class="col-12">
                        NIF: ES Q2817024I  - NIPO: 798-20-071-1 - DOI: 10.7419/162.09.2020
                    </div>
                </div>
                <div id="dirCnigMobile" class="row paddingBottom2por" style="display: none;">
                    <div class="col-12">
                        Calle General Ibáñez de Ibero, 3. 28003 - Madrid - España. 
                    </div>
                    <div class="col-12">
                        NIF: ES Q2817024I 
                    </div>
                    <div class="col-12">
                        NIPO: 798-20-071-1
                    </div>
                    <div class="col-12">
                        DOI: 10.7419/162.09.2020
                    </div>
                </div>
              </div>
        </textarea>
        <textarea id="areaCssList" rows="5" cols="20">
            https://centrodedescargas.cnig.es/CentroDescargas/css/estilos-css-cnig-2024.css
        </textarea>
        <input type="button" value="Eliminar Plugin" name="eliminar" id="botonEliminar">
    </div>
    <div id="mapjs" class="m-container"></div>
    <script type="text/javascript" src="vendor/browser-polyfill.js"></script>
    <script type="text/javascript" src="js/apiidee.ol.min.js"></script>
    <script type="text/javascript" src="js/configuration.js"></script>
    <script type="text/javascript" src="plugins/mapfooter/mapfooter.ol.min.js"></script>
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
            controls: ['scaleline']
        });

        let mp;
        const selectOpen = document.getElementById("selectOpen");
        const areaHtmlCode = document.getElementById("areaHtmlCode");
        const areaCssList = document.getElementById("areaCssList");
        selectOpen.addEventListener('change', cambiarTest);
        areaHtmlCode.addEventListener('change', cambiarTest);
        areaCssList.addEventListener('change', cambiarTest);
        
        crearPlugin(getOptions());

        function cambiarTest() {
            const objeto = getOptions();
            map.removePlugins(mp);
            crearPlugin(objeto);
        }

        function crearPlugin(propiedades) {
            mp = new IDEE.plugin.Mapfooter(propiedades);
            map.addPlugin(mp);
        }

        function getOptions() {
            let objeto = {};
            objeto.open = selectOpen.options[selectOpen.selectedIndex].value === "true";
            objeto.htmlCode = areaHtmlCode.value;;
            objeto.cssList = areaCssList.value;
            return objeto;
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

    function gtag() {
        dataLayer.push(arguments);
    }
    gtag('js', new Date());
    gtag('config', 'G-19NTRSBP21');
</script>

</html>