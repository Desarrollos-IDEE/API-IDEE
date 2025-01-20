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
    <link href="plugins/beautytoc/beautytoc.ol.min.css" rel="stylesheet" />
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

        <label for="selectCollapsed">Selector collapsed</label>
        <select name="collapsedValue" id="selectCollapsed">
            <option value=true>true</option>
            <option value=false>false</option>
        </select>
        <input type="button" value="Eliminar Plugin" name="eliminar" id="botonEliminar">
    </div>

    <div id="mapjs" class="m-container"></div>
    <script type="text/javascript" src="vendor/browser-polyfill.js"></script>
    <script type="text/javascript" src="js/apiidee.ol.min.js"></script>
    <script type="text/javascript" src="js/configuration.js"></script>
    <script type="text/javascript" src="plugins/beautytoc/beautytoc.ol.min.js"></script>
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

        let map;

        let mp, posicion, collapsed;
        let layersPlugin = [];

        crearPlugin(posicion, collapsed);

        const selectPosicion = document.getElementById("selectPosicion");
        const selectCollapsed = document.getElementById("selectCollapsed");

        selectPosicion.addEventListener('change', function() {
            collapsed = (selectCollapsed.options[selectCollapsed.selectedIndex].value == 'true');
            posicion = selectPosicion.options[selectPosicion.selectedIndex].value;
            map.removePlugins(mp);
            map.destroy()
            crearPlugin(posicion, collapsed);

        })

        selectCollapsed.addEventListener('change', function() {
            collapsed = (selectCollapsed.options[selectCollapsed.selectedIndex].value == 'true');
            posicion = selectPosicion.options[selectPosicion.selectedIndex].value;
            map.removePlugins(mp);
            map.destroy()

            crearPlugin(posicion, collapsed);
        })


        function crearPlugin(posicion, collapsed) {

            map = M.map({
                container: 'mapjs',
                zoom: 5,
                maxZoom: 20,
                minZoom: 4,
                center: [-467062.8225, 4783459.6216],
            });

            mp = new M.plugin.BeautyTOC({
                position: posicion,
                collapsed: collapsed,
            });

            map.addPlugin(mp);

            layersPlugin = [
                new M.layer.WMS({
                    url: 'http://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx?',
                    name: 'Catastro',
                    legend: 'Catastro',
                    tiled: false,
                    version: '1.1.1',
                }, {
                    visibility: false,
                    displayInLayerSwitcher: true,
                    queryable: true
                }),
                new M.layer.WMS({
                    url: 'https://www.ign.es/wms/pnoa-historico?',
                    name: 'Interministerial_1973-1986',
                    legend: 'Vuelo Interministerial (1973-1986)',
                    tiled: false,
                    version: '1.3.0',
                }, {
                    visibility: false,
                    displayInLayerSwitcher: true,
                    queryable: false
                }),
                new M.layer.WMS({
                    url: 'https://www.ign.es/wms/pnoa-historico?',
                    name: 'Nacional_1981-1986',
                    legend: 'Vuelo Nacional (1981-1986)',
                    tiled: false,
                    version: '1.3.0',
                }, {
                    visibility: false,
                    displayInLayerSwitcher: true,
                    queryable: false
                }),
                new M.layer.WMS({
                    url: 'https://www.ign.es/wms/pnoa-historico?',
                    name: 'OLISTAT',
                    legend: 'OLISTAT (1997-1998)',
                    tiled: false,
                    version: '1.3.0',
                }, {
                    visibility: false,
                    displayInLayerSwitcher: true,
                    queryable: false
                }),
                new M.layer.WMS({
                    url: 'https://www.ign.es/wms/pnoa-historico?',
                    name: 'SIGPAC',
                    legend: 'SIGPAC (1997-2003)',
                    tiled: false,
                    version: '1.3.0',
                }, {
                    visibility: false,
                    displayInLayerSwitcher: true,
                    queryable: false
                }),
                new M.layer.WMS({
                    url: 'https://www.ign.es/wms/pnoa-historico?',
                    name: 'PNOA2004',
                    legend: 'PNOA 2004',
                    tiled: false,
                    version: '1.3.0',
                }, {
                    visibility: false,
                    displayInLayerSwitcher: true,
                    queryable: false
                }),
                new M.layer.WMS({
                    url: 'https://www.ign.es/wms/pnoa-historico?',
                    name: 'PNOA2005',
                    legend: 'PNOA 2005',
                    tiled: false,
                    version: '1.3.0',
                }, {
                    visibility: false,
                    displayInLayerSwitcher: true,
                    queryable: false
                }),
                new M.layer.WMS({
                    url: 'https://www.ign.es/wms/pnoa-historico?',
                    name: 'PNOA2006',
                    legend: 'PNOA 2006',
                    tiled: false,
                    version: '1.3.0',
                }, {
                    visibility: false,
                    displayInLayerSwitcher: true,
                    queryable: false
                }),
                new M.layer.WMS({
                    url: 'https://www.ign.es/wms/pnoa-historico?',
                    name: 'PNOA2007',
                    legend: 'PNOA 2007',
                    tiled: false,
                    version: '1.3.0',
                }, {
                    visibility: false,
                    displayInLayerSwitcher: true,
                    queryable: false
                }),
                new M.layer.WMS({
                    url: 'https://www.ign.es/wms/pnoa-historico?',
                    name: 'PNOA2008',
                    legend: 'PNOA 2008',
                    tiled: false,
                    version: '1.3.0',
                }, {
                    visibility: false,
                    displayInLayerSwitcher: true,
                    queryable: false
                }),
                new M.layer.WMS({
                    url: 'https://www.ign.es/wms/pnoa-historico?',
                    name: 'PNOA2009',
                    legend: 'PNOA 2009',
                    tiled: false,
                    version: '1.3.0',
                }, {
                    visibility: false,
                    displayInLayerSwitcher: true,
                    queryable: false
                }),
                new M.layer.WMS({
                    url: 'https://www.ign.es/wms/pnoa-historico?',
                    name: 'PNOA2010',
                    legend: 'PNOA 2010',
                    tiled: false,
                    version: '1.3.0',
                }, {
                    visibility: false,
                    displayInLayerSwitcher: true,
                    queryable: false
                }),
                new M.layer.WMS({
                    url: 'https://www.ign.es/wms/pnoa-historico?',
                    name: 'PNOA2011',
                    legend: 'PNOA 2011',
                    tiled: false,
                    version: '1.3.0',
                }, {
                    visibility: false,
                    displayInLayerSwitcher: true,
                    queryable: false
                }),
                new M.layer.WMS({
                    url: 'https://www.ign.es/wms/pnoa-historico?',
                    name: 'PNOA2012',
                    legend: 'PNOA 2012',
                    tiled: false,
                    version: '1.3.0',
                }, {
                    visibility: false,
                    displayInLayerSwitcher: true,
                    queryable: false
                }),
                new M.layer.WMS({
                    url: 'https://www.ign.es/wms/pnoa-historico?',
                    name: 'PNOA2013',
                    legend: 'PNOA 2013',
                    tiled: false,
                    version: '1.3.0',
                }, {
                    visibility: false,
                    displayInLayerSwitcher: true,
                    queryable: false
                }),
                new M.layer.WMS({
                    url: 'https://www.ign.es/wms/pnoa-historico?',
                    name: 'PNOA2014',
                    legend: 'PNOA 2014',
                    tiled: false,
                    version: '1.3.0',
                }, {
                    visibility: false,
                    displayInLayerSwitcher: true,
                    queryable: false
                }),
                new M.layer.WMS({
                    url: 'https://www.ign.es/wms/pnoa-historico?',
                    name: 'PNOA2015',
                    legend: 'PNOA 2015',
                    tiled: false,
                    version: '1.3.0',
                }, {
                    visibility: false,
                    displayInLayerSwitcher: true,
                    queryable: false
                }),
                new M.layer.WMS({
                    url: 'https://www.ign.es/wms/pnoa-historico?',
                    name: 'PNOA2016',
                    legend: 'PNOA 2016',
                    tiled: false,
                    version: '1.3.0',
                }, {
                    visibility: false,
                    displayInLayerSwitcher: true,
                    queryable: false
                }),
                new M.layer.WMS({
                    url: 'https://www.ign.es/wms/pnoa-historico?',
                    name: 'PNOA2017',
                    legend: 'PNOA 2017',
                    tiled: false,
                    version: '1.3.0',
                }, {
                    visibility: false,
                    displayInLayerSwitcher: true,
                    queryable: false
                }),
            ];

            layersPlugin.forEach((l, index) => {
                l.setVisible(false);
                l.displayInLayerSwitcher = true;
                if (l.url === 'https://www.ign.es/wms/pnoa-historico?') {
                    l.setZIndex(500 + index);
                } else {
                    l.setZIndex(2000 + index);
                }
            });
            map.addLayers(layersPlugin)
            let mp2 = new M.plugin.ShareMap({
                baseUrl: window.location.href.substring(0, window.location.href.indexOf('api-idee')) + "api-idee/",
                position: "TR",
            });
            map.addPlugin(mp2);
            const botonEliminar = document.getElementById("botonEliminar");
            botonEliminar.addEventListener("click", function() {
                map.removePlugins(mp);
            });
        }
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
