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
                <link href="plugins/vectorsmanagement/vectorsmanagement.ol.min.css" rel="stylesheet" />
                <link href="plugins/sharemap/sharemap.ol.min.css" rel="stylesheet" />
                </link>
                <% Map<String, String[]> parameterMap = request.getParameterMap();
                    PluginsManager.init (getServletContext());
                    String[] cssfiles = PluginsManager.getCSSFiles(parameterMap);
                    for (int i = 0; i < cssfiles.length; i++) { String cssfile=cssfiles[i]; %>
                        <link type="text/css" rel="stylesheet" href="plugins/<%=cssfile%>">
                        </link>
                        <% } %>
            </head>

            <body>
                <div class="m-api-idee-test-form-frame">
                    <div class="m-test-form" style="max-height: 14.2rem;">

                        <div>
                            <label for="selectPosicion">Posición del panel "position"</label>
                            <select name="position" id="selectPosicion">
                                <option value="" selected="selected"></option>
                                <option value="left">Izquierda (left)</option>
                                <option value="right">Derecha (right)</option>
                            </select>
                        </div>
                        <div>
                            <label for="inputOrder"
                                title="Define en que posición del panel debe aparecer en el conjunto de controles o plugins">Orden
                                en la posición asignada "order"</label>
                            <input type="number" name="order" id="inputOrder" list="orderSug" value="-1">
                        </div>
                        <div>
                            <label for="inputTooltip"
                                title="Título ilustrativo que aporta información adicional">Información de la
                                herramienta
                                "tooltip"</label>
                            <input type="text" name="tooltip" id="inputTooltip" list="tooltipSug" value="">
                        </div>
                        <div>
                            <label for="selectCollapsed">Panel colapsado "collapsed"</label>
                            <select name="collapsed" id="selectCollapsed">
                                <option value=''></option>
                                <option value="true">true</option>
                                <option value="false" selected="selected">false</option>
                            </select>
                        </div>
                        <!-- Controles -->
                        <div>
                            <label for="selection">Control de selección habilitado "selection"</label>
                            <select name="collapsible" id="selection">
                                <option value=""></option>
                                <option value="true" selected="selected">true</option>
                                <option value="false">false</option>
                            </select>
                        </div>
                        <div>
                            <label for="addLayer">Control de añadir capa habilitado "addLayer"</label>
                            <select name="collapsible" id="addLayer">
                                <option value=""></option>
                                <option value="true" selected="selected">true</option>
                                <option value="false">false</option>
                            </select>
                        </div>
                        <div>
                            <label for="analysis">Control de análisis habilitado "analysis"</label>
                            <select name="collapsible" id="analysis">
                                <option value=""></option>
                                <option value="true" selected="selected">true</option>
                                <option value="false">false</option>
                            </select>
                        </div>
                        <div>
                            <label for="creation">Control de creación habilitado "creation"</label>
                            <select name="collapsible" id="creation">
                                <option value=""></option>
                                <option value="true" selected="selected">true</option>
                                <option value="false">false</option>
                            </select>
                        </div>
                        <div>
                            <label for="download">Control de descarga habilitado "download"</label>
                            <select name="collapsible" id="download">
                                <option value=""></option>
                                <option value="true" selected="selected">true</option>
                                <option value="false">false</option>
                            </select>
                        </div>
                        <div>
                            <label for="edition">Control de edición habilitado "edition"</label>
                            <select name="collapsible" id="edition">
                                <option value=""></option>
                                <option value="true" selected="selected">true</option>
                                <option value="false">false</option>
                            </select>
                        </div>
                        <div>
                            <label for="help">Control de ayuda habilitado "help"</label>
                            <select name="collapsible" id="help">
                                <option value=""></option>
                                <option value="true" selected="selected">true</option>
                                <option value="false">false</option>
                            </select>
                        </div>
                        <div>
                            <label for="style">Control de estilo habilitado "style"</label>
                            <select name="collapsible" id="style">
                                <option value=""></option>
                                <option value="true" selected="selected">true</option>
                                <option value="false">false</option>
                            </select>
                        </div>
                        <div>
                            <label for="turf" title="Es necesario tener añadida la herramienta de selección">Control de geoprocesos (Turf.js) habilitado "turf"</label>
                            <select name="selectTurf" id="turf">
                                <option value=""></option>
                                <option value="true" selected="selected">true</option>
                                <option value="false">false</option>
                            </select>
                        </div>
                        <div>
                            <label for="snapping" title="Configuración del snapping de las herramientas de creación y edición: true, false, JSON o base64. Si se deja vacío se usan los valores por defecto">Configuración del snapping "snapping"</label>
                            <input type="text" name="snapping" id="snapping" list="snappingSug">
                            <datalist id="snappingSug">
                                <option value="true" label="Snapping activado con los valores por defecto"></option>
                                <option value="false" label="Snapping desactivado"></option>
                                <option value='{"vertex":true,"edge":false,"intersection":true,"allLayers":true,"guides":true,"pixelTolerance":15}' label="Configuración completa"></option>
                            </datalist>
                        </div>
                    </div>
                    <div class="m-test-buttons">
                        <button name="eliminar" class="m-test-button" id="removeButton">Eliminar plugin</button>
                    </div>
                </div>
                <div id="mapjs" class="m-container"></div>
                <script type="text/javascript" src="vendor/browser-polyfill.js"></script>
                <script type="text/javascript" src="js/apiidee.ol.min.js"></script>
                <script type="text/javascript" src="js/configuration.js"></script>
                <script type="text/javascript" src="plugins/vectorsmanagement/vectorsmanagement.ol.min.js"></script>
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
                                controls: ['rotate']
                            });
                            let mp, collapsed, collapsible;
                            create({});
                            const selectPosicion = document.getElementById('selectPosicion');
                            const inputTooltip = document.getElementById('inputTooltip');
                            const selectCollapsed = document.getElementById('selectCollapsed');
                            const inputOrder = document.getElementById('inputOrder');
                            const selectionInput = document.getElementById("selection");
                            const addLayerInput = document.getElementById("addLayer");
                            const analysisInput = document.getElementById("analysis");
                            const creationInput = document.getElementById("creation");
                            const downloadInput = document.getElementById("download");
                            const editionInput = document.getElementById("edition");
                            const helpInput = document.getElementById("help");
                            const styleInput = document.getElementById("style");
                            const turfInput = document.getElementById("turf");
                            const snappingInput = document.getElementById("snapping");

                            [
                                selectPosicion,
                                inputTooltip,
                                selectCollapsed,
                                inputOrder,
                                selectionInput,
                                addLayerInput,
                                analysisInput,
                                creationInput,
                                downloadInput,
                                editionInput,
                                helpInput,
                                styleInput,
                                turfInput,
                                snappingInput,
                            ].forEach((elm) => { elm.addEventListener('change', changeTest); });

                            function changeTest() {
                                let options = {}

                                const selectPosition = selectPosicion.options[selectPosicion.selectedIndex].value;
                                if (selectPosition !== '') options.position = selectPosition;

                                if (inputTooltip.value !== '') options.tooltip = inputTooltip.value;

                                const collapsed = selectCollapsed.options[selectCollapsed.selectedIndex].value;
                                if (collapsed !== '') options.collapsed = (collapsed === 'true');

                                if (inputOrder.value !== undefined) options.order = Number(inputOrder.value);

                                let selectionValor = selectionInput.options[selectionInput.selectedIndex].value;
                                if (selectionValor) {
                                    options.selection = selectionValor === "true" ? true : false;
                                }
                                let addLayerValor = addLayerInput.options[addLayerInput.selectedIndex].value;
                                if (addLayerValor) {
                                    options.addlayer = addLayerValor === "true" ? true : false;
                                }
                                let analysisValor = analysisInput.options[analysisInput.selectedIndex].value;
                                if (analysisValor) {
                                    options.analysis = analysisValor === "true" ? true : false;
                                }
                                let creationValor = creationInput.options[creationInput.selectedIndex].value;
                                if (creationValor) {
                                    options.creation = creationValor === "true" ? true : false;
                                }
                                let downloadValor = downloadInput.options[downloadInput.selectedIndex].value;
                                if (downloadValor) {
                                    options.download = downloadValor === "true" ? true : false;
                                }
                                let editionValor = editionInput.options[editionInput.selectedIndex].value;
                                if (editionValor) {
                                    options.edition = editionValor === "true" ? true : false;
                                }
                                let helpValor = helpInput.options[helpInput.selectedIndex].value;
                                if (helpValor) {
                                    options.help = helpValor === "true" ? true : false;
                                }
                                let styleValor = styleInput.options[styleInput.selectedIndex].value;
                                if (styleValor) {
                                    options.style = styleValor === "true" ? true : false;
                                }
                                let turfValor = turfInput.options[turfInput.selectedIndex].value;
                                if (turfValor) {
                                    options.turf = turfValor === "true" ? true : false;
                                }
                                const snappingValor = snappingInput.value.trim();
                                if (snappingValor) {
                                    options.snapping = snappingValor;
                                }

                                map.removePlugins(mp);
                                create(options);
                            }

                            function create(propiedades) {
                                mp = new IDEE.plugin.VectorsManagement(propiedades);
                                map.addPlugin(mp);
                            }

                            const removeButton = document.getElementById("removeButton");
                            removeButton.addEventListener("click", function () {
                                map.removePlugins(mp);
                            });
                            const mp2 = new IDEE.plugin.ShareMap({
                                baseUrl: window.location.href.substring(0, window.location.href.indexOf('api-idee')) + "api-idee/",
                                position: "left",
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