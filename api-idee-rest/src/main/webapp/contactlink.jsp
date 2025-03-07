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
    <link type="text/css" rel="stylesheet" href="assets/css/apiidee.ol.min.css"/>
    <link href="plugins/contactlink/contactlink.ol.min.css" rel="stylesheet" />
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
        <label for="inputDescargascnig">Parámetro descargascnig</label>
        <input type="text" name="descargascnig" id="inputDescargascnig" list="descargascnigSug">
        <datalist id="descargascnigSug">
            <option value="http://centrodedescargas.cnig.es/CentroDescargas/index.jsp"></option>
        </datalist>
        <label for="inputPnoa">Parámetro pnoa</label>
        <input type="text" name="pnoa" id="inputPnoa" list="pnoaSug">
        <datalist id="pnoaSug">
            <option value="https://www.ign.es/web/comparador_pnoa/index.html"></option>
        </datalist>
        <label for="inputVisualizador3d">Parámetro visualizador3d</label>
        <input type="text" name="visualizador3d" id="inputVisualizador3d" list="visualizador3dSug">
        <datalist id="visualizador3dSug">
            <option value="https://visualizadores.ign.es/estereoscopico/"></option>
        </datalist>
        <label for="inputFototeca">Parámetro fototeca</label>
        <input type="text" name="fototeca" id="inputFototeca" list="fototecaSug">
        <datalist id="fototecaSug">
            <option value="https://fototeca.cnig.es/"></option>
        </datalist>
        <label for="inputTwitter">Parámetro twitter</label>
        <input type="text" name="twitter" id="inputTwitter" list="twitterSug">
        <datalist id="twitterSug">
            <option value="https://twitter.com/IGNSpain"></option>
        </datalist>
        <label for="inputInstagram">Parámetro instagram</label>
        <input type="text" name="instagram" id="inputInstagram" list="instagramSug">
        <datalist id="instagramSug">
            <option value="https://www.instagram.com/ignspain/"></option>
        </datalist>
        <label for="inputFacebook">Parámetro facebook</label>
        <input type="text" name="facebook" id="inputFacebook" list="facebookSug">
        <datalist id="facebookSug">
            <option value="https://www.facebook.com/IGNSpain/"></option>
        </datalist>
        <label for="inputPinterest">Parámetro pinterest</label>
        <input type="text" name="pinterest" id="inputPinterest" list="pinterestSug">
        <datalist id="pinterestSug">
            <option value="https://www.pinterest.es/IGNSpain/"></option>
        </datalist>
        <label for="inputYoutube">Parámetro youtube</label>
        <input type="text" name="youtube" id="inputYoutube" list="youtubeSug">
        <datalist id="youtubeSug">
            <option value="https://www.youtube.com/user/IGNSpain"></option>
        </datalist>

        <label for="inputMail">Parámetro mail</label>
        <input type="text" name="mail" id="inputMail" list="mailSug">
          <datalist id="mailSug">
           <option value="mailto:ign@fomento.es"></option>
          </datalist>

     	<label for="selectCollapsed">Parámetro de collapsed</label>
        <select name="collapsed" id="selectCollapsed">
            <option value=''></option>
            <option value="true" selected="selected">true</option>
            <option value="false">false</option>
        </select>

     	<label for="selectCollapsible">Selector de collapsible</label>
        <select name="collapsible" id="selectCollapsible">
            <option value=''></option>
            <option value="true" selected="selected">true</option>
            <option value="false">false</option>
        </select>

       	<label for="inputTooltip">Parámetro tooltip</label>
        <input type="text" name="tooltip" id="inputTooltip" list="tooltipSug" value="Reconocimientos">
        <datalist id="tooltipSug">
            <option value="Reconocimientos"></option>
        </datalist>

  
        <input type="hidden" id="buttonAPI" value="API Rest" />
        <input type="button" value="Eliminar Plugin" name="eliminar" id="botonEliminar">

    </div>
    <div id="mapjs" class="m-container"></div>
    <script type="text/javascript" src="vendor/browser-polyfill.js"></script>
    <script type="text/javascript" src="js/apiidee.ol.min.js"></script>
    <script type="text/javascript" src="js/configuration.js"></script>
    <script type="text/javascript" src="plugins/contactlink/contactlink.ol.min.js"></script>
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
        IDEE.language.setLang(urlParams.get('language') || 'es');

        const map = IDEE.map({
            container: 'mapjs',
            zoom: 5,
            maxZoom: 20,
            minZoom: 4,
            center: [-467062.8225, 4783459.6216],
        });


        let mp, posicion;
        let pnoa, visualizador3d, descargascnig, fototeca, twitter, instagram, facebook, pinterest, youtube, mail, collapsed, collapsible, tooltip;
        crearPlugin({
            position: posicion,
            descargascnig: descargascnig,
            pnoa: pnoa,
            visualizador3d: visualizador3d,
            fototeca: fototeca,
            twitter:twitter,
            instagram: instagram,
            facebook: facebook,
            pinterest: pinterest,
            youtube: youtube,
            mail: mail,
			collapsed: collapsed,
			collapsible: collapsible,
			tooltip: tooltip
        });

        const selectPosicion = document.getElementById("selectPosicion");
        const inputDescargascnig = document.getElementById("inputDescargascnig");
        const inputPnoa = document.getElementById("inputPnoa");
        const inputVisualizador3d = document.getElementById("inputVisualizador3d");
        const inputFototeca = document.getElementById("inputFototeca");
        const inputTwitter = document.getElementById("inputTwitter");
        const inputInstagram = document.getElementById("inputInstagram");
        const inputFacebook = document.getElementById("inputFacebook");
        const inputPinterest = document.getElementById("inputPinterest");
        const inputYoutube = document.getElementById("inputYoutube");
        const inputMail = document.getElementById("inputMail");
        const buttonApi = document.getElementById("buttonAPI");
        const inputTooltip = document.getElementById("inputTooltip");
      	const selectCollapsed = document.getElementById("selectCollapsed");
        const selectCollapsible = document.getElementById("selectCollapsible");

        selectPosicion.addEventListener('change', cambiarTest);
        inputDescargascnig.addEventListener('change', cambiarTest);
        inputPnoa.addEventListener('change', cambiarTest);
        inputVisualizador3d.addEventListener('change', cambiarTest);
        inputFototeca.addEventListener('change', cambiarTest);
        inputTwitter.addEventListener('change', cambiarTest);
        inputInstagram.addEventListener('change', cambiarTest);
        inputFacebook.addEventListener('change', cambiarTest);
        inputPinterest.addEventListener('change', cambiarTest);
        inputYoutube.addEventListener('change', cambiarTest);
        inputMail.addEventListener('change', cambiarTest);
  		inputTooltip.addEventListener('change', cambiarTest);
		selectCollapsible.addEventListener('change', cambiarTest);
		selectCollapsed.addEventListener('change', cambiarTest);

        function cambiarTest() {
            let objeto = {}
            objeto.position = selectPosicion.options[selectPosicion.selectedIndex].value;
            descargascnig = inputDescargascnig.value != "" ? objeto.descargascnig = inputDescargascnig.value : "";
            pnoa = inputPnoa.value != "" ? objeto.pnoa = inputPnoa.value : "";
            visualizador3d = inputVisualizador3d.value != "" ? objeto.visualizador3d = inputVisualizador3d.value : "";
            fototeca = inputFototeca.value != "" ? objeto.fototeca = inputFototeca.value : "";
            twitter = inputTwitter.value != "" ? objeto.twitter = inputTwitter.value : "";
            instagram = inputInstagram.value != "" ? objeto.instagram = inputInstagram.value : "";
            facebook = inputFacebook.value != "" ? objeto.facebook = inputFacebook.value : "";
            pinterest = inputPinterest.value != "" ? objeto.pinterest = inputPinterest.value : "";
            youtube = inputYoutube.value != "" ? objeto.youtube = inputYoutube.value : "";
            mail = inputMail.value != "" ? objeto.mail = 'mailto:' + inputMail.value : "";
		    collapsible = selectCollapsible.options[selectCollapsible.selectedIndex].value;
            collapsible != '' ? objeto.collapsible = (collapsible === "true") : '';
	        collapsed = selectCollapsed.options[selectCollapsed.selectedIndex].value;
            collapsed != '' ? objeto.collapsed = (collapsed === "true") : '';
			tooltip = inputTooltip.value != "" ? objeto.tooltip = inputTooltip.value : "";
            map.removePlugins(mp);
            crearPlugin(objeto);
        }

        buttonApi.addEventListener('click', function() {
            posicion = selectPosicion.options[selectPosicion.selectedIndex].value;
            descargascnig = inputDescargascnig.value;
            pnoa = inputPnoa.value;
            visualizador3d = inputVisualizador3d.value;
            fototeca = inputFototeca.value;
            twitter = inputTwitter.value;
            instagram = inputInstagram.value;
            facebook = inputFacebook.value;
            pinterest = inputPinterest.value;
            youtube = inputYoutube.value;
            mail = inputMail.value;

            window.location.href = 'https://componentes-desarrollo.idee.es/api-idee/?contactlink=' + posicion + '*' + descargascnig + '*' + fototeca + '*' + visualizador3d + '*' + pnoa +
                '*' + twitter + '*' + instagram + '*' + pinterest + '*' + youtube + '*' + mail;
        });
	

        function crearPlugin(propiedades) {
            mp = new IDEE.plugin.ContactLink(propiedades);
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
