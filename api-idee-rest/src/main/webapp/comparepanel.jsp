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
    <link href="plugins/comparepanel/comparepanel.ol.min.css" rel="stylesheet" />
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
        <!-- <label for="inputBaseLayers">Parámetro baseLayers</label>
        <input type="text" name="baseLayers" id="inputBaseLayers">
        <select id="selectIntervals">
            <option selected></option>
            <option
                value='[["NACIONAL 1981-1986","1986","WMS*NACIONAL_1981-1986*https://www.ign.es/wms/pnoa-historico*NACIONAL_1981-1986"],["OLISTAT","1998","WMS*OLISTAT*https://www.ign.es/wms/pnoa-historico*OLISTAT"],["SIGPAC","2003","WMS*SIGPAC*https://www.ign.es/wms/pnoa-historico*SIGPAC"],["PNOA 2004","2004","WMS*pnoa2004*https://www.ign.es/wms/pnoa-historico*pnoa2004"],["PNOA 2005","2005","WMS*pnoa2005*https://www.ign.es/wms/pnoa-historico*pnoa2005"],["PNOA 2006","2006","WMS*pnoa2006*https://www.ign.es/wms/pnoa-historico*pnoa2006"],["PNOA 2010","2010","WMS*pnoa2010*https://www.ign.es/wms/pnoa-historico*pnoa2010"]]'>
                Ej: 7 Capas</option>
            <option
                value='[["NACIONAL 1981-1986","1986","WMS*NACIONAL_1981-1986*https://www.ign.es/wms/pnoa-historico*NACIONAL_1981-1986"],["OLISTAT","1998","WMS*OLISTAT*https://www.ign.es/wms/pnoa-historico*OLISTAT"],["SIGPAC","2003","WMS*SIGPAC*https://www.ign.es/wms/pnoa-historico*SIGPAC"],["PNOA 2004","2004","WMS*pnoa2004*https://www.ign.es/wms/pnoa-historico*pnoa2004"],["PNOA 2005","2005","WMS*pnoa2005*https://www.ign.es/wms/pnoa-historico*pnoa2005"],["PNOA 2006","2006","WMS*pnoa2006*https://www.ign.es/wms/pnoa-historico*pnoa2006"],["PNOA 2007","2007","WMS*pnoa2007*https://www.ign.es/wms/pnoa-historico*pnoa2007"],["PNOA 2008","2008","WMS*pnoa2008*https://www.ign.es/wms/pnoa-historico*pnoa2008"],["PNOA 2009","2009","WMS*pnoa2009*https://www.ign.es/wms/pnoa-historico*pnoa2009"],["PNOA 2010","2010","WMS*pnoa2010*https://www.ign.es/wms/pnoa-historico*pnoa2010"],["PNOA 2011","2011","WMS*pnoa2011*https://www.ign.es/wms/pnoa-historico*pnoa2011"],["PNOA 2012","2012","WMS*pnoa2012*https://www.ign.es/wms/pnoa-historico*pnoa2012"],["PNOA 2013","2013","WMS*pnoa2013*https://www.ign.es/wms/pnoa-historico*pnoa2013"],["PNOA 2014","2014","WMS*pnoa2014*https://www.ign.es/wms/pnoa-historico*pnoa2014"],["PNOA 2015","2015","WMS*pnoa2015*https://www.ign.es/wms/pnoa-historico*pnoa2015"],["PNOA 2016","2016","WMS*pnoa2016*https://www.ign.es/wms/pnoa-historico*pnoa2016"],["PNOA 2017","2017","WMS*pnoa2017*https://www.ign.es/wms/pnoa-historico*pnoa2017"],["PNOA 2018","2018","WMS*pnoa2018*https://www.ign.es/wms/pnoa-historico*pnoa2018"]]'>
                Ej: 18 capas</option>
        </select> -->
        <label for="selectVertical">Selector de orientacion</label>
        <select name="vertical" id="selectVertical">
            <option value=""></option>
            <option value="true" selected="selected">Vertical</option>
            <option value="false">Horizontal</option>
        </select>
        <input type="button" value="Eliminar Plugin" name="eliminar" id="botonEliminar">
    </div>
    <div id="mapjs" class="m-container"></div>
    <script type="text/javascript" src="vendor/browser-polyfill.js"></script>
    <script type="text/javascript" src="js/apiign.ol.min.js"></script>
    <script type="text/javascript" src="js/configuration.js"></script>
    <script type="text/javascript" src="plugins/comparepanel/comparepanel.ol.min.js"></script>
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
            center: [-467062.8225, 4683459.6216],
            zoom: 6,
        });
        let mp, posicion, vertical;

        const baseLayers = [
                    ['Americano 1956-57', '1956', 'WMS*Americano 1956-1957*https://www.ign.es/wms/pnoa-historico*AMS_1956-1957'],
                    ['Interministerial 1973-86', '1983', 'WMS*Interministerial 1973-1986*https://www.ign.es/wms/pnoa-historico*Interministerial_1973-1986'],
                    ['Nacional 1981-86', '1986', 'WMS*Nacional 1981-1986*https://www.ign.es/wms/pnoa-historico*NACIONAL_1981-1986'],
                    ['OLISTAT', '1998', 'WMS*OLISTAT*https://www.ign.es/wms/pnoa-historico*OLISTAT'],
                    ['SIGPAC', '2003', 'WMS*SIGPAC*https://www.ign.es/wms/pnoa-historico*SIGPAC'],
                    ['PNOA 2004', '2004', 'WMS*PNOA 2004*https://www.ign.es/wms/pnoa-historico*pnoa2004'],
                    ['PNOA 2005', '2005', 'WMS*PNOA 2005*https://www.ign.es/wms/pnoa-historico*pnoa2005'],
                    ['PNOA 2006', '2006', 'WMS*PNOA 2006*https://www.ign.es/wms/pnoa-historico*pnoa2006'],
                    ['PNOA 2007', '2007', 'WMS*PNOA 2007*https://www.ign.es/wms/pnoa-historico*pnoa2007'],
                    ['PNOA 2008', '2008', 'WMS*PNOA 2008*https://www.ign.es/wms/pnoa-historico*pnoa2008'],
                    ['PNOA 2009', '2009', 'WMS*PNOA 2009*https://www.ign.es/wms/pnoa-historico*pnoa2009'],
                    ['PNOA 2010', '2010', 'WMS*PNOA 2010*https://www.ign.es/wms/pnoa-historico*pnoa2010'],
                    ['PNOA 2011', '2011', 'WMS*PNOA 2011*https://www.ign.es/wms/pnoa-historico*pnoa2011'],
                    ['PNOA 2012', '2012', 'WMS*PNOA 2012*https://www.ign.es/wms/pnoa-historico*pnoa2012'],
                    ['PNOA 2013', '2013', 'WMS*PNOA 2013*https://www.ign.es/wms/pnoa-historico*pnoa2013'],
                    ['PNOA 2014', '2014', 'WMS*PNOA 2014*https://www.ign.es/wms/pnoa-historico*pnoa2014'],
                    ['PNOA 2015', '2015', 'WMS*PNOA 2015*https://www.ign.es/wms/pnoa-historico*pnoa2015'],
                    ['PNOA 2016', '2016', 'WMS*PNOA 2016*https://www.ign.es/wms/pnoa-historico*pnoa2016'],
                    ['PNOA 2017', '2017', 'WMS*PNOA 2017*https://www.ign.es/wms/pnoa-historico*pnoa2017'],
                    ['PNOA 2018', '2018', 'WMS*PNOA 2018*https://www.ign.es/wms/pnoa-historico*pnoa2018'],
        ];


		const SENTINELLayerList = [
			['Huellas Sentinel2', '2018', 'WMS*Huellas Sentinel2*https://wms-satelites-historicos.idee.es/satelites-historicos*teselas_sentinel2_espanna'],
			['Invierno 2022 falso color natural', '2022', 'WMS*Invierno 2022 falso color natural*https://wms-satelites-historicos.idee.es/satelites-historicos*SENTINEL.2022invierno_432-1184'],
			['Invierno 2022 falso color infrarrojo', '2022', 'WMS*Invierno 2022 falso color infrarrojo*https://wms-satelites-historicos.idee.es/satelites-historicos*SENTINEL.2022invierno_843'],
			['Filomena', '2021', 'WMS*Filomena*https://wms-satelites-historicos.idee.es/satelites-historicos*Filomena'],
			['Invierno 2021 falso color natural', '2021', 'WMS*Invierno 2021 falso color natural*https://wms-satelites-historicos.idee.es/satelites-historicos*SENTINEL.2021invierno_432-1184'],
			['Invierno 2021 falso color infrarrojo', '2021', 'WMS*Invierno 2021 falso color infrarrojo*https://wms-satelites-historicos.idee.es/satelites-historicos*SENTINEL.2021invierno_843'],
			['Verano 2021 falso color natural', '2021', 'WMS*Verano 2021 falso color natural*https://wms-satelites-historicos.idee.es/satelites-historicos*SENTINEL.2021verano_432-1184'],
			['Verano 2021 falso color infrarrojo', '2021', 'WMS*Verano 2021 falso color infrarrojo*https://wms-satelites-historicos.idee.es/satelites-historicos*SENTINEL.2021verano_843'],
			['Invierno 2020 falso color natural', '2020', 'WMS*Invierno 2020 falso color natural*https://wms-satelites-historicos.idee.es/satelites-historicos*SENTINEL.2020invierno_432-1184'],
			['Invierno 2020 falso color infrarrojo', '2020', 'WMS*Invierno 2020 falso color infrarrojo*https://wms-satelites-historicos.idee.es/satelites-historicos*SENTINEL.2020invierno_843'],
			['Verano 2020 falso color natural', '2020', 'WMS*Verano 2020 falso color natural*https://wms-satelites-historicos.idee.es/satelites-historicos*SENTINEL.2020verano_432-1184'],
			['Verano 2020 falso color infrarrojo', '2020', 'WMS*Verano 2020 falso color infrarrojo*https://wms-satelites-historicos.idee.es/satelites-historicos*SENTINEL.2020verano_843'],
			['Invierno 2019 falso color natural', '2019', 'WMS*Invierno 2019 falso color natural*https://wms-satelites-historicos.idee.es/satelites-historicos*SENTINEL.2019invierno_432-1184'],
			['Invierno 2019 falso color infrarrojo', '2019', 'WMS*Invierno 2019 falso color infrarrojo*https://wms-satelites-historicos.idee.es/satelites-historicos*SENTINEL.2019invierno_843'],
			['Verano 2019 falso color natural', '2019', 'WMS*Verano 2019 falso color natural*https://wms-satelites-historicos.idee.es/satelites-historicos*SENTINEL.2019verano_432-1184'],
			['Verano 2019 falso color infrarrojo', '2019', 'WMS*Verano 2019 falso color infrarrojo*https://wms-satelites-historicos.idee.es/satelites-historicos*SENTINEL.2019verano_843'],
			['Verano 2018 falso color natural', '2018', 'WMS*Verano 2018 falso color natural*https://wms-satelites-historicos.idee.es/satelites-historicos*SENTINEL.2018verano_432-1184'],
			['Verano 2018 falso color infrarrojo', '2018', 'WMS*Verano 2018 falso color infrarrojo*https://wms-satelites-historicos.idee.es/satelites-historicos*SENTINEL.2018verano_843'],
			['Huellas Spot5', '2005', 'WMS*Huellas Spot5*https://wms-satelites-historicos.idee.es/satelites-historicos*HuellasSpot5_espanna'],
			['2014. Pseudocolor natural', '2014', 'WMS*2014. Pseudocolor natural*https://wms-satelites-historicos.idee.es/satelites-historicos*SPOT.2014'],
			['2013. Pseudocolor natural', '2013', 'WMS*2013. Pseudocolor natural*https://wms-satelites-historicos.idee.es/satelites-historicos*SPOT.2013'],
			['2012. Pseudocolor natural', '2012', 'WMS*2012. Pseudocolor natural*https://wms-satelites-historicos.idee.es/satelites-historicos*SPOT.2012'],
			['2011. Pseudocolor natural', '2011', 'WMS*2011. Pseudocolor natural*https://wms-satelites-historicos.idee.es/satelites-historicos*SPOT.2011'],
			['2009. Pseudocolor natural', '2009', 'WMS*2009. Pseudocolor natural*https://wms-satelites-historicos.idee.es/satelites-historicos*SPOT.2009'],
			['2008. Pseudocolor natural', '2008', 'WMS*2008. Pseudocolor natural*https://wms-satelites-historicos.idee.es/satelites-historicos*SPOT.2008'],
			['2005. Pseudocolor natural', '2005', 'WMS*2005. Pseudocolor natural*https://wms-satelites-historicos.idee.es/satelites-historicos*SPOT.2005'],
			['Huellas Landsat8', '1971', 'WMS*Huellas Landsat8*https://wms-satelites-historicos.idee.es/satelites-historicos*Landsat_huellas_espanna'],
			['Landsat 8 2014. Color natural', '2014', 'WMS*Landsat 8 2014. Color natural*https://wms-satelites-historicos.idee.es/satelites-historicos*LANDSAT8.2014_432'],
			['Landsat 8 2014. Falso color infrarrojo', '2014', 'WMS*Landsat 8 2014. Falso color infrarrojo*https://wms-satelites-historicos.idee.es/satelites-historicos*LANDSAT8.2014_654'],
			['Landsat 5 TM 2006. Color natural', '2006', 'WMS*Landsat 5 TM 2006. Color natural*https://wms-satelites-historicos.idee.es/satelites-historicos*LANDSAT5.2006_321-543'],
			['Landsat 5 TM 2006. Falso color infrarrojo', '2006', 'WMS*Landsat 5 TM 2006. Falso color infrarrojo*https://wms-satelites-historicos.idee.es/satelites-historicos*LANDSAT5.2006_432'],
			['Landsat 5 TM 1996. Color natural', '1996', 'WMS*Landsat 5 TM 1996. Color natural*https://wms-satelites-historicos.idee.es/satelites-historicos*LANDSAT5.1996_321-543'],
			['Landsat 5 TM 1996. Falso color infrarrojo', '1996', 'WMS*Landsat 5 TM 1996. Falso color infrarrojo*https://wms-satelites-historicos.idee.es/satelites-historicos*LANDSAT5.1996_432'],
			['Landsat 5 TM 1991. Color natural', '1991', 'WMS*Landsat 5 TM 1991. Color natural*https://wms-satelites-historicos.idee.es/satelites-historicos*LANDSAT5.1991_321-543'],
			['Landsat 5 TM 1991. Falso color infrarrojo', '1991', 'WMS*Landsat 5 TM 1991. Falso color infrarrojo*https://wms-satelites-historicos.idee.es/satelites-historicos*LANDSAT5.1991_432'],
			['Landsat 5 TM 1986. Color natural', '1986', 'WMS*Landsat 5 TM 1986. Color natural*https://wms-satelites-historicos.idee.es/satelites-historicos*LANDSAT5.1986_321-543'],
			['Landsat 5 TM 1986. Falso color infrarrojo', '1986', 'WMS*Landsat 5 TM 1986. Falso color infrarrojo*https://wms-satelites-historicos.idee.es/satelites-historicos*LANDSAT5.1986_432'],
			['Landsat 1 1971-1975. Color natural', '1971', 'WMS*Landsat 1 1971-1975. Color natural*https://wms-satelites-historicos.idee.es/satelites-historicos*LANDSAT1_544-574'],
			['Landsat 1 1971-1975. Falso color infrarrojo', '1971', 'WMS*Landsat 1 1971-1975. Falso color infrarrojo*https://wms-satelites-historicos.idee.es/satelites-historicos*LANDSAT1_654'],
			['Fondo', '2001', 'WMS*Fondo*https://wms-satelites-historicos.idee.es/satelites-historicos*fondo'],
		];

        crearPlugin({
            position: posicion,
            baseLayers: baseLayers,
            vertical: true,
            defaultCompareMode: 'mirror',// mirror - curtain - timeline - spyeye
            defaultCompareViz: 1,
            /*urlcoberturas: 'https://projects.develmap.com/apicnig/pnoahisto/coberturas.geojson',*/
            timelineParams: {
                animation: true,
            },
            transparencyParams: {
                radius: 100,
            },
            lyrcompareParams: {
                staticDivision: 2,
                defaultLyrA:0,
                defaultLyrB:1,
                defaultLyrC:2,
                defaultLyrD:3,
                opacityVal:100,
            },
            mirrorpanelParams: {
                showCursors: true,
                reverseLayout:true,
                enabledPlugins: true,
                enabledKeyFunctions: true,
            }
        });
        const selectPosicion = document.getElementById("selectPosicion");
        const selectCollapsed = document.getElementById("selectCollapsed");
        const selectCollapsible = document.getElementById("selectCollapsible");
        const selectVertical = document.getElementById("selectVertical");
        selectPosicion.addEventListener('change', cambiarTest);
        selectCollapsed.addEventListener('change', cambiarTest);
        selectCollapsible.addEventListener('change', cambiarTest);
        selectVertical.addEventListener('change', cambiarTest);

        function cambiarTest() {
            const collapsedValor = selectCollapsed.options[selectCollapsed.selectedIndex].value;
            const collapsibleValor = selectCollapsible.options[selectCollapsible.selectedIndex].value;
            const verticalValor = selectVertical.options[selectVertical.selectedIndex].value;
            map.removePlugins(mp);
            setTimeout(() => {
              crearPlugin({
                  position: selectPosicion.options[selectPosicion.selectedIndex].value,
                  collapsed: collapsedValor !== 'false',
                  collapsible: collapsibleValor !== 'false',
                  baseLayers: baseLayers,
                  vertical: verticalValor !== 'false',
                  defaultCompareMode: 'mirror',// mirror - curtain - timeline - spyeye
                  defaultCompareViz: 1,
                  /*urlcoberturas: 'https://projects.develmap.com/apicnig/pnoahisto/coberturas.geojson',*/
                  timelineParams: {
                      animation: true,
                  },
                  transparencyParams: {
                      radius: 100,
                  },
                  lyrcompareParams: {
                      staticDivision: 2,
                      defaultLyrA:0,
                      defaultLyrB:1,
                      defaultLyrC:2,
                      defaultLyrD:3,
                      opacityVal:100,
                  },
                  mirrorpanelParams: {
                      showCursors: true,
                      reverseLayout:true,
                      enabledPlugins: true,
                      enabledKeyFunctions: true,
                  }
              });
            }, 1000);
        }

        function crearPlugin(propiedades) {
            mp = new M.plugin.Comparepanel(propiedades);
            map.addPlugin(mp);
        }

        mp2 = new M.plugin.ShareMap({
            baseUrl: window.location.href.substring(0, window.location.href.indexOf('api-core')) + "api-core/",
            position: "TR",
        });
        map.addPlugin(mp2);
        const botonEliminar = document.getElementById("botonEliminar");
        botonEliminar.addEventListener("click", function () {
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
