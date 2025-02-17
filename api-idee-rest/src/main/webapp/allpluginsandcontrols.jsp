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
    <link href="plugins/ignsearch/ignsearch.ol.min.css" rel="stylesheet" />
    <link href="plugins/attributions/attributions.ol.min.css" rel="stylesheet" />
    <link href="plugins/xylocator/xylocator.ol.min.css" rel="stylesheet" />
    <link href="plugins/sharemap/sharemap.ol.min.css" rel="stylesheet" />
    <link href="plugins/mousesrs/mousesrs.ol.min.css" rel="stylesheet" />
    <link href="plugins/zoomextent/zoomextent.ol.min.css" rel="stylesheet" />
    <link href="plugins/toc/toc.ol.min.css" rel="stylesheet" />
    <link href="plugins/backimglayer/backimglayer.ol.min.css" rel="stylesheet" />
    <link href="plugins/selectionzoom/selectionzoom.ol.min.css" rel="stylesheet" />
    <link href="plugins/zoompanel/zoompanel.ol.min.css" rel="stylesheet" />
    <link href="plugins/beautytoc/beautytoc.ol.min.css" rel="stylesheet" />
    <link href="plugins/contactlink/contactlink.ol.min.css" rel="stylesheet" />
    <link href="plugins/fototecahelp/fototecahelp.ol.min.css" rel="stylesheet" />
    <link href="plugins/geometrydraw/geometrydraw.ol.min.css" rel="stylesheet" />
    <link href="plugins/georefimage/georefimage.ol.min.css" rel="stylesheet" />
    <link href="plugins/iberpixhelp/iberpixhelp.ol.min.css" rel="stylesheet" />
    <link href="plugins/ignsearchlocator/ignsearchlocator.ol.min.css" rel="stylesheet" />
    <link href="plugins/infocatastro/infocatastro.ol.min.css" rel="stylesheet" />
    <link href="plugins/information/information.ol.min.css" rel="stylesheet" />
    <link href="plugins/measurebar/measurebar.ol.min.css" rel="stylesheet" />
    <link href="plugins/overviewmap/overviewmap.ol.min.css" rel="stylesheet" />
    <link href="plugins/predefinedzoom/predefinedzoom.ol.min.css" rel="stylesheet" />
    <link href="plugins/printermap/printermap.ol.min.css" rel="stylesheet" />
    <link href="plugins/rescale/rescale.ol.min.css" rel="stylesheet" />
    <link href="plugins/selectiondraw/selectiondraw.ol.min.css" rel="stylesheet" />
    <link href="plugins/viewhistory/viewhistory.ol.min.css" rel="stylesheet" />
    <link href="plugins/transparency/transparency.ol.min.css" rel="stylesheet" />


    </link>
    <style type="text/css">
        html,
        body {
            margin: 0;
            padding: 0;
            height: 100%;
            overflow: hidden;
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
    <script type="text/javascript" src="plugins/ignsearch/ignsearch.ol.min.js"></script>
    <script type="text/javascript" src="plugins/attributions/attributions.ol.min.js"></script>
    <script type="text/javascript" src="plugins/xylocator/xylocator.ol.min.js"></script>
    <script type="text/javascript" src="plugins/sharemap/sharemap.ol.min.js"></script>
    <script type="text/javascript" src="plugins/zoomextent/zoomextent.ol.min.js"></script>
    <script type="text/javascript" src="plugins/mousesrs/mousesrs.ol.min.js"></script>
    <script type="text/javascript" src="plugins/toc/toc.ol.min.js"></script>
    <script type="text/javascript" src="plugins/backimglayer/backimglayer.ol.min.js"></script>
    <script type="text/javascript" src="plugins/selectionzoom/selectionzoom.ol.min.js"></script>
    <script type="text/javascript" src="plugins/zoompanel/zoompanel.ol.min.js"></script>
    <script type="text/javascript" src="plugins/beautytoc/beautytoc.ol.min.js"></script>
    <script type="text/javascript" src="plugins/contactlink/contactlink.ol.min.js"></script>
    <script type="text/javascript" src="plugins/fototecahelp/fototecahelp.ol.min.js"></script>
    <script type="text/javascript" src="plugins/geometrydraw/geometrydraw.ol.min.js"></script>
    <script type="text/javascript" src="plugins/georefimage/georefimage.ol.min.js"></script>
    <script type="text/javascript" src="plugins/iberpixhelp/iberpixhelp.ol.min.js"></script>
    <script type="text/javascript" src="plugins/ignsearchlocator/ignsearchlocator.ol.min.js"></script>
    <script type="text/javascript" src="plugins/infocatastro/infocatastro.ol.min.js"></script>
    <script type="text/javascript" src="plugins/information/information.ol.min.js"></script>
    <script type="text/javascript" src="plugins/measurebar/measurebar.ol.min.js"></script>
    <script type="text/javascript" src="plugins/overviewmap/overviewmap.ol.min.js"></script>
    <script type="text/javascript" src="plugins/predefinedzoom/predefinedzoom.ol.min.js"></script>
    <script type="text/javascript" src="plugins/printermap/printermap.ol.min.js"></script>
    <script type="text/javascript" src="plugins/rescale/rescale.ol.min.js"></script>
    <script type="text/javascript" src="plugins/selectiondraw/selectiondraw.ol.min.js"></script>
    <script type="text/javascript" src="plugins/viewhistory/viewhistory.ol.min.js"></script>
    <script type="text/javascript" src="plugins/transparency/transparency.ol.min.js"></script>
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
        const map = IDEE.map({
            container: 'mapjs',
            controls: ['panzoom', 'scale*true', 'scaleline', 'rotate', 'location', 'getfeatureinfo'],
            zoom: 5,
            maxZoom: 20,
            minZoom: 4,
            center: [-467062.8225, 4683459.6216],
        });

        let wmts = new IDEE.layer.WMTS({
            url: "http://www.ideandalucia.es/geowebcache/service/wmts",
            name: "toporaster",
            matrixSet: "EPSG:25830",
            legend: "Toporaster"
        }, {
            format: 'image/png'
        });
        map.addWMTS(wmts);

        const wms = new IDEE.layer.WMS({
            url: 'http://www.ign.es/wms-inspire/unidades-administrativas?',
            name: 'AU.AdministrativeBoundary',
            legend: 'Limite administrativo',
            tiled: false,
        }, {});
        map.addWMS(wms);

        const layerinicial = new IDEE.layer.WMS({
            url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
            name: 'AU.AdministrativeBoundary',
            legend: 'Limite administrativo',
            tiled: false,
        }, {});

        const layerUA = new IDEE.layer.WMS({
            url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
            name: 'AU.AdministrativeUnit',
            legend: 'Unidad administrativa',
            tiled: false
        }, {});

        map.addLayers([layerinicial, layerUA]);

        const mp = new IDEE.plugin.IGNSearch({
            servicesToSearch: 'gn',
            maxResults: 10,
            noProcess: 'poblacion',
            countryCode: 'es',
            isCollapsed: false,
            position: 'TL',
            reverse: true,

            urlCandidates: 'http://servicios-de-busqueda-publico.desarrollo.guadaltel.es/geocoder/api/geocoder/candidatesJsonp',
            urlFind: 'http://servicios-de-busqueda-publico.desarrollo.guadaltel.es/geocoder/api/geocoder/findJsonp',
            urlReverse: 'http://servicios-de-busqueda-publico.desarrollo.guadaltel.es/geocoder/api/geocoder/reverseGeocode',
        });
        const mp2 = new IDEE.plugin.Attributions({
            mode: 1,
            scale: 10000,
        });

        const mp3 = new IDEE.plugin.ShareMap({
            baseUrl: window.location.href.substring(0, window.location.href.indexOf('api-idee')) + "api-idee/",,
            position: 'BR',
        });
        const mp4 = new IDEE.plugin.XYLocator({
            position: 'TL',
        });
        const mp6 = new IDEE.plugin.ZoomExtent();
        const mp7 = new IDEE.plugin.MouseSRS({
            srs: 'EPSG:4326',
            label: 'WGS84',
            precision: 6,
            geoDecimalDigits: 4,
            utmDecimalDigits: 2,
        });

        const mp8 = new IDEE.plugin.TOC({
            collapsed: true,
        });

        const mp9 = new IDEE.plugin.BackImgLayer({
            position: 'TR',
            collapsible: true,
            collapsed: true,
            layerId: 0,
            layerVisibility: true,
            layerOpts: [{
                    id: 'mapa',
                    preview: 'plugins/backimglayer/images/svqmapa.png',
                    title: 'Mapa',
                    layers: [new IDEE.layer.WMTS({
                        url: 'http://www.ign.es/wmts/ign-base?',
                        name: 'IGNBaseTodo',
                        legend: 'Mapa IGN',
                        matrixSet: 'GoogleMapsCompatible',
                        transparent: false,
                        displayInLayerSwitcher: false,
                        queryable: false,
                        visible: true,
                        format: 'image/jpeg',
                    })],
                },
                {
                    id: 'imagen',
                    title: 'Imagen',
                    preview: 'plugins/backimglayer/images/svqimagen.png',
                    layers: [new IDEE.layer.WMTS({
                        url: 'http://www.ign.es/wmts/pnoa-ma?',
                        name: 'OI.OrthoimageCoverage',
                        legend: 'Imagen (PNOA)',
                        matrixSet: 'GoogleMapsCompatible',
                        transparent: false,
                        displayInLayerSwitcher: false,
                        queryable: false,
                        visible: true,
                        format: 'image/jpeg',
                    })],
                },
                {
                    id: 'hibrido',
                    title: 'Híbrido',
                    preview: 'plugins/backimglayer/images/svqhibrid.png',
                    layers: [new IDEE.layer.WMTS({
                            url: 'http://www.ign.es/wmts/pnoa-ma?',
                            name: 'OI.OrthoimageCoverage',
                            legend: 'Imagen (PNOA)',
                            matrixSet: 'GoogleMapsCompatible',
                            transparent: true,
                            displayInLayerSwitcher: false,
                            queryable: false,
                            visible: true,
                            format: 'image/jpeg',
                        }),
                        new IDEE.layer.WMTS({
                            url: 'http://www.ign.es/wmts/ign-base?',
                            name: 'IGNBaseOrto',
                            matrixSet: 'GoogleMapsCompatible',
                            legend: 'Mapa IGN',
                            transparent: false,
                            displayInLayerSwitcher: false,
                            queryable: false,
                            visible: true,
                            format: 'image/png',
                        })
                    ],
                },
                {
                    id: 'lidar',
                    preview: 'plugins/backimglayer/images/svqlidar.png',
                    title: 'LIDAR',
                    layers: [new IDEE.layer.WMTS({
                        url: 'https://wmts-mapa-lidar.idee.es/lidar?',
                        name: 'EL.GridCoverageDSM',
                        legend: 'Modelo Digital de Superficies LiDAR',
                        matrixSet: 'GoogleMapsCompatible',
                        transparent: false,
                        displayInLayerSwitcher: false,
                        queryable: false,
                        visible: true,
                        format: 'image/png',
                    })],
                },
            ],
        });

        const mp10 = new IDEE.plugin.SelectionZoom({
            position: 'TL',
            collapsible: true,
            collapsed: true,
            layerId: 0,
            layerVisibility: true,
            layerOpts: [{
                    id: 'peninsula',
                    preview: 'plugins/selectionzoom/images/espana.png',
                    title: 'Peninsula',
                    bbox: {
                        x: {
                            min: -1200091.444315327,
                            max: 365338.89496508264,
                        },
                        y: {
                            min: 4348955.797933925,
                            max: 5441088.058207252,
                        },
                    },
                    zoom: 7,
                },
                {
                    id: 'canarias',
                    title: 'Canarias',
                    preview: 'plugins/selectionzoom/images/canarias.png',
                    bbox: {
                        x: {
                            min: -2170190.6639824593,
                            max: -1387475.4943422542,
                        },
                        y: {
                            min: 3091778.038884449,
                            max: 3637844.1689537475,
                        },
                    },
                    zoom: 8,
                },
                {
                    id: 'baleares',
                    title: 'Baleares',
                    preview: 'plugins/selectionzoom/images/baleares.png',
                    bbox: {
                        x: {
                            min: 115720.89020469127,
                            max: 507078.4750247937,
                        },
                        y: {
                            min: 4658411.436032817,
                            max: 4931444.501067467,
                        },
                    },
                    zoom: 9,
                },
                {
                    id: 'ceuta',
                    preview: 'plugins/selectionzoom/images/ceuta.png',
                    title: 'Ceuta',
                    bbox: {
                        x: {
                            min: -599755.2558583047,
                            max: -587525.3313326766,
                        },
                        y: {
                            min: 4281734.817081453,
                            max: 4290267.100363785,
                        },
                    },
                    zoom: 14,
                },
                {
                    id: 'melilla',
                    preview: 'plugins/selectionzoom/images/melilla.png',
                    title: 'Melilla',
                    bbox: {
                        x: {
                            min: -334717.4178261766,
                            max: -322487.4933005484,
                        },
                        y: {
                            min: 4199504.016876071,
                            max: 4208036.300158403,
                        },
                    },
                    zoom: 14,
                },
            ],
        });


        const mp11 = new IDEE.plugin.ZoomPanel({
            position: 'TL',
            collapsible: true,
            collapsed: true,
            layerId: 0,
            layerVisibility: true,
            projection: 'EPSG:4326'
        });

        const mp22 = new IDEE.plugin.BeautyTOC({
            collapsed: true,
            position: 'TR',
        });

        const mp23 = new IDEE.plugin.ContactLink({
            position: 'BR',
        });

        const mp24 = new IDEE.plugin.FototecaHelp({
            position: 'TR',
            helpLink: 'http://fototeca.cnig.es/help_es.pdf',
            contactEmail: 'fototeca@cnig.es',
        });

        const mp25 = new IDEE.plugin.GeometryDraw({
            collapsed: true,
            collapsible: true,
            position: 'TR',
        });

        const mp26 = new IDEE.plugin.Georefimage({
            collapsed: true,
            collapsible: true,
            position: 'TR',
        });

        const mp27 = new IDEE.plugin.IberpixHelp({
            position: 'TR',
            helpLink: 'https://www.ign.es/iberpix2/visor/help/Manual%20de%20Usuario.html?1Introduccion.html',
        });

        const mp28 = new IDEE.plugin.IGNSearchLocator({
            position: 'TL'
        });

        const mp29 = new IDEE.plugin.InfoCatastro({
            position: 'TR',
            tooltip: 'Consultar Catastro',
        });

        const mp30 = new IDEE.plugin.Information({
            position: 'TR',
        });

        const mp31 = new IDEE.plugin.MeasureBar();

        const mp32 = new IDEE.plugin.OverviewMap({
            position: 'BR',
            fixed: true,
            zoom: 4,
            baseLayer: 'WMTS*http://www.ign.es/wmts/ign-base?*IGNBaseTodo*GoogleMapsCompatible*Mapa IGN*false*image/jpeg*false*false*true',

        }, {
            collapsed: false,
            collapsible: true,

        });

        const mp33 = new IDEE.plugin.PredefinedZoom({
            position: 'TL',
            savedZooms: [{
                name: 'Zoom a la extensión del mapa',
                bbox: [-2563852.2025329857, 3178130.5783665525, 567008.4760278338, 5443112.600512895],
            }],
        });

        const mp34 = new IDEE.plugin.PrinterMap({
            collapsed: true,
            collapsible: true,
            position: 'TR',
        });

        const mp35 = new IDEE.plugin.Rescale({
            collapsible: true,
            collapsed: true,
            position: 'BL',
        });

        const mp36 = new IDEE.plugin.SelectionDraw({
            projection: 'EPSG:4326'
        });

        const mp37 = new IDEE.plugin.ViewHistory({
            position: 'TL',
        });

        const mp38 = new IDEE.plugin.Transparency({
            position: 'TL',
            layers: ['toporaster', 'AU.AdministrativeBoundary'],
            collapsible: false
        });

        map.addPlugin(mp);
        map.addPlugin(mp2);
        map.addPlugin(mp3);
        map.addPlugin(mp4);
        map.addPlugin(mp6);
        map.addPlugin(mp7);
        map.addPlugin(mp8);
        map.addPlugin(mp9);
        map.addPlugin(mp10);
        map.addPlugin(mp11);
        map.addPlugin(mp22);
        map.addPlugin(mp23);
        map.addPlugin(mp24);
        map.addPlugin(mp25);
        map.addPlugin(mp26);
        map.addPlugin(mp27);
        map.addPlugin(mp28);
        map.addPlugin(mp29);
        map.addPlugin(mp30);
        map.addPlugin(mp31);
        map.addPlugin(mp32);
        map.addPlugin(mp33);
        map.addPlugin(mp34);
        map.addPlugin(mp35);
        map.addPlugin(mp36);
        map.addPlugin(mp37);
        map.addPlugin(mp38);
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
