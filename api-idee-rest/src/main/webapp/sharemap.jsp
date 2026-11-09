<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ page import="es.api_idee.plugins.PluginsManager"%>
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
    <link href="plugins/sharemap/sharemap.ol.min.css" rel="stylesheet" />
    <link href="plugins/layerswitcher/layerswitcher.ol.min.css" rel="stylesheet" />
    <%
      Map<String, String[]> parameterMap = request.getParameterMap();
      PluginsManager.init(getServletContext());
      String[] cssfiles = PluginsManager.getCSSFiles(parameterMap);
      for (int i = 0; i < cssfiles.length; i++) {
         String cssfile = cssfiles[i];
   %>
    <link type="text/css" rel="stylesheet" href="plugins/<%=cssfile%>">
    </link>
    <%
      } %>
</head>

<body>
    <div class="m-api-idee-test-form-frame">
        <div class="m-test-form" style="max-height: 13rem;">
            <div>
                <label for="selectPosition" title="Posición del plugin sobre el mapa. Por defecto: left">Posición "position"</label>
                <select name="position" id="selectPosition">
                    <option value="" selected="selected"></option>
                    <option value="left">Izquierda (left)</option>
                    <option value="right">Derecha (right)</option>
                </select>
            </div>
            <div>
                <label for="inputOrder" title="Define en qué posición del panel debe aparecer en el conjunto de controles o plugins">Orden entre controles / plugins "order"</label>
                <input type="number" name="order" id="inputOrder" value="1">
            </div>
            <div>
                <label for="inputTooltip" title="Texto del tooltip que aparece al pasar el ratón sobre el botón principal del plugin">Tooltip del botón del plugin "tooltip"</label>
                <input type="text" id="inputTooltip" list="tooltipSug">
                <datalist id="tooltipSug">
                    <option value="Compartir"></option>
                </datalist>
            </div>
            <div>
                <label for="inputBaseUrl" title="URL base que se usará para construir el enlace compartido. Se emplea cuando urlAPI es true">URL base "baseUrl"</label>
                <input type="text" id="inputBaseUrl" list="baseUrlSug">
                <datalist id="baseUrlSug">
                    <option value="https://componentes.idee.es/api-idee/"></option>
                    <option value="https://componentes-desarrollo.idee.es/api-idee/"></option>
                    <option value="https://componentes-beta.idee.es/api-idee/"></option>
                    <option value="http://localhost:8080/api-idee/"></option>
                </datalist>
            </div>
            <div>
                <label for="selectUrlAPI" title="Controla si se usa baseUrl (true) o la URL actual del visor (false) para generar el enlace compartido. Por defecto: false">Usar URL de API "urlAPI"</label>
                <select name="urlAPI" id="selectUrlAPI">
                    <option value=""></option>
                    <option value="true">true</option>
                    <option value="false" selected="selected">false</option>
                </select>
            </div>
            <div>
                <label for="selectMinimize" title="Solo actúa cuando urlAPI es true. Genera una URL minimizada (true) o en formato estándar (false). Por defecto: false">URL minimizada "minimize"</label>
                <select name="minimize" id="selectMinimize">
                    <option value=""></option>
                    <option value="true">true</option>
                    <option value="false" selected="selected">false</option>
                </select>
            </div>
            <div>
                <label for="inputTitle" title="Título primario del modal">Título principal del modal "title"</label>
                <input type="text" id="inputTitle" list="titleSug">
                <datalist id="titleSug">
                    <option value="Compartir URL"></option>
                </datalist>
            </div>
            <div>
                <label for="inputText" title="Texto que aparece como título de la sección de HTML embebido en el panel del plugin">Título secundario del modal "text"</label>
                <input type="text" id="inputText" list="textSug">
                <datalist id="textSug">
                    <option value="HTML embebido"></option>
                </datalist>
            </div>
            <div>
                <label for="selectShareLayer" title="Solo actúa cuando urlAPI es false. Incluye en el enlace todas las capas presentes en el mapa (true) o ninguna (false). Por defecto: false">Compartir capas "shareLayer"</label>
                <select name="shareLayer" id="selectShareLayer">
                    <option value=""></option>
                    <option value="true">true</option>
                    <option value="false" selected="selected">false</option>
                </select>
            </div>
            <div>
                <label for="inputFilterLayers" title="Lista de nombres de capas (separados por coma) que se incluirán en el enlace. Solo aplica cuando shareLayer es false o no está definido">Filtro de capas "filterLayers"</label>
                <input type="text" id="inputFilterLayers" list="filterLayersSug">
                <datalist id="filterLayersSug">
                    <option value="AU.AdministrativeBoundary"></option>
                    <option value="AU.AdministrativeBoundary,AU.AdministrativeUnit"></option>
                </datalist>
            </div>
            <div>
                <label for="inputBtn" title="Texto del botón que cierra el panel del plugin">Texto del botón cerrar "btn"</label>
                <input type="text" id="inputBtn" list="btnSug">
                <datalist id="btnSug">
                    <option value="OK"></option>
                    <option value="Aceptar"></option>
                    <option value="Cerrar"></option>
                </datalist>
            </div>
            <div>
                <label for="inputCopyBtn" title="Texto del botón que copia la URL compartida al portapapeles">Botón copiar URL "copyBtn"</label>
                <input type="text" id="inputCopyBtn" list="copyBtnSug">
                <datalist id="copyBtnSug">
                    <option value="Copiar"></option>
                    <option value="Copiar URL"></option>
                </datalist>
            </div>
            <div>
                <label for="inputCopyBtnHtml" title="Texto del botón que copia el código HTML embebido al portapapeles">Botón copiar HTML "copyBtnHtml"</label>
                <input type="text" id="inputCopyBtnHtml" list="copyBtnHtmlSug">
                <datalist id="copyBtnHtmlSug">
                    <option value="Copiar"></option>
                    <option value="Copiar HTML"></option>
                </datalist>
            </div>
            <div>
                <label for="inputTooltipCopy" title="Mensaje que aparece como notificación emergente cuando se copia la URL o el HTML">Mensaje de confirmación "tooltipCopy"</label>
                <input type="text" id="inputTooltipCopy" list="tooltipCopySug">
                <datalist id="tooltipCopySug">
                    <option value="¡Copiado!"></option>
                    <option value="Copiado al portapapeles"></option>
                </datalist>
            </div>
            <div>
                <label for="inputQrImage" title="URL de la imagen que se muestra en el centro del código QR. Por defecto: el logo de IDEE">Imagen del QR "qrImage"</label>
                <input type="text" id="inputQrImage" list="qrImageSug">
                <datalist id="qrImageSug">
                    <option value="https://componentes.idee.es/estaticos/imagenes/logos/API_IDEE/API_2/API_2.svg"></option>
                </datalist>
            </div>
            <div>
                <label for="selectOverwriteStyles" title="Controla si se aplican los colores personalizados definidos en styles (true) o se mantienen los estilos por defecto (false). Por defecto: false">Sobreescribir estilos "overwriteStyles"</label>
                <select name="overwriteStyles" id="selectOverwriteStyles">
                    <option value=""></option>
                    <option value="true">true</option>
                    <option value="false" selected="selected">false</option>
                </select>
            </div>
            <div>
                <label for="inputPrimaryColor" title="Color primario del plugin: botón de apertura, caja y botones internos. Requiere overwriteStyles=true">Color primario "styles.primaryColor"</label>
                <input type="color" id="inputPrimaryColor" value="#71a7d3">
            </div>
            <div>
                <label for="inputSecondaryColor" title="Color secundario del plugin: fondo del panel abierto e imagen interior del botón. Requiere overwriteStyles=true">Color secundario "styles.secondaryColor"</label>
                <input type="color" id="inputSecondaryColor" value="#ffffff">
            </div>
        </div>
        <div class="m-test-buttons">
            <button name="eliminar" class="m-test-button" id="botonEliminar">Eliminar Plugin</button>
        </div>
    </div>

    <div id="mapjs" class="m-container"></div>

    <script type="text/javascript" src="vendor/browser-polyfill.js"></script>
    <script type="text/javascript" src="js/apiidee.ol.min.js"></script>
    <script type="text/javascript" src="js/configuration.js"></script>
    <script type="text/javascript" src="plugins/sharemap/sharemap.ol.min.js"></script>
    <script type="text/javascript" src="plugins/layerswitcher/layerswitcher.ol.min.js"></script>
    <%
      String[] jsfiles = PluginsManager.getJSFiles(parameterMap);
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
            zoom: 7,
            minZoom: 4,
            maxZoom: 20,
            center: [144112, 4839064],
            controls: ['scale*exactScale=true', 'location', 'backgroundlayers'],
        });

        const layerinicial = new IDEE.layer.WMS({
            url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
            name: 'AU.AdministrativeBoundary',
            legend: 'Limite administrativo',
        }, {});

        const layerUA = new IDEE.layer.WMS({
            url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
            name: 'AU.AdministrativeUnit',
            legend: 'Unidad administrativa'
        }, {});

        map.addLayers([layerinicial, layerUA]);

        let mp = null;

        const selectPosition = document.getElementById('selectPosition');
        const inputOrder = document.getElementById('inputOrder');
        const inputTooltip = document.getElementById('inputTooltip');
        const inputBaseUrl = document.getElementById('inputBaseUrl');
        const selectUrlAPI = document.getElementById('selectUrlAPI');
        const selectMinimize = document.getElementById('selectMinimize');
        const selectShareLayer = document.getElementById('selectShareLayer');
        const inputFilterLayers = document.getElementById('inputFilterLayers');
        const selectOverwriteStyles = document.getElementById('selectOverwriteStyles');
        const inputPrimaryColor = document.getElementById('inputPrimaryColor');
        const inputSecondaryColor = document.getElementById('inputSecondaryColor');
        const inputTitle = document.getElementById('inputTitle');
        const inputText = document.getElementById('inputText');
        const inputBtn = document.getElementById('inputBtn');
        const inputCopyBtn = document.getElementById('inputCopyBtn');
        const inputCopyBtnHtml = document.getElementById('inputCopyBtnHtml');
        const inputTooltipCopy = document.getElementById('inputTooltipCopy');
        const inputQrImage = document.getElementById('inputQrImage');
        const botonEliminar = document.getElementById('botonEliminar');

        const parseBool = (val) => {
            if (val === 'true') return true;
            if (val === 'false') return false;
            return undefined;
        };

        [
            selectPosition,
            inputOrder,
            inputTooltip,
            inputBaseUrl,
            selectUrlAPI,
            selectMinimize,
            selectShareLayer,
            inputFilterLayers,
            selectOverwriteStyles,
            inputPrimaryColor,
            inputSecondaryColor,
            inputTitle,
            inputText,
            inputBtn,
            inputCopyBtn,
            inputCopyBtnHtml,
            inputTooltipCopy,
            inputQrImage,
        ].forEach((ctrl) => ctrl.addEventListener('change', cambiarTest));

        botonEliminar.addEventListener('click', function () {
            map.removePlugins(mp);
        });

        function cambiarTest() {
            if (mp !== null) {
                map.removePlugins(mp);
            }
            crearPlugin({
                position: selectPosition.value,
                order: Number(inputOrder.value),
                tooltip: inputTooltip.value.trim(),
                baseUrl: inputBaseUrl.value,
                urlAPI: parseBool(selectUrlAPI.value),
                minimize: parseBool(selectMinimize.value),
                shareLayer: parseBool(selectShareLayer.value),
                filterLayers: inputFilterLayers.value.trim().split(',').map((l) => l.trim()),
                overwriteStyles: parseBool(selectOverwriteStyles.value),
                styles: {
                    primaryColor: inputPrimaryColor.value.trim(),
                    secondaryColor: inputSecondaryColor.value.trim(),
                },
                title: inputTitle.value.trim(),
                text: inputText.value.trim(),
                btn: inputBtn.value.trim(),
                copyBtn: inputCopyBtn.value.trim(),
                copyBtnHtml: inputCopyBtnHtml.value.trim(),
                tooltipCopy: inputTooltipCopy.value.trim(),
                qrImage: inputQrImage.value.trim(),
            });
        }

        function crearPlugin(propiedades) {
            mp = new IDEE.plugin.ShareMap(propiedades);
            map.addPlugin(mp);
        }

        cambiarTest();
        const layerswitcher = new IDEE.plugin.Layerswitcher({});
        map.addPlugin(layerswitcher);
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
