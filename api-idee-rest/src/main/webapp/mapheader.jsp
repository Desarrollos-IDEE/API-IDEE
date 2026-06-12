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
    <link href="plugins/mapheader/mapheader.ol.min.css" rel="stylesheet" />
    <link href="plugins/sharemap/sharemap.ol.min.css" rel="stylesheet" />
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
    <div id="mapjs" class="m-container"></div>
    <div>
        <label for="selectOpen">Estado de la cabecera (abierta o cerrada)</label>
        <select id="selectOpen">
            <option value="true" selected="selected">Abierta</option>
            <option value="false">Cerrada</option>
        </select>
        <label for="areaHtmlCode">Código HTML de la cabecera</label>
        <textarea id="areaHtmlCode" rows="5" cols="20">
            <header>
                <div id="header-pc">
                   <div class="col-12">
                      <div class="col-3 marginTop20px">
                         <a href="https://www.ign.es" target="_blank" title="Instituto Geográfico Nacional y O. A. Centro Nacional de Información Geográfica">
                         <img src="https://centrodedescargas.cnig.es/CentroDescargas/imgCdD/escudoInstitucional.png" alt="Instituto Geográfico Nacional y O. A. Centro Nacional de Información Geográfica" class="img-fluid imgMinisterio "></a>
                      </div>
                      <div class="col-6 col-m-12 marginTop20px">
                         <div class="col-12 txtCenter"><a href="https://centrodedescargas.cnig.es/CentroDescargas/home" class="txtSupCdDCabenlace" title="Centro de Descargas">Centro de Descargas</a></div>
                         <div class="marginTop10px col-12 colorVerdeClaro   txtCenter paddingBottom10px ">Instituto Geográfico Nacional</div>
                         <div class="col-12 colorVerdeClaro   txtCenter  ">Organismo Autónomo Centro Nacional de Información Geográfica</div>
                      </div>
                   </div>
                </div>
                </div>  
             </header>
        </textarea>
        <textarea id="areaCssList" rows="5" cols="20">
            https://centrodedescargas.cnig.es/CentroDescargas/css/estilos-css-cnig-2024.css
        </textarea>
        <input type="button" value="Eliminar Plugin" name="eliminar" id="botonEliminar">
    </div>
    <script type="text/javascript" src="vendor/browser-polyfill.js"></script>
    <script type="text/javascript" src="js/apiidee.ol.min.js"></script>
    <script type="text/javascript" src="js/configuration.js"></script>
    <script type="text/javascript" src="plugins/mapheader/mapheader.ol.min.js"></script>
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
            mp = new IDEE.plugin.Mapheader(propiedades);
            map.addPlugin(mp);
        }

        function getOptions() {
            let objeto = {};
            objeto.open = selectOpen.options[selectOpen.selectedIndex].value === "true";
            objeto.htmlCode = areaHtmlCode.value;
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