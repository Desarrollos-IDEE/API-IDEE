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
    <link href="plugins/sharemap/sharemap.ol.min.css" rel="stylesheet" />
    <link href="plugins/layerswitcher/layerswitcher.ol.min.css" rel="stylesheet" />
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
          <option value="TR" selected="selected">Arriba Derecha (TR)</option>
            <option value="TL">Arriba Izquierda (TL)</option>
            <option value="BR">Abajo Derecha (BR)</option>
            <option value="BL">Abajo Izquierda (BL)</option>
        </select>
        <label for="inputTooltip">Parámetro tooltip</label>
        <input type="text" id="inputTooltip" value="¡Copiado!" />
        <label for="selectURL">Parámetro baseUrl</label>
        <input type="text" id="selectURL" list="urlSug" value="https://componentes-desarrollo.idee.es/api-idee/"/>
        <datalist id="urlSug">
            <option value="https://componentes-desarrollo.idee.es/api-idee/"></option>
            <option value="https://componentes.ign.es/api-idee/"></option>
        </datalist>
        <label for="selectMinimize">Selector minimize</label>
        <select name="selectMinimize" id="selectMinimize">
            <option value=true>true</option>
            <option value=false selected>false</option>
        </select>
        <label for="inputTitle">Parámetro title</label>
        <input type="text" id="inputTitle" value="Compartir Mapa" />
        <label for="inputBtn">Parámetro btn</label>
        <input type="text" id="inputBtn" value="OK" />
        <label for="inputCopyBtn">Parámetro copyBtn</label>
        <input type="text" id="inputCopyBtn" value="Copiar" />
        <label for="inputText">Parámetro text</label>
        <input type="text" id="inputText" value="HTML embebido" />
        <label for="inputCopyBtnHtml">Parámetro copyBtnHtml</label>
        <input type="text" id="inputCopyBtnHtml" value="Copiar" />
        <label for="selectOverwriteStyles">Selector overwriteStyles</label>
        <select name="selectOverwriteStyles" id="selectOverwriteStyles">
            <option value=true>true</option>
            <option value=false selected>false</option>
        </select>
        <label for="inputStylesPC">Styles: Color primario</label>
        <input type="color" id="inputStylesPC" value="#71a7d3"/>
        <label for="inputStylesSC">Styles: Color secundario</label>
        <input type="color" id="inputStylesSC" value="#ffffff"/>       
        <label for="selectURLAPI">Parámetro URL API</label>
        <select name="selectURLAPI" id="selectURLAPI">
            <option value="true">true</option>
            <option value="false" selected>false</option>
        </select>
        <label for="selectShareLayer">Selector sharelayer</label>
        <select name="selectShareLayer" id="selectShareLayer">
            <option value=true>true</option>
            <option value=false selected>false</option>
        </select>
        <label for="inputFilterLayers">Parámetro filterLayers (separado por ,)</label>
        <input type="text" name="filterLayers" id="inputFilterLayers" value="AU.AdministrativeUnit"/>
        <input type="button" value="Eliminar Plugin" name="eliminar" id="botonEliminar">

    </div>
    <div id="mapjs" class="m-container"></div>
    <script type="text/javascript" src="vendor/browser-polyfill.js"></script>
    <script type="text/javascript" src="js/apiidee.ol.min.js"></script>
    <script type="text/javascript" src="js/configuration.js"></script>
    <script type="text/javascript" src="plugins/sharemap/sharemap.ol.min.js"></script>
    <script type="text/javascript" src="plugins/layerswitcher/layerswitcher.ol.min.js"></script>
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
            zoom: 3,
        });

        function crearPlugin(propiedades) {
            mp = new IDEE.plugin.ShareMap(propiedades);
            map.addPlugin(mp);
        }

        const layerinicial = new IDEE.layer.WMS({
            url: 'http://www.ign.es/wms-inspire/unidades-administrativas?',
            name: 'AU.AdministrativeBoundary',
            legend: 'Limite administrativo',
        }, {});

        const layerUA = new IDEE.layer.WMS({
            url: 'http://www.ign.es/wms-inspire/unidades-administrativas?',
            name: 'AU.AdministrativeUnit',
            legend: 'Unidad administrativa'
        }, {});

        const ocupacionSuelo = new IDEE.layer.WMTS({
          url: 'https://www.ign.es/wmts/pnoa-ma?',
          name: 'OI.OrthoimageCoverage',
          legend: 'Imagen',
          matrixSet: 'GoogleMapsCompatible',
          transparent: false,
          displayInLayerSwitcher: false,
          queryable: false,
          visible: true,
          format: 'image/jpeg',
        });

        map.addLayers([ocupacionSuelo, layerinicial, layerUA]);

        let mp = undefined;
        crearPlugin({ 
        	position: "TR",
	        tooltip: "¡Copiado!",
	        minimize: false,
	        title: "Compartir Mapa",
	        btn: "OK",
	        copyBtn: "Copiar",
	        text: "HTML embebido",
	        copyBtnHtml: "Copiar",
	        shareLayer: false,
	        filterLayers: ['AU.AdministrativeUnit'],
	        urlAPI: false,
        });

        const selectURL = document.getElementById("selectURL");
        const selectURLAPI = document.getElementById("selectURLAPI");
        const selectPosicion = document.getElementById("selectPosicion");
        const inputTooltip = document.getElementById("inputTooltip");
        const selectMinimize = document.getElementById("selectMinimize");
        const inputTitle = document.getElementById("inputTitle");
        const inputBtn = document.getElementById("inputBtn");
        const inputCopyBtn = document.getElementById("inputCopyBtn");
        const inputText = document.getElementById("inputText");
        const inputCopyBtnHtml = document.getElementById("inputCopyBtnHtml");
        const selectShareLayer = document.getElementById("selectShareLayer");
        const selectOverwriteStyles = document.getElementById("selectOverwriteStyles");
        const inputStylesPC = document.getElementById("inputStylesPC");          
        const inputStylesSC = document.getElementById("inputStylesSC");
        const inputFilterLayers = document.getElementById("inputFilterLayers");          
        

        selectURL.addEventListener('change', cambiarTest);
        selectPosicion.addEventListener('change', cambiarTest);
        selectURLAPI.addEventListener('change', cambiarTest);
        inputTooltip.addEventListener('change', cambiarTest);
        selectMinimize.addEventListener('change', cambiarTest);
        inputTitle.addEventListener('change', cambiarTest);
        inputBtn.addEventListener('change', cambiarTest);
        inputCopyBtn.addEventListener('change', cambiarTest);
        inputText.addEventListener('change', cambiarTest);
        inputCopyBtnHtml.addEventListener('change', cambiarTest);
        selectShareLayer.addEventListener('change', cambiarTest);
        inputStylesPC.addEventListener('change', cambiarTest);
        inputStylesSC.addEventListener('change', cambiarTest);
        inputFilterLayers.addEventListener('change', cambiarTest);
        selectOverwriteStyles.addEventListener('change', cambiarTest);

        function cambiarTest() {
            let objeto = {};
            let styles = {};
            (selectURL.value != "") ? objeto.baseUrl = selectURL.value : objeto.baseUrl = window.location.href.substring(0, window.location.href.indexOf('api-idee')) + "api-idee/";
            objeto.position = selectPosicion.options[selectPosicion.selectedIndex].value;
            (inputTooltip.value != "¡Copiado!") ? objeto.tooltip = inputTooltip.value : "¡Copiado!";
            objeto.minimize = (selectMinimize.options[selectMinimize.selectedIndex].value === 'true');
            (inputTitle.value != "") ? objeto.title = inputTitle.value : "Compartir Mapa";
            (inputBtn.value != "") ? objeto.btn = inputBtn.value : "OK";
            (inputCopyBtn.value != "") ? objeto.copyBtn = inputCopyBtn.value : "Copiar";
            (inputText.value != "") ? objeto.text = inputText.value : "HTML embebido";
            (inputCopyBtnHtml.value != "")? objeto.copyBtnHtml = inputCopyBtnHtml.value : "Copiar";
            objeto.shareLayer = (selectShareLayer.options[selectShareLayer.selectedIndex].value === 'true');
            (inputFilterLayers.value != "") ? objeto.filterLayers = inputFilterLayers.value.split(',') : ['AU.AdministrativeUnit'];
            objeto.overwriteStyles = (selectOverwriteStyles.options[selectOverwriteStyles.selectedIndex].value === 'true');
			(inputStylesPC.value != "") ? styles.primaryColor = inputStylesPC.value : "#71a7d3";
            (inputStylesSC.value != "") ? styles.secondaryColor = inputStylesSC.value : "#ffffff";
            objeto.styles = styles;
               
            objeto.urlAPI = selectURLAPI.options[selectURLAPI.selectedIndex].value;
            map.removePlugins(mp);
            crearPlugin(objeto);
        }

        const botonEliminar = document.getElementById("botonEliminar");
        botonEliminar.addEventListener("click", function() {
            map.removePlugins(mp);
        });

        const layerswitcher = new IDEE.plugin.Layerswitcher({});
        map.addPlugin(layerswitcher);
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
