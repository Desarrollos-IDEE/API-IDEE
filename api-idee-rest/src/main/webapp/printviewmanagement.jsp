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
                <title>Visor base</title>
                <link type="text/css" rel="stylesheet" href="assets/css/apiidee.ol.min.css">
                <link href="plugins/printviewmanagement/printviewmanagement.ol.min.css" rel="stylesheet" />
                <link href="plugins/sharemap/sharemap.ol.min.css" rel="stylesheet" />
                <% Map<String, String[]> parameterMap = request.getParameterMap();
                    PluginsManager.init (getServletContext());
                    String[] cssfiles = PluginsManager.getCSSFiles(parameterMap);
                    for (int i = 0; i < cssfiles.length; i++) { String cssfile=cssfiles[i]; %>
                        <link type="text/css" rel="stylesheet" href="plugins/<%=cssfile%>">
                        </link>
                        <% } %>
                <style rel="stylesheet">
                    html,
                    body {
                        margin: 0;
                        padding: 0;
                        height: 100%;
                        overflow: hidden;
                    }
                </style>
            </head>

            <body>
                <div class="m-api-idee-test-form-frame">
                    <div class="m-test-form">
                        <div>
                            <label for="selectPosition" title="Posición del plugin sobre el mapa">Posición "position"</label>
                            <select name="position" id="selectPosition">
                                <option value="" selected="selected"></option>
                                <option value="left">Izquierda</option>
                                <option value="right">Derecha</option>
                            </select>
                        </div>
                        <div>
                            <label for="selectCollapsed"
                                title="Indica si el plugin viene colapsado de entrada (true/false). Por defecto: true">Colapsado
                                "collapsed"</label>
                            <select name="collapsed" id="selectCollapsed">
                                <option value="" selected="selected"></option>
                                <option value="true">true</option>
                                <option value="false">false</option>
                            </select>
                        </div>
                        <div>
                            <label for="inputOrder"
                                title="Define en que posición del panel debe aparecer en el conjunto de controles o plugins">Orden
                                entre controles / plugins "order"</label>
                            <input type="number" name="order" id="inputOrder" list="orderSug" value="-1">
                        </div>
                        <div>
                            <label for="inputTooltip"
                                title="Texto que se muestra al dejar el ratón encima del plugin.">Título
                                de la herramienta "tooltip"</label>
                            <input type="text" name="tooltip" id="inputTooltip" list="tooltipSug">
                            <datalist id="tooltipSug">
                                <option value="Impresión del mapa"></option>
                            </datalist>
                        </div>
                        <div>
                            <label for="inputDefaultOpenControl"
                                title="Índice del modo de impresión que aparecerá abierto al inicio: 0=ninguno, 1=printermap, 2=georefImage, 3=georefImageEpsg. Por defecto: 1">Modo por defecto "defaultOpenControl"</label>
                            <input type="number" id="inputDefaultOpenControl" value="1" min="0" max="3" step="1">
                        </div>
                        <div>
                            <label for="inputGeorefImageEpsg"
                                title="Objeto de configuración del control de georreferenciación por EPSG. Campos: tooltip (string), layers (array de {url, name, format, legend, EPSG?}), defaultDpiOptions (array de números). Escribe false para desactivar este modo de impresión">Configuración
                                "georefImageEpsg"</label>
                            <input type="text" id="inputGeorefImageEpsg" list="georefImageEpsgSug">
                            <datalist id="georefImageEpsgSug">
                                <option value='{"tooltip":"Georeferenciar imagen predefinida","layers":[{"url":"http://www.ign.es/wms-inspire/mapa-raster?","name":"mtn_rasterizado","format":"image/jpeg","legend":"Mapa ETRS89 UTM"},{"url":"http://www.ign.es/wms-inspire/pnoa-ma?","name":"OI.OrthoimageCoverage","format":"image/jpeg","legend":"Imagen (PNOA) ETRS89 UTM"}],"defaultDpiOptions":[96,150,300]}'></option>
                            </datalist>
                        </div>
                        <div>
                            <label for="inputGeorefImage"
                                title="Objeto de configuración del control de georreferenciación de imagen. Campos: tooltip (string), defaultDpiOptions (array de números). Escribe false para desactivar este modo de impresión">Configuración
                                "georefImage"</label>
                            <input type="text" id="inputGeorefImage" list="georefImageSug">
                            <datalist id="georefImageSug">
                                <option value='{"tooltip":"Georeferenciar imagen","defaultDpiOptions":[96,150,300]}'></option>
                            </datalist>
                        </div>
                        <div>
                            <label for="inputPrintermap"
                                title="Objeto de configuración del control de impresión con plantilla. Campos: tooltip (string), filterTemplates (array de rutas HTML), showDefaultTemplate (boolean), defaultDpiOptions (array de números), layoutsRestraintFromDpi (array de strings). Escribe false para desactivar este modo de impresión">Configuración
                                "printermap"</label>
                            <input type="text" id="inputPrintermap" list="printermapSug">
                            <datalist id="printermapSug">
                                <option value='{"tooltip":"Impresión del mapa","filterTemplates":["${api-idee.static_resources.url}/plantillas/html/mapaConMarco.html","${api-idee.static_resources.url}/plantillas/html/mapaConCabeceraYMarco.html","${api-idee.static_resources.url}/plantillas/html/mapaConPieYMarco.html","${api-idee.static_resources.url}/plantillas/html/PlantillaAMB.html"],"showDefaultTemplate":true,"defaultDpiOptions":[96,150,300],"layoutsRestraintFromDpi":["screensize","A0","A1","A2"]}'></option>
                            </datalist>
                        </div>
                    </div>
                    <div class="m-test-buttons">
                        <button name="eliminar" class="m-test-button" id="removeButton">Eliminar Plugin</button>
                    </div>
                </div>
                <div id="mapjs" class="m-container"></div>
                <script type="text/javascript" src="vendor/browser-polyfill.js"></script>
                <script type="text/javascript" src="js/apiidee.ol.min.js"></script>
                <script type="text/javascript" src="js/configuration.js"></script>
                <script type="text/javascript" src="plugins/printviewmanagement/printviewmanagement.ol.min.js"></script>
                <script type="text/javascript" src="plugins/sharemap/sharemap.ol.min.js"></script>
                <% String[] jsfiles=PluginsManager.getJSFiles(parameterMap); for (int i=0; i < jsfiles.length; i++) {
                    String jsfile=jsfiles[i]; %>
                    <script type="text/javascript" src="plugins/<%=jsfile%>"></script>
                    <% } %>
                        <script type="text/javascript">
                            const urlParams = new URLSearchParams(window.location.search);
                            IDEE.language.setLang(urlParams.get('language') || 'es');

                            const map = IDEE.map({
                                container: 'mapjs',
                                zoom: 5,
                                maxZoom: 20,
                                minZoom: 4,
                                center: [-467062.8225, 4683459.6216],
                            });

                            const layerinicial = new IDEE.layer.WMS({
                                url: 'http://www.ign.es/wms-inspire/unidades-administrativas?',
                                name: 'AU.AdministrativeBoundary',
                                legend: 'Limite administrativo',
                                tiled: false,
                            }, {});

                            map.addLayers([layerinicial]);

                            let mp;

                            const createPlugin = (options) => {
                                mp = new IDEE.plugin.PrintViewManagement(options);
                                window.mp = mp;
                                map.addPlugin(mp);
                            };

                            const removePlugin = () => {
                                if (mp) map.removePlugins(mp);
                            };

                            const removeButton = document.getElementById('removeButton');
                            removeButton.addEventListener('click', () => { removePlugin(); });

                            const selectPosition = document.getElementById('selectPosition');
                            const selectCollapsed = document.getElementById('selectCollapsed');
                            const inputOrder = document.getElementById('inputOrder');
                            const inputTooltip = document.getElementById('inputTooltip');
                            const inputDefaultOpenControl = document.getElementById('inputDefaultOpenControl');
                            const inputGeorefImageEpsg = document.getElementById('inputGeorefImageEpsg');
                            const inputGeorefImage = document.getElementById('inputGeorefImage');
                            const inputPrintermap = document.getElementById('inputPrintermap');

                            const safeParseJSON = (val, fallback) => {
                                try { return val ? JSON.parse(val) : fallback; } catch (e) { return fallback; }
                            };

                            const updatePlugin = () => {
                                const options = {};
                                options.position = selectPosition.options[selectPosition.selectedIndex].value;
                                options.collapsed = selectCollapsed.options[selectCollapsed.selectedIndex].value === '' || selectCollapsed.options[selectCollapsed.selectedIndex].value === 'true';
                                options.order = Number(inputOrder.value);
                                options.tooltip = inputTooltip.value !== '' ? options.tooltip = inputTooltip.value : '';
                                if (inputDefaultOpenControl.value !== '') {
                                    options.defaultOpenControl = Number(inputDefaultOpenControl.value);
                                }

                                options.georefImageEpsg = safeParseJSON(inputGeorefImageEpsg.value, true);
                                options.georefImage = safeParseJSON(inputGeorefImage.value, true);
                                options.printermap = safeParseJSON(inputPrintermap.value, true);

                                removePlugin();
                                createPlugin(options);
                            };

                            [
                                selectPosition,
                                selectCollapsed,
                                inputOrder,
                                inputTooltip,
                                inputDefaultOpenControl,
                                inputGeorefImageEpsg,
                                inputGeorefImage,
                                inputPrintermap,
                            ].forEach((ctrl) => {
                                ctrl.addEventListener('change', updatePlugin);
                            });

                            updatePlugin();
                            const mp2 = new IDEE.plugin.ShareMap({
                                baseUrl: window.location.href.substring(0, window.location.href.indexOf('api-idee')) + "api-idee/",
                                position: "right",
                            });
                            map.addPlugin(mp2);
                        </script>
            </body>
            <!-- Global site tag (gtag.js) - Google Analytics -->
            <script async src="https://www.googletagmanager.com/gtag/js?id=G-19NTRSBP21"></script>
            <script>
                window.dataLayer = window.dataLayer || [];
                function gtag() { dataLayer.push(arguments); }
                gtag('js', new Date());
                gtag('config', 'G-19NTRSBP21');
            </script>

            </html>
