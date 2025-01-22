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
    <link href="plugins/fulltoc/fulltoc.ol.min.css" rel="stylesheet" />
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
        <select name="collapsed" id="selectCollapsed">
            <option value=true>true</option>
            <option value=false>false</option>
        </select>

        <label for="selectHttps">Selector https</label>
        <select name="https" id="selectHttps">
            <option value=true>true</option>
            <option value=false>false</option>
        </select>

        <label for="selectHttp">Selector http</label>
        <select name="http" id="selectHttp">
            <option value=true>true</option>
            <option value=false>false</option>
        </select>

        <label for="selectCODSI">Selector codsi</label>
        <select name="codsi" id="selectCODSI">
            <option value=true>true</option>
            <option value=false>false</option>
        </select>

        <input type="submit" id="buttonAPI" value="API Rest" />
        <input type="button" value="Eliminar Plugin" name="eliminar" id="botonEliminar">
    </div>

    <div id="mapjs" class="m-container"></div>
    <script type="text/javascript" src="vendor/browser-polyfill.js"></script>
    <script type="text/javascript" src="js/apiidee.ol.min.js"></script>
    <script type="text/javascript" src="js/configuration.js"></script>
    <script type="text/javascript" src="plugins/fulltoc/fulltoc.ol.min.js"></script>
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

        let mp, posicion, collapsed = true,
            http, https, ocupacionSuelo, layerUA, layerinicial, codsi;
        crearPlugin(collapsed, posicion, http, https, codsi);

        const selectPosicion = document.getElementById("selectPosicion");
        const selectCollapsed = document.getElementById("selectCollapsed");
        const selectHttp = document.getElementById("selectHttp");
        const selectHttps = document.getElementById("selectHttps");
        const selectCODSI = document.getElementById("selectCODSI");
        const buttonApi = document.getElementById("buttonAPI");


        selectPosicion.addEventListener('change', function() {
            collapsed = (selectCollapsed.options[selectCollapsed.selectedIndex].value == 'true');
            http = (selectHttp.options[selectHttp.selectedIndex].value == 'true');
            https = (selectHttps.options[selectHttps.selectedIndex].value == 'true');
            posicion = selectPosicion.options[selectPosicion.selectedIndex].value;
            codsi = (selectCODSI.options[selectCODSI.selectedIndex].value == 'true');
            map.removePlugins(mp);
            crearPlugin(collapsed, http, https, posicion, codsi);
        });

        selectCollapsed.addEventListener('change', function() {
            collapsed = (selectCollapsed.options[selectCollapsed.selectedIndex].value == 'true');
            http = (selectHttp.options[selectHttp.selectedIndex].value == 'true');
            https = (selectHttps.options[selectHttps.selectedIndex].value == 'true');
            posicion = selectPosicion.options[selectPosicion.selectedIndex].value;
            codsi = (selectCODSI.options[selectCODSI.selectedIndex].value == 'true');
            map.removePlugins(mp);
            crearPlugin(collapsed, http, https, posicion, codsi);
        });

        selectHttp.addEventListener('change', function() {
            collapsed = (selectCollapsed.options[selectCollapsed.selectedIndex].value == 'true');
            http = (selectHttp.options[selectHttp.selectedIndex].value == 'true');
            https = (selectHttps.options[selectHttps.selectedIndex].value == 'true');
            posicion = selectPosicion.options[selectPosicion.selectedIndex].value;
            codsi = (selectCODSI.options[selectCODSI.selectedIndex].value == 'true');
            map.removePlugins(mp);
            crearPlugin(collapsed, http, https, posicion, codsi);
        });

        selectHttps.addEventListener('change', function() {
            collapsed = (selectCollapsed.options[selectCollapsed.selectedIndex].value == 'true');
            http = (selectHttp.options[selectHttp.selectedIndex].value == 'true');
            https = (selectHttps.options[selectHttps.selectedIndex].value == 'true');
            posicion = selectPosicion.options[selectPosicion.selectedIndex].value;
            codsi = (selectCODSI.options[selectCODSI.selectedIndex].value == 'true');
            map.removePlugins(mp);
            crearPlugin(collapsed, http, https, posicion, codsi);
        });

        selectCODSI.addEventListener('change', function() {
            collapsed = (selectCollapsed.options[selectCollapsed.selectedIndex].value == 'true');
            http = (selectHttp.options[selectHttp.selectedIndex].value == 'true');
            https = (selectHttps.options[selectHttps.selectedIndex].value == 'true');
            posicion = selectPosicion.options[selectPosicion.selectedIndex].value;
            codsi = (selectCODSI.options[selectCODSI.selectedIndex].value == 'true');
            map.removePlugins(mp);
            crearPlugin(collapsed, http, https, posicion, codsi);
        });

        buttonApi.addEventListener('click', function() {
            collapsed = (selectCollapsed.options[selectCollapsed.selectedIndex].value == 'true');
            http = (selectHttp.options[selectHttp.selectedIndex].value == 'true');
            https = (selectHttps.options[selectHttps.selectedIndex].value == 'true');
            posicion = selectPosicion.options[selectPosicion.selectedIndex].value;
            codsi = (selectCODSI.options[selectCODSI.selectedIndex].value == 'true');
            window.location.href = 'https://componentes-desarrollo.idee.es/api-idee//api-idee/?fulltoc=' + posicion + '*' + collapsed + '*' + collapsible + '*' + codsi;
        });

        // const precharged = {
        //     groups: [{
        //             name: 'Hidrografía',
        //             services: [{
        //                 name: 'IDEE Hidrografía',
        //                 type: 'WMS',
        //                 url: 'http://servicios.idee.es/wms-inspire/hidrografia?',
        //                 white_list: ['HY.PhysicalWaters.Waterbodies', 'HY.PhysicalWaters.Wetland', 'HY.PhysicalWaters.Catchments'],
        //             }, ],
        //         },
        //         {
        //             name: 'Transporte',
        //             services: [{
        //                     name: 'IDEE - Red de transporte',
        //                     type: 'WMS',
        //                     url: 'http://servicios.idee.es/wms-inspire/transportes?',
        //                 },
        //                 {
        //                     name: 'ADIF - Red de transporte ferroviario',
        //                     type: 'WMS',
        //                     url: 'http://ideadif.adif.es/services/wms?',
        //                 },
        //             ],
        //         },
        //     ],
        //     services: [{
        //             name: 'Camino de Santiago',
        //             type: 'WMS',
        //             url: 'https://www.ign.es/wms-inspire/camino-santiago',
        //         },
        //         {
        //             name: 'Redes Geodésicas',
        //             type: 'WMS',
        //             url: 'https://www.ign.es/wms-inspire/redes-geodesicas',
        //         },
        //         {
        //             name: 'Planimetrías',
        //             type: 'WMS',
        //             url: 'https://www.ign.es/wms/minutas-cartograficas',
        //         },
        //     ],
        // };



        function crearPlugin(collapsed, http, https, posicion, codsi) {
            mp = new IDEE.plugin.FullTOC({
                position: posicion,
                collapsed: collapsed,
                http: http,
                https: https,
                codsi: (codsi || false),
                precharged: {
                    groups: [{
                            name: 'Hidrografía',
                            services: [{
                                name: 'IDEE Hidrografía',
                                type: 'WMS',
                                url: 'http://servicios.idee.es/wms-inspire/hidrografia?',
                                white_list: ['HY.PhysicalWaters.Waterbodies', 'HY.PhysicalWaters.Wetland', 'HY.PhysicalWaters.Catchments'],
                            }, ],
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
                            name: 'Camino de Santiago',
                            type: 'WMS',
                            url: 'https://www.ign.es/wms-inspire/camino-santiago',
                        },
                        {
                            name: 'Redes Geodésicas',
                            type: 'WMS',
                            url: 'https://www.ign.es/wms-inspire/redes-geodesicas',
                        },
                        {
                            name: 'Planimetrías',
                            type: 'WMS',
                            url: 'https://www.ign.es/wms/minutas-cartograficas',
                        },
                    ],
                },
            });

            map.addPlugin(mp);

            ocupacionSuelo = new IDEE.layer.WMTS({
                url: 'http://wmts-mapa-lidar.idee.es/lidar',
                name: 'EL.GridCoverageDSM',
                legend: 'Modelo Digital de Superficies LiDAR',
                matrixSet: 'GoogleMapsCompatible',
            }, {
                visibility: false,
            });

            layerUA = new IDEE.layer.WMS({
			  url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
			  name: 'AU.AdministrativeUnit',
			  legend: 'Unidad administrativa',
			  tiled: false,
			}, {});

			layerinicial = new IDEE.layer.WMS({
			  url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
			  name: 'AU.AdministrativeBoundary',
			  legend: 'Limite administrativo',
			  tiled: false,
			}, {
			  visibility: false,
			});

			map.addLayers(ocupacionSuelo);
			map.addLayers(layerUA);
			map.addLayers(layerinicial);

            let mp2 = new IDEE.plugin.ShareMap({
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
