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
                    <div class="m-test-form">
                        <div>
                            <label for="selectPosicion" title="Posición del Control">Posición del panel
                                "position"</label>
                            <select name="position" id="selectPosicion">
                                <option value="left">Izquierda (left)</option>
                                <option value="right">Derecha (right)</option>
                                <option value="center-top-left">Centro superior izquierdo (center-top-left)</option>
                                <option value="center-top-right">Centro superior derecho (center-top-right)</option>
                                <option value="center-bottom-left">Centro inferior izquierdo (center-bottom-left)
                                </option>
                                <option value="center-bottom-right">Centro inferior derecho (center-bottom-left)
                                </option>
                                <option value="down" selected="selected">Abajo (down)</option>
                            </select>
                        </div>
                        <div>
                            <label for="inputOrder"
                                title="Define en que posición del panel debe aparecer en el conjunto de controles o plugins">Orden
                                entre controles / plugins "order"</label>
                            <input type="number" name="order" id="inputOrder" list="orderSug" value="-1">
                        </div>
                        <div>
                            <label for="inputTooltip" title="Título ilustrativo que aporta información adicional">Título
                                "tooltip"</label>
                            <input type="text" name="tooltip" id="inputTooltip" list="tooltipSug" value="WMCSelector">
                        </div>
                    </div>
                    <div class="m-test-buttons">
                        <button name="eliminar control" class="m-test-button" id="removeButton">Eliminar
                            Control</button>
                    </div>
                </div>
                <div id="mapjs" class="m-container"></div>
                <script type="text/javascript" src="vendor/browser-polyfill.js"></script>
                <script type="text/javascript" src="js/apiidee.ol.min.js"></script>
                <script type="text/javascript" src="js/configuration.js"></script>
                <script type="text/javascript" src="plugins/sharemap/sharemap.ol.min.js"></script>
                <% String[] jsfiles=PluginsManager.getJSFiles(parameterMap); for (int i=0; i < jsfiles.length; i++) {
                    String jsfile=jsfiles[i]; %>
                    <script type="text/javascript" src="plugins/<%=jsfile%>"></script>

                    <% } %>
                        <script type="text/javascript">
                            const urlParams = new URLSearchParams(window.location.search);
                            let lang = urlParams.get('language');
                            if (!lang) {
                                lang = 'es';
                            }
                            IDEE.language.setLang(lang);
                            const map = IDEE.map({
                                container: 'mapjs',
                                wmcfile: ['callejero', 'ortofoto'],
                            });

                            const WMCSelector = IDEE.control.WMCSelector;

                            const create = (options) => {
                                if (!map.hasControl(WMCSelector.NAME)) {
                                    map.addControls(new WMCSelector(options));
                                }
                            };

                            const remove = () => {
                                const ctrls = map.getControls(WMCSelector.NAME);
                                if (ctrls.length === 1) map.removeControls(ctrls);
                            };

                            const selectPosition = document.getElementById('selectPosicion');
                            const inputTooltip = document.getElementById('inputTooltip');
                            const inputOrder = document.getElementById('inputOrder');

                            const recreate = () => {
                                remove();
                                const options = {};

                                const position = selectPosition.options[selectPosition.selectedIndex].value;
                                if (position !== '') options.position = position;

                                if (inputTooltip.value !== '') options.tooltip = inputTooltip.value;

                                if (inputOrder.value !== undefined) options.order = Number(inputOrder.value);

                                create(options);
                            };

                            [
                                selectPosition,
                                inputTooltip,
                                inputOrder,
                            ].forEach((ctrl) => {
                                ctrl.addEventListener('change', recreate);
                            });

                            const removeButton = document.getElementById('removeButton');
                            removeButton.addEventListener('click', () => {
                                remove();
                            });

                            recreate();

                            let mp = new IDEE.plugin.ShareMap({
                                baseUrl: window.location.href.substring(0, window.location.href.indexOf('api-idee')) + "api-idee/",
                                position: "right",
                            });
                            map.addPlugin(mp);
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
