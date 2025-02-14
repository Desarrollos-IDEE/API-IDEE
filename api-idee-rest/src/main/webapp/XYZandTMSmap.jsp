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
    </link>
    <link href="plugins/toc/toc.ol.min.css" rel="stylesheet" />
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

    <div id="mapjs" class="m-container"></div>
    <script type="text/javascript" src="vendor/browser-polyfill.js"></script>
    <script type="text/javascript" src="js/apiidee.ol.min.js"></script>
    <script type="text/javascript" src="js/configuration.js"></script>
    <script type="text/javascript" src="plugins/toc/toc.ol.min.js"></script>
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

        const mapa = IDEE.map({
            container: 'mapjs',
            getfeatureinfo: 'plain',
            projection: 'EPSG:3857*m', // CASO EPSG:4326 'EPSG:4326*d',
            center: [-421350.1318796586, 4895652.467539945],
            zoom: 6,
        });

        const xyz = new IDEE.layer.XYZ({
          url: 'https://api.maptiler.com/maps/outdoor/256/{z}/{x}/{y}@2x.png?key=7oapAXDXQ3uctBopr1Wx',
          name: 'pruebaXYZ',
          projection: 'EPSG:3857',
          displayInLayerSwitcher: true
        });

        const xyz2 = new IDEE.layer.XYZ({
          url: 'https://rts.larioja.org/mapa-base/rioja/{z}/{x}/{y}.png',
          name: 'XYZLaRioja',
          projection: 'EPSG:3857',
          visible: false,
	      displayInLayerSwitcher: true
        });

        const tms = new IDEE.layer.TMS({
            url: 'https://www.ign.es/resources/sismologia/tproximos/rsn_tiles/{z}/{x}/{-y}.png',
            name: 'sismología',
            projection: 'EPSG:3857',
            visible: false,
	      displayInLayerSwitcher: true
        });

        const tms2 = new IDEE.layer.TMS({
            url: 'https://www.ign.es/web/catalogo-cartoteca/resources/webmaps/data/cresques/{z}/{x}/{y}.jpg',
            name: 'Cresques',
            projection: 'EPSG:3857',
	      displayInLayerSwitcher: true
        });

        const tms3 = new IDEE.layer.TMS({
            url: 'https://www.ign.es/web/catalogo-cartoteca/resources/webmaps/data/malagandlc/{z}/{x}/{y}.jpg',
            name: 'Malagandlc',
            projection: 'EPSG:3857',
	      displayInLayerSwitcher: true
        });

        const tms4 = new IDEE.layer.TMS({
            url: 'https://www.ign.es/web/catalogo-cartoteca/resources/webmaps/data/mapmosaic/{z}/{x}/{y}.jpg',
            name: 'Mapmosaic',
            projection: 'EPSG:3857',
	      displayInLayerSwitcher: true
        });

        const tms5 = new IDEE.layer.TMS({
            url: 'https://www.ign.es/web/resources/expo/virtual/2018/data/visual01/{z}/{x}/{y}.jpg',
            name: 'Visual01',
            projection: 'EPSG:3857',
	      displayInLayerSwitcher: true
        });

        mapa.addLayers([xyz, xyz2, tms, tms2, tms3, tms4, tms5]);

        const mp = new IDEE.plugin.TOC ({
            collapsed: true,
            collapsible: true,
            position: 'TR',
        });

        mapa.addPlugin(mp);


    </script>
</body>

</html>
