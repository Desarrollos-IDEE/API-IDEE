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
    <link href="plugins/stylemanager/stylemanager.ol.min.css" rel="stylesheet" />
    <link href="plugins/sharemap/sharemap.ol.min.css" rel="stylesheet" />
    <link href="plugins/vectors/vectors.ol.min.css" rel="stylesheet" />
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
    <div>
        <label for="selectPosicion">Selector de posición del plugin</label>
        <select name="position" id="selectPosicion">
            <option value="TL" selected="selected">Arriba Izquierda (TL)</option>
            <option value="TR">Arriba Derecha (TR)</option>
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
        <label for="inputTooltip">Parámetro tooltip</label>
        <input type="text" id="inputTooltip" value="Gestor de estilos" />
        <label for="selectLayer">Selector de capa</label>
        <select name="layer" id="selectLayer">
            <option value="" selected="selected"></option>
            <option value="points">points</option>
            <option value="polygons">polygons</option>
            <option value="allgeoms">allgeoms</option>
        </select>
        <input type="button" value="Eliminar Plugin" name="eliminar" id="botonEliminar" />
    </div>
    <div id="mapjs" class="m-container"></div>
    <script type="text/javascript" src="vendor/browser-polyfill.js"></script>
    <script type="text/javascript" src="js/apiidee.ol.min.js"></script>
    <script type="text/javascript" src="js/configuration.js"></script>
    <script type="text/javascript" src="plugins/stylemanager/stylemanager.ol.min.js"></script>
    <script type="text/javascript" src="plugins/sharemap/sharemap.ol.min.js"></script>
    <script type="text/javascript" src="plugins/vectors/vectors.ol.min.js"></script>
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
        const urlParams = new URLSearchParams(window.location.search);
        IDEE.language.setLang(urlParams.get('language') || 'es');

        const map = IDEE.map({
            container: 'mapjs',
        });
        const points = new IDEE.layer.WFS({
            url: 'http://geostematicos-sigc.juntadeandalucia.es/geoserver/sepim/ows?',
            namespace: 'sepim',
            name: 'campamentos',
            legend: 'Campamentos',
            geometry: 'POINT',
        });
        map.addLayers(points);


        const polygons = new IDEE.layer.WFS({
            url: 'http://geostematicos-sigc.juntadeandalucia.es/geoserver/tematicos/ows?',
            namespace: 'tematicos',
            name: 'Provincias',
            legend: 'Provincias',
            geometry: 'MPOLYGON',
        });
        map.addLayers(polygons);

        const allgeoms = new IDEE.layer.GeoJSON({
            name: "allgeoms",
            source: {
                "type": "FeatureCollection",
                "features": [{
                        "type": "Feature",
                        "id": "temp_1671099227379.1671099241598",
                        "geometry": {
                            "type": "Point",
                            "coordinates": [
                                -3.9550781249999925,
                                48.283192895483495,
                                0
                            ]
                        },
                        "properties": {
                            "alumnos": 3955,
                            "colegios": 41
                        }
                    },
                    {
                        "type": "Feature",
                        "id": "temp_1671099378275.1671099397755",
                        "geometry": {
                            "type": "LineString",
                            "coordinates": [
                                [
                                    7.382812500000008,
                                    43.802818719047195,
                                    0
                                ],
                                [
                                    8.129882812500007,
                                    46.8301336404474,
                                    0
                                ]
                            ]
                        },
                        "properties": {
                            "alumnos": 73828,
                            "colegios": 3500
                        }
                    },
                    {
                        "type": "Feature",
                        "id": "temp_1671099558770.1671099570826",
                        "geometry": {
                            "type": "Polygon",
                            "coordinates": [
                                [
                                    [
                                        1.076660156250006,
                                        45.92058734473366,
                                        0
                                    ],
                                    [
                                        3.911132812500006,
                                        48.70546289579056,
                                        0
                                    ],
                                    [
                                        4.504394531250007,
                                        47.546871598922365,
                                        0
                                    ],
                                    [
                                        3.229980468750008,
                                        46.27103747280259,
                                        0
                                    ],
                                    [
                                        0.9448242187500056,
                                        44.30812668488613,
                                        0
                                    ],
                                    [
                                        1.1206054687500069,
                                        45.95114968669142,
                                        0
                                    ],
                                    [
                                        1.076660156250006,
                                        45.92058734473366,
                                        0
                                    ]
                                ]
                            ]
                        },
                        "properties": {
                            "alumnos": 20342,
                            "colegios": 100
                        }
                    }
                ]
            }
        });
        map.addLayers(allgeoms);

        let mp, collapsed, collapsible;
        crearPlugin();
        const selectPosicion = document.getElementById("selectPosicion");
        const selectCollapsed = document.getElementById("selectCollapsed");
        const selectCollapsible = document.getElementById("selectCollapsible");
        const inputTooltip = document.getElementById("inputTooltip");
        const selectLayer = document.getElementById("selectLayer");
        selectPosicion.addEventListener('change', cambiarTest);
        selectCollapsed.addEventListener('change', cambiarTest);
        selectCollapsible.addEventListener('change', cambiarTest);
        selectLayer.addEventListener('change', cambiarTest);
        inputTooltip.addEventListener('change', cambiarTest);

        function cambiarTest() {
            let objeto = {}
            objeto.position = selectPosicion.options[selectPosicion.selectedIndex].value;
            let collapsedValor = selectCollapsed.options[selectCollapsed.selectedIndex].value;
            collapsed = collapsedValor != "" ? objeto.collapsed = (collapsedValor == "true" || collapsedValor == true) : "true";
            let collapsibleValor = selectCollapsible.options[selectCollapsible.selectedIndex].value;
            collapsible = collapsibleValor != "" ? objeto.collapsible = (collapsibleValor == "true" || collapsibleValor == true) : "true";
            tooltip = inputTooltip.value != "" ? objeto.tooltip = inputTooltip.value : "";
            objeto.layer = getLayer(selectLayer.options[selectLayer.selectedIndex].value);
            map.removePlugins(mp);
            crearPlugin(objeto);
        }

        function getLayer(name) {
            if (name === 'points') {
                return points;
            } else if (name === 'lines') {
                return lines;
            } else if (name === 'polygons') {
                return polygons;
            } else if (name === 'allgeoms') {
                return allgeoms;
            } else {
                return null;
            }
        }

        function crearPlugin(propiedades) {

            mp = new IDEE.plugin.StyleManager(propiedades);
            map.addPlugin(mp);
        }
        const botonEliminar = document.getElementById("botonEliminar");
        botonEliminar.addEventListener("click", function() {
            map.removePlugins(mp);
        });

        const vectors = new IDEE.plugin.Vectors({});
        map.addPlugin(vectors);
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
