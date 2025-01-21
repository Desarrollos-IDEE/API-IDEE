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
    <link href="plugins/timeline/timeline.ol.min.css" rel="stylesheet" />
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
        <label for="selectPosicion">Selector de posición del plugin</label>
        <select name="position" id="selectPosicion">
            <option value="TL">Arriba Izquierda (TL)</option>
            <option value="TR" selected="selected">Arriba Derecha (TR)</option>
            <option value="BR">Abajo Derecha (BR)</option>
            <option value="BL">Abajo Izquierda (BL)</option>
        </select>
        <label for="typeTimeLine">Tipo TimeLine: </label>
        <select name="typeTimeLine" id="typeTimeLine">
            <option value="absoluteSimple">absoluteSimple</option>
            <option value="absolute">absolute</option>
            <option value="relative">relative</option>
        </select>

        <div id="origin">
        <label for="inputIntervals">Parámetro intervals</label>
        <input type="text" name="intervals" id="inputIntervals">
        <select id="selectIntervals">
            <option selected></option>
            <option
                value='[["NACIONAL 1981-1986","1986","WMS*NACIONAL_1981-1986*https://www.ign.es/wms/pnoa-historico*NACIONAL_1981-1986"],["OLISTAT","1998","WMS*OLISTAT*https://www.ign.es/wms/pnoa-historico*OLISTAT"],["SIGPAC","2003","WMS*SIGPAC*https://www.ign.es/wms/pnoa-historico*SIGPAC"],["PNOA 2004","2004","WMS*pnoa2004*https://www.ign.es/wms/pnoa-historico*pnoa2004"],["PNOA 2005","2005","WMS*pnoa2005*https://www.ign.es/wms/pnoa-historico*pnoa2005"],["PNOA 2006","2006","WMS*pnoa2006*https://www.ign.es/wms/pnoa-historico*pnoa2006"],["PNOA 2010","2010","WMS*pnoa2010*https://www.ign.es/wms/pnoa-historico*pnoa2010"]]'>
                Ej: 7 Capas</option>
            <option
                value='[["NACIONAL 1981-1986","1986","WMS*NACIONAL_1981-1986*https://www.ign.es/wms/pnoa-historico*NACIONAL_1981-1986"],["OLISTAT","1998","WMS*OLISTAT*https://www.ign.es/wms/pnoa-historico*OLISTAT"],["SIGPAC","2003","WMS*SIGPAC*https://www.ign.es/wms/pnoa-historico*SIGPAC"],["PNOA 2004","2004","WMS*pnoa2004*https://www.ign.es/wms/pnoa-historico*pnoa2004"],["PNOA 2005","2005","WMS*pnoa2005*https://www.ign.es/wms/pnoa-historico*pnoa2005"],["PNOA 2006","2006","WMS*pnoa2006*https://www.ign.es/wms/pnoa-historico*pnoa2006"],["PNOA 2007","2007","WMS*pnoa2007*https://www.ign.es/wms/pnoa-historico*pnoa2007"],["PNOA 2008","2008","WMS*pnoa2008*https://www.ign.es/wms/pnoa-historico*pnoa2008"],["PNOA 2009","2009","WMS*pnoa2009*https://www.ign.es/wms/pnoa-historico*pnoa2009"],["PNOA 2010","2010","WMS*pnoa2010*https://www.ign.es/wms/pnoa-historico*pnoa2010"],["PNOA 2011","2011","WMS*pnoa2011*https://www.ign.es/wms/pnoa-historico*pnoa2011"],["PNOA 2012","2012","WMS*pnoa2012*https://www.ign.es/wms/pnoa-historico*pnoa2012"],["PNOA 2013","2013","WMS*pnoa2013*https://www.ign.es/wms/pnoa-historico*pnoa2013"],["PNOA 2014","2014","WMS*pnoa2014*https://www.ign.es/wms/pnoa-historico*pnoa2014"],["PNOA 2015","2015","WMS*pnoa2015*https://www.ign.es/wms/pnoa-historico*pnoa2015"],["PNOA 2016","2016","WMS*pnoa2016*https://www.ign.es/wms/pnoa-historico*pnoa2016"],["PNOA 2017","2017","WMS*pnoa2017*https://www.ign.es/wms/pnoa-historico*pnoa2017"],["PNOA 2018","2018","WMS*pnoa2018*https://www.ign.es/wms/pnoa-historico*pnoa2018"]]'>
                Ej: 18 capas</option>
        </select>
        <label for="selectAnimation">Selector de animation</label>
        <select name="animation" id="selectAnimation">
            <option value=""></option>
            <option value="true" selected="selected">true</option>
            <option value="false">false</option>
        </select>
        <label for="inputSpeed">Parámetro velocidad de animacion/speed (segundos)</label>
        <input type="number" name="speed" step="any" id="inputSpeed" list="speedSug">
        <datalist id="speedSug">
            <option value='1'></option>
            <option value='0.5'></option>
            <option value='0.1'></option>
            <option value='5'></option>
        </datalist>
        </div>

    <div id="dinamic">
        <!-- VisualizaciónDinamicaPorLineaDeTiempo </label> -->
        <label for="time">Capas disponibles: </label>
        <input type="text" name="time" id="time">


        <label for="speedDate">Velocidad por segundo: </label>
        <input type="number" min="1" name="speedDate" id="speedDate">


        <label for="paramsDate">Tiempo del Step: </label>
        <select name="paramsDate" id="paramsDate">
            <option value="yr">Años (yr)</option>
            <option value="mos">Meses (mos)</option>
            <option value="day">Días (day)</option>
            <option value="hrs">Horas (hrs)</option>
            <option value="min">Minutos (min)</option>
            <option value="sec">Segundos (sec)</option>
        </select>

        <label for="stepValue">Valor del step: </label>
        <input type="number" min="1" name="stepValue" id="stepValue">

        <label for="sizeWidthDinamic">Tamaño plugin: </label>
        <select name="sizeWidthDinamic" id="sizeWidthDinamic">
            <option value="sizeWidthDinamic_medium">Mediano</option>
            <option value="">Pequeño</option>
            <option value="sizeWidthDinamic_big">Grande</option>
        </select>

        <label for="formatValueDinamic">Representación de los datos: </label>
        <select name="formatValueDinamic" id="formatValueDinamic">
            <option value="logarithmic">Logarítmica</option>
            <option value="exponential">Exponencial</option>
            <option value="linear">Lineal</option>
        </select>

        <label for="formatMove">Movimiento Step: </label>
        <select name="formatMove" id="formatMove">
            <option value="continuous">continuous</option>
            <option value="discrete">discrete</option>
        </select>
    </div>

    <input type="button" value="Eliminar Plugin" name="eliminar" id="botonEliminar">

    </div>
    <div id="mapjs" class="m-container"></div>
    <script type="text/javascript" src="vendor/browser-polyfill.js"></script>
    <script type="text/javascript" src="js/apiidee.ol.min.js"></script>
    <script type="text/javascript" src="js/configuration.js"></script>
    <script type="text/javascript" src="plugins/timeline/timeline.ol.min.js"></script>
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
            center: [-467062.8225, 4683459.6216],
            zoom: 6,
        });
        
        let mp, posicion, animation, speed, dinamic, intervals = '[["NACIONAL 1981-1986","1986","WMS*NACIONAL_1981-1986*https://www.ign.es/wms/pnoa-historico*NACIONAL_1981-1986"],["OLISTAT","1998","WMS*OLISTAT*https://www.ign.es/wms/pnoa-historico*OLISTAT"],["SIGPAC","2003","WMS*SIGPAC*https://www.ign.es/wms/pnoa-historico*SIGPAC"],["PNOA 2004","2004","WMS*pnoa2004*https://www.ign.es/wms/pnoa-historico*pnoa2004"],["PNOA 2005","2005","WMS*pnoa2005*https://www.ign.es/wms/pnoa-historico*pnoa2005"],["PNOA 2006","2006","WMS*pnoa2006*https://www.ign.es/wms/pnoa-historico*pnoa2006"],["PNOA 2010","2010","WMS*pnoa2010*https://www.ign.es/wms/pnoa-historico*pnoa2010"]]';
        
        let time = [
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
          grupo: 'vectorWMS_GRUPO',
          layer: 'WMS*Eventos sísmicos*https://www.ign.es/wms-inspire/geofisica*NZ.ObservedEvent',
          attributeParam: 'date',
          grupo: 'NZ.ObservedEvent - equalsTimeLine',
        },
        ], speedDate = 2, paramsDate = 'yr', stepValue = 5,formatValue = 'logarithmic', sizeWidthDinamic = 'sizeWidthDinamic_medium', formatMove = 'continuous';

        // Type
        const typeTimeLine = document.getElementById('typeTimeLine');

        if(typeTimeLine.value === 'absolute' || typeTimeLine.value === 'relative') {
            crearPlugin({
                timelineType: typeTimeLine.options[typeTimeLine.selectedIndex].value, 
                intervals: time,
                speedDate,
                paramsDate,
                stepValue,
                formatMove,
                formatValue,
                sizeWidthDinamic
            });
        }else {
            crearPlugin({
            timelineType: typeTimeLine.options[typeTimeLine.selectedIndex].value, 
            position: posicion,
            intervals: intervals,
            });
        }

        // Original
        const selectPosicion = document.getElementById("selectPosicion");
        const inputIntervals = document.getElementById("inputIntervals");
        const selectIntervals = document.getElementById("selectIntervals");
        const selectAnimation = document.getElementById("selectAnimation");
        const inputSpeed = document.getElementById("inputSpeed");

        typeTimeLine.addEventListener('change', ({target}) => {
            if(target.value === 'absolute' || target.value === 'relative') {
                document.querySelector('#dinamic').style.display = 'block';
                document.querySelector('#origin').style.display = 'none'
            }else {
                document.querySelector('#dinamic').style.display = 'none';
                document.querySelector('#origin').style.display = 'block'
            }
            cambiarTest();
        });

        selectPosicion.addEventListener('change', cambiarTest);
        inputIntervals.addEventListener('change', cambiarTest);
        selectIntervals.addEventListener('change', () => {
            inputIntervals.value = selectIntervals.value;
            cambiarTest();
        });

        selectAnimation.addEventListener('change', cambiarTest);
        inputSpeed.addEventListener('change', cambiarTest);

        // Dinamic
        const elementTime = document.getElementById('time');
        const elementSpeedDate = document.getElementById('speedDate');
        const elementParamsDate = document.getElementById('paramsDate');
        const elementStepValue = document.getElementById('stepValue');
        const elementSizeWidthDinamic = document.getElementById('sizeWidthDinamic');
        const elementFormatValue = document.getElementById('formatValueDinamic');
        const elementFormatMove = document.getElementById('formatMove');

        [elementTime, elementSpeedDate, elementParamsDate, elementStepValue, 
        elementSizeWidthDinamic, elementFormatMove, elementFormatValue].forEach(el => el.addEventListener('change', cambiarTest));


        if(typeTimeLine.value === 'absolute' || typeTimeLine.value === 'relative') {
                document.querySelector('#dinamic').style.display = 'block';
                document.querySelector('#origin').style.display = 'none';
        }else {
                document.querySelector('#dinamic').style.display = 'none';
                document.querySelector('#origin').style.display = 'block';
        }
          


        function cambiarTest() {
          let objeto = {}
          objeto.position = selectPosicion.options[selectPosicion.selectedIndex].value;

          if(typeTimeLine.value === 'absolute' || typeTimeLine.value === 'relative') {
            objeto.timelineType =  typeTimeLine.options[typeTimeLine.selectedIndex].value, 
            objeto.position = selectPosicion.options[selectPosicion.selectedIndex].value;
            objeto.intervals = elementTime.value !== '' ? elementTime.value : time;
            objeto.speedDate = elementSpeedDate.value >= 1 ? elementSpeedDate.value : 1;
            objeto.paramsDate = elementParamsDate.options[elementParamsDate.selectedIndex].value;
            objeto.stepValue = elementStepValue.value >= 1 ? elementStepValue.value : 1;
            objeto.sizeWidthDinamic = elementSizeWidthDinamic.options[elementSizeWidthDinamic.selectedIndex].value;
            objeto.formatValue = elementFormatValue.options[elementFormatValue.selectedIndex].value;
            objeto.formatMove = elementFormatMove.options[elementFormatMove.selectedIndex].value;
          }else {
            objeto.timelineType =  typeTimeLine.options[typeTimeLine.selectedIndex].value, 
            objeto.intervals = inputIntervals.value != '' ? inputIntervals.value : intervals;
            let animationValor = selectAnimation.options[selectAnimation.selectedIndex].value;
            animation = animationValor != "" ? objeto.animation = (animationValor == "true") : "";
            speed = inputSpeed.value != '' ? objeto.speed = inputSpeed.value : '';
          }

            map.removePlugins(mp);
            crearPlugin(objeto);
        }

        function crearPlugin(propiedades) {
            mp = new IDEE.plugin.Timeline(propiedades);
            map.addPlugin(mp);
        }

        const botonEliminar = document.getElementById("botonEliminar");
        botonEliminar.addEventListener("click", function () {
            map.removePlugins(mp);
        });
    </script>
</body>

<!-- Global site tag (gtag.js) - Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-CTLHMMB5YT"></script>
<script>
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-CTLHMMB5YT');
</script>

</html>
