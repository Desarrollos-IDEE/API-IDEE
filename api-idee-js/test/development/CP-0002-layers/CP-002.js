/* eslint-disable object-property-newline,no-console,no-underscore-dangle,max-len,camelcase,no-plusplus,no-param-reassign,no-proto,import/newline-after-import */
import { map as Mmap } from 'M/mapea';
// Escoger una de estas capas para probarlas.
// import { tms_003 } from '../layers/tms/tms'; const capaPrueba = tms_003; window.tms = capaPrueba; // STRING ==> import { tms_002 } from '../layers/tms/tms'; const capaPrueba = tms_002; window.tms = tms_002;
// import { wms_001, wms_003 } from '../layers/wms/wms'; const capaPrueba = wms_003; window.wms = capaPrueba; // STRING ==> import { wms_002 } from '../layers/wms/wms'; const capaPrueba = wms_002; window.wms = wms_002;
// import { wmts_003 } from '../layers/wmts/wmts'; const capaPrueba = wmts_003; window.wmts = capaPrueba; // STRING ==> import { wmts_002 } from '../layers/wmts/wmts'; const capaPrueba = wmts_002; window.wmts = wmts_002;
// import { xyz_003 } from '../layers/xyz/xyz'; const capaPrueba = xyz_003; window.xyz = capaPrueba; // STRING ==> import { xyz_002 } from '../layers/xyz/xyz'; const capaPrueba = xyz_002; window.xyz = xyz_002;
// import { osm_004 } from '../layers/osm/osm'; const capaPrueba = osm_004; window.osm = capaPrueba;// STRING ==> import { osm_002 } from '../layers/osm/osm'; const capaPrueba = osm_002; window.osm = osm_002;// STRING ==> import { osm_003 } from '../layers/osm/osm'; const capaPrueba = osm_003; window.osm = osm_003;
// import { mbtile_02 } from '../layers/mbtiles/mbtiles'; const capaPrueba = mbtile_02; window.mbtile = capaPrueba;
// import { generic_001 } from '../layers/generic/generic'; const capaPrueba = generic_001; window.generic = generic_001;
import { geotiff_004 } from '../layers/geotiff/geotiff'; const capaPrueba = geotiff_004; window.geotiff = capaPrueba;
// import { layerGroup_001 } from '../layers/layerGroup/layerGroup'; const capaPrueba = layerGroup_001; window.layerGroup = layerGroup_001;
// import { maplibre_001 } from '../layers/maplibre/maplibre'; const capaPrueba = maplibre_001; window.maplibre = maplibre_001;
window.capaPrueba = capaPrueba;

const mapa = Mmap({
  container: 'map',
  projection: 'EPSG:3857*m',
  center: [-443273.10081370454, 4757481.749296248], zoom: 6, // Other Tests
  // bbox: [287821.2283355333, 5226384.980194519, 324511.00191241794, 5237544.7863241555], // GeoTIFF Test
  // center: [309697, 5231113], zoom: 14, // GeoTIFF Test
  layers: [capaPrueba],
  controls: ['attributions', 'scale'],
});

// mapa.addLayers([capaPrueba]);

window.mapa = mapa;

// HTMLs de CP-002.html
const tituloCapa = window.document.getElementById('Name_Capa_Prueba');
tituloCapa.innerText = capaPrueba.name;
const popupDePruebas = window.document.getElementById('popup_de_test');
const abrirPopup = window.document.getElementById('abrir_test');
const cerrarPopup = window.document.getElementById('cerrar_test');
abrirPopup.addEventListener('click', () => { popupDePruebas.className = 'active'; });
cerrarPopup.addEventListener('click', () => { popupDePruebas.className = 'notactive'; });

const noParam = window.document.getElementsByClassName('noParameters')[0];
const getWithParam = window.document.getElementsByClassName('getWithParameters')[0];
const addParam = window.document.getElementsByClassName('addFunctions')[0];
const removeParam = window.document.getElementsByClassName('removeFunctions')[0];
const setParam = window.document.getElementsByClassName('setFunctions')[0];
const otherParam = window.document.getElementsByClassName('otherFunctions')[0];

// Guardar todos los __proto__ del Objeto "capaPrueba", usando ... para traerse elementos de estos objetos a un objeto común con el que se trabajará
const mergeObjects = (first, second) => { return { ...first, ...Object.getOwnPropertyDescriptors(second) }; };
let objectWithAllFunctions = {};
for (let acumuladorObjetos = capaPrueba; acumuladorObjetos.__proto__ !== null; acumuladorObjetos = acumuladorObjetos.__proto__) {
  objectWithAllFunctions = mergeObjects(objectWithAllFunctions, acumuladorObjetos);
}

// Creado Array para manejar más adelante el objectWithAllFunctions y ordenado de este sin funciones de "constructor" y "destroy"
const listAllFunctions = Object.keys(objectWithAllFunctions).sort();
listAllFunctions.remove('constructor'); listAllFunctions.remove('destroy'); listAllFunctions.remove('generateName_');
const listOnlyShown = [];

if (listAllFunctions && listAllFunctions.length > 0) { // Confirmar que existen funciones que se quieren probar
  const eventsFuncArray = [];
  const eventsKeyArray = [];

  // Función de escritura al Console del Browser
  const showResult = (button, format, result) => {
    const complete = button.innerText + (format ? `_${format}` : '');
    if (result instanceof Promise) {
      const resultArray = [];
      result.then((success) => { console.log(`PROMISE_SUCCESS:${complete}`, success); resultArray.push(success); button.className = 'okButton'; }, (error) => { console.log(`PROMISE_ERROR_THEN:${complete}`, error); resultArray.push(error); button.className = 'errorButton'; }).catch((error) => { console.log(`PROMISE_ERROR_CATCH:${complete}`, error); resultArray.push(error); button.className = 'errorButton'; });
      return resultArray;
    }
    button.className = 'okButton';
    console.log(complete, result);
    return result;
  };

  const checkFunctionArguments = (func) => {
    let hasArguments = false;
    const functString = func.toString().split('\n').splice(0, 2);
    if (functString[0]) {
      hasArguments = functString[0].substring(functString[0].indexOf('(') + 1, functString[0].indexOf(')')).trim().length !== 0 || functString[0].includes('arguments.length');
    }
    if (!hasArguments && functString[1]) {
      hasArguments = functString[1].includes('arguments.length') || functString[1].includes('[native code]');
    }
    return hasArguments;
  };

  for (let i = 0; i < listAllFunctions.length; i++) { // Comenzar a generar botones del HTML
    const auxName = listAllFunctions[i]; // Nombre de Función

    if (objectWithAllFunctions[auxName].value && objectWithAllFunctions[auxName].value instanceof Function) { // Comprobar que es una función y no un objeto
      // El botón de esta función
      const auxButton = document.createElement('button');
      auxButton.innerText = auxName;
      let appendTo;
      let parameterTest;
      listOnlyShown.push(auxName);

      if (objectWithAllFunctions[auxName].value && !checkFunctionArguments(objectWithAllFunctions[auxName].value)) {
        // ---------------------------------FUNCIONES SIN PARÁMETROS---------------------------------
        // FUNCIÓNES ÚNICAS
        // wms_001 ==> "_updateNoCache", "getCapabilities", "getNoCacheName" y "getNoCacheUrl"
        // geotiff_001 ==> "getNoCacheName" y "getNoCacheUrl"
        parameterTest = () => { // singeParameterTest
          showResult(auxButton, undefined, capaPrueba[auxName]());
        };
        appendTo = noParam;
      } else if (auxName.startsWith('get')) {
        // ---------------------------------FUNCIONES GET---------------------------------
        parameterTest = () => { // getParameterTest
          if (auxName === 'getFeatureById') { // ONLY USED IN "maplibre_001" (COULD BE UNNEDED others "extends LayerBase" are not using it)
            showResult(auxButton, 'GET_getFeatureById_NULL', capaPrueba[auxName]('TEST_NO_EXISTENTE'));
          } else if (auxName === 'getFeatureInfoUrl') { // ONLY USED IN "wmts_001"
            showResult(auxButton, 'GET_getFeatureInfoUrl', capaPrueba[auxName]([-394825, 4657802], 6, 'text/plain'));
          } else if (auxName === 'getTileColTileRow') { // ONLY USED IN "wmts_001"
            showResult(auxButton, 'GET_getTileColTileRow', capaPrueba[auxName]([-394825, 4657802], 6));
          } else {
            auxButton.className = 'errorButton';
            console.error('NOT_PREPARED_FUNCTION_TEST_FOR_GET:', auxName);
          }
        };
        appendTo = getWithParam;
      } else if (auxName.startsWith('add')) {
        // ---------------------------------FUNCIONES ADD---------------------------------
        parameterTest = () => { // addParameterTest
          if (auxName === '*NOT_DEFINED*') {
            // showResult(auxButton, "ADD_", capaPrueba[auxName]());
          } else {
            auxButton.className = 'errorButton';
            console.error('NOT_PREPARED_FUNCTION_TEST_FOR_ADD:', auxName);
          }
        };
        appendTo = addParam;
      } else if (auxName.startsWith('remove')) {
        // ---------------------------------FUNCIONES REMOVE---------------------------------
        parameterTest = () => { // removeParameterTest
          if (auxName === '*NOT_DEFINED*') {
            // showResult(auxButton, "ADD_", capaPrueba[auxName]());
          } else {
            auxButton.className = 'errorButton';
            console.error('NOT_PREPARED_FUNCTION_TEST_FOR_REMOVE:', auxName);
          }
        };
        appendTo = removeParam;
      } else if (auxName.startsWith('set')) {
        // ---------------------------------FUNCIONES SET---------------------------------
        parameterTest = () => { // setParameterTest
          if (auxName === 'setFilter') { // ONLY USED IN "maplibre_001"
            auxButton.className = 'warningButton';
            console.error('Not implemente in MapLibre Layers:', auxName);
            // showResult(auxButton, 'SET_setFilter', capaPrueba[auxName]());
          } else if (auxName === 'setFormat') { // ONLY USED IN "wmts_001"
            showResult(auxButton, 'SET_setFormat', capaPrueba[auxName]('text/html'));
          } else if (auxName === 'setImpl') {
            showResult(auxButton, 'SET_setImpl', capaPrueba[auxName](capaPrueba.getImpl()));
          } else if (auxName === 'setLayerGroup') {
            showResult(auxButton, 'SET_setLayerGroup', capaPrueba[auxName](['OSM', 'OSM']));
          } else if (auxName === 'setLayoutProperty') { // ONLY USED IN "maplibre_001"
            // window.maplibre.impl_.ol3Layer.mapLibreMap.setLayoutProperty('cubierta_vegetal_bosque_pol', 'visibility', 'none');
            showResult(auxButton, 'SET_setLayoutProperty', capaPrueba[auxName]('cubierta_vegetal_bosque_pol', 'visibility', 'none'));
          } else if (auxName === 'setLegend') {
            showResult(auxButton, 'SET_setLegend', capaPrueba[auxName]('PRUEBA_TEXTO_LEYENDA'));
          } else if (auxName === 'setLegendURL') {
            showResult(auxButton, 'SET_setLegendURL', capaPrueba[auxName]('TEST_BASE64_URL_REPLACEMENT'));
          } else if (auxName === 'setMap') {
            showResult(auxButton, 'SET_setMap', capaPrueba[auxName](capaPrueba.map_));
          } else if (auxName === 'setMaxExtent') {
            showResult(auxButton, 'SET_setMaxExtent', capaPrueba[auxName]([-306651, 4417678, -232910, 4491775]));// Leaves only line from "addFeatures"
          } else if (auxName === 'setMaxZoom') {
            showResult(auxButton, 'SET_setMaxZoom', capaPrueba[auxName](7));
          } else if (auxName === 'setMinZoom') {
            showResult(auxButton, 'SET_setMinZoom', capaPrueba[auxName](5));
          } else if (auxName === 'setOpacity') {
            if (capaPrueba.getOpacity() === 1) {
              showResult(auxButton, 'SET_setOpacity_0.5', capaPrueba[auxName](0.5));
            } else if (capaPrueba.getOpacity() === 0.5) {
              showResult(auxButton, 'SET_setOpacity_0', capaPrueba[auxName](0));
            } else {
              showResult(auxButton, 'SET_setOpacity_1', capaPrueba[auxName](1));
            }
          } else if (auxName === 'setPaintProperty') { // ONLY USED IN "maplibre_001"
            // window.maplibre.impl_.ol3Layer.mapLibreMap.setPaintProperty('cubierta_vegetal_bosque_pol','fill-color','rgba( 0, 0, 0, 1.00 )');
            showResult(auxButton, 'SET_setPaintProperty', capaPrueba[auxName]('cubierta_vegetal_bosque_pol', 'fill-color', 'rgba( 0, 0, 0, 1.00 )'));
          } else if (auxName === 'setStyle') { // ONLY USED IN "maplibre_001"
            showResult(auxButton, 'SET_setStyle', capaPrueba[auxName]('https://demotiles.maplibre.org/style.json'));
          } else if (auxName === 'setVisible') {
            if (capaPrueba.isVisible()) {
              showResult(auxButton, 'SET_setVisible_false', capaPrueba[auxName](false));
            } else {
              showResult(auxButton, 'SET_setVisible_true', capaPrueba[auxName](true));
            }
          } else if (auxName === 'setZIndex') {
            showResult(auxButton, 'SET_setZIndex', capaPrueba[auxName](101));
          } else {
            auxButton.className = 'errorButton';
            console.error('NOT_PREPARED_FUNCTION_TEST_FOR_SET:', auxName);
          }
        };
        appendTo = setParam;
      } else {
        // ---------------------------------OTRAS FUNCIONES---------------------------------
        parameterTest = () => { // otherParameterTest
          if (auxName === 'calculateMaxExtentWithCapabilities') { // ONLY USED IN "wms_001"
            capaPrueba.getCapabilities().then((capabilities) => {
              if (capabilities) {
                showResult(auxButton, 'calculateMaxExtentWithCapabilities', capaPrueba[auxName](capabilities));
              } else {
                auxButton.className = 'warningButton';
                console.error('NO_CAPABILITIES_PRESENT');
              }
            });
          } else if (auxName === 'equals') {
            showResult(auxButton, 'equals_capaPrueba', capaPrueba[auxName](capaPrueba));
            showResult(auxButton, 'equals_EMPTY_OBJ', capaPrueba[auxName]({}));
          } else if (auxName === 'fire') {
            showResult(auxButton, 'FIRE_CLICK_EVENT', capaPrueba[auxName]('click', { pixel: [0, 0] }));
          } else if (auxName === 'on') {
            const onDate = new Date().getTime();
            const funcEvent = () => { console.log('ON_FUNCTION:', onDate); };
            eventsFuncArray.push(funcEvent);
            showResult(auxButton, `ON_CLICK_${onDate}`, capaPrueba[auxName]('click', funcEvent));
          } else if (auxName === 'once') {
            const onDate = new Date().getTime();
            eventsKeyArray.push(showResult(auxButton, `ONCE_CLICK_${onDate}`, capaPrueba[auxName]('click', () => { console.log('ONCE_FUNCTION:', onDate); })));
          } else if (auxName === 'un') {
            if (eventsFuncArray.length > 0) {
              eventsFuncArray.forEach((f) => { showResult(auxButton, 'UN', capaPrueba[auxName]('click', f)); });
              eventsFuncArray.splice(0);
            } else {
              auxButton.className = 'warningButton';
              console.error('NO_ON_EVENTS_PRESENT_TO_CLEAR:', auxName);
            }
          } else if (auxName === 'unByKey') {
            if (eventsKeyArray.length > 0) {
              eventsKeyArray.forEach((k) => { showResult(auxButton, 'UNBYKEY', capaPrueba[auxName]('click', k)); });
              eventsKeyArray.splice(0);
            } else {
              auxButton.className = 'warningButton';
              console.error('NO_ONCE_EVENTS_PRESENT_TO_CLEAR:', auxName);
            }
          } else if (auxName === 'updateMinMaxResolution') { // ONLY USED IN "wms_001" and "geotiff_001"
            showResult(auxButton, 'updateMinMaxResolution', capaPrueba[auxName](mapa.getProjection())); // "minResolution" y "maxResolution" tienen que estar en este layer
          } else {
            auxButton.className = 'errorButton';
            console.error('NOT_PREPARED_FUNCTION_TEST_FOR_OTHER:', auxName);
          }
        };
        appendTo = otherParam;
      }

      // Asignado del botón con el evento apropiado
      auxButton.addEventListener('click', () => {
        auxButton.className = '';
        try {
          parameterTest();
        } catch (error) {
          auxButton.className = 'errorButton';
          throw error;
        }
      });
      appendTo.append(auxButton);
    }
  }
}

window.listAllFunctions = listAllFunctions; // Para tener acceso a toda la lista de funciones.
window.listOnlyShown = listOnlyShown; // Solo las funciones mostradas en las pruebas.

// Resultados de pruebas de funciones
// TMS tms_001           OK
// WMS wms_001           OK
// WMTS wmts_001         OK
// XYZ xyz_001           OK
// OSM osm               OK
// MBTile mbtile_01      OK
// generic generic_001   OK
// GeoTIFF geotiff_001   OK
// MapLibre maplibre_001 OK
