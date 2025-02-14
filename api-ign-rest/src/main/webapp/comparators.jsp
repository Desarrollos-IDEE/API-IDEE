<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
    <%@ page import="es.cnig.mapea.plugins.PluginsManager" %>
        <%@ page import="es.cnig.mapea.parameter.adapter.ParametersAdapterV3ToV4" %>
            <%@ page import="java.util.Map" %>

                <!DOCTYPE html>
                <html lang="en">

                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport"
                        content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">
                    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
                    <meta name="mapea" content="yes">
                    <title>Visor base</title>
                    <link type="text/css" rel="stylesheet" href="assets/css/apiign.ol.min.css">
                    <link href="plugins/comparators/comparators.ol.min.css" rel="stylesheet" />
                    <!-- Necesario para compartir los plugins en el mapa -->
                    <link href="plugins/beautytoc/beautytoc.ol.min.css" rel="stylesheet" />
                    <link href="plugins/topographicprofile/topographicprofile.ol.min.css" rel="stylesheet" />
                    <link href="plugins/toc/toc.ol.min.css" rel="stylesheet" />
                    <link href="plugins/viewshed/viewshed.ol.min.css" rel="stylesheet" />
                    <link href="plugins/ignsearchlocator/ignsearchlocator.ol.min.css" rel="stylesheet" />
                    <link href="plugins/incicarto/incicarto.ol.min.css" rel="stylesheet" />
                    <link href="plugins/geometrydraw/geometrydraw.ol.min.css" rel="stylesheet" />
                    <link href="plugins/infocoordinates/infocoordinates.ol.min.css" rel="stylesheet" />
                    <link href="plugins/measurebar/measurebar.ol.min.css" rel="stylesheet" />
                    <link href="plugins/queryattributes/queryattributes.ol.min.css" rel="stylesheet" />
                    <link href="plugins/rescale/rescale.ol.min.css" rel="stylesheet" />
                    <link href="plugins/printermap/printermap.ol.min.css" rel="stylesheet" />
                    <link href="plugins/selectionzoom/selectionzoom.ol.min.css" rel="stylesheet" />
                    <link href="plugins/buffer/buffer.ol.min.css" rel="stylesheet" />
                    <link href="plugins/xylocator/xylocator.ol.min.css" rel="stylesheet" />
                    <link href="plugins/overviewmap/overviewmap.ol.min.css" rel="stylesheet" />
                    <link href="plugins/calendar/calendar.ol.min.css" rel="stylesheet" />
                    <link href="plugins/contactlink/contactlink.ol.min.css" rel="stylesheet" />
                    <link href="plugins/ignsearch/ignsearch.ol.min.css" rel="stylesheet" />
                    <link href="plugins/georefimage2/georefimage2.ol.min.css" rel="stylesheet" />
                    <link href="plugins/selectiondraw/selectiondraw.ol.min.css" rel="stylesheet" />
                    <link href="plugins/mousesrs/mousesrs.ol.min.css" rel="stylesheet" />
                    <link href="plugins/popup/popup.ol.min.css" rel="stylesheet" />
                    <link href="plugins/vectors/vectors.ol.min.css" rel="stylesheet" />
                    <link href="plugins/sharemap/sharemap.ol.min.css" rel="stylesheet" />
                    <link href="plugins/georefimage/georefimage.ol.min.css" rel="stylesheet" />
                    <link href="plugins/infocatastro/infocatastro.ol.min.css" rel="stylesheet" />
                    <link href="plugins/timeline/timeline.ol.min.css" rel="stylesheet" />
                    <link href="plugins/backimglayer/backimglayer.ol.min.css" rel="stylesheet" />
                    <link href="plugins/information/information.ol.min.css" rel="stylesheet" />
                    <link href="plugins/viewhistory/viewhistory.ol.min.css" rel="stylesheet" />
                    <link href="plugins/zoompanel/zoompanel.ol.min.css" rel="stylesheet" />
                    <link href="plugins/viewmanagement/viewmanagement.ol.min.css" rel="stylesheet" />
                    <link href="plugins/locator/locator.ol.min.css" rel="stylesheet" />
                    <link href="plugins/zoomextent/zoomextent.ol.min.css" rel="stylesheet" />
                    <link href="plugins/attributions/attributions.ol.min.css" rel="stylesheet" />
                    <link href="plugins/predefinedzoom/predefinedzoom.ol.min.css" rel="stylesheet" />
                    <link href="plugins/stylemanager/stylemanager.ol.min.css" rel="stylesheet" />
                    <link href="plugins/layerswitcher/layerswitcher.ol.min.css" rel="stylesheet" />

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
                    <% Map<String, String[]> parameterMap = request.getParameterMap();
                        PluginsManager.init (getServletContext());
                        Map<String, String[]> adaptedParams = ParametersAdapterV3ToV4.adapt(parameterMap);
                            String[] cssfiles = PluginsManager.getCSSFiles(adaptedParams);
                            for (int i = 0; i < cssfiles.length; i++) { String cssfile=cssfiles[i]; %>
                                <link type="text/css" rel="stylesheet" href="plugins/<%=cssfile%>">
                                </link>
                                <% } %>
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

                        <label for="selectDraggable">Selector de draggable</label>
                        <select name="selectDraggable" id="selectDraggable">
                            <option value=""></option>
                            <option value="true" selected="selected">true</option>
                            <option value="false">false</option>
                        </select>

                        <label for="enabledKeyFunctions">Activa atajos de teclado</label>
                        <select name="enabledKeyFunctions" id="enabledKeyFunctions">
                            <option value=""></option>
                            <option value="true" selected="selected">true</option>
                            <option value="false">false</option>
                        </select>

                        <label for="defaultCompareMode">Selector de modo por defecto</label>
                        <select name="defaultCompareMode" id="defaultCompareMode">
                            <option value="none" selected="selected">none</option>
                            <option value="mirror">mirror</option>
                            <option value="curtain">curtain</option>
                            <option value="spyeye">spyeye</option>
                        </select>

                        <label for="listLayers">Introducir capas</label>
                        <input type="text" id="listLayers" value="[
                        'WMS*Huellas Sentinel2*https://wms-satelites-historicos.idee.es/satelites-historicos*teselas_sentinel2_espanna*true',
                        'WMS*Invierno 2022 falso color natural*https://wms-satelites-historicos.idee.es/satelites-historicos*SENTINEL.2022invierno_432-1184*true',
                        'WMS*Invierno 2022 falso color infrarrojo*https://wms-satelites-historicos.idee.es/satelites-historicos*SENTINEL.2022invierno_843*true',
                        'WMS*Filomena*https://wms-satelites-historicos.idee.es/satelites-historicos*Filomena*true'
                        ]">

                        <label for="lyrsMirrorMinZindex">Introducir z-index de las capas</label>
                        <input type="text" id="lyrsMirrorMinZindex" value="10">

                        <label for="tooltipComparator">Tooltip del plugin</label>
                        <input type="text" id="tooltipComparator" value="tooltipComparator">

                        <label for="transparencyParams_radius">Introducir radio del control transparencyParams</label>
                        <input type="text" id="transparencyParams_radius" value="50">

                        <label for="transparencyParams_maxRadius">Introducir radio máximo del control
                            transparencyParams</label>
                        <input type="text" id="transparencyParams_maxRadius" value="100">

                        <label for="transparencyParams_minRadius">Introducir radio mínimo del control
                            transparencyParams</label>
                        <input type="text" id="transparencyParams_minRadius" value="10">


                        <label for="transparencyParams_tooltip">Introducir tooltip control transparencyParams</label>
                        <input type="text" id="transparencyParams_tooltip" value="tooltipTransparency">


                        <label for="lyrcompareParams_staticDivision">Introducir staticDivision del control
                            lyrcompareParams</label>
                        <input type="text" id="lyrcompareParams_staticDivision" value="2">

                        <label for="lyrcompareParams_defaultLyrA">Introducir defaultLyrA del control
                            lyrcompareParams</label>
                        <input type="text" id="lyrcompareParams_defaultLyrA" value="3">

                        <label for="lyrcompareParams_defaultLyrB">Introducir defaultLyrB del control
                            lyrcompareParams</label>
                        <input type="text" id="lyrcompareParams_defaultLyrB" value="2">

                        <label for="lyrcompareParams_defaultLyrC">Introducir defaultLyrC del control
                            lyrcompareParams</label>
                        <input type="text" id="lyrcompareParams_defaultLyrC" value="1">

                        <label for="lyrcompareParams_defaultLyrD">Introducir defaultLyrD del control
                            lyrcompareParams</label>
                        <input type="text" id="lyrcompareParams_defaultLyrD" value="0">

                        <label for="lyrcompareParams_opacityVal">Introducir opacityVal del control
                            lyrcompareParams</label>
                        <input type="text" id="lyrcompareParams_opacityVal" value="100">

                        <label for="lyrcompareParams_tooltip">Introducir tooltip del control lyrcompareParams</label>
                        <input type="text" id="lyrcompareParams_tooltip" value="tooltipLyrCompare">

                        <label for="lyrcompareParams_defaultCompareViz">Introducir defaultCompareViz del control
                            lyrcompareParams</label>
                        <input type="text" id="lyrcompareParams_defaultCompareViz" value="2">


                        <label for="mirrorpanelParams_showCursors">Introducir showCursors del control
                            mirrorpanelParams</label>
                        <select name="mirrorpanelParams_showCursors" id="mirrorpanelParams_showCursors">
                            <option value=""></option>
                            <option value="true" selected="selected">true</option>
                            <option value="false">false</option>
                        </select>


                        <label for="mirrorpanelParams_principalMap">Introducir principalMap del control
                            mirrorpanelParams</label>
                        <select name="mirrorpanelParams_principalMap" id="mirrorpanelParams_principalMap">
                            <option value=""></option>
                            <option value="true" selected="selected">true</option>
                            <option value="false">false</option>
                        </select>

                        <label for="mirrorpanelParams_enabledDisplayInLayerSwitcher">Introducir
                            enabledDisplayInLayerSwitcher del control mirrorpanelParams</label>
                        <select name="mirrorpanelParams_enabledDisplayInLayerSwitcher"
                            id="mirrorpanelParams_enabledDisplayInLayerSwitcher">
                            <option value=""></option>
                            <option value="true" selected="selected">true</option>
                            <option value="false">false</option>
                        </select>

                        <label for="mirrorpanelParams_defaultCompareViz">Introducir defaultCompareViz del control
                            mirrorpanelParams</label>
                        <input type="text" id="mirrorpanelParams_defaultCompareViz" value="2">

                        <label for="mirrorpanelParams_modeVizTypes">Introducir modeVizTypes del control
                            mirrorpanelParams</label>
                        <input type="text" id="mirrorpanelParams_modeVizTypes" value="[0, 1, 2, 3, 5]">

                        <label for="mirrorpanelParams_tooltip">Introducir tooltip del control mirrorpanelParams</label>
                        <input type="text" id="mirrorpanelParams_tooltip" value="tooltipMirror">

                        <label for="mirrorpanelParams_enabledControlsPlugins">Introducir enabledControlsPlugins del
                            control mirrorpanelParams</label>
                        <input type="text" id="mirrorpanelParams_enabledControlsPlugins" value="{}">

                        <label for="windowsyncParams_controls">Introducir controls del
                            control windowsyncParams</label>
                        <input type="text" id="windowsyncParams_controls" value="[]">

                        <label for="windowsyncParams_plugins">Introducir plugins del
                            control windowsyncParams</label>
                        <input type="text" id="windowsyncParams_plugins" value="[]">

                        <input type="button" value="Eliminar Plugin" name="eliminar" id="botonEliminar">
                    </div>

                    <div id="mapjs" class="m-container"></div>

                    <script type="text/javascript" src="vendor/browser-polyfill.js"></script>
                    <script type="text/javascript" src="js/apiign.ol.min.js"></script>
                    <script type="text/javascript" src="js/configuration.js"></script>
                    <script type="text/javascript" src="plugins/comparators/comparators.ol.min.js"></script>
                    <!-- Necesario para compartir los plugins en el mapa -->
                    <script type="text/javascript" src="plugins/beautytoc/beautytoc.ol.min.js"></script>
                    <script type="text/javascript"
                        src="plugins/topographicprofile/topographicprofile.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/toc/toc.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/viewshed/viewshed.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/ignsearchlocator/ignsearchlocator.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/incicarto/incicarto.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/geometrydraw/geometrydraw.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/infocoordinates/infocoordinates.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/measurebar/measurebar.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/queryattributes/queryattributes.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/rescale/rescale.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/printermap/printermap.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/selectionzoom/selectionzoom.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/buffer/buffer.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/xylocator/xylocator.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/overviewmap/overviewmap.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/calendar/calendar.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/contactlink/contactlink.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/ignsearch/ignsearch.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/georefimage2/georefimage2.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/selectiondraw/selectiondraw.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/mousesrs/mousesrs.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/popup/popup.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/vectors/vectors.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/sharemap/sharemap.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/georefimage/georefimage.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/infocatastro/infocatastro.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/timeline/timeline.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/backimglayer/backimglayer.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/information/information.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/viewhistory/viewhistory.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/zoompanel/zoompanel.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/viewmanagement/viewmanagement.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/locator/locator.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/zoomextent/zoomextent.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/attributions/attributions.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/predefinedzoom/predefinedzoom.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/stylemanager/stylemanager.ol.min.js"></script>
                    <script type="text/javascript" src="plugins/layerswitcher/layerswitcher.ol.min.js"></script>
                    
                    <% String[] jsfiles=PluginsManager.getJSFiles(adaptedParams); for (int i=0; i < jsfiles.length; i++)
                        { String jsfile=jsfiles[i]; %>
                        <script type="text/javascript" src="plugins/<%=jsfile%>"></script>

                        <% } %>
                            <script type="text/javascript">
                                const urlParams = new URLSearchParams(window.location.search);
                                M.language.setLang(urlParams.get('language') || 'es');

                                const map = M.map({
                                    container: 'mapjs',
                                    center: [-467062.8225, 4683459.6216],
                                    zoom: 6,
                                });

                                let mp;

                                const selectPosicion = document.getElementById("selectPosicion");
                                const selectCollapsed = document.getElementById("selectCollapsed");
                                const selectCollapsible = document.getElementById("selectCollapsible");
                                const selectEnabledKeyFunctions = document.getElementById("enabledKeyFunctions");
                                const selectDefaultCompareMode = document.getElementById("defaultCompareMode");
                                const selectListLayers = document.getElementById("listLayers");
                                const selectLyrsMirrorMinZindex = document.getElementById("lyrsMirrorMinZindex");
                                const selectTransparencyParams_radius = document.getElementById("transparencyParams_radius");
                                const selectTransparencyParams_maxRadius = document.getElementById("transparencyParams_maxRadius");
                                const selectTransparencyParams_minRadius = document.getElementById("transparencyParams_minRadius");
                                const selectTransparencyParams_tooltip = document.getElementById("transparencyParams_tooltip");
                                const selectLyrcompareParams_staticDivision = document.getElementById("lyrcompareParams_staticDivision");
                                const selectLyrcompareParams_defaultLyrA = document.getElementById("lyrcompareParams_defaultLyrA");
                                const selectLyrcompareParams_defaultLyrB = document.getElementById("lyrcompareParams_defaultLyrB");
                                const selectLyrcompareParams_defaultLyrC = document.getElementById("lyrcompareParams_defaultLyrC");
                                const selectLyrcompareParams_defaultLyrD = document.getElementById("lyrcompareParams_defaultLyrD");
                                const selectLyrcompareParams_opacityVal = document.getElementById("lyrcompareParams_opacityVal");
                                const selectLyrcompareParams_tooltip = document.getElementById("lyrcompareParams_tooltip");
                                const selectLyrcompareParams_defaultCompareViz = document.getElementById("lyrcompareParams_defaultCompareViz");
                                const selectMirrorpanelParams_showCursors = document.getElementById("mirrorpanelParams_showCursors");
                                const selectMirrorpanelParams_principalMap = document.getElementById("mirrorpanelParams_principalMap");
                                const selectMirrorpanelParams_enabledDisplayInLayerSwitcher = document.getElementById("mirrorpanelParams_enabledDisplayInLayerSwitcher");
                                const selectMirrorpanelParams_defaultCompareViz = document.getElementById("mirrorpanelParams_defaultCompareViz");
                                const selectMirrorpanelParams_modeVizTypes = document.getElementById("mirrorpanelParams_modeVizTypes");
                                const selectMirrorpanelParams_tooltip = document.getElementById("mirrorpanelParams_tooltip");
                                const selectMirrorpanelParams_enabledControlsPlugins = document.getElementById("mirrorpanelParams_enabledControlsPlugins");
                                const selectwindowsyncParams_controls = document.getElementById("windowsyncParams_controls");
                                const selectwindowsyncParams_plugins = document.getElementById("windowsyncParams_plugins");
                                const selectDraggableParams = document.getElementById("selectDraggable");
                                const tooltipComparatorParams = document.getElementById("tooltipComparator");


                                selectPosicion.addEventListener('change', cambiarTest);
                                selectCollapsed.addEventListener('change', cambiarTest);
                                selectCollapsible.addEventListener('change', cambiarTest);
                                selectEnabledKeyFunctions.addEventListener('change', cambiarTest);
                                selectDefaultCompareMode.addEventListener('change', cambiarTest);
                                selectListLayers.addEventListener('change', cambiarTest);
                                selectLyrsMirrorMinZindex.addEventListener('change', cambiarTest);
                                selectTransparencyParams_radius.addEventListener('change', cambiarTest);
                                selectTransparencyParams_maxRadius.addEventListener('change', cambiarTest);
                                selectTransparencyParams_minRadius.addEventListener('change', cambiarTest);
                                selectTransparencyParams_tooltip.addEventListener('change', cambiarTest);
                                selectLyrcompareParams_staticDivision.addEventListener('change', cambiarTest);
                                selectLyrcompareParams_defaultLyrA.addEventListener('change', cambiarTest);
                                selectLyrcompareParams_defaultLyrB.addEventListener('change', cambiarTest);
                                selectLyrcompareParams_defaultLyrC.addEventListener('change', cambiarTest);
                                selectLyrcompareParams_defaultLyrD.addEventListener('change', cambiarTest);
                                selectLyrcompareParams_opacityVal.addEventListener('change', cambiarTest);
                                selectLyrcompareParams_tooltip.addEventListener('change', cambiarTest);
                                selectLyrcompareParams_defaultCompareViz.addEventListener('change', cambiarTest);
                                selectMirrorpanelParams_showCursors.addEventListener('change', cambiarTest);
                                selectMirrorpanelParams_principalMap.addEventListener('change', cambiarTest);
                                selectMirrorpanelParams_enabledDisplayInLayerSwitcher.addEventListener('change', cambiarTest);
                                selectMirrorpanelParams_defaultCompareViz.addEventListener('change', cambiarTest);
                                selectMirrorpanelParams_modeVizTypes.addEventListener('change', cambiarTest);
                                selectMirrorpanelParams_tooltip.addEventListener('change', cambiarTest);
                                selectMirrorpanelParams_enabledControlsPlugins.addEventListener('change', cambiarTest);
                                selectwindowsyncParams_controls.addEventListener('change', cambiarTest);
                                selectwindowsyncParams_plugins.addEventListener('change', cambiarTest);
                                selectDraggableParams.addEventListener('change', cambiarTest);
                                tooltipComparatorParams.addEventListener('change', cambiarTest);

                                /* Creación por defecto */
                                crearPlugin({
                                    position: 'TR',
                                    collapsed: false,
                                    collapsible: true,
                                    defaultCompareMode: 'none', // mirror - curtain - spyeye - none
                                    listLayers: [
                                        'WMS*Huellas Sentinel2*https://wms-satelites-historicos.idee.es/satelites-historicos*teselas_sentinel2_espanna*true',
                                        'WMS*Invierno 2022 falso color natural*https://wms-satelites-historicos.idee.es/satelites-historicos*SENTINEL.2022invierno_432-1184*true',
                                        'WMS*Invierno 2022 falso color infrarrojo*https://wms-satelites-historicos.idee.es/satelites-historicos*SENTINEL.2022invierno_843*true',
                                        'WMS*Filomena*https://wms-satelites-historicos.idee.es/satelites-historicos*Filomena*true',
                                    ],
                                    enabledKeyFunctions: true,
                                    lyrsMirrorMinZindex: 10,
                                    transparencyParams: {
                                        radius: 50,
                                        maxRadius: 100,
                                        minRadius: 10,
                                        tooltip: 'tooltipTransparency',
                                    },
                                    lyrcompareParams: {
                                        staticDivision: 2,
                                        defaultLyrA: 3,
                                        defaultLyrB: 2,
                                        defaultLyrC: 1,
                                        defaultLyrD: 0,
                                        opacityVal: 100,
                                        tooltip: 'tooltipLyrCompare',
                                        defaultCompareViz: 2,
                                    },
                                    mirrorpanelParams: {
                                        showCursors: false,
                                        principalMap: true,
                                        enabledControlsPlugins: {
                                            map2: {
                                                ShareMap: {}, // Opciones por defecto
                                            },
                                            map3: {
                                                controls: ['scale'],
                                            },
                                        },
                                        enabledDisplayInLayerSwitcher: true,
                                        defaultCompareViz: 2,
                                        modeVizTypes: [0, 1, 2, 3, 5], // 0 - 9
                                        tooltip: 'tooltipMirror',
                                    },
                                    windowsyncParams: {
                                        controls: ['scale'],
                                        plugins: [
                                            {
                                                name: 'Layerswitcher',
                                                param: {
                                                    position: 'TL',
                                                },
                                            },
                                        ],
                                    },
                                });


                                function cambiarTest() {
                                    const posicionValor = selectPosicion.options[selectPosicion.selectedIndex].value;
                                    const collapsedValor = selectCollapsed.options[selectCollapsed.selectedIndex].value === 'true';
                                    const collapsibleValor = selectCollapsible.options[selectCollapsible.selectedIndex].value === 'true';
                                    const enabledKeyFunctionsValor = selectEnabledKeyFunctions.options[selectEnabledKeyFunctions.selectedIndex].value === 'true';
                                    const defaultCompareModeValor = selectDefaultCompareMode.options[selectDefaultCompareMode.selectedIndex].value;
                                    const listLayersValor = JSON.parse(selectListLayers.value.replace(/'/g, "\""));
                                    const lyrsMirrorMinZindexValor = Number(selectLyrsMirrorMinZindex.value);
                                    const transparencyParams_radiusValor = Number(selectTransparencyParams_radius.value);
                                    const transparencyParams_maxRadiusValor = Number(selectTransparencyParams_maxRadius.value);
                                    const transparencyParams_minRadiusValor = Number(selectTransparencyParams_minRadius.value);
                                    const transparencyParams_tooltipValor = selectTransparencyParams_tooltip.value;
                                    const lyrcompareParams_staticDivisionValor = Number(selectLyrcompareParams_staticDivision.value);
                                    const lyrcompareParams_defaultLyrAValor = Number(selectLyrcompareParams_defaultLyrA.value);
                                    const lyrcompareParams_defaultLyrBValor = Number(selectLyrcompareParams_defaultLyrB.value);
                                    const lyrcompareParams_defaultLyrCValor = Number(selectLyrcompareParams_defaultLyrC.value);
                                    const lyrcompareParams_defaultLyrDValor = Number(selectLyrcompareParams_defaultLyrD.value);
                                    const lyrcompareParams_opacityValValor = Number(selectLyrcompareParams_opacityVal.value);
                                    const lyrcompareParams_tooltipValor = selectLyrcompareParams_tooltip.value;
                                    const lyrcompareParams_defaultCompareVizValor = Number(selectLyrcompareParams_defaultCompareViz.value);
                                    const mirrorpanelParams_showCursorsValor = selectMirrorpanelParams_showCursors.options[selectMirrorpanelParams_showCursors.selectedIndex].value === 'true';
                                    const mirrorpanelParams_principalMapValor = selectMirrorpanelParams_principalMap.options[selectMirrorpanelParams_principalMap.selectedIndex].value === 'true';
                                    const mirrorpanelParams_enabledDisplayInLayerSwitcherValor = selectMirrorpanelParams_enabledDisplayInLayerSwitcher.options[selectMirrorpanelParams_enabledDisplayInLayerSwitcher.selectedIndex].value === 'true';
                                    const mirrorpanelParams_defaultCompareVizValor = Number(selectMirrorpanelParams_defaultCompareViz.value);
                                    const mirrorpanelParams_modeVizTypesValor = JSON.parse(selectMirrorpanelParams_modeVizTypes.value);
                                    const mirrorpanelParams_tooltipValor = selectMirrorpanelParams_tooltip.value;
                                    const mirrorpanelParams_enabledControlsPluginsValor = JSON.parse(selectMirrorpanelParams_enabledControlsPlugins.value);
                                    const windowsyncParams_controlsValor = JSON.parse(selectwindowsyncParams_controls.value);
                                    const windowsyncParams_pluginsValor = JSON.parse(selectwindowsyncParams_plugins.value);
                                    const draggableValor = selectDraggableParams.options[selectDraggableParams.selectedIndex].value === 'true';
                                    const tooltipComparatorValor = tooltipComparatorParams.value;


                                    map.removePlugins(mp);
                                    setTimeout(() => {
                                        crearPlugin({
                                            position: posicionValor,
                                            collapsed: collapsedValor,
                                            collapsible: collapsibleValor,
                                            defaultCompareMode: defaultCompareModeValor, // mirror - curtain - spyeye - none
                                            listLayers: listLayersValor,
                                            tooltip: tooltipComparatorValor,
                                            isDraggable: draggableValor,
                                            enabledKeyFunctions: enabledKeyFunctionsValor,
                                            lyrsMirrorMinZindex: lyrsMirrorMinZindexValor,
                                            transparencyParams: {
                                                radius: transparencyParams_radiusValor,
                                                maxRadius: transparencyParams_maxRadiusValor,
                                                minRadius: transparencyParams_minRadiusValor,
                                                tooltip: transparencyParams_tooltipValor,
                                            },
                                            lyrcompareParams: {
                                                staticDivision: lyrcompareParams_staticDivisionValor,
                                                defaultLyrA: lyrcompareParams_defaultLyrAValor,
                                                defaultLyrB: lyrcompareParams_defaultLyrBValor,
                                                defaultLyrC: lyrcompareParams_defaultLyrCValor,
                                                defaultLyrD: lyrcompareParams_defaultLyrDValor,
                                                opacityVal: lyrcompareParams_opacityValValor,
                                                tooltip: lyrcompareParams_tooltipValor,
                                                defaultCompareViz: lyrcompareParams_defaultCompareVizValor,
                                            },
                                            mirrorpanelParams: {
                                                showCursors: mirrorpanelParams_showCursorsValor,
                                                principalMap: mirrorpanelParams_principalMapValor,
                                                enabledControlsPlugins: mirrorpanelParams_enabledControlsPluginsValor,
                                                enabledDisplayInLayerSwitcher: mirrorpanelParams_enabledDisplayInLayerSwitcherValor,
                                                defaultCompareViz: mirrorpanelParams_defaultCompareVizValor,
                                                modeVizTypes: mirrorpanelParams_modeVizTypesValor,
                                                tooltip: mirrorpanelParams_tooltipValor,
                                            },
                                            windowsyncParams: {
                                                controls: windowsyncParams_controlsValor,
                                                plugins: windowsyncParams_pluginsValor,
                                            },
                                        });
                                    }, 1000);
                                }

                                function crearPlugin(propiedades) {
                                    mp = new M.plugin.Comparators(propiedades);
                                    map.addPlugin(mp);
                                }

                                const botonEliminar = document.getElementById("botonEliminar");
                                botonEliminar.addEventListener("click", function () {
                                    map.removePlugins(mp);
                                });


                                /* ShareMap */
                                mp2 = new M.plugin.ShareMap({
                                    baseUrl: window.location.href.substring(0, window.location.href.indexOf('api-core')) + "api-core/",
                                    position: "TR",
                                });
                                map.addPlugin(mp2);
                            </script>
                </body>

                <!-- Global site tag (gtag.js) - Google Analytics -->
                <script async src="https://www.googletagmanager.com/gtag/js?id=G-CTLHMMB5YT"></script>
                <script>
                    window.dataLayer = window.dataLayer || [];
                    function gtag() { dataLayer.push(arguments); }
                    gtag('js', new Date());
                    gtag('config', 'G-CTLHMMB5YT');
                </script>

                </html>