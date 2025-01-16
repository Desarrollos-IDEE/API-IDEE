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
    <link href="plugins/storymap/storymap.ol.min.css" rel="stylesheet" />
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
            <option value=false selected="selected">false</option>
        </select>
        <label for="selectCollapsible">Selector collapsible</label>
        <select name="collapsibleValue" id="selectCollapsible">
            <option value=true>true</option>
            <option value=false selected="selected">false</option>
        </select>

        <label for="inputTooltip">Parametro tooltip</label>
        <input type="text" id="inputTooltip" value="" />
        <label for="inputContent">Parametro content</label>
        <input type="text" id="inputContent" value="" />
        <label for="inputIndexInContent">Parametro indexInContent</label>
        <input type="text" id="inputIndexInContent" value="" />
        <label for="inputDelay">Parametro delay</label>
        <input type="text" id="inputDelay" value="2000" />
        
        <input type="button" value="Eliminar Plugin" name="eliminar" id="botonEliminar">
    </div>

    <div id="mapjs" class="m-container"></div>
    <script type="text/javascript" src="vendor/browser-polyfill.js"></script>
    <script type="text/javascript" src="js/apiidee.ol.min.js"></script>
    <script type="text/javascript" src="js/configuration.js"></script>
    <script type="text/javascript" src="plugins/storymap/storymap.ol.min.js"></script>
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
		const defaultContent = `{"es": {"head": {"title": "StoryMap"},"cap": [{"title": "Capítulo 0 Un recorrido por el Madrid cervantino.","subtitle": "Subtítulo capítulo 0","steps": [{"html": "<br><h3>Ejemplo Step 1</h3> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <br><br><br><br><br> <br>","js": "console.log('cap0 - step 1'); let impl = map.getImpl().getMapImpl();let view = impl.getView();view.animate({zoom: 16,center: [-412400.86, 4926815.10],duration: 2000,});"},{"html": "<br><h3>Ejemplo Step 2</h3> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <br> <br><br><br><br><br>","js": "console.log('cap0 - step 2'); let impl = map.getImpl().getMapImpl();let view = impl.getView();view.animate({zoom: 16,center: [-412400.86, 4926815.10],duration: 2000,});"}]},{"title": "Capítulo 1.- Vistazo a la ciudad del Siglo XVII","subtitle": "Subtítulo capítulo 2","steps": [{"html": "<br><h3>Ejemplo Step 1</h3> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <br><br><br><br><br><br><br><br>","js": "console.log('cap1 - step 1'); let impl = map.getImpl().getMapImpl();let view = impl.getView();view.animate({zoom: 16,center: [-412400.86, 4926815.10],duration: 2000,});"},{"html": "<br><h3>Ejemplo Step 1</h3> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <br> <br><br><br><br><br><br> <br>","js": "console.log('cap1 - step 2'); let impl = map.getImpl().getMapImpl();let view = impl.getView();view.animate({zoom: 16,center: [-412400.86, 4926815.10],duration: 2000,});"}]}]}}`;
		const defaultIndexInContent = `{"title": "Indice StoryMap","subtitle": "Visualizador de Cervantes y el Madrid del siglo XVII","js": "console.log('HolaMundo')"}`;
        
        M.language.setLang(urlParams.get('language') || 'es');

        let layerUA, layerinicial;
        let map = M.map({
            container: 'mapjs',
        });
       
        let mp, position, collapsed, collapsible, tooltip, 
        	content = JSON.parse(defaultContent), 
        	indexInContent = JSON.parse(defaultIndexInContent), 
        	delay;

        crearPlugin({
        	position: position,
            collapsed: collapsed,
            collapsible: collapsible,
            tooltip: tooltip,
            content: content,
            indexInContent: indexInContent,
            delay: delay,
        });

        const selectPosicion = document.getElementById("selectPosicion");
        const selectCollapsed = document.getElementById("selectCollapsed");
        const selectCollapsible = document.getElementById("selectCollapsible");
        const inputTooltip = document.getElementById("inputTooltip");
        const inputContent = document.getElementById("inputContent");
        const inputIndexInContent = document.getElementById("inputIndexInContent");
        const inputDelay = document.getElementById("inputDelay");

        inputContent.value = defaultContent;
        inputIndexInContent.value = defaultIndexInContent;
        
		selectPosicion.addEventListener('change', cambiarTest);
        selectCollapsed.addEventListener('change', cambiarTest);
        selectCollapsible.addEventListener('change', cambiarTest);
        inputTooltip.addEventListener('change', cambiarTest);
        inputContent.addEventListener('change', cambiarTest);
        inputIndexInContent.addEventListener('change', cambiarTest);
        inputDelay.addEventListener('change', cambiarTest);

        function cambiarTest() {
            let objeto = {};
            objeto.position = selectPosicion.options[selectPosicion.selectedIndex].value;
            objeto.collapsed = (selectCollapsed.options[selectCollapsed.selectedIndex].value == 'true');
            objeto.collapsible = (selectCollapsible.options[selectCollapsible.selectedIndex].value == 'true');
            objeto.tooltip = inputTooltip.value != "" ? inputTooltip.value : '';
            objeto.content = inputContent.value != "" ? JSON.parse(inputContent.value) : defaultContent;
            objeto.indexInContent = inputIndexInContent.value != "" ? JSON.parse(inputIndexInContent.value) : defaultIndexInContent;
            objeto.delay = inputDelay.value != "" ? inputDelay.value : '';
            map.removePlugins(mp);
            crearPlugin(objeto);
        }

        function crearPlugin(propiedades) {
            mp = new M.plugin.StoryMap(propiedades);
            map.addPlugin(mp);
        }
        let mp2 = new M.plugin.ShareMap({
            baseUrl: window.location.href.substring(0, window.location.href.indexOf('api-idee')) + "api-idee/",
            position: "TL",
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
