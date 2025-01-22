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
    <link href="plugins/help/help.ol.min.css" rel="stylesheet" />
    <link href="plugins/backimglayer/backimglayer.ol.min.css" rel="stylesheet" />
    <link href="plugins/measurebar/measurebar.ol.min.css" rel="stylesheet" />
    <link href="plugins/information/information.ol.min.css" rel="stylesheet" />
    <link href="plugins/infocoordinates/infocoordinates.ol.min.css" rel="stylesheet" />
    <link href="plugins/mousesrs/mousesrs.ol.min.css" rel="stylesheet" />
    <link href="plugins/overviewmap/overviewmap.ol.min.css" rel="stylesheet" />
    <link href="plugins/contactlink/contactlink.ol.min.css" rel="stylesheet" />
    <link href="plugins/selectionzoom/selectionzoom.ol.min.css" rel="stylesheet" />
    <link href="plugins/sharemap/sharemap.ol.min.css" rel="stylesheet" />
    <link href="plugins/modal/modal.ol.min.css" rel="stylesheet" />
    <link href="plugins/rescale/rescale.ol.min.css" rel="stylesheet" />
    <link href="plugins/comparators/comparators.ol.min.css" rel="stylesheet" />
    <link href="plugins/storymap/storymap.ol.min.css" rel="stylesheet" />
    <link href="plugins/locator/locator.ol.min.css" rel="stylesheet" />
    <link href="plugins/layerswitcher/layerswitcher.ol.min.css" rel="stylesheet" />
    <link href="plugins/stylemanager/stylemanager.ol.min.css" rel="stylesheet" />
    <link href="plugins/incicarto/incicarto.ol.min.css" rel="stylesheet" />
    <link href="plugins/timeline/timeline.ol.min.css" rel="stylesheet" />
    <link href="plugins/queryattributes/queryattributes.ol.min.css" rel="stylesheet" />
    <link href="plugins/viewmanagement/viewmanagement.ol.min.css" rel="stylesheet" />
    <link href="plugins/printviewmanagement/printviewmanagement.ol.min.css" rel="stylesheet" />
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
        <label for="selectPosition">Selector de posición del plugin</label>
        <select name="position" id="selectPosition">
            <option value="TL">Arriba Izquierda (TL)</option>
            <option value="TR" selected="selected">Arriba Derecha (TR)</option>
            <option value="BR">Abajo Derecha (BR)</option>
            <option value="BL">Abajo Izquierda (BL)</option>
        </select>
        <label for="inputTooltip">Tooltip</label>
        <input type="text" name="tooltip" id="inputTooltip">
        <label for="selectExtend">Extender contenido inicial</label>
        <select id="selectExtend">
            <option value="true" selected="selected">Sí</option>
            <option value="false">No</option>
        </select>
        <label for="areaHeader">Cabecera</label>
        <textarea id="areaHeader" rows="5" cols="20">
            {
                "images":[
                    "https://www.ign.es/IGNCNIG/Imagenes/Contenidos/IGN-Header-Tittle.png"
                ],
                "title":"Ayuda"
            }
        </textarea>
        <label for="areaInitial">Contenido Inicial</label>
        <textarea id="areaInitial" rows="5" cols="20">
            {
            "es":[
                {
                    "title":"Introducción",
                    "content":"<div><h2>Título introducción</h2><div><p>Contenido de introducción</p></div></div>",
                    "subContents":[
                        {
                        "title":"Introducción 2",
                        "content":"<div><h2>Título introducción 2</h2><div><p>Contenido de introducción 2</p></div></div>"
                        }
                    ]
                }
            ],
            "en":[
                {
                    "title":"Introduction",
                    "content":"<div><h2>Title introduction</h2><div><p>Introduction content</p></div></div>",
                    "subContents":[
                        {
                        "title":"Introduction 2",
                        "content":"<div><h2>Title introduction 2</h2><div><p>Introduction content 2</p></div></div>"
                        }
                    ]
                }
            ]
            }
        </textarea>
        <label for="areaFinal">Contenido Final</label>
        <textarea id="areaFinal" rows="5" cols="20">
            {
            "es":[
                {
                    "title":"Final",
                    "content":"<div><h2>Título final</h2><div><p>Contenido de final</p></div></div>",
                    "subContents":[
                        {
                        "title":"Final 2",
                        "content":"<div><h2>Título final 2</h2><div><p>Contenido de final 2</p></div></div>"
                        }
                    ]
                }
            ],
            "en":[
                {
                    "title":"Final",
                    "content":"<div><h2>Title Final</h2><div><p>Final content</p></div></div>",
                    "subContents":[
                        {
                        "title":"Final 2",
                        "content":"<div><h2>Title final 2</h2><div><p>Final content 2</p></div></div>"
                        }
                    ]
                }
            ]
            }
        </textarea>
        <label for="initialIndex">Sección inicial</label>
        <input id="initialIndex" type="number" min="0" value="0">
        <input type="button" value="Eliminar Plugin" name="eliminar" id="botonEliminar">
    </div>

    <div id="mapjs" class="m-container"></div>
    <script type="text/javascript" src="vendor/browser-polyfill.js"></script>
    <script type="text/javascript" src="js/apiidee.ol.min.js"></script>
    <script type="text/javascript" src="js/configuration.js"></script>
    <script type="text/javascript" src="plugins/help/help.ol.min.js"></script>
    <script type="text/javascript" src="plugins/backimglayer/backimglayer.ol.min.js"></script>
    <script type="text/javascript" src="plugins/measurebar/measurebar.ol.min.js"></script>
    <script type="text/javascript" src="plugins/information/information.ol.min.js"></script>
    <script type="text/javascript" src="plugins/infocoordinates/infocoordinates.ol.min.js"></script>
    <script type="text/javascript" src="plugins/mousesrs/mousesrs.ol.min.js"></script>
    <script type="text/javascript" src="plugins/overviewmap/overviewmap.ol.min.js"></script>
    <script type="text/javascript" src="plugins/contactlink/contactlink.ol.min.js"></script>
    <script type="text/javascript" src="plugins/selectionzoom/selectionzoom.ol.min.js"></script>
    <script type="text/javascript" src="plugins/sharemap/sharemap.ol.min.js"></script>
    <script type="text/javascript" src="plugins/modal/modal.ol.min.js"></script>
    <script type="text/javascript" src="plugins/rescale/rescale.ol.min.js"></script>
    <script type="text/javascript" src="plugins/comparators/comparators.ol.min.js"></script>
    <script type="text/javascript" src="plugins/storymap/storymap.ol.min.js"></script>
    <script type="text/javascript" src="plugins/locator/locator.ol.min.js"></script>
    <script type="text/javascript" src="plugins/layerswitcher/layerswitcher.ol.min.js"></script>
    <script type="text/javascript" src="plugins/stylemanager/stylemanager.ol.min.js"></script>
    <script type="text/javascript" src="plugins/incicarto/incicarto.ol.min.js"></script>
    <script type="text/javascript" src="plugins/timeline/timeline.ol.min.js"></script>
    <script type="text/javascript" src="plugins/queryattributes/queryattributes.ol.min.js"></script>
    <script type="text/javascript" src="plugins/viewmanagement/viewmanagement.ol.min.js"></script>
    <script type="text/javascript" src="plugins/printviewmanagement/printviewmanagement.ol.min.js"></script>
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
            zoom: 5,
            maxZoom: 20,
            minZoom: 2,
            center: [-467062.8225, 4783459.6216],
	        controls: ['scale', 'panzoom', 'attributions', 'backgroundlayers', 'getfeatureinfo', 'location', 'panzoombar', 'rotate', 'scaleline']
        });

        let mp = null;

        let mp2 = new IDEE.plugin.ShareMap({
            baseUrl: window.location.href.substring(0, window.location.href.indexOf('api-idee')) + "api-idee/",
            position: "TR",
        });
        map.addPlugin(mp2);

        let mp3 = new IDEE.plugin.BackImgLayer({});
        map.addPlugin(mp3);

        let mp4 = new IDEE.plugin.MeasureBar({});
        map.addPlugin(mp4);

        let mp5 = new IDEE.plugin.Information({});
        map.addPlugin(mp5);

        let mp6 = new IDEE.plugin.Infocoordinates({});
        map.addPlugin(mp6);

        let mp7 = new IDEE.plugin.MouseSRS({});
        map.addPlugin(mp7);

        let mp8 = new IDEE.plugin.OverviewMap({});
        map.addPlugin(mp8);

        let mp9 = new IDEE.plugin.ContactLink({});
        map.addPlugin(mp9);

        let mp10 = new IDEE.plugin.SelectionZoom({});
        map.addPlugin(mp10);

        let mp11 = new IDEE.plugin.Modal({});
        map.addPlugin(mp11);

        let mp12 = new IDEE.plugin.Rescale({});
        map.addPlugin(mp12);

        let mp13 = new IDEE.plugin.Comparators({});
        map.addPlugin(mp13);

        let mp14 = new IDEE.plugin.StoryMap({
            collapsed: true,
            collapsible: true,
            position: 'TR',
            tooltip: 'Tooltip Storymap',
            content: {
                es: {
                    "head": {
                        "title": "StoryMap"
                    },
                    "cap": [
                        {
                            "title": "Capítulo 0 Un recorrido por el Madrid cervantino.",
                            "subtitle": "Subtítulo capítulo 0",
                            "steps": [
                                {
                                    "html": "<br><h3>Ejemplo Step 1</h3> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <br><br><br><br><br> <br>",
                                    "js": "console.log('cap0 - step 1'); let impl = map.getImpl().getMapImpl();let view = impl.getView();view.animate({zoom: 16,center: [-412400.86, 4926815.10],duration: 2000,});"
                                },
                                {
                                "html": "<br><h3>Ejemplo Step 2</h3> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <br> <br><br><br><br><br>",
                                    "js": "console.log('cap0 - step 2'); let impl = map.getImpl().getMapImpl();let view = impl.getView();view.animate({zoom: 16,center: [-412400.86, 4926815.10],duration: 2000,});"
                                },
                                {
                                "html": "<br><h3>Ejemplo Step 3</h3> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <br><br><br><br><br><br> <br>",
                                    "js": "console.log('cap0 - step 3'); let impl = map.getImpl().getMapImpl();let view = impl.getView();view.animate({zoom: 16,center: [-412400.86, 4926815.10],duration: 2000,});"
                                }
                            ] 
                        },
                        {
                            "title": "Capítulo 1.- Vistazo a la ciudad del Siglo XVII",
                            "subtitle": "Subtítulo capítulo 2",
                            "steps": [
                                {
                                    "html": "<br><h3>Ejemplo Step 1</h3> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <br><br><br><br><br><br><br>  <br>",
                                "js": "console.log('cap1 - step 1'); let impl = map.getImpl().getMapImpl();let view = impl.getView();view.animate({zoom: 16,center: [-412400.86, 4926815.10],duration: 2000,});"
                                },
                                {
                                "html": "<br><h3>Ejemplo Step 1</h3> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <br> <br><br><br><br><br><br> <br>",
                                "js": "console.log('cap1 - step 2'); let impl = map.getImpl().getMapImpl();let view = impl.getView();view.animate({zoom: 16,center: [-412400.86, 4926815.10],duration: 2000,});"
                                }
                            ] 
                        },
                        {
                            "title": "Capítulo 2.- Los viajes del Agua",
                            "subtitle": "Subtítulo capítulo 3",
                            "steps": [
                                {
                                "html": "<br><h3>Ejemplo Step 1</h3> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <br> <br><br><br><br><br><br> <br><br><br><br><br><br> <br>",
                                "js": "console.log('cap2 - step 1'); let impl = map.getImpl().getMapImpl();let view = impl.getView();view.animate({zoom: 16,center: [-412400.86, 4926815.10],duration: 2000,});"
                                },
                                {
                                    "html": "<br><h3>Ejemplo Step 1</h3> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <br> <br><br><br><br><br><br> <br><br><br><br><br><br> <br>",
                                "js": "console.log('cap2 - step 2'); let impl = map.getImpl().getMapImpl();let view = impl.getView();view.animate({zoom: 16,center: [-412400.86, 4926815.10],duration: 2000,});"
                                }
                            ] 
                        },
                        {
                            "title": "Capítulo 3.- Felipe IV",
                            "subtitle": "Subtítulo capítulo 3",
                            "steps": [
                                {
                                    "html": "<br><h3>Ejemplo Step 1</h3> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <br> <br><br><br><br><br><br> <br><br><br><br><br><br> <br>",
                                "js": "console.log('cap3 - step 1'); let impl = map.getImpl().getMapImpl();let view = impl.getView();view.animate({zoom: 16,center: [-412400.86, 4926815.10],duration: 2000,});"
                                },
                                {
                                    "html": "<br><h3>Ejemplo Step 2</h3> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <br> <br><br><br><br><br><br> <br><br><br><br><br><br> <br>",
                                "js": "console.log('cap3 - step 2'); let impl = map.getImpl().getMapImpl();let view = impl.getView();view.animate({zoom: 16,center: [-412400.86, 4926815.10],duration: 2000,});"
                                },
                                {
                                    "html": "<br><h3>Ejemplo Step 3</h3> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <p>Los viajeespañoles llevaran al Nuevo Mundo en el siglo XVI por ordenanzas de Carlos V, y que también aplicaron en la capital.</p> <br> <br><br><br><br><br><br> <br><br><br><br><br><br> <br>",
                                "js": "console.log('cap3 - step 3'); let impl = map.getImpl().getMapImpl();let view = impl.getView();view.animate({zoom: 16,center: [-412400.86, 4926815.10],duration: 2000,});"
                                }
                            ] 
                        }
                    ] 
                },
            },
            indexInContent: {
                title: 'Índice StoryMap',
                subtitle: 'Visualizador de Cervantes y el Madrid del siglo XVII',
                js: "console.log('Visualizador de Cervantes');",
            },
            delay: 2000,
        });
        map.addPlugin(mp14);

        let mp15 = new IDEE.plugin.Locator({});
        map.addPlugin(mp15);

        let mp16 = new IDEE.plugin.Layerswitcher({});
        map.addPlugin(mp16);

        let mp17 = new IDEE.plugin.StyleManager({});
        map.addPlugin(mp17);

        let mp18 = new IDEE.plugin.Incicarto({});
        map.addPlugin(mp18);

        let mp19 = new IDEE.plugin.Timeline({
            position: 'TR',
            timelineType: 'absolute',
            intervals : [
                {
                id: '1',
                init: '1918-05-12T23:39:58.767Z',
                end: '1951-01-16T12:47:07.530Z',
                layer: 'WMS*Eventos sísmicos*https://www.ign.es/wms-inspire/geofisica*NZ.ObservedEvent',
                // grupo: 'GRUPO'
                },
            ],
            speedDate: 2,
            paramsDate:  'yr',
            formatValue: 'exponential',
            stepValue: 5,
            sizeWidthDinamic: 'sizeWidthDinamic_medium',
            formatMove: 'continuous'
        });
        map.addPlugin(mp19);

        let mp20 = new IDEE.plugin.QueryAttributes({});
        map.addPlugin(mp20);

        let mp21 = new IDEE.plugin.ViewManagement({});
        map.addPlugin(mp21);

        let mp22 = new IDEE.plugin.PrintViewManagement({});
        map.addPlugin(mp22);

        const selectPosition = document.getElementById("selectPosition");
        const selectExtend = document.getElementById("selectExtend");
        const inputTooltip = document.getElementById("inputTooltip");
        const areaHeader = document.getElementById("areaHeader");
        const areaInitial = document.getElementById("areaInitial");
        const areaFinal = document.getElementById("areaFinal");
        const initialIndex = document.getElementById("initialIndex");
        const botonEliminar = document.getElementById("botonEliminar");

        selectPosition.addEventListener('change', cambiarTest);
        selectExtend.addEventListener('change', cambiarTest);
        inputTooltip.addEventListener('change', cambiarTest);
        areaHeader.addEventListener('change', cambiarTest);
        areaInitial.addEventListener('change', cambiarTest);
        areaFinal.addEventListener('change', cambiarTest);
        initialIndex.addEventListener('change', cambiarTest);
        botonEliminar.addEventListener("click", function() {
            map.removePlugins(mp);
        });


        function cambiarTest() {
            let objeto = {};
            objeto.position = selectPosition.options[selectPosition.selectedIndex].value;
            objeto.extendInitialExtraContents = selectExtend.options[selectExtend.selectedIndex].value === 'true' ? true : false;
            inputTooltip.value !== "" ? objeto.tooltip = inputTooltip.value : objeto.tooltip = "";
            areaHeader.value !== "" ? objeto.header = JSON.parse(areaHeader.value.trim()) : objeto.header = [];
            areaInitial.value !== "" ? objeto.initialExtraContents = JSON.parse(areaInitial.value.trim()) : objeto.initialExtraContents = [];
            areaFinal.value !== "" ? objeto.finalExtraContents = JSON.parse(areaFinal.value.trim()) : objeto.finalExtraContents = [];
            objeto.initialIndex = Number.parseInt(initialIndex.value, 10);
            if (mp !== null) {
                map.removePlugins(mp);
            }
            crearPlugin(objeto);
        }

        function crearPlugin(propiedades) {
            mp = new IDEE.plugin.Help(propiedades);
            map.addPlugin(mp);
        }

        cambiarTest();
    </script>
</body>

<!-- Global site tag (gtag.js) - Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-CTLHMMB5YT"></script>
<script>
    window.dataLayer = window.dataLayer || [];

    function gtag() {
        dataLayer.push(arguments);
    }
    gtag('js', new Date());
    gtag('config', 'G-CTLHMMB5YT');
</script>

</html>

