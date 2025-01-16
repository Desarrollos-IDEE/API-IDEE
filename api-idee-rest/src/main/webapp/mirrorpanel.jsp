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
    <meta name="idee" content="yes">
    <title>Visor base</title>
    <link type="text/css" rel="stylesheet" href="assets/css/apiidee.ol.min.css">
    <link href="plugins/backimglayer/backimglayer.ol.min.css" rel="stylesheet" />
    <link href="plugins/fulltoc/fulltoc.ol.min.css" rel="stylesheet" />
    <link href="plugins/mirrorpanel/mirrorpanel.ol.min.css" rel="stylesheet" />
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
        <label for="inputModeViz">Parámetro modeViz</label>
        <input type="number" min="0" max="9" name="modeViz" id="inputModeViz" list="modeVizSug">
        <datalist id="modeVizSug">
            <option value="1"></option>
            <option value="2"></option>
            <option value="6"></option>
        </datalist>
        <label for="selectEnabledPlugins">Selector de enabledPlugins</label>
        <select name="enabledPlugins" id="selectEnabledPlugins">
            <option value=""></option>
            <option value="true" selected="selected">true</option>
            <option value="false">false</option>
        </select>
        <label for="selectEnabledKeyFunctions">Selector de enabledKeyFunctions</label>
        <select name="enabledKeyFunctions" id="selectEnabledKeyFunctions">
            <option value=""></option>
            <option value="true" selected="selected">true</option>
            <option value="false">false</option>
        </select>
        <label for="selectShowCursors">Selector de showCursors</label>
        <select name="showCursors" id="selectShowCursors">
            <option value=""></option>
            <option value="true" selected="selected">true</option>
            <option value="false">false</option>
        </select>
        <label for="inputMirrorLayers">Parámetro mirrorLayers</label>
        <input type="text" name="mirrorLayers" id="inputMirrorLayers" list="mirrorLayersSug">
        <datalist id="mirrorLayersSug">
            <option
                value='WMS*PNOA 2004*https://www.ign.es/wms/pnoa-historico*PNOA2004,WMS*PNOA 2005*https://www.ign.es/wms/pnoa-historico*PNOA2005,WMS*PNOA 2006*https://www.ign.es/wms/pnoa-historico*PNOA2006,WMS*PNOA 2007*https://www.ign.es/wms/pnoa-historico*PNOA2007,WMS*PNOA 2008*https://www.ign.es/wms/pnoa-historico*PNOA2008,WMS*PNOA 2009*https://www.ign.es/wms/pnoa-historico*PNOA2009,WMS*PNOA 2010*https://www.ign.es/wms/pnoa-historico*PNOA2010,WMS*PNOA 2011*https://www.ign.es/wms/pnoa-historico*PNOA2011,WMS*PNOA 2012*https://www.ign.es/wms/pnoa-historico*PNOA2012,WMS*PNOA 2013*https://www.ign.es/wms/pnoa-historico*PNOA2013,WMS*PNOA 2014*https://www.ign.es/wms/pnoa-historico*PNOA2014,WMS*PNOA 2015*https://www.ign.es/wms/pnoa-historico*PNOA2015,WMS*PNOA 2016*https://www.ign.es/wms/pnoa-historico*PNOA2016,WMS*PNOA 2017*https://www.ign.es/wms/pnoa-historico*PNOA2017,WMS*PNOA 2018*https://www.ign.es/wms/pnoa-historico*PNOA2018'>
            </option>
        </datalist>
        <label for="inputDefaultBaseLyrs">Parámetro defaultBaseLyrs</label>
        <input type="text" name="defaultBaseLyrs" id="inputDefaultBaseLyrs" value='WMTS*http://www.ign.es/wmts/mapa-raster?*MTN*GoogleMapsCompatible*MTN,WMTS*http://www.ign.es/wmts/pnoa-ma?*OI.OrthoimageCoverage*GoogleMapsCompatible*PNOA,WMTS*https://wmts-mapa-lidar.idee.es/lidar?*EL.GridCoverageDSM*GoogleMapsCompatible*LiDAR'>
        <label for="selectInterface">Selector de interface</label>
        <select name="interface" id="selectInterface">
            <option value=""></option>
            <option value="true" selected="selected">true</option>
            <option value="false">false</option>
        </select>
        <label for="inputBackImgLayersParams">Parámetro backImgLayersParams</label>
        <textarea id="inputBackImgLayersParams" rows="3">
{
  position: "TR",
  collapsible: true,
  collapsed: true,
  layerId: 0,
  layerVisibility: true,
  layerOpts: [
    {
      id: "mapa",
      preview:
        "http://componentes.ign.es/api-idee/plugins/backimglayer/images/svqmapa.png",
      title: "Mapa",
      layers: [
        new M.layer.WMTS({
          url: "http://www.ign.es/wmts/ign-base?",
          name: "IGNBaseTodo",
          legend: "MapaIGN",
          matrixSet: "GoogleMapsCompatible",
          transparent: false,
          displayInLayerSwitcher: false,
          queryable: false,
          visible: true,
          format: "image/jpeg",
        }),
      ],
    },
    {
      id: "imagen",
      title: "Imagen",
      preview:
        "http://componentes.ign.es/api-idee/plugins/backimglayer/images/svqimagen.png",
      layers: [
        new M.layer.WMTS({
          url: "http://www.ign.es/wmts/pnoa-ma?",
          name: "OI.OrthoimageCoverage",
          legend: "Imagen(PNOA)",
          matrixSet: "GoogleMapsCompatible",
          transparent: false,
          displayInLayerSwitcher: false,
          queryable: false,
          visible: true,
          format: "image/jpeg",
        }),
      ],
    },
    {
      id: "lidar",
      preview:
        "http://componentes.ign.es/api-idee/plugins/backimglayer/images/svqlidar.png",
      title: "LIDAR",
      layers: [
        new M.layer.WMTS({
          url: "https://wmts-mapa-lidar.idee.es/lidar?",
          name: "EL.GridCoverageDSM",
          legend: "ModeloDigitaldeSuperficiesLiDAR",
          matrixSet: "GoogleMapsCompatible",
          transparent: false,
          displayInLayerSwitcher: false,
          queryable: false,
          visible: true,
          format: "image/png",
        }),
      ],
    },
    {
      id: "hibrido",
      title: "Híbrido",
      preview:
        "http://componentes.ign.es/api-idee/plugins/backimglayer/images/svqhibrid.png",
      layers: [
        new M.layer.WMTS({
          url: "http://www.ign.es/wmts/pnoa-ma?",
          name: "OI.OrthoimageCoverage",
          legend: "Imagen(PNOA)",
          matrixSet: "GoogleMapsCompatible",
          transparent: true,
          displayInLayerSwitcher: false,
          queryable: false,
          visible: true,
          format: "image/png",
        }),
        new M.layer.WMTS({
          url: "http://www.ign.es/wmts/ign-base?",
          name: "IGNBaseOrto",
          matrixSet: "GoogleMapsCompatible",
          legend: "MapaIGN",
          transparent: false,
          displayInLayerSwitcher: false,
          queryable: false,
          visible: true,
          format: "image/png",
        }),
      ],
    },
  ],
}   
        </textarea>
        <input type="button" value="Eliminar Plugin" name="eliminar" id="botonEliminar">
    </div>
    <div id="mapjs" class="m-container"></div>
    <script type="text/javascript" src="vendor/browser-polyfill.js"></script>
    <script type="text/javascript" src="js/apiideee.ol.min.js"></script>
    <script type="text/javascript" src="js/configuration.js"></script>
    <script type="text/javascript" src="plugins/backimglayer/backimglayer.ol.min.js"></script>
    <script type="text/javascript" src="plugins/fulltoc/fulltoc.ol.min.js"></script>
    <script type="text/javascript" src="plugins/mirrorpanel/mirrorpanel.ol.min.js"></script>
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
            center: {
                x: -667143.31,
                y: 4493011.77,
            },
            projection: "EPSG:3857*m",
            zoom: 15,
        });
        const capasPNOA = [
            'WMS*PNOA 2015*https://www.ign.es/wms/pnoa-historico*PNOA2015',
            'WMS*PNOA 2016*https://www.ign.es/wms/pnoa-historico*PNOA2016',
            'WMS*PNOA 2017*https://www.ign.es/wms/pnoa-historico*PNOA2017',
            'WMS*PNOA 2018*https://www.ign.es/wms/pnoa-historico*PNOA2018',
        ];
        let backImgLayerParams = {
    position: 'TR',
    layerId: 0,
    layerVisibility: true,
    collapsed: true,
    collapsible: true,
    columnsNumber: 4,
    // empty: true,
    layerOpts: [
      {
        id: 'raster',
        preview: 'https://www.ign.es/iberpix/static/media/raster.c7a904f3.png',
        title: 'Mapa',
        layers: [
          new M.layer.TMS({
            url: 'https://tms-mapa-raster.ign.es/1.0.0/mapa-raster/{z}/{x}/{-y}.jpeg',
            name: 'MTN',
            legend: 'Mapa',
            projection: 'EPSG:3857',
            transparent: false,
            displayInLayerSwitcher: false,
            queryable: false,
            visible: true,
            tileGridMaxZoom: 19,
          }),
        ],
      },
      {
        id: 'imagen',
        preview: 'https://www.ign.es/iberpix/static/media/image.44c5b451.png',
        title: 'Imagen',
        layers: [
          new M.layer.TMS({
            url: 'https://tms-pnoa-ma.idee.es/1.0.0/pnoa-ma/{z}/{x}/{-y}.jpeg',
            name: 'PNOA-MA',
            legend: 'Imagen',
            projection: 'EPSG:3857',
            transparent: false,
            displayInLayerSwitcher: false,
            queryable: false,
            visible: true,
            tileGridMaxZoom: 19,
          }),
        ],
      },
      {
        id: 'mapa',
        preview: 'https://www.ign.es/iberpix/static/media/mapa.98d45f00.png',
        title: 'Callejero',
        layers: [
          new M.layer.TMS({
            url: 'https://tms-ign-base.idee.es/1.0.0/IGNBaseTodo/{z}/{x}/{-y}.jpeg',
            name: 'IGNBaseTodo',
            legend: 'Callejero',
            projection: 'EPSG:3857',
            transparent: false,
            displayInLayerSwitcher: false,
            queryable: false,
            visible: true,
            tileGridMaxZoom: 19,
          }),
        ],
      },
      {
        id: 'hibrido',
        title: 'Híbrido',
        preview: 'https://www.ign.es/iberpix/static/media/hibrido.485e957e.png',
        layers: [
          new M.layer.TMS({
            url: 'https://tms-pnoa-ma.idee.es/1.0.0/pnoa-ma/{z}/{x}/{-y}.jpeg',
            name: 'PNOA-MA',
            legend: 'Imagen',
            projection: 'EPSG:3857',
            transparent: false,
            displayInLayerSwitcher: false,
            queryable: false,
            visible: true,
            tileGridMaxZoom: 19,
          }), 
          new M.layer.TMS({
            url: 'https://tms-ign-base.idee.es/1.0.0/IGNBaseOrto/{z}/{x}/{-y}.png',
            name: 'IGNBaseOrto',
            legend: 'Topónimos',
            projection: 'EPSG:3857',
            transparent: false,
            displayInLayerSwitcher: false,
            queryable: false,
            visible: true,
            tileGridMaxZoom: 19,
          }), 
        ],
      },
    ]
  }

        const mpBIL = new M.plugin.BackImgLayer(backImgLayerParams);
        map.addPlugin(mpBIL);
        const mpFullTOC = new M.plugin.FullTOC({
            position: 'TR',
            collapsed: true,
            http: true,
            https: true,
            precharged: {
                groups: [{
                    name: 'Cartografía histórica',
                    services: [{
                        name: 'Planimetrías',
                        type: 'WMS',
                        url: 'https://www.ign.es/wms/minutas-cartograficas',
                    },
                    {
                        name: 'Primeras ediciones de cartografía',
                        type: 'WMTS',
                        url: 'http://www.ign.es/wmts/primera-edicion-mtn',
                    },
                    ],
                },
                {
                    name: 'Transporte',
                    services: [{
                        name: 'IDEE - Red de transporte',
                        type: 'WMS',
                        url: 'http://servicios.idee.es/wms-inspire/transportes?',
                    },
                    {
                        name: 'ADIF - Red de transporte ferroviario',
                        type: 'WMS',
                        url: 'http://ideadif.adif.es/services/wms?',
                    },
                    ],
                },
                ],
                services: [{
                    name: 'Ortofotografías del PNOA y  Vuelos',
                    type: 'WMS',
                    url: 'https://www.ign.es/wms/pnoa-historico',
                }],
            },
        });

        map.addPlugin(mpFullTOC);
        let mp, collapsed, collapsible, enabledPlugins, enabledKeyFunctions, showCursors, modeViz, mirrorLayers = capasPNOA,
            defaultBaseLyrs = [
                'WMTS*http://www.ign.es/wmts/mapa-raster?*MTN*GoogleMapsCompatible*MTN',
                'WMTS*http://www.ign.es/wmts/pnoa-ma?*OI.OrthoimageCoverage*GoogleMapsCompatible*PNOA',
                'WMTS*https://wmts-mapa-lidar.idee.es/lidar?*EL.GridCoverageDSM*GoogleMapsCompatible*LiDAR',
            ], backImgLayersParams = backImgLayerParams,
            interface;
        crearPlugin({ defaultBaseLyrs, backImgLayersParams, mirrorLayers });

        const selectPosicion = document.getElementById("selectPosicion");
        const selectCollapsed = document.getElementById("selectCollapsed");
        const selectCollapsible = document.getElementById("selectCollapsible");
        const inputModeViz = document.getElementById("inputModeViz");
        const selectEnabledPlugins = document.getElementById("selectEnabledPlugins");
        const selectEnabledKeyFunctions = document.getElementById("selectEnabledKeyFunctions");
        const selectShowCursors = document.getElementById("selectShowCursors");
        const inputMirrorLayers = document.getElementById("inputMirrorLayers");
        const inputDefaultBaseLyrs = document.getElementById("inputDefaultBaseLyrs");
        const inputBackImgLayersParams = document.getElementById("inputBackImgLayersParams");
        const selectInterface = document.getElementById("selectInterface");
        selectPosicion.addEventListener('change', cambiarTest);
        selectCollapsed.addEventListener('change', cambiarTest);
        selectCollapsible.addEventListener('change', cambiarTest);
        inputModeViz.addEventListener('change', cambiarTest);
        selectEnabledPlugins.addEventListener('change', cambiarTest);
        selectEnabledKeyFunctions.addEventListener('change', cambiarTest);
        selectShowCursors.addEventListener('change', cambiarTest);
        inputMirrorLayers.addEventListener('change', cambiarTest);
        inputDefaultBaseLyrs.addEventListener('change', cambiarTest);
        inputBackImgLayersParams.addEventListener('change', cambiarTest);
        selectInterface.addEventListener('change', cambiarTest);

        function cambiarTest() {
            map.removeLayers(map.getLayers().filter(a => ['PNOA2015', 'PNOA2016', 'PNOA2017', 'PNOA2018'].includes(a.getImpl().name)));
            let objeto = {}
            objeto.position = selectPosicion.options[selectPosicion.selectedIndex].value;
            let collapsedValor = selectCollapsed.options[selectCollapsed.selectedIndex].value;
            collapsed = collapsedValor != "" ? objeto.collapsed = (collapsedValor == "true") : "";
            let collapsibleValor = selectCollapsible.options[selectCollapsible.selectedIndex].value;
            collapsible = collapsibleValor != "" ? objeto.collapsible = (collapsibleValor == "true") : "";
            let enabledPluginsValor = selectEnabledPlugins.options[selectEnabledPlugins.selectedIndex].value;
            enabledPlugins = enabledPluginsValor != "" ? objeto.enabledPlugins = (enabledPluginsValor == "true") : "";
            let enabledKeyFunctionsValor = selectEnabledKeyFunctions.options[selectEnabledKeyFunctions.selectedIndex].value;
            enabledKeyFunctions = enabledKeyFunctionsValor != "" ? objeto.enabledKeyFunctions = (enabledKeyFunctionsValor == "true") : "";
            let showCursorsValor = selectShowCursors.options[selectShowCursors.selectedIndex].value;
            showCursors = showCursorsValor != "" ? objeto.showCursors = (showCursorsValor == "true") : "";
            modeViz = inputModeViz.value != "" ? objeto.modeViz = inputModeViz.value : "";
            mirrorLayers = inputMirrorLayers.value != "" ? objeto.mirrorLayers = inputMirrorLayers.value : objeto.mirrorLayers = capasPNOA;
            defaultBaseLyrs = inputDefaultBaseLyrs.value != "" ? objeto.defaultBaseLyrs = inputDefaultBaseLyrs.value : objeto.defaultBaseLyrs = defaultBaseLyrs;
            backImgLayersParams = inputBackImgLayersParams.value != "" ? objeto.backImgLayersParams = eval('(' + inputBackImgLayersParams.value + ')') : objeto.backImgLayersParams = backImgLayerParams;
            let interfaceValor = selectInterface.options[selectInterface.selectedIndex].value;
            interface = interfaceValor != "" ? objeto.interface = (interfaceValor == "true") : "";

            map.removePlugins(mp);
            crearPlugin(objeto);
        }

        function crearPlugin(propiedades) {
            mp = new M.plugin.Mirrorpanel(propiedades);
            map.addPlugin(mp);
        }
        let mp2 = new M.plugin.ShareMap({
            baseUrl: window.location.href.substring(0, window.location.href.indexOf('api-idee')) + "api-idee/",
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
