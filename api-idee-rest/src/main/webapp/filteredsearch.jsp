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
                <link href="plugins/filteredsearch/filteredsearch.ol.min.css" rel="stylesheet" />
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
                    <div class="m-test-form">
                        <div>
                            <label for="selectPosicion">Posición del panel "position"</label>
                            <select name="position" id="selectPosicion">
                                <option value="left">Izquierda (left)</option>
                                <option value="right" selected="selected">Derecha (right)</option>
                            </select>
                        </div>
                        <div>
                            <label for="inputOrder"
                                title="Define en que posición del panel debe aparecer en el conjunto de controles o plugins">Orden
                                entre controles / plugins "order"</label>
                            <input type="number" name="order" id="inputOrder" list="orderSug" value="0">
                        </div>
                        <div>
                            <label for="inputTooltip"
                                title="Título ilustrativo que aporta información adicional">Información de la
                                herramienta
                                "tooltip"</label>
                            <input type="text" name="tooltip" id="inputTooltip" list="tooltipSug" value="Búsqueda filtrada">
                        </div>
                        <div>
                            <label for="selectCollapsed">Panel colapsado "collapsed"</label>
                            <select name="collapsed" id="selectCollapsed">
                                <option value="true" selected="selected">true</option>
                                <option value="false">false</option>
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
                <script type="text/javascript" src="plugins/filteredsearch/filteredsearch.ol.min.js"></script>
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
                                center: [-467062.8225, 4783459.6216],
                            });

                            const geodesia = new IDEE.layer.WFS({
                                url: 'https://www.ign.es/wfs/redes-geodesicas?',
                                legend: 'Red Geodésica Nacional por Técnicas Espaciales (REGENTE)',
                                name: 'RED_REGENTE',
                                geometry: 'POINT',
                                extract: true
                            });

                            const provincias = new IDEE.layer.WFS({
                                url: "https://hcsigc.juntadeandalucia.es/geoserver/wfs?",
                                namespace: "IECA",
                                name: "sigc_provincias_1724753768757",
                                legend: "Provincias",
                                geometry: 'MPOLYGON',
                            });

                            map.addWFS(geodesia);
                            map.addWFS(provincias);

                            let mp = null;

                            const selectPosicion = document.getElementById('selectPosicion');
                            const inputOrder = document.getElementById('inputOrder');
                            const inputTooltip = document.getElementById('inputTooltip');
                            const selectCollapsed = document.getElementById('selectCollapsed');

                            function create(propiedades) {
                                mp = new IDEE.plugin.FilteredSearch(propiedades);
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

                                create(options);
                            }

                            [
                                selectPosicion,
                                inputTooltip,
                                selectCollapsed,
                                inputOrder,
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

                function gtag() {
                    dataLayer.push(arguments);
                }
                gtag('js', new Date());
                gtag('config', 'G-19NTRSBP21');
            </script>

            </html>
