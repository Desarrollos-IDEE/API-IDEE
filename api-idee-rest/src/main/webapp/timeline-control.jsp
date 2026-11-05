<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
    <%@ page import="es.api_idee.plugins.PluginsManager" %>
        <%@ page import="java.util.Map" %>

            <!DOCTYPE html>
            <html lang="es">

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
                <style>
                    /* El script fija data-timeline-mode ("get" o "manual"); hasta entonces no se muestra ningún bloque. */
                    html:not([data-timeline-mode]) .timeline-get,
                    html:not([data-timeline-mode]) .timeline-manual,
                    html[data-timeline-mode="get"] .timeline-manual,
                    html[data-timeline-mode="manual"] .timeline-get {
                        display: none !important;
                    }

                    .timeline-diagnostics {
                        margin: 0;
                        padding: .5rem;
                        max-height: 10rem;
                        overflow: auto;
                        white-space: pre-wrap;
                        overflow-wrap: anywhere;
                        font-size: var(--idee-font-size-caption);
                        background-color: var(--idee-color-neutral-05);
                        border-radius: var(--idee-shape-border-radius);
                    }
                </style>
            </head>

            <body>
                <div class="m-api-idee-test-form-frame">
                    <div class="m-test-form timeline-manual" style="min-height: 12.15rem;">
                        <div>
                            <label for="selectLanguage">Idioma de la API</label>
                            <select name="language" id="selectLanguage">
                                <option value="es">Español (es)</option>
                                <option value="en">English (en)</option>
                                <option value="ca">Català (ca)</option>
                            </select>
                        </div>
                        <div>
                            <label for="selectPosicion">Posición del panel "position"</label>
                            <select name="position" id="selectPosicion">
                                <option value="" selected="selected"></option>
                                <option value="left">Izquierda (left)</option>
                                <option value="right">Derecha (right)</option>
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
                            <input type="number" name="order" id="inputOrder" list="orderSug" value="-1">
                        </div>
                        <div>
                            <label for="inputTooltip" title="Título ilustrativo que aporta información adicional">Título
                                "tooltip"</label>
                            <input type="text" name="tooltip" id="inputTooltip" list="tooltipSug"
                                value="Series Temporales">
                        </div>
                        <div>
                            <label for="inputTitle" title="Título del panel; por defecto, el tooltip">Título del panel
                                "title"</label>
                            <input type="text" name="title" id="inputTitle">
                        </div>
                        <div>
                            <label for="selectCollapsed">Panel colapsado "collapsed"</label>
                            <select name="collapsed" id="selectCollapsed">
                                <option value='' selected="selected"></option>
                                <option value="true">true</option>
                                <option value="false">false</option>
                            </select>
                        </div>
                        <div>
                            <label for="selectCollapsible">Panel colapsable "collapsible"</label>
                            <select name="collapsible" id="selectCollapsible">
                                <option value='' selected="selected"></option>
                                <option value="true">true</option>
                                <option value="false">false</option>
                            </select>
                        </div>
                        <div>
                            <label for="typeTimeLine">Tipo de línea de tiempo "timelineType"</label>
                            <select name="typeTimeLine" id="typeTimeLine">
                                <option value="absoluteSimple" selected="selected">absoluteSimple</option>
                                <option value="absolute">absolute</option>
                                <option value="relative">relative</option>
                                <option value="track">track</option>
                            </select>
                        </div>
                        <div>
                            <label for="selectTrack" title="Recorrido que se muestra al crear el control: en track es el principal; en el resto, complementario">Recorrido
                                inicial "track"</label>
                            <select name="track" id="selectTrack">
                                <option value="" selected="selected">(ninguno; en track, layerPosition o la primera capa)</option>
                                <option value="guadarrama">GPX trk con fechas y 3 segmentos (ruta_guadarrama · trk-4)</option>
                                <option value="variante">GPX trk sin fechas (ruta_guadarrama · trk-5)</option>
                                <option value="waypoints">GPX wpt con fechas, unidos (ruta_guadarrama · wpt-0…3)</option>
                                <option value="penalara">GPX trk con fechas (ruta_penalara · trk-4)</option>
                                <option value="penalaraRte">GPX rte sin fechas (ruta_penalara · rte-3)</option>
                                <option value="vectorPuntos">Vector: puntos sin tiempo, por orden (vector_sin_tiempo)</option>
                                <option value="vectorLinea">Vector: LineString sin tiempos (vector_sin_tiempo · l1)</option>
                            </select>
                        </div>
                        <div>
                            <label for="inputLayerPosition">Capa por defecto por posición "layerPosition" (1 =
                                superior)</label>
                            <input type="number" min="1" name="layerPosition" id="inputLayerPosition">
                        </div>
                        <div>
                            <label for="selectAnimation" title="Con false se ocultan play/pausa y la velocidad">Play/pausa
                                y velocidad "animation"</label>
                            <select name="animation" id="selectAnimation">
                                <option value=""></option>
                                <option value="true" selected="selected">true</option>
                                <option value="false">false</option>
                            </select>
                        </div>
                        <div class="origin">
                            <label for="selectIntervals">Selección de intervalos "intervals"</label>
                            <select name="intervals" id="selectIntervals">
                                <option selected></option>
                                <option
                                    value='[["NACIONAL 1981-1986","1986","WMS*NACIONAL_1981-1986*https://www.ign.es/wms/pnoa-historico*NACIONAL_1981-1986"],["OLISTAT","1998","WMS*OLISTAT*https://www.ign.es/wms/pnoa-historico*OLISTAT"],["SIGPAC","2003","WMS*SIGPAC*https://www.ign.es/wms/pnoa-historico*SIGPAC"],["PNOA 2004","2004","WMS*pnoa2004*https://www.ign.es/wms/pnoa-historico*pnoa2004"],["PNOA 2005","2005","WMS*pnoa2005*https://www.ign.es/wms/pnoa-historico*pnoa2005"],["PNOA 2006","2006","WMS*pnoa2006*https://www.ign.es/wms/pnoa-historico*pnoa2006"],["PNOA 2010","2010","WMS*pnoa2010*https://www.ign.es/wms/pnoa-historico*pnoa2010"]]'>
                                    Ej: 7 Capas</option>
                                <option
                                    value='[["NACIONAL 1981-1986","1986","WMS*NACIONAL_1981-1986*https://www.ign.es/wms/pnoa-historico*NACIONAL_1981-1986"],["OLISTAT","1998","WMS*OLISTAT*https://www.ign.es/wms/pnoa-historico*OLISTAT"],["SIGPAC","2003","WMS*SIGPAC*https://www.ign.es/wms/pnoa-historico*SIGPAC"],["PNOA 2004","2004","WMS*pnoa2004*https://www.ign.es/wms/pnoa-historico*pnoa2004"],["PNOA 2005","2005","WMS*pnoa2005*https://www.ign.es/wms/pnoa-historico*pnoa2005"],["PNOA 2006","2006","WMS*pnoa2006*https://www.ign.es/wms/pnoa-historico*pnoa2006"],["PNOA 2007","2007","WMS*pnoa2007*https://www.ign.es/wms/pnoa-historico*pnoa2007"],["PNOA 2008","2008","WMS*pnoa2008*https://www.ign.es/wms/pnoa-historico*pnoa2008"],["PNOA 2009","2009","WMS*pnoa2009*https://www.ign.es/wms/pnoa-historico*pnoa2009"],["PNOA 2010","2010","WMS*pnoa2010*https://www.ign.es/wms/pnoa-historico*pnoa2010"],["PNOA 2011","2011","WMS*pnoa2011*https://www.ign.es/wms/pnoa-historico*pnoa2011"],["PNOA 2012","2012","WMS*pnoa2012*https://www.ign.es/wms/pnoa-historico*pnoa2012"],["PNOA 2013","2013","WMS*pnoa2013*https://www.ign.es/wms/pnoa-historico*pnoa2013"],["PNOA 2014","2014","WMS*pnoa2014*https://www.ign.es/wms/pnoa-historico*pnoa2014"],["PNOA 2015","2015","WMS*pnoa2015*https://www.ign.es/wms/pnoa-historico*pnoa2015"],["PNOA 2016","2016","WMS*pnoa2016*https://www.ign.es/wms/pnoa-historico*pnoa2016"],["PNOA 2017","2017","WMS*pnoa2017*https://www.ign.es/wms/pnoa-historico*pnoa2017"],["PNOA 2018","2018","WMS*pnoa2018*https://www.ign.es/wms/pnoa-historico*pnoa2018"]]'>
                                    Ej: 18 capas</option>
                                <option
                                    value='[["PNOA 2004","2004","WMS*pnoa2004*https://www.ign.es/wms/pnoa-historico*pnoa2004"],["Ruta Guadarrama","2021","GPX*ruta_guadarrama*data/timeline/ruta-guadarrama.gpx*true*true"],["Ruta Peñalara","2021","GPX*ruta_penalara*data/timeline/ruta-penalara.gpx*true*true"]]'>
                                    Ej: WMS + rutas GPX</option>
                            </select>
                        </div>
                        <div class="origin">
                            <label for="inputIntervals">Intervalos "intervals"</label>
                            <input type="text" name="intervals" id="inputIntervals">
                        </div>
                        <div class="origin trackmode">
                            <label for="inputSpeed">Segundos por paso "speed" (1 = ×1)</label>
                            <input type="number" min="0.1" step="0.1" name="speed" id="inputSpeed">
                        </div>
                        <div class="origin">
                            <label for="selectSnapMode">Modo de ajuste de acercamiento "snapMode"</label>
                            <select name="snapMode" id="selectSnapMode">
                                <option value=""></option>
                                <option value="bySpep">bySpep</option>
                                <option value="byStepIntersection" selected="selected">byStepIntersection</option>
                            </select>
                        </div>
                        <div class="dynamic">
                            <label for="selectTime">Ejemplo de intervalos "intervals"</label>
                            <select name="selectTime" id="selectTime">
                                <option value="wms" selected="selected">WMS eventos sísmicos (CQL por date)</option>
                                <option value="gpx">GPX de ejemplo (filtro por time)</option>
                                <option value="rutas">Rutas GPX (pasos de 10 min)</option>
                            </select>
                        </div>
                        <div class="dynamic">
                            <label for="time" title="JSON; si se rellena, sustituye al ejemplo">Intervalos propios
                                "intervals" (JSON)</label>
                            <input type="text" name="time" id="time">
                        </div>
                        <div class="dynamic">
                            <label for="speedDate">Segundos por paso "speedDate" (2 = ×1)</label>
                            <input type="number" min="0.1" step="0.1" name="speedDate" id="speedDate">
                        </div>
                        <div class="dynamic">
                            <label for="paramsDate">Unidad de tiempo del paso "paramsDate"</label>
                            <select name="paramsDate" id="paramsDate">
                                <option value="" selected="selected">(por defecto, yr)</option>
                                <option value="yr">Años (yr)</option>
                                <option value="mos">Meses (mos)</option>
                                <option value="day">Días (day)</option>
                                <option value="hrs">Horas (hrs)</option>
                                <option value="min">Minutos (min)</option>
                                <option value="sec">Segundos (sec)</option>
                            </select>
                        </div>
                        <div class="dynamic">
                            <label for="stepValue">Valor del step "stepValue"</label>
                            <input type="number" min="1" name="stepValue" id="stepValue">
                        </div>
                        <div class="dynamic trackmode">
                            <label for="sizeWidthDinamic">Tamaño plugin "sizeWidthDinamic"</label>
                            <select name="sizeWidthDinamic" id="sizeWidthDinamic">
                                <option value="">Pequeño ("")</option>
                                <option value="sizeWidthDinamic_medium">Mediano ("sizeWidthDinamic_medium")</option>
                                <option value="sizeWidthDinamic_big">Grande ("sizeWidthDinamic_big")</option>
                            </select>
                        </div>
                        <div class="dynamic">
                            <label for="formatValueDinamic">Representación de los datos "formatValue"</label>
                            <select name="formatValueDinamic" id="formatValueDinamic">
                                <option value="" selected="selected">(por defecto, linear)</option>
                                <option value="logarithmic">Logarítmica ("logarithmic")</option>
                                <option value="exponential">Exponencial ("exponential")</option>
                                <option value="linear">Lineal ("linear")</option>
                            </select>
                        </div>
                        <div class="dynamic">
                            <label for="formatMove">Movimiento en pasos "formatMove"</label>
                            <select name="formatMove" id="formatMove">
                                <option value="" selected="selected">(por defecto según el tipo)</option>
                                <option value="continuous">Ventana deslizante ("continuous")</option>
                                <option value="discrete">Inicio fijo, fin móvil ("discrete")</option>
                            </select>
                        </div>
                    </div>
                    <div class="m-test-buttons">
                        <select id="timeline-scenario" title="Modo de apertura" aria-label="Modo de apertura">
                            <option value="manual">Manual (programático, sin GET)</option>
                            <option value="relative">GET · relative</option>
                            <option value="absolute">GET · absolute</option>
                            <option value="absoluteSimple">GET · absoluteSimple</option>
                            <option value="track">GET · track (recorrido y perfil)</option>
                            <option value="recorridos">GET · relative con recorrido sincronizado</option>
                        </select>
                        <button id="removeButton" type="button" class="timeline-manual">Eliminar control</button>
                        <button id="timeline-refresh" type="button" class="timeline-get">Refrescar diagnóstico</button>
                        <button id="timeline-next" type="button" class="secondary timeline-get">Seleccionar siguiente
                            capa</button>
                        <button id="timeline-remove" type="button" class="secondary timeline-get">Retirar
                            Timeline</button>
                        <button id="timeline-add" type="button" class="secondary timeline-get">Volver a añadir el mismo
                            Timeline</button>
                    </div>
                    <pre id="timeline-diagnostics" class="timeline-diagnostics timeline-get" aria-live="polite"></pre>
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
                            /*
                             * Control Timeline (como test/development/CP-0003-controls/CP-014 de api-idee-js).
                             *
                             * Modo manual (por defecto, sin query string): formulario con todas las opciones del
                             * control; crea el Timeline con new IDEE.control.Timeline(...) y lo recrea al cambiar
                             * cualquier campo. "Eliminar control" lo retira y, pulsado de nuevo, lo crea.
                             *
                             * Escenarios GET (?demo=relative|absolute|absoluteSimple|track|recorridos, desde "Modo de apertura"):
                             * antes de crear el mapa se navega a una URL GET real con `layers` (dos GPX y una base) y
                             * `controls` (Timeline con `intervals` en base64). Como api-idee-rest (BuilderWS), las
                             * entradas se separan por comas y llegan como cadenas a IDEE.map({ layers, controls }):
                             * el GPX lo crea el parser general y el Timeline, buildControl. Si la URL ya trae
                             * `layers` o `controls`, se respeta. El panel inferior muestra el estado y la consola lo
                             * registra; window.mapa, window.timeline y window.timelineDemo.estado() sirven para depurar.
                             * `track`: timelineType=track con dos rutas GPX por GET; layerPosition=2 elige
                             * ruta_guadarrama y su primera línea con fechas (trk-4, tres segmentos). `recorridos`:
                             * relative con las dos rutas (pasos de 10 min) y la opción `track`, sincronizada con el rango.
                             * En el modo manual el mapa incluye las dos rutas y una capa vectorial sin tiempos como
                             * fuentes de recorrido, y el campo "track" elige el recorrido inicial en cualquier tipo.
                             *
                             * En las JSP, dólar seguido de llave es una expresión EL: el script no usa plantillas de JS.
                             */
                            const urlParams = new URLSearchParams(window.location.search);
                            IDEE.language.setLang(urlParams.get('language') || 'es');

                            // Modo manual por defecto: sin `demo`, `layers` ni `controls` (o con mode=manual).
                            const manual = urlParams.get('mode') === 'manual'
                                || !['demo', 'layers', 'controls'].some((key) => urlParams.has(key));
                            const Timeline = IDEE.control.Timeline;
                            const EventType = IDEE.evt;

                            // GPX de ejemplo de la webapp: wpt-0 y rte-2 tienen time en 2020; wpt-1 y trk-3, en 2021.
                            const GPX_URL = new URL('data/timeline/timeline-ejemplo.gpx', window.location.href).href;
                            const ROUTES = {
                                guadarrama: new URL('data/timeline/ruta-guadarrama.gpx', window.location.href).href,
                                penalara: new URL('data/timeline/ruta-penalara.gpx', window.location.href).href,
                            };
                            const TRACK_EXAMPLES = {
                                guadarrama: { layer: 'ruta_guadarrama', feature: 'trk-4' },
                                variante: { layer: 'ruta_guadarrama', feature: 'trk-5' },
                                waypoints: { layer: 'ruta_guadarrama', feature: ['wpt-0', 'wpt-1', 'wpt-2', 'wpt-3'] },
                                penalara: { layer: 'ruta_penalara', feature: 'trk-4' },
                                penalaraRte: { layer: 'ruta_penalara', feature: 'rte-3' },
                                vectorPuntos: { layer: 'vector_sin_tiempo', feature: ['p1', 'p2', 'p3', 'p4', 'p5'] },
                                vectorLinea: { layer: 'vector_sin_tiempo', feature: 'l1' },
                            };
                            const toMercator = ([lon, lat]) => [
                                (lon * 20037508.34) / 180,
                                ((Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) / (Math.PI / 180)) * 20037508.34) / 180,
                            ];
                            // base64 de UTF-8, como espera parseUrlParams (base64~).
                            const toBase64 = (value) => {
                                let binary = '';
                                new TextEncoder().encode(JSON.stringify(value)).forEach((byte) => {
                                    binary += String.fromCharCode(byte);
                                });
                                return window.btoa(binary);
                            };
                            const ROUTE_INTERVALS = [
                                {
                                    id: 'guadarrama',
                                    init: '2021-06-05T08:00:00Z',
                                    end: '2021-06-05T13:20:00Z',
                                    layer: 'ruta_guadarrama',
                                    attributeParam: 'time',
                                },
                                {
                                    id: 'penalara',
                                    init: '2021-07-10T09:00:00Z',
                                    end: '2021-07-10T12:00:00Z',
                                    layer: 'ruta_penalara',
                                    attributeParam: 'time',
                                },
                            ];

                            /*
                             * Escenarios GET: navega (location.replace) a la URL con `layers` y `controls`.
                             * Devuelve true si redirige; en ese caso no debe crearse el mapa.
                             */
                            const prepareTimelineGetDemo = () => {
                                const params = new URLSearchParams(urlParams);
                                document.documentElement.dataset.timelineMode = manual ? 'manual' : 'get';
                                if (manual || params.has('layers') || params.has('controls')) return false;

                                const demo = ['relative', 'absolute', 'absoluteSimple', 'recorridos', 'track'].includes(params.get('demo'))
                                    ? params.get('demo') : 'relative';
                                if (demo === 'recorridos' || demo === 'track') {
                                    params.set('demo', demo);
                                    params.set('layers', [
                                        'QUICK*Base_IGNBaseTodo_TMS',
                                        'GPX*ruta_guadarrama*' + ROUTES.guadarrama + '*true*true',
                                        'GPX*ruta_penalara*' + ROUTES.penalara + '*true*true',
                                    ].join(','));
                                    const common = ['collapsible=false', 'collapsed=false', 'position=right',
                                        'sizeWidthDinamic=sizeWidthDinamic_medium'];
                                    const options = demo === 'track'
                                        ? ['timelineType=track', ...common, 'layerPosition=2', 'speed=0.5']
                                        : [
                                            'timelineType=relative',
                                            ...common,
                                            'layerPosition=2',
                                            'paramsDate=min',
                                            'stepValue=10',
                                            'speedDate=1',
                                            'intervals=base64~' + toBase64(ROUTE_INTERVALS),
                                            'track=base64~' + toBase64(TRACK_EXAMPLES.guadarrama),
                                        ];
                                    params.set('controls', 'timeline*' + options.join(';'));
                                    params.set('center', '-445835,4982151');
                                    params.set('zoom', '12');
                                    window.location.replace(window.location.pathname + '?' + params.toString() + window.location.hash);
                                    return true;
                                }

                                // Posiciones resultantes (1 = superior): 1 gpx_definicion, 2 gpx_nombre, 3 base.
                                const layers = [
                                    'QUICK*Base_IGNBaseTodo_TMS',
                                    'GPX*gpx_nombre*' + GPX_URL + '*true*true',
                                    'GPX*gpx_definicion*' + GPX_URL + '*true*true',
                                ];

                                // gpx_nombre: referencia por nombre a una capa existente.
                                // gpx_definicion: definición "*" que coincide con una capa existente (se reutiliza).
                                // gpx_creada: definición "*" que no está en `layers` (Timeline la crea).
                                const intervals = demo === 'absoluteSimple' ? [
                                    ['GPX por nombre', '2020', 'gpx_nombre'],
                                    ['GPX por definición', '2021', 'GPX*gpx_definicion*' + GPX_URL + '*true*true'],
                                    ['GPX creada', '2022', 'GPX*gpx_creada*' + GPX_URL + '*true*true'],
                                ] : [
                                    {
                                        id: 'por-nombre',
                                        init: '2020-01-01T00:00:00Z',
                                        end: '2021-12-31T23:59:59Z',
                                        layer: 'gpx_nombre',
                                        attributeParam: 'time',
                                    },
                                    {
                                        id: 'por-definicion',
                                        init: '2020-01-01T00:00:00Z',
                                        end: '2020-12-31T23:59:59Z',
                                        layer: 'GPX*gpx_definicion*' + GPX_URL + '*true*true',
                                        attributeParam: 'time',
                                    },
                                    {
                                        id: 'creada',
                                        init: '2021-01-01T00:00:00Z',
                                        end: '2021-12-31T23:59:59Z',
                                        layer: 'GPX*gpx_creada*' + GPX_URL + '*true*true',
                                        attributeParam: 'time',
                                    },
                                ];

                                const timelineOptions = [
                                    'timelineType=' + demo,
                                    'collapsible=false',
                                    'collapsed=false',
                                    'position=right',
                                    'layerPosition=2',
                                    'sizeWidthDinamic=sizeWidthDinamic_medium',
                                    'paramsDate=mos',
                                    'stepValue=1',
                                    'speedDate=1',
                                    'intervals=base64~' + toBase64(intervals),
                                ];

                                params.set('demo', demo);
                                params.set('layers', layers.join(','));
                                params.set('controls', 'timeline*' + timelineOptions.join(';'));
                                // Centro desplazado al este para que el panel (a la derecha) no tape el GPX.
                                params.set('center', '-407000,4928393');
                                params.set('zoom', '13');
                                window.location.replace(window.location.pathname + '?' + params.toString() + window.location.hash);
                                return true;
                            };

                            const splitEntries = (value) => (value || '').split(',')
                                .map((entry) => entry.trim())
                                .filter((entry) => entry !== '');

                            const getMapParametersFromUrl = () => {
                                const parameters = { container: 'mapjs' };
                                ['center', 'zoom', 'projection'].forEach((key) => {
                                    if (urlParams.has(key)) parameters[key] = urlParams.get(key);
                                });
                                const layers = splitEntries(urlParams.get('layers'));
                                const controls = splitEntries(urlParams.get('controls'));
                                if (layers.length > 0) parameters.layers = layers;
                                if (controls.length > 0) parameters.controls = controls;
                                return parameters;
                            };

                            const decodeBase64Utf8 = (text) => {
                                const binary = window.atob(text);
                                const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
                                return new TextDecoder('utf-8').decode(bytes);
                            };

                            // Selector "Modo de apertura": marca el actual y navega al elegido (conserva `language`).
                            const setupScenarioSelector = () => {
                                const select = document.getElementById('timeline-scenario');
                                const demo = urlParams.get('demo');
                                if (manual) {
                                    select.value = 'manual';
                                } else if (demo && [...select.options].some((option) => option.value === demo)) {
                                    select.value = demo;
                                } else {
                                    const custom = document.createElement('option');
                                    custom.textContent = 'URL GET personalizada';
                                    custom.disabled = true;
                                    select.prepend(custom);
                                    select.selectedIndex = 0;
                                }
                                select.addEventListener('change', () => {
                                    const params = new URLSearchParams();
                                    if (select.value !== 'manual') params.set('demo', select.value);
                                    if (urlParams.has('language')) params.set('language', urlParams.get('language'));
                                    const query = params.toString();
                                    window.location.assign(window.location.pathname + (query ? '?' + query : ''));
                                });
                            };

                            // Solo para mostrarlos: abrevia la URL del GPX y recorta el base64 de intervals.
                            const shortenPath = (text) => text.split(GPX_URL).join('…/timeline-ejemplo.gpx')
                                .split(ROUTES.guadarrama).join('…/ruta-guadarrama.gpx')
                                .split(ROUTES.penalara).join('…/ruta-penalara.gpx');
                            const shortenControl = (control) => control.replace(/base64~([^;]+)/,
                                (match, base64) => 'base64~' + base64.slice(0, 8) + '… (' + base64.length + ' car.)');

                            // Los intervalos tal y como viajan en la URL, una línea cada uno.
                            const decodeIntervalsParam = (controls) => controls.flatMap((control) => {
                                const match = control.match(/intervals=base64~([^;]+)/);
                                if (!match) return [];
                                try {
                                    return JSON.parse(decodeBase64Utf8(match[1])).map((interval) => (Array.isArray(interval)
                                        ? interval.map((value) => shortenPath(String(value))).join(' · ')
                                        : [interval.id, shortenPath(String(interval.layer || interval.service)),
                                            interval.init + ' → ' + interval.end, interval.attributeParam].join(' · ')));
                                } catch (error) {
                                    return ['No se pudo decodificar: ' + error];
                                }
                            });

                            // Orden del visualizador como lo muestra el LayerSwitcher (1 = capa superior).
                            const getViewerLayers = (mapa) => mapa.getLayers()
                                .filter((layer) => layer.name !== '__draw__' && layer.displayInLayerSwitcher !== false)
                                .map((layer, index) => ({ layer, index, zIndex: Number(layer.getZIndex()) || 0 }))
                                .sort((a, b) => (b.zIndex - a.zIndex) || (b.index - a.index))
                                .map(({ layer }) => layer);

                            const toISO = (time) => (Number.isFinite(time) && time !== 0 ? new Date(time).toISOString() : time);

                            // Velocidad elegida en el selector del panel y segundos por paso que usa la reproducción.
                            const getSpeedText = (control) => {
                                const select = control.getElement() && control.getElement().querySelector('.m-timeline-speed');
                                const option = select && select.selectedOptions[0];
                                const seconds = ['absoluteSimple', 'track'].includes(control.timelineType)
                                    ? control.speed : control.speedDate;
                                return (option ? option.textContent : '–') + ' (' + Number(seconds) + ' s/paso)';
                            };

                            const describeTrack = (track) => {
                                if (!track) return 'sin recorrido';
                                const time = track.time !== null ? ' · ' + new Date(track.time).toISOString() : '';
                                return [
                                    track.label + ' (' + track.kind + ', ' + (track.timed ? 'temporal' : 'secuencial') + ')',
                                    'paso ' + track.step + '/' + track.steps + time,
                                    'segmento ' + (track.segment === null ? '–' : track.segment + 1),
                                    Math.round(track.fraction * 100) + ' %',
                                    track.synchronized ? 'sincronizado' : 'sin sincronizar',
                                ].join(' · ');
                            };

                            const startGetScenario = () => {
                                const parameters = getMapParametersFromUrl();
                                const mapa = IDEE.map(parameters);
                                const timeline = mapa.getControls(Timeline.NAME)[0];
                                window.mapa = mapa;
                                window.timeline = timeline;

                                // Estado compacto (una línea por elemento).
                                const getState = () => {
                                    const timelineLayers = timeline ? timeline.getLayers() : [];
                                    // Opciones interpretadas por buildControl que vienen en `controls`, sin intervals.
                                    const controlsText = (parameters.controls || []).join(';');
                                    const getOptions = Object.fromEntries(Object.entries((timeline && timeline.builderParams) || {})
                                        .filter(([key]) => key !== 'intervals' && controlsText.includes(key + '=')));
                                    const selected = timeline && timeline.getSelectedLayer();
                                    return {
                                        get: {
                                            layers: (parameters.layers || []).map(shortenPath),
                                            controls: (parameters.controls || []).map(shortenControl),
                                            intervals: decodeIntervalsParam(parameters.controls || []),
                                            vista: (parameters.center || '-') + ' · zoom ' + (parameters.zoom || '-'),
                                        },
                                        timeline: timeline ? {
                                            opciones: JSON.stringify(getOptions),
                                            seleccionada: selected ? selected.name : null,
                                            rango: toISO(timeline.date.init) + ' → ' + toISO(timeline.date.end),
                                            reproduciendo: timeline.running !== false,
                                            velocidad: getSpeedText(timeline),
                                            movimiento: (timeline.formatMove === 'discrete' && 'inicio fijo') || 'ventana deslizante',
                                            recorrido: describeTrack(timeline.getTrack()),
                                        } : 'No hay Timeline en el mapa',
                                        selector: timeline ? timeline.getSelectableLayers().map((entry) => [
                                            entry.position ? '[' + entry.position + ']' : '[–]',
                                            entry.name,
                                            entry.selected ? '✓' : '',
                                        ].join(' ').trim()) : [],
                                        visualizador: getViewerLayers(mapa).map((layer, index) => [
                                            index + 1,
                                            layer.name,
                                            layer.type,
                                            layer.isVisible() ? 'visible' : 'oculta',
                                            timelineLayers.includes(layer) ? 'Timeline' : '',
                                            timeline && timeline.isValidLayer(layer) ? 'elegible' : 'no elegible',
                                        ].filter((value) => value !== '').join(' · ')),
                                        gpx: mapa.getGPX().map((layer) => layer.name + ': ' + layer.getFeatures().length + '/'
                                            + layer.getFeatures(true).length + ' visibles ('
                                            + layer.getFeatures().map((feature) => feature.getId()).join(', ') + ')'),
                                    };
                                };

                                // Texto del panel: una línea por elemento (la consola recibe el objeto).
                                const formatState = (state) => {
                                    const list = (items) => items.map((item) => '  ' + item);
                                    const t = state.timeline;
                                    return [
                                        'GET layers: ' + state.get.layers.join(' | '),
                                        'GET controls: ' + state.get.controls.join(' | '),
                                        'GET vista: ' + state.get.vista,
                                        'Intervalos (base64 decodificado):',
                                        ...list(state.get.intervals),
                                        typeof t === 'string' ? t
                                            : ['Timeline: ' + (t.seleccionada || 'sin capa'), t.rango,
                                                t.reproduciendo ? 'reproduciendo' : 'parado', t.velocidad, t.movimiento].join(' · '),
                                        typeof t === 'string' ? '' : '  opciones GET: ' + t.opciones,
                                        typeof t === 'string' ? '' : '  recorrido: ' + t.recorrido,
                                        'Selector: ' + state.selector.join(' | '),
                                        'Visualizador (1 = superior):',
                                        ...list(state.visualizador),
                                        'GPX:',
                                        ...list(state.gpx),
                                    ].filter((line) => line !== '').join('\n');
                                };

                                const output = document.getElementById('timeline-diagnostics');
                                let last = '';
                                const render = (log = false) => {
                                    const state = getState();
                                    const text = formatState(state);
                                    output.textContent = text;
                                    if (log || text !== last) {
                                        console.groupCollapsed('[Timeline] Estado');
                                        console.log(state);
                                        console.groupEnd();
                                    }
                                    last = text;
                                };
                                window.timelineDemo = { estado: getState, refrescar: () => render(true) };

                                const scheduleRender = () => queueMicrotask(render);
                                if (timeline) timeline.on(EventType.CHANGE, scheduleRender);
                                mapa.on(EventType.ADDED_LAYER, (layers) => {
                                    [].concat(layers).forEach((layer) => layer && layer.on && layer.on(EventType.LOAD, scheduleRender));
                                    scheduleRender();
                                });
                                mapa.on(EventType.REMOVED_LAYER, scheduleRender);
                                mapa.getGPX().forEach((layer) => layer.on(EventType.LOAD, scheduleRender));
                                // Respaldo para cambios sin evento (p. ej. visibilidad desde el LayerSwitcher).
                                setInterval(render, 1500);

                                document.getElementById('timeline-refresh').addEventListener('click', () => render(true));
                                document.getElementById('timeline-next').addEventListener('click', () => {
                                    const entries = timeline.getSelectableLayers();
                                    const index = entries.findIndex((entry) => entry.selected);
                                    const next = entries[(index + 1) % entries.length];
                                    if (next) timeline.selectLayer(next.id);
                                });
                                document.getElementById('timeline-remove').addEventListener('click', () => {
                                    if (mapa.getControls(Timeline.NAME).length > 0) mapa.removeControls(timeline);
                                    scheduleRender();
                                });
                                document.getElementById('timeline-add').addEventListener('click', () => {
                                    if (mapa.getControls(Timeline.NAME).length === 0) mapa.addControls(timeline);
                                    scheduleRender();
                                });
                                render(true);
                            };

                            // Modo manual: el formulario define las opciones; los campos vacíos no se pasan.
                            const startManualScenario = () => {
                                const map = IDEE.map({
                                    container: 'mapjs',
                                    controls: ['rotate'],
                                    center: [-445835, 4982151],
                                    zoom: 11,
                                });
                                window.mapa = map;

                                map.addLayers([
                                    'GPX*ruta_guadarrama*' + ROUTES.guadarrama + '*true*true',
                                    'GPX*ruta_penalara*' + ROUTES.penalara + '*true*true',
                                ]);
                                const vectorLayer = new IDEE.layer.Vector({ name: 'vector_sin_tiempo', legend: 'Vector sin tiempos' });
                                map.addLayers(vectorLayer);
                                vectorLayer.addFeatures([
                                    [-4.035, 40.765], [-4.015, 40.772], [-3.995, 40.769], [-3.978, 40.776], [-3.962, 40.784],
                                ].map((point, index) => new IDEE.Feature('p' + (index + 1), {
                                    type: 'Feature',
                                    geometry: { type: 'Point', coordinates: toMercator(point) },
                                    properties: { name: 'Punto ' + (index + 1) },
                                })).concat(new IDEE.Feature('l1', {
                                    type: 'Feature',
                                    geometry: {
                                        type: 'LineString',
                                        coordinates: [[-4.05, 40.745], [-4.03, 40.752], [-4.01, 40.748], [-3.99, 40.756], [-3.97, 40.751]]
                                            .map(toMercator),
                                    },
                                    properties: { name: 'Línea sin tiempos' },
                                })));

                                const create = (options) => {
                                    if (!map.hasControl(Timeline.NAME)) {
                                        window.timeline = new Timeline(options);
                                        map.addControls(window.timeline);
                                    }
                                };

                                const remove = () => {
                                    const ctrls = map.getControls(Timeline.NAME);
                                    if (ctrls.length === 1) map.removeControls(ctrls);
                                };

                                const intervals = [
                                    ['NACIONAL 1981-1986', '1986', 'WMS*NACIONAL_1981-1986*https://www.ign.es/wms/pnoa-historico*NACIONAL_1981-1986'],
                                    ['OLISTAT', '1998', 'WMS*OLISTAT*https://www.ign.es/wms/pnoa-historico*OLISTAT'],
                                    ['SIGPAC', '1998', 'WMS*SIGPAC*https://www.ign.es/wms/pnoa-historico*SIGPAC'],
                                    ['PNOA 2004', '2004', 'WMS*pnoa2004*https://www.ign.es/wms/pnoa-historico*pnoa2004'],
                                    ['PNOA 2005', '2005', 'WMS*pnoa2005*https://www.ign.es/wms/pnoa-historico*pnoa2005'],
                                    ['PNOA 2006', '2006', 'WMS*pnoa2006*https://www.ign.es/wms/pnoa-historico*pnoa2006'],
                                    ['PNOA 2010', '2010', 'WMS*pnoa2010*https://www.ign.es/wms/pnoa-historico*pnoa2010'],
                                ];
                                const time = [
                                    {
                                        id: '1',
                                        init: '1990-05-12T23:39:58.767Z',
                                        end: '2015-05-29T20:22:26.001Z',
                                        layer: 'WMS*Eventos sísmicos*https://www.ign.es/wms-inspire/geofisica*NZ.ObservedEvent',
                                        attributeParam: 'date',
                                    },
                                    {
                                        id: '2',
                                        init: '1990-05-12T23:39:58.767Z',
                                        end: '2015-05-29T20:22:26.001Z',
                                        layer: 'WMS*Eventos sísmicos*https://www.ign.es/wms-inspire/geofisica*NZ.ObservedEvent',
                                        attributeParam: 'date',
                                        grupo: 'NZ.ObservedEvent - equalsTimeLine',
                                    },
                                ];
                                // Timeline crea la capa GPX a partir de la definición "*".
                                const gpxIntervals = [{
                                    id: 'gpx',
                                    init: '2020-01-01T00:00:00Z',
                                    end: '2021-12-31T23:59:59Z',
                                    layer: 'GPX*gpx_ejemplo*' + GPX_URL + '*true*true',
                                    attributeParam: 'time',
                                }];
                                const routeIntervals = ROUTE_INTERVALS.map((interval) => ({
                                    ...interval,
                                    layer: 'GPX*' + interval.layer + '*' + ROUTES[interval.id] + '*true*true',
                                }));
                                const dynamicExamples = { wms: time, gpx: gpxIntervals, rutas: routeIntervals };

                                const field = (id) => document.getElementById(id);
                                const value = (id) => field(id).value;
                                const typeTimeLine = field('typeTimeLine');

                                const changeTestFormsDisplay = (formValue = typeTimeLine) => {
                                    const group = { absoluteSimple: 'origin', track: 'trackmode' }[formValue.value] || 'dynamic';
                                    document.querySelectorAll('.origin, .dynamic, .trackmode').forEach((el) => {
                                        el.style.display = el.classList.contains(group) ? 'flex' : 'none';
                                    });
                                };

                                // Opciones del control a partir del formulario: los campos vacíos no se pasan y el
                                // control aplica sus valores por defecto.
                                const readOptions = () => {
                                    const options = { timelineType: typeTimeLine.value };
                                    const optional = {
                                        position: value('selectPosicion'),
                                        tooltip: value('inputTooltip'),
                                        title: value('inputTitle'),
                                    };
                                    Object.entries(optional).forEach(([key, text]) => {
                                        if (text !== '') options[key] = text;
                                    });
                                    ['selectCollapsible', 'selectCollapsed', 'selectAnimation'].forEach((id) => {
                                        if (value(id) !== '') options[field(id).name] = value(id) === 'true';
                                    });
                                    if (value('inputOrder') !== '') options.order = Number(value('inputOrder'));
                                    if (value('inputLayerPosition') !== '') options.layerPosition = Number(value('inputLayerPosition'));
                                    if (value('selectTrack') !== '') options.track = TRACK_EXAMPLES[value('selectTrack')];

                                    if (typeTimeLine.value === 'track') {
                                        if (Number(value('inputSpeed')) > 0) options.speed = Number(value('inputSpeed'));
                                        if (value('sizeWidthDinamic') !== '') options.sizeWidthDinamic = value('sizeWidthDinamic');
                                    } else if (typeTimeLine.value === 'absoluteSimple') {
                                        options.intervals = value('inputIntervals') !== '' ? value('inputIntervals') : intervals;
                                        if (Number(value('inputSpeed')) > 0) options.speed = Number(value('inputSpeed'));
                                        if (value('selectSnapMode') !== '') options.snapMode = value('selectSnapMode');
                                    } else {
                                        options.intervals = value('time') !== '' ? value('time') : dynamicExamples[value('selectTime')];
                                        if (Number(value('speedDate')) > 0) options.speedDate = Number(value('speedDate'));
                                        if (Number(value('stepValue')) > 0) options.stepValue = Number(value('stepValue'));
                                        ['paramsDate', 'sizeWidthDinamic', 'formatValueDinamic', 'formatMove'].forEach((id) => {
                                            const key = id === 'formatValueDinamic' ? 'formatValue' : field(id).name;
                                            if (value(id) !== '') options[key] = value(id);
                                        });
                                    }
                                    return options;
                                };

                                const removeButton = field('removeButton');
                                const updateRemoveButton = () => {
                                    removeButton.textContent = map.hasControl(Timeline.NAME) ? 'Eliminar control' : 'Crear control';
                                };

                                const changeTest = () => {
                                    remove();
                                    create(readOptions());
                                    updateRemoveButton();
                                };

                                [
                                    'selectPosicion', 'inputIntervals', 'selectAnimation', 'inputSpeed', 'time', 'selectTime',
                                    'speedDate', 'paramsDate', 'stepValue', 'sizeWidthDinamic', 'formatValueDinamic', 'formatMove',
                                    'inputTooltip', 'inputTitle', 'selectCollapsible', 'selectCollapsed', 'inputOrder',
                                    'selectSnapMode', 'inputLayerPosition', 'selectTrack',
                                ].forEach((id) => field(id).addEventListener('change', changeTest));

                                field('selectTime').addEventListener('change', () => {
                                    if (value('selectTime') !== 'rutas') return;
                                    field('paramsDate').value = 'min';
                                    field('stepValue').value = '10';
                                    field('speedDate').value = '1';
                                    if (value('selectTrack') === '') field('selectTrack').value = 'guadarrama';
                                }, true);

                                field('selectIntervals').addEventListener('change', () => {
                                    field('inputIntervals').value = value('selectIntervals');
                                    changeTest();
                                });

                                typeTimeLine.addEventListener('change', (event) => {
                                    if (event.target) {
                                        changeTestFormsDisplay(event.target);
                                        changeTest();
                                    }
                                });

                                // Idioma de la API: los textos del control (títulos y etiquetas) se toman al crearlo.
                                const selectLanguage = field('selectLanguage');
                                selectLanguage.value = urlParams.get('language') || 'es';
                                selectLanguage.addEventListener('change', () => {
                                    IDEE.language.setLang(selectLanguage.value);
                                    changeTest();
                                });

                                // Elimina el control o, si no está, lo crea con las opciones del formulario.
                                removeButton.addEventListener('click', () => {
                                    if (map.hasControl(Timeline.NAME)) remove();
                                    else create(readOptions());
                                    updateRemoveButton();
                                });

                                changeTestFormsDisplay();
                                create(readOptions());
                                updateRemoveButton();
                            };

                            if (!prepareTimelineGetDemo()) {
                                setupScenarioSelector();
                                if (manual) startManualScenario();
                                else startGetScenario();
                            }
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
