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
                <link href="plugins/incicarto/incicarto.ol.min.css" rel="stylesheet" />
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
                    <div class="m-test-form" style="max-height: 14.5rem;">
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
                                entre controles / plugins "order"</label>
                            <input type="number" name="order" id="inputOrder" list="orderSug" value="-1">
                        </div>
                        <div>
                            <label for="inputTooltip" title="Título ilustrativo que aporta información adicional">Título
                                "tooltip"</label>
                            <input type="text" name="tooltip" id="inputTooltip" list="tooltipSug" value="">
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
                            <label for="inputPrefixSubject">Prefijo email "prefixSubject"</label>
                            <input type="text" id="inputPrefixSubject" value="Incidencia cartogrfica - " />
                        </div>
                        <div>
                            <label for="selectInterfazmode">Tipo de interfaz "interfazmode"</label>
                            <select name="interfazmode" id="selectInterfazmode">
                                <option value=""></option>
                                <option value="simple">simple</option>
                                <option value="advance" selected>advance</option>
                            </select>
                        </div>
                        <div>
                            <label for="selectProfileGraphs" title="Gráficas del perfil topográfico. Por defecto: profile">Gráficas del perfil topográfico "profileGraphs"</label>
                            <select name="profileGraphs" id="selectProfileGraphs">
                                <option value="" selected></option>
                                <option value="profile">profile</option>
                                <option value="elevationGain">elevationGain</option>
                                <option value="profile,elevationGain">profile,elevationGain</option>
                            </select>
                        </div>
                        <div>
                            <label for="inputErrorList">Lista de errores "errorList" (separado por ,)</label>
                            <input type="text" name="errorList" id="inputErrorList"
                                value="No especificado,Omisión,Otros" />
                        </div>
                        <div>
                            <label for="inputProductList">Lista de productos "productList" (separado por ,)</label>
                            <input type="text" name="productList" id="inputProductList"
                                value="No especificado,IGN Base,Otros productos" />
                        </div>
                        <div>
                            <label for="inputBuzones">Parámetro "buzones"</label>
                            <textarea id="inputBuzones" rows="4">
                [
                  {
                    "name": "Cartografía",
                    "email": "cartografia.ign@mitma.es"
                  },
                  {
                    "name": "Atlas Nacional de España",
                    "email": "ane@mitma.es"
                  },
                  {
                    "name": "Fototeca",
                    "email": "fototeca@cnig.es"
                  }
                ]
                </textarea>
                        </div>
                        <div>
                            <label for="inputControllist">Parámetro "controllist"</label>
                            <textarea id="inputControllist" rows="4">
                [
                  {
                    "id": "themeList",
                    "name": "Temas de errores",
                    "mandatory": true
                  },
                  {
                    "id": "errorList",
                    "name": "Tipos de errores",
                    "mandatory": true
                  },
                  {
                    "id": "productList",
                    "name": "Lista de productos",
                    "mandatory": true
                  }
                ]
                </textarea>
                        </div>
                        <div>
                            <label for="inputThemeList">Parámetro "themeList"</label>
                            <textarea id="inputThemeList" rows="4">
                [
                  {
                    "idTheme": 1,
                    "nameTheme": "No especificado",
                    "emailTheme": "consultas@cnig.es"
                  },
                  {
                    "idTheme": 2,
                    "nameTheme": "Relieve",
                    "emailTheme": "cartografia.ign@mitma.es"
                  }
                ]
                </textarea>
                        </div>
                    </div>
                    <div class="m-test-buttons">
                        <button id="removeButton">Eliminar Control</button>
                    </div>
                </div>
                <div id="mapjs" class="m-container"></div>
                <script type="text/javascript" src="vendor/browser-polyfill.js"></script>
                <script type="text/javascript" src="js/apiidee.ol.min.js"></script>
                <script type="text/javascript" src="js/configuration.js"></script>
                <script type="text/javascript" src="plugins/incicarto/incicarto.ol.min.js"></script>
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
                                controls: ['rotate'],
                                center: [-467062.8225, 4683459.6216],
                                zoom: 6,
                            });

                            let mp = null;

                            const selectPosicion = document.getElementById('selectPosicion');
                            const inputTooltip = document.getElementById('inputTooltip');
                            const selectCollapsed = document.getElementById('selectCollapsed');
                            const inputOrder = document.getElementById('inputOrder');
                            const inputPrefixSubject = document.getElementById('inputPrefixSubject');
                            const selectInterfazmode = document.getElementById('selectInterfazmode');
                            const selectProfileGraphs = document.getElementById('selectProfileGraphs');
                            const inputErrorList = document.getElementById('inputErrorList');
                            const inputProductList = document.getElementById('inputProductList');
                            const inputBuzones = document.getElementById('inputBuzones');
                            const inputControllist = document.getElementById('inputControllist');
                            const inputThemeList = document.getElementById('inputThemeList');

                            const Incicarto = IDEE.plugin.Incicarto;

                            function create(propiedades) {
                                mp = new Incicarto(propiedades);
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

                                const interfazMode = selectInterfazmode.options[selectInterfazmode.selectedIndex].value;
                                if (interfazMode !== '') options.interfazmode = interfazMode;

                                if (inputPrefixSubject.value !== '') options.prefixSubject = inputPrefixSubject.value; // 'Incidencia cartogrfica - '

                                if (selectProfileGraphs.value !== '') options.profileGraphs = selectProfileGraphs.value; // 'profile,elevationGain'

                                if (inputErrorList.value !== '') options.errorList = inputErrorList.value.split(','); // ['No especificado', 'Omisión', 'Otros']

                                if (inputProductList.value !== '') options.productList = inputProductList.value.split(','); // ['No especificado', 'IGN Base', 'Otros productos'];

                                if (inputBuzones.value !== '') options.buzones = JSON.parse(inputBuzones.value);

                                if (inputControllist.value !== '') options.controllist = JSON.parse(inputControllist.value);

                                if (inputThemeList.value !== '') options.themeList = JSON.parse(inputThemeList.value);

                                create(options);
                            }

                            [
                                selectPosicion,
                                selectCollapsed,
                                inputTooltip,
                                inputPrefixSubject,
                                selectInterfazmode,
                                selectProfileGraphs,
                                inputErrorList,
                                inputProductList,
                                inputBuzones,
                                inputControllist,
                                inputThemeList,
                            ].forEach((elm) => { elm.addEventListener('change', changeTest); });

                            const removeButton = document.getElementById('removeButton');
                            removeButton.addEventListener('click', () => { remove(); });

                            create({
                                collapsed: true,
                                collapsible: true,
                                position: 'right',
                                interfazmode: 'advance',
                                isDraggable: true,
                                buzones: [{
                                    name: 'Cartografía (MTN, BTN, RT, HY, Pob, BCN, Provinciales, escalas pequeñas)',
                                    email: 'cartografia.ign@mitma.es',
                                },
                                {
                                    name: 'Atlas Nacional de España',
                                    email: 'ane@mitma.es',
                                },
                                {
                                    name: 'Fototeca',
                                    email: 'fototeca@cnig.es',
                                },
                                {
                                    name: 'Geodesia',
                                    email: 'buzon-geodesia@mitma.es',
                                },
                                {
                                    name: 'Líneas Límite Municipales',
                                    email: 'limites_municipales@mitma.es',
                                },
                                {
                                    name: 'Nombres geográficos',
                                    email: 'toponimia.ign@mitma.es',
                                },
                                {
                                    name: 'Ocupación del suelo',
                                    email: 'siose@mitma.es',
                                },
                                {
                                    name: 'Teledetección',
                                    email: 'pnt@mitma.es',
                                },
                                {
                                    name: 'Documentación histórica, Archivo, Cartoteca y biblioteca',
                                    email: 'documentacionign@mitma.es',
                                },
                                {
                                    name: 'Registro Central de Cartografía',
                                    email: 'rcc@mitma.es',
                                },
                                {
                                    name: 'Naturaleza, Cultura y Ocio',
                                    email: 'naturalezaculturaocio@mitma.es',
                                },
                                {
                                    name: 'Cartociudad',
                                    email: 'cartociudad@mitma.es',
                                },
                                {
                                    name: 'Infraestructura de Datos Espaciales',
                                    email: 'idee@mitma.es',
                                },
                                {
                                    name: 'Sistemas de Información Geográfica (SIGNA)',
                                    email: 'signa@mitma.es',
                                },
                                {
                                    name: 'Volcanología',
                                    email: 'volcanologia@mitma.es',
                                },
                                {
                                    name: 'Red Sísmica Nacional',
                                    email: 'sismologia@mitma.es',
                                },
                                ],
                                controllist: [{
                                    id: 'themeList',
                                    name: 'Temas de errores',
                                    mandatory: true,
                                },
                                {
                                    id: 'errorList',
                                    name: 'Tipos de errores',
                                    mandatory: true,
                                },
                                {
                                    id: 'productList',
                                    name: 'Lista de productos',
                                    mandatory: true,
                                },
                                ],
                                themeList: [{
                                    idTheme: 1,
                                    nameTheme: 'No especificado',
                                    emailTheme: 'consultas@cnig.es',
                                },
                                {
                                    idTheme: 2,
                                    nameTheme: 'Relieve',
                                    emailTheme: 'cartografia.ign@mitma.es',
                                },
                                {
                                    idTheme: 3,
                                    nameTheme: 'Hidrografía',
                                    emailTheme: 'cartografia.ign@mitma.es',
                                },
                                {
                                    idTheme: 4,
                                    nameTheme: 'Edificaciones',
                                    emailTheme: 'cartografia.ign@mitma.es',
                                },
                                {
                                    idTheme: 5,
                                    nameTheme: 'Carretera',
                                    emailTheme: 'cartociudad@mitma.es',
                                },
                                {
                                    idTheme: 6,
                                    nameTheme: 'Camino o senda',
                                    emailTheme: 'cartociudad@mitma.es',
                                },
                                {
                                    idTheme: 7,
                                    nameTheme: 'Ferrocarriles',
                                    emailTheme: 'cartociudad@mitma.es',
                                },
                                {
                                    idTheme: 8,
                                    nameTheme: 'Topónimo o nombre geográfico',
                                    emailTheme: 'toponimia.ign@mitma.es',
                                },
                                {
                                    idTheme: 9,
                                    nameTheme: 'Límite de CCAA o municipio',
                                    emailTheme: 'limites_municipales@mitma.es',
                                },
                                {
                                    idTheme: 10,
                                    nameTheme: 'Pruebas',
                                    emailTheme: 'danielleon@guadaltel.com',
                                },
                                {
                                    idTheme: 11,
                                    nameTheme: 'Pruebas Guadaltel',
                                    emailTheme: 'albertobuces@guadaltel.com',
                                },
                                {
                                    idTheme: 12,
                                    nameTheme: 'Pruebas Guadaltel 2',
                                    emailTheme: 'jesusdiaz@guadaltel.com',
                                },
                                {
                                    idTheme: 13,
                                    nameTheme: 'Pruebas Guadaltel - IGN',
                                    emailTheme: 'esteban.emolin@gmail.com',
                                },
                                {
                                    idTheme: 14,
                                    nameTheme: 'Pruebas IGN',
                                    emailTheme: 'aurelio.aragon@cnig.es',
                                },
                                {
                                    idTheme: 15,
                                    nameTheme: 'Pruebas Outlook 1',
                                    emailTheme: 'daleji75@gmail.com',
                                },
                                {
                                    idTheme: 16,
                                    nameTheme: 'Pruebas Outlook 2',
                                    emailTheme: 'pruebasdlj@outlook.es',
                                },
                                ],
                                errorList: [
                                    'No especificado',
                                    'Omisión',
                                    'Comisión',
                                    'Clasificación',
                                    'Nombre',
                                    'Valor del atributo',
                                    'Forma',
                                    'Localización',
                                    'Otros',
                                ],
                                productList: [
                                    'No especificado',
                                    'Serie MTN25',
                                    'Serie MTN50',
                                    'BTN25',
                                    'BTN100',
                                    'MP200',
                                    'BCN200',
                                    'BCN500',
                                    'Mapa Autonómico',
                                    'Mapa España 1:500 000',
                                    'Mapa España 1:1 000 000',
                                    'Cartociudad',
                                    'Redes de Transporte',
                                    'Hidrografía',
                                    'Poblaciones',
                                    'Mundo real',
                                    'IGN Base',
                                    'Otros productos',
                                ],
                                baseLayers: [
                                    ['NACIONAL 1981-1986', '1986', 'WMS*NACIONAL_1981-1986*https://www.ign.es/wms/pnoa-historico*NACIONAL_1981-1986'],
                                    ['OLISTAT', '1998', 'WMS*OLISTAT*https://www.ign.es/wms/pnoa-historico*OLISTAT'],
                                    ['SIGPAC', '2003', 'WMS*SIGPAC*https://www.ign.es/wms/pnoa-historico*SIGPAC'],
                                    ['PNOA 2004', '2004', 'WMS*pnoa2004*https://www.ign.es/wms/pnoa-historico*pnoa2004'],
                                    ['PNOA 2005', '2005', 'WMS*pnoa2005*https://www.ign.es/wms/pnoa-historico*pnoa2005'],
                                    ['PNOA 2006', '2006', 'WMS*pnoa2006*https://www.ign.es/wms/pnoa-historico*pnoa2006'],
                                    ['PNOA 2010', '2010', 'WMS*pnoa2010*https://www.ign.es/wms/pnoa-historico*pnoa2010'],
                                ],
                            });
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