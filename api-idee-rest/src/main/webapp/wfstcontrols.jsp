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
                <link href="plugins/wfstcontrols/wfstcontrols.ol.min.css" rel="stylesheet" />
                <link href="plugins/sharemap/sharemap.ol.min.css" rel="stylesheet" />
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
                                <option value="left">Izquierda (left)</option>
                                <option value="right" selected="selected">Derecha (right)</option>
                                <option value="center-top-left">Centro superior izquierdo (center-top-left)</option>
                                <option value="center-top-right">Centro superior derecho (center-top-right)</option>
                                <option value="center-bottom-left">Centro inferior izquierdo (center-bottom-left)
                                </option>
                                <option value="center-bottom-right">Centro inferior derecho (center-bottom-right)
                                </option>
                                <option value="down">Abajo (down)</option>
                            </select>
                        </div>
                        <div>
                            <label for="inputOrder"
                                title="Define en que posición del panel debe aparecer en el conjunto de controles o plugins">Orden
                                entre controles / plugins "order"</label>
                            <input type="number" name="order" id="inputOrder" list="orderSug" value="1">
                        </div>
                        <div>
                            <label for="inputTooltip"
                                title="Título ilustrativo que aporta información adicional">Información de la
                                herramienta
                                "tooltip"</label>
                            <input type="text" name="tooltip" id="inputTooltip" list="tooltipSug" value="Herramientas de edición">
                        </div>
                        <div>
                            <label for="selectCollapsed">Panel colapsado "collapsed"</label>
                            <select name="collapsed" id="selectCollapsed">
                                <option value="true" selected="selected">true</option>
                                <option value="false">false</option>
                            </select>
                        </div>
                        <div>
                            <label>Herramientas "features"</label>
                            <label><input type="checkbox" class="feat" value="drawfeature" checked> drawfeature</label>
                            <label><input type="checkbox" class="feat" value="modifyfeature" checked> modifyfeature</label>
                            <label><input type="checkbox" class="feat" value="deletefeature" checked> deletefeature</label>
                            <label><input type="checkbox" class="feat" value="editattribute" checked> editattribute</label>
                        </div>
                        <div>
                            <label for="layername">Capa WFS "layername"</label>
                            <input type="text" id="layername" value="RED_REGENTE" />
                        </div>
                        <div>
                            <label for="geometry">Geometría "geometry"</label>
                            <select id="geometry">
                                <option value="POINT" selected="selected">POINT</option>
                                <option value="LINE">LINE</option>
                                <option value="POLYGON">POLYGON</option>
                                <option value="MPOINT">MPOINT</option>
                                <option value="MLINE">MLINE</option>
                                <option value="MPOLYGON">MPOLYGON</option>
                            </select>
                        </div>
                        <div>
                            <label for="selectProxyStatus">Proxy activo "proxy.status"</label>
                            <select id="selectProxyStatus">
                                <option value="true" selected="selected">true</option>
                                <option value="false">false</option>
                            </select>
                        </div>
                        <div>
                            <label for="selectProxyDisable">Proxy deshabilitado "proxy.disable"</label>
                            <select id="selectProxyDisable">
                                <option value="false" selected="selected">false</option>
                                <option value="true">true</option>
                            </select>
                        </div>
                    </div>
                    <div class="m-test-buttons">
                        <button id="removeButton">Eliminar</button>
                    </div>
                </div>

                <div id="mapjs" class="m-container"></div>
                <script type="text/javascript" src="vendor/browser-polyfill.js"></script>
                <script type="text/javascript" src="js/apiidee.ol.min.js"></script>
                <script type="text/javascript" src="js/configuration.js"></script>
                <script type="text/javascript" src="plugins/wfstcontrols/wfstcontrols.ol.min.js"></script>
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

                            const wfsLayer = new IDEE.layer.WFS({
                                url: 'https://www.ign.es/wfs/redes-geodesicas?',
                                legend: 'Red Geodésica Nacional por Técnicas Espaciales (REGENTE)',
                                name: 'RED_REGENTE',
                                geometry: 'POINT',
                                extract: true
                            });
                            map.addWFS(wfsLayer);

                            let mp = null;

                            const selectPosicion = document.getElementById('selectPosicion');
                            const inputOrder = document.getElementById('inputOrder');
                            const inputTooltip = document.getElementById('inputTooltip');
                            const selectCollapsed = document.getElementById('selectCollapsed');
                            const layernameInput = document.getElementById('layername');
                            const geometrySelect = document.getElementById('geometry');
                            const selectProxyStatus = document.getElementById('selectProxyStatus');
                            const selectProxyDisable = document.getElementById('selectProxyDisable');
                            const featuresInputs = Array.from(document.querySelectorAll('.feat'));

                            function create(propiedades) {
                                mp = new IDEE.plugin.WFSTControls(propiedades);
                                map.addPlugin(mp);
                            }

                            function remove() {
                                if (mp) map.removePlugin(mp);
                                mp = null;
                            }

                            function changeTest() {
                                remove();
                                const options = {};

                                const selectPosition = selectPosicion.options[selectPosicion.selectedIndex].value;
                                if (selectPosition !== '') options.position = selectPosition;

                                if (inputTooltip.value !== '') options.tooltip = inputTooltip.value;

                                const collapsed = selectCollapsed.options[selectCollapsed.selectedIndex].value;
                                if (collapsed !== '') options.collapsed = (collapsed === 'true');

                                if (inputOrder.value !== undefined) options.order = Number(inputOrder.value);

                                const features = featuresInputs.filter((chk) => chk.checked).map((chk) => chk.value).join(',');
                                if (features !== '') options.features = features;

                                if (layernameInput.value !== '') options.layername = layernameInput.value;
                                if (geometrySelect.value !== '') options.geometry = geometrySelect.value;

                                options.proxy = {
                                    status: selectProxyStatus.options[selectProxyStatus.selectedIndex].value === 'true',
                                    disable: selectProxyDisable.options[selectProxyDisable.selectedIndex].value === 'true',
                                };

                                create(options);
                            }

                            [
                                selectPosicion,
                                inputTooltip,
                                selectCollapsed,
                                inputOrder,
                                layernameInput,
                                geometrySelect,
                                selectProxyStatus,
                                selectProxyDisable,
                                ...featuresInputs,
                            ].forEach((elm) => { elm.addEventListener('change', changeTest); });

                            const removeButton = document.getElementById('removeButton');
                            removeButton.addEventListener('click', () => { remove(); });

                            changeTest();

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
