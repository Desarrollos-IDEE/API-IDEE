<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ page import="es.api_idee.plugins.PluginsManager"%>
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
    <link href="plugins/layerswitcher/layerswitcher.ol.min.css" rel="stylesheet" />
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
      String[] cssfiles = PluginsManager.getCSSFiles(parameterMap);
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
        <label for="selectPosition">Selector de posición del plugin</label>
        <select name="position" id="selectPosition">
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
        <label for="selectStatusLayers">Funcionalidad estado capas</label>
        <select name="statusValue" id="selectStatusLayers">
            <option value=true>true</option>
            <option value=false>false</option>
        </select>
        <label for="selectAddLayers">Funcionalidad estado capas</label>
        <select name="addValue" id="selectAddLayers">
            <option value=true>true</option>
            <option value=false>false</option>
        </select>
        <label for="selectCollapsible">Selector collapsible</label>
        <select name="collapsibleValue" id="selectCollapsible">
            <option value=true>true</option>
            <option value=false>false</option>
        </select>
        <label for="inputTooltip">Tooltip</label>
        <input type="text" name="tooltip" id="inputTooltip">
        <label for="inputTools">Herramientas</label>
        <input type="text" name="tools" id="inputTools" value="transparency, zoom, legend, information, style, delete">
        <label for="isDraggable">isDraggable</label>
        <select name="draggableValue" id="isDraggable">
            <option value=true>true</option>
            <option value=false>false</option>
        </select>
        <label for="isMoveLayers">isMoveLayers</label>
        <select name="moveLayerValue" id="isMoveLayers">
            <option value=true>true</option>
            <option value=false>false</option>
        </select>
        <label for="modeSelectLayers">modeSelectLayers</label>
        <select name="modeSelectLayersValue" id="modeSelectLayers">
            <option value=eyes>eyes</option>
            <option value=radio>radio</option>
        </select>
        <label for="inputPrecharged">Precharged</label>
        <input type="text" name="precharged" id="inputPrecharged">
        <label for="isHttp">isHttp</label>
        <select name="isHttpValue" id="isHttp">
            <option value=true>true</option>
            <option value=false>false</option>
        </select>
        <label for="isHttps">isHttps</label>
        <select name="isHttpsValue" id="isHttps">
            <option value=true>true</option>
            <option value=false>false</option>
        </select>
        <label for="isShowCatalog">isShowCatalog</label>
        <select name="isShowCatalogValue" id="isShowCatalog">
            <option value=true>true</option>
            <option value=false>false</option>
        </select>
        <label for="selectProxy">Proxy</label>
        <select name="proxyValue" id="selectProxy">
            <option value=true>true</option>
            <option value=false>false</option>
        </select>
        <label for="selectDisplay">displayLabel</label>
        <select name="displayValue" id="selectDisplay">
            <option value=true>true</option>
            <option value=false>false</option>
        </select>
        <input type="button" value="Eliminar Plugin" name="eliminar" id="botonEliminar">
    </div>

    <div id="mapjs" class="m-container"></div>
    <script type="text/javascript" src="vendor/browser-polyfill.js"></script>
    <script type="text/javascript" src="js/apiidee.ol.min.js"></script>
    <script type="text/javascript" src="js/configuration.js"></script>
    <script type="text/javascript" src="plugins/layerswitcher/layerswitcher.ol.min.js"></script>
    <script type="text/javascript" src="plugins/sharemap/sharemap.ol.min.js"></script>
    <%
      String[] jsfiles = PluginsManager.getJSFiles(parameterMap);
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
            minZoom: 2,
            center: [-467062.8225, 4783459.6216],
        });

        let mp = null;

        let mp2 = new IDEE.plugin.ShareMap({
            baseUrl: window.location.href.substring(0, window.location.href.indexOf('api-idee')) + "api-idee/",
            position: "TR",
        });
        map.addPlugin(mp2);

        const PRECHARGED = {
            groups: [{
                'Cartografía': {
                'Mapas': {
                    'type': 'WMTS',
                    'url': 'https://www.ign.es/wmts/mapa-raster?',
                },
                'Callejero': {
                    'type': 'WMTS',
                    'url': 'https://www.ign.es/wmts/ign-base?',
                },
                'Primera edición MTN y Minutas de 1910-1970': {
                    'type': 'WMTS',
                    'url': 'https://www.ign.es/wmts/primera-edicion-mtn?',
                },
                'Planimetrías (1870 y 1950)': {
                    'type': 'WMS',
                    'url': 'https://www.ign.es/wms/minutas-cartograficas?',
                },
                'Planos de Madrid (1622 - 1960)': {
                    'type': 'WMTS',
                    'url': 'https://www.ign.es/wmts/planos?',
                },
                'Hojas kilométricas (Madrid - 1860)': {
                    'type': 'WMS',
                    'url': 'https://www.ign.es/wms/hojas-kilometricas?',
                },
                'Cuadrículas Mapa Topográfico Nacional': {
                    'type': 'WMS',
                    'url': 'https://www.ign.es/wms-inspire/cuadriculas?',
                },
                },
                'Imagenes': {
                'Ortofotos': {
                    'Máxima actualidad PNOA': {
                    'type': 'WMTS',
                    'url': 'https://www.ign.es/wmts/pnoa-ma?',
                    },
                    'Históricas y PNOA anual': {
                    'type': 'WMS',
                    'url': 'https://www.ign.es/wms/pnoa-historico?',
                    },
                    'PNOA Provisionales': {
                    'type': 'WMS',
                    'url': 'https://wms-pnoa.idee.es/pnoa-provisionales?',
                    },
                },
                'Mosaicos de satélite': {
                    'type': 'WMS',
                    'url': 'https://wms-satelites-historicos.idee.es/satelites-historicos?',
                },
                'Fototeca (Consulta de fotogramas históricos y PNOA)': {
                    'type': 'WMS',
                    'url': 'https://wms-fototeca.idee.es/fototeca?',
                },
                },
                'Información geográfica de referencia y temática': {
                'Catastro': {
                    'type': 'WMS',
                    'url': 'https://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx?',
                },
                'Unidades administrativas': {
                    'type': 'WMS',
                    'url': ' https://www.ign.es/wms-inspire/unidades-administrativas?',
                },
                'Nombres geográficos (Nomenclátor Geográfico Básico NGBE)': {
                    'type': 'WMS',
                    'url': 'https://www.ign.es/wms-inspire/ngbe?',
                },
                'Redes de transporte': {
                    'type': 'WMS',
                    'url': 'https://servicios.idee.es/wms-inspire/transportes?',
                },
                'Hidrografía': {
                    'type': 'WMS',
                    'url': 'https://servicios.idee.es/wms-inspire/hidrografia?',
                },
                'Direcciones y códigos postales': {
                    'type': 'WMS',
                    'url': 'https://www.cartociudad.es/wms-inspire/direcciones-ccpp?',
                },
                'Ocupación del suelo': {
                    'Actual (Corine y SIOSE)': {
                    'type': 'WMTS',
                    'url': 'https://servicios.idee.es/wmts/ocupacion-suelo?',
                    },
                    'Histórico (Corine y SIOSE)': {
                    'type': 'WMS',
                    'url': 'https://servicios.idee.es/wms-inspire/ocupacion-suelo-historico?',
                    },
                    'Copernicus Land Monitoring Service': {
                    'type': 'WMS',
                    'url': 'https://servicios.idee.es/wms/copernicus-landservice-spain?',
                    },
                },
                'Información sísmica (terremotos)': {
                    'type': 'WMS',
                    'url': 'https://www.ign.es/wms-inspire/geofisica?',
                },
                'Red de vigilancia volcánica': {
                    'type': 'WMS',
                    'url': 'https://wms-volcanologia.ign.es/volcanologia?',
                },
                'Redes geodésicas': {
                    'type': 'WMS',
                    'url': 'https://www.ign.es/wms-inspire/redes-geodesicas?',
                },
                },
                'Modelos digitales de elevaciones': {
                'Modelo Digital de Superficies (Sombreado superficies y consulta de elevaciones edificios y vegetación)': {
                    'type': 'WMTS',
                    'url': 'https://wmts-mapa-lidar.idee.es/lidar?',
                },
                'Modelo Digital del Terreno (Sombreado terreno y consulta de altitudes)': {
                    'type': 'WMTS',
                    'url': 'https://servicios.idee.es/wmts/mdt?',
                    'white_list': ['EL.ElevationGridCoverage'],
                },
                'Curvas de nivel y puntos acotados': {
                    'type': 'WMS',
                    'url': 'https://servicios.idee.es/wms-inspire/mdt?',
                    'white_list': ['EL.ContourLine', 'EL.SpotElevation'],
                },
                },
            },

            ],
        };

        const capaGeoJSON = new IDEE.layer.GeoJSON({
            name: 'Capa GeoJSON',
            url: 'http://www.ign.es/resources/geodesia/GNSS/SPTR_geo.json',
            extract: false,
        });

        const capaWMS = new IDEE.layer.WMS({
            url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
            name: 'AU.AdministrativeUnit',
            legend: 'Capa WMS',
        });
        map.addLayers(capaGeoJSON);
        map.addLayers(capaWMS);

        const selectPosition = document.getElementById("selectPosition");
        const selectCollapsed = document.getElementById("selectCollapsed");
        const selectAdd = document.getElementById("selectAddLayers");
        const selectStatus = document.getElementById("selectStatusLayers");
        const selectCollapsible = document.getElementById("selectCollapsible");
        const inputTooltip = document.getElementById("inputTooltip");
        const inputTools = document.getElementById("inputTools");
        const selectDraggable = document.getElementById("isDraggable");
        const selectMoveLayer = document.getElementById("isMoveLayers");
        const selectModeSelectLayers = document.getElementById("modeSelectLayers");
        const inputPrecharged = document.getElementById("inputPrecharged");
        const selectHttp = document.getElementById("isHttp");
        const selectHttps = document.getElementById("isHttps");
        const selectShowCatalog = document.getElementById("isShowCatalog");
        const selectProxy = document.getElementById("selectProxy");
        const selectDisplay = document.getElementById("selectDisplay");

        const botonEliminar = document.getElementById("botonEliminar");

        selectPosition.addEventListener('change', cambiarTest);
        selectCollapsed.addEventListener('change', cambiarTest);
        selectAdd.addEventListener('change', cambiarTest);
        selectStatus.addEventListener('change', cambiarTest);
        selectCollapsible.addEventListener('change', cambiarTest);
        inputTooltip.addEventListener('change', cambiarTest);
        inputTools.addEventListener('change', cambiarTest);
        selectDraggable.addEventListener('change', cambiarTest);
        selectMoveLayer.addEventListener('change', cambiarTest);
        selectModeSelectLayers.addEventListener('change', cambiarTest);
        inputPrecharged.addEventListener('change', cambiarTest);
        selectHttp.addEventListener('change', cambiarTest);
        selectHttps.addEventListener('change', cambiarTest);
        selectShowCatalog.addEventListener('change', cambiarTest);
        selectProxy.addEventListener('change', cambiarTest);
        selectDisplay.addEventListener('change', cambiarTest);
        botonEliminar.addEventListener("click", function() {
            map.removePlugins(mp);
        });

        /**
         * Convierte el nuevo formato de objetos anidados al formato antiguo de arrays
         * para mantener compatibilidad con la plantilla addservices.html
         */
        function transformPrecharged(obj) {
            if (!obj) return obj;

            const finalGroups = [];
            const rawGroups = (Array.isArray(obj.groups) && obj.groups.length > 0) ? obj.groups[0] : {};

            Object.keys(rawGroups).forEach(categoryName => {
                const categoryContent = rawGroups[categoryName];
                const servicesList = [];

                const processNode = (node) => {
                    Object.keys(node).forEach(key => {
                        const item = node[key];
                        
                        if (item && typeof item === 'object' && item.url) {
                            servicesList.push({
                                name: key,
                                type: item.type,
                                url: item.url,
                                white_list: item.white_list
                            });
                        } 
                        else if (item && typeof item === 'object') {
                            processNode(item);
                        }
                    });
                };

                processNode(categoryContent);

                if (servicesList.length > 0) {
                    finalGroups.push({
                        name: categoryName,
                        services: servicesList
                    });
                }
            });

            return {
                services: obj.services || [],
                groups: finalGroups
            };
        }

        function cambiarTest() {
            let objeto = {};
            objeto.position = selectPosition.options[selectPosition.selectedIndex].value;
            objeto.collapsed = (selectCollapsed.options[selectCollapsed.selectedIndex].value == 'true');
            objeto.addLayers = (selectAdd.options[selectAdd.selectedIndex].value == 'true');
            objeto.statusLayers = (selectStatus.options[selectStatus.selectedIndex].value == 'true');
            objeto.collapsible = (selectCollapsible.options[selectCollapsible.selectedIndex].value == 'true');
            inputTooltip.value !== "" ? objeto.tooltip = inputTooltip.value : objeto.tooltip = "";
            inputTools.value !== "" ? objeto.tools = inputTools.value.split(', ') : objeto.tools = [];
            objeto.isDraggable = (selectDraggable.options[selectDraggable.selectedIndex].value == 'true');
            objeto.isMoveLayers = (selectMoveLayer.options[selectMoveLayer.selectedIndex].value == 'true');
            objeto.modeSelectLayers = selectModeSelectLayers.options[selectModeSelectLayers.selectedIndex].value;
            // inputPrecharged.value !== "" ? objeto.precharged = inputPrecharged.value : objeto.precharged = "";
            if (inputPrecharged.value.trim() !== "") {
                try {
                    objeto.precharged = JSON.parse(inputPrecharged.value);
                } catch (e) {
                    objeto.precharged = inputPrecharged.value;
                }
            } else {
                objeto.precharged = transformPrecharged(PRECHARGED); 
            }
            objeto.http = (selectHttp.options[selectHttp.selectedIndex].value == 'true');
            objeto.https = (selectHttps.options[selectHttps.selectedIndex].value == 'true');
            objeto.showCatalog = (selectShowCatalog.options[selectShowCatalog.selectedIndex].value == 'true');
            objeto.useProxy = (selectProxy.options[selectProxy.selectedIndex].value == 'true');
            objeto.displayLabel = (selectDisplay.options[selectDisplay.selectedIndex].value == 'true');
            if (mp !== null) {
                map.removePlugins(mp);
            }
            crearPlugin(objeto);
        }

        function crearPlugin(propiedades) {
            mp = new IDEE.plugin.Layerswitcher(propiedades);
            map.addPlugin(mp);
        }

        cambiarTest();
    </script>
</body>

<!-- Global site tag (gtag.js) - Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-19NTRSBP21"></script>
<script>
    window.dataLayer = window.dataLayer || [];

    function gtag() {
        dataLayer.push(arguments);
    }
    gtag('js', new Date());
    gtag('config', 'G-19NTRSBP21');
</script>

</html>
