<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
    <%@ page import="es.api_idee.plugins.PluginsManager" %>
        <%@ page import="java.util.Map" %>

            <!DOCTYPE html>
            <html lang="en">

            <head>
                <meta charset="UTF-8">
                <meta name="viewport"
                    content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">
                <meta http-equiv="X-UA-Compatible" content="IE=edge" />
                <meta name="idee" content="yes">
                <title>Layerswitcher TEST — Section vs Group z-order</title>
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

                    .ls-test-hint {
                        position: absolute;
                        top: 8px;
                        left: 8px;
                        z-index: 9999;
                        max-width: 340px;
                        padding: 8px 10px;
                        background: rgba(255, 255, 255, 0.92);
                        border: 1px solid #ccc;
                        border-radius: 4px;
                        font: 12px/1.4 sans-serif;
                    }
                </style>
                <% Map<String, String[]> parameterMap = request.getParameterMap();
                    PluginsManager.init (getServletContext());
                    String[] cssfiles = PluginsManager.getCSSFiles(parameterMap);
                    for (int i = 0; i < cssfiles.length; i++) { String cssfile=cssfiles[i]; %>
                        <link type="text/css" rel="stylesheet" href="plugins/<%=cssfile%>">
                        </link>
                        <% } %>
            </head>

            <body>

                <div class="ls-test-hint">
                    Prueba de orden: <strong>Sección externa</strong> (Provincias amarillas +
                    <strong>Sección externa dos</strong> con Red viaria anidada)
                    y <strong>Grupo externo</strong> (Provincias azules + Red hidrográfica).
                    Reordena capas, sección y grupo en el layerswitcher para comprobar delante/detrás.
                </div>

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
                        <option value=false selected="selected">false</option>
                    </select>
                    <label for="selectStatusLayers">Funcionalidad estado capas</label>
                    <select name="statusValue" id="selectStatusLayers">
                        <option value=true selected="selected">true</option>
                        <option value=false>false</option>
                    </select>
                    <label for="selectAddLayers">Funcionalidad añadir capas</label>
                    <select name="addValue" id="selectAddLayers">
                        <option value=true selected="selected">true</option>
                        <option value=false>false</option>
                    </select>
                    <label for="selectCollapsible">Selector collapsible</label>
                    <select name="collapsibleValue" id="selectCollapsible">
                        <option value=true selected="selected">true</option>
                        <option value=false>false</option>
                    </select>
                    <label for="inputTooltip">Tooltip</label>
                    <input type="text" name="tooltip" id="inputTooltip">
                    <label for="inputTools">Herramientas</label>
                    <input type="text" name="tools" id="inputTools"
                        value="transparency, zoom, legend, information, style, delete">
                    <label for="isDraggable">isDraggable</label>
                    <select name="draggableValue" id="isDraggable">
                        <option value=true selected="selected">true</option>
                        <option value=false>false</option>
                    </select>
                    <label for="isMoveLayers">isMoveLayers</label>
                    <select name="moveLayerValue" id="isMoveLayers">
                        <option value=true selected="selected">true</option>
                        <option value=false>false</option>
                    </select>
                    <label for="modeSelectLayers">modeSelectLayers</label>
                    <select name="modeSelectLayersValue" id="modeSelectLayers">
                        <option value=eyes selected="selected">eyes</option>
                        <option value=radio>radio</option>
                    </select>
                    <label for="inputPrecharged" title="Objeto JSON o URL a un JSON con el catálogo precargado. Si se deja vacío se usa el JSON por defecto del plugin">Precharged</label>
                    <input type="text" name="precharged" id="inputPrecharged" placeholder='{"groups":[...]} o https://.../precharged.json'>
                    <label for="isHttp">isHttp</label>
                    <select name="isHttpValue" id="isHttp">
                        <option value=true selected="selected">true</option>
                        <option value=false>false</option>
                    </select>
                    <label for="isHttps">isHttps</label>
                    <select name="isHttpsValue" id="isHttps">
                        <option value=true selected="selected">true</option>
                        <option value=false>false</option>
                    </select>
                    <label for="isShowCatalog">isShowCatalog</label>
                    <select name="isShowCatalogValue" id="isShowCatalog">
                        <option value=true selected="selected">true</option>
                        <option value=false>false</option>
                    </select>
                    <label for="selectProxy">Proxy</label>
                    <select name="proxyValue" id="selectProxy">
                        <option value=true selected="selected">true</option>
                        <option value=false>false</option>
                    </select>
                    <label for="selectDisplay">displayLabel</label>
                    <select name="displayValue" id="selectDisplay">
                        <option value=true selected="selected">true</option>
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
                <% String[] jsfiles=PluginsManager.getJSFiles(parameterMap); for (int i=0; i < jsfiles.length; i++) {
                    String jsfile=jsfiles[i]; %>
                    <script type="text/javascript" src="plugins/<%=jsfile%>"></script>

                    <% } %>
                        <script type="text/javascript">
                            const urlParams = new URLSearchParams(window.location.search);
                            IDEE.language.setLang(urlParams.get('language') || 'es');

                            if (IDEE.config.terrain) {
                                IDEE.config.terrain.default = '';
                            }

                            const map = IDEE.map({
                                container: 'mapjs',
                                zoom: 5,
                                maxZoom: 20,
                                minZoom: 2,
                                center: [-467062.8225, 4783459.6216],
                            });
                            window.mapajs = map;

                            let mp = null;

                            let mp2 = new IDEE.plugin.ShareMap({
                                baseUrl: window.location.href.substring(0, window.location.href.indexOf('api-idee')) + "api-idee/",
                                position: "TR",
                            });
                            map.addPlugin(mp2);

                            const PROVINCIAS_GEOJSON_URL = 'https://hcsigc.juntadeandalucia.es/geoserver/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=IECA:sigc_provincias_1724753768757&maxFeatures=50&outputFormat=application/json';

                            const styleProvinciasSeccion = new IDEE.style.Polygon({
                                fill: {
                                    color: '#FFD54F',
                                    opacity: 0.45,
                                },
                                stroke: {
                                    color: '#F57C00',
                                    width: 3,
                                },
                            });

                            const styleProvinciasGrupo = new IDEE.style.Polygon({
                                fill: {
                                    color: '#64B5F6',
                                    opacity: 0.35,
                                },
                                stroke: {
                                    color: '#1565C0',
                                    width: 3,
                                },
                            });

                            const provinciasSeccion = new IDEE.layer.GeoJSON({
                                name: 'Provincias_seccion',
                                legend: 'Provincias (sección)',
                                url: PROVINCIAS_GEOJSON_URL,
                            }, {
                                style: styleProvinciasSeccion,
                            });

                            const lineasSeccion = new IDEE.layer.WMS({
                                url: 'https://www.ideandalucia.es/services/andalucia/wms?',
                                name: '05_Red_Viaria',
                                legend: 'Líneas (sección)',
                                transparent: true,
                                tiled: false,
                            });

                            const provinciasGrupo = new IDEE.layer.GeoJSON({
                                name: 'Provincias_grupo',
                                legend: 'Provincias (grupo)',
                                url: PROVINCIAS_GEOJSON_URL,
                            }, {
                                style: styleProvinciasGrupo,
                            });

                            const lineasGrupo = new IDEE.layer.WMS({
                                url: 'https://www.ideandalucia.es/services/andalucia/wms?',
                                name: '03_Red_Hidrografica',
                                legend: 'Líneas (grupo)',
                                transparent: true,
                                tiled: false,
                            });

                            const seccionExterna_dos = new IDEE.layer.Section({
                                idSection: 'seccion_externa_dos',
                                title: 'Sección externa dos',
                                collapsed: false,
                                order: 2,
                                children: [lineasSeccion],
                            });

                            const seccionExterna = new IDEE.layer.Section({
                                idSection: 'seccion_externa',
                                title: 'Sección externa',
                                collapsed: false,
                                order: 1,
                                children: [provinciasSeccion, seccionExterna_dos],
                            });

                            const grupoExterno = new IDEE.layer.LayerGroup({
                                name: 'Grupo externo',
                                legend: 'Grupo externo',
                                layers: [provinciasGrupo, lineasGrupo],
                            });

                            // Solo la sección raíz; seccionExterna_dos ya va anidada dentro.
                            map.addSections(seccionExterna);
                            map.addLayerGroups(grupoExterno);

                            window.seccionExterna = seccionExterna;
                            window.seccionExterna_dos = seccionExterna_dos;
                            window.grupoExterno = grupoExterno;
                            window.provinciasSeccion = provinciasSeccion;
                            window.lineasSeccion = lineasSeccion;
                            window.provinciasGrupo = provinciasGrupo;
                            window.lineasGrupo = lineasGrupo;

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
                            botonEliminar.addEventListener("click", function () {
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
                                        // Si no es JSON, se trata como URL
                                        objeto.precharged = inputPrecharged.value.trim();
                                    }
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