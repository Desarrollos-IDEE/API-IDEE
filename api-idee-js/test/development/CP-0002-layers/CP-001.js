/* eslint-disable no-console,no-underscore-dangle,max-len,camelcase,no-plusplus,no-param-reassign,no-proto,import/newline-after-import,object-property-newline,new-cap,object-curly-newline */
import { map as Mmap } from 'M/mapea';
import Feature from 'M/feature/Feature';
import Generic from 'M/style/Generic';
import * as filterFunction from 'M/filter/Function';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'M/layer/GeoJSON';
import { bbox as bboxStrategy } from 'ol/loadingstrategy';
import olXMLFormater from 'ol/format/XML';
// Escoger una de estas capas para probarlas.
// import { vector_001 } from '../layers/vector/vector'; const capaPrueba = vector_001; window.vector = vector_001;
// import { geojson_006 } from '../layers/geojson/geojson'; const capaPrueba = geojson_006; window.geojson = capaPrueba;
import { wfs_005 } from '../layers/wfs/wfs'; const capaPrueba = wfs_005; window.wfs = capaPrueba;
// import { kml_003 } from '../layers/kml/kml'; const capaPrueba = kml_003; window.kml = capaPrueba;
// import { mvt_001 } from '../layers/mvt/mvt'; const capaPrueba = mvt_001; window.mvt = mvt_001; // Mode 'feature'
// import { mvt_004 } from '../layers/mvt/mvt'; const capaPrueba = mvt_004; window.mvt = capaPrueba; // Mode 'render'
// import { ogcAPIFeatures_002 } from '../layers/ogcApiFeatures/ogcApiFeatures'; const capaPrueba = ogcAPIFeatures_002; window.ogcAPIFeatures = capaPrueba;
// import { mbtileVector_002 } from '../layers/mbTilesVector/mbTilesVector'; const capaPrueba = mbtileVector_002; window.mbtileVector = capaPrueba;
// import { generic_002 } from '../layers/generic/generic'; const capaPrueba = generic_002; window.generic = generic_002;
window.capaPrueba = capaPrueba;
window.xmlFormater = new olXMLFormater();
const mapa = Mmap({
  container: 'map',
  projection: 'EPSG:3857*m',
  center: [-443273.10081370454, 4757481.749296248],
  zoom: 6,
  controls: ['scale'],
  layers: [capaPrueba],
});

// mapa.addLayers([capaPrueba]);

window.mapa = mapa;

// HTMLs de CP-001.html
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
        // geojson_001 ==> "serialize"(if source is 'undefined' returns 'dW5kZWZpbmVk')
        // mvt_001 y mbtileVector_001 ==> "getProjection"
        parameterTest = () => { // singeParameterTest
          if (window.mvt && (auxName === 'refresh' || auxName === 'redraw' || auxName === 'toGeoJSON' || auxName === 'getFilter' || auxName === 'removeFilter')) {
            auxButton.className = 'warningButton';
            console.error('Not implementable in MVT Layers:', auxName);
          } else {
            showResult(auxButton, undefined, capaPrueba[auxName]());
          }
        };
        appendTo = noParam;
      } else if (auxName.startsWith('get')) {
        // ---------------------------------FUNCIONES GET---------------------------------
        parameterTest = () => { // getParameterTest
          if (auxName === 'getFeatureById') {
            showResult(auxButton, 'GET_getFeatureById', capaPrueba[auxName]('GRXX0114_00E044_0')); // ID del olFeature.getProperties().id
          } else if (auxName === 'getFeatures') {
            showResult(auxButton, 'GET_getFeatures', capaPrueba[auxName]());
          } else if (auxName === 'getFeaturesExtent') {
            showResult(auxButton, 'GET_getFeaturesExtent_WITH_FILTER', capaPrueba[auxName]());
            showResult(auxButton, 'GET_getFeaturesExtent_WITHOUT_FILTER', capaPrueba[auxName](true));
          } else {
            auxButton.className = 'errorButton';
            console.error('NOT_PREPARED_FUNCTION_TEST_FOR_GET:', auxName);
          }
        };
        appendTo = getWithParam;
      } else if (auxName.startsWith('add')) {
        // ---------------------------------FUNCIONES ADD---------------------------------
        parameterTest = () => { // addParameterTest
          if (auxName === 'addFeatures') {
            if (window.mvt) {
              auxButton.className = 'warningButton';
              console.error('Not implementable in MVT Layers:', auxName);
            } else {
              showResult(auxButton, 'ADD_addFeatures', capaPrueba[auxName]([
                new Feature('featurePruebaLine0', { type: 'Feature', id: 'featurePruebaLine0',
                  geometry: { type: 'LineString',
                    coordinates: [[-232910, 4433901], [-290293, 4419678], [-290293, 4433901]],
                  }, geometry_name: 'geometry', properties: { nombre: 'featurePruebaLine0' },
                }),
                new Feature('featurePruebaPolygon0', { type: 'Feature', id: 'featurePruebaPolygon0',
                  geometry: { type: 'Polygon',
                    coordinates: [[
                      [-353770, 4485361], [-320910, 4431901],
                      [-378293, 4417678], [-353770, 4485361],
                    ]],
                  }, geometry_name: 'geometry', properties: { nombre: 'featurePruebaPolygon0' },
                }),
              ]));
            }
          } else {
            auxButton.className = 'errorButton';
            console.error('NOT_PREPARED_FUNCTION_TEST_FOR_ADD:', auxName);
          }
        };
        appendTo = addParam;
      } else if (auxName.startsWith('remove')) {
        // ---------------------------------FUNCIONES REMOVE---------------------------------
        parameterTest = () => { // removeParameterTest
          if (auxName === 'removeFeatures') {
            if (window.mvt) {
              auxButton.className = 'warningButton';
              console.error('Not implementable in MVT Layers:', auxName);
            } else {
              showResult(auxButton, 'REMOVE_removeFeatures', capaPrueba[auxName](capaPrueba.getFeatures()));
            }
          } else {
            auxButton.className = 'errorButton';
            console.error('NOT_PREPARED_FUNCTION_TEST_FOR_REMOVE:', auxName);
          }
        };
        appendTo = removeParam;
      } else if (auxName.startsWith('set')) {
        // ---------------------------------FUNCIONES SET---------------------------------
        parameterTest = () => { // setParameterTest
          if (auxName === 'setCQL') { // ONLY USED IN "wfs_001" and "generic_002"
            showResult(auxButton, 'SET_setCQL', capaPrueba[auxName]('id IN (3,5)')); // window.capaPrueba.impl_.cql
          } else if (auxName === 'setFilter') {
            if (window.mvt) {
              auxButton.className = 'warningButton';
              console.error('Not implementable in MVT Layers:', auxName);
            } else {
              showResult(auxButton, 'SET_setFilter', capaPrueba[auxName](new filterFunction.default((feature) => { return feature.impl_.olFeature_.values_.geometry.getType() === 'Polygon'; }))); // Leaves only Polygons from "addFeatures"
            }
          } else if (auxName === 'setImpl') {
            showResult(auxButton, 'SET_setImpl', capaPrueba[auxName](capaPrueba.getImpl()));
          } else if (auxName === 'setLayerGroup') {
            showResult(auxButton, 'SET_setLayerGroup', capaPrueba[auxName](['OSM', 'OSM']));
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
          } else if (auxName === 'setSource') { // ONLY USED IN "geojson_001"
            showResult(auxButton, 'SET_setSource', capaPrueba[auxName](new VectorSource({
              format: new GeoJSON(),
              url: 'https://geostematicos-sigc.juntadeandalucia.es/geoserver/tematicos/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=tematicos:Provincias&maxFeatures=50&outputFormat=application%2Fjson',
              strategy: bboxStrategy,
            })));
          } else if (auxName === 'setStyle') {
            showResult(auxButton, 'SET_setStyle', capaPrueba[auxName](new Generic({
              point: { radius: 5, fill: { color: 'blue', opacity: 0.5 }, stroke: { color: 'green' } },
              line: { fill: { color: 'blue' }, stroke: { color: 'green' } },
              polygon: { fill: { color: 'blue' }, stroke: { color: 'green' } },
              label: { text: 'Tres Tristes Tigres Trigo', font: 'bold 15px Courier New', color: 'blue', stroke: { color: 'green' } },
            })));
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
          if (auxName === 'applyStyle_') {
            if (capaPrueba.getFeatures()[0]) {
              showResult(auxButton, 'applyStyle_', capaPrueba[auxName](new Generic({
                point: { radius: 5, fill: { color: 'yellow', opacity: 0.5 }, stroke: { color: 'red' } },
                line: { fill: { color: 'yellow' }, stroke: { color: 'red' } },
                polygon: { fill: { color: 'yellow' }, stroke: { color: 'red' } },
                label: { text: 'Tres Tristes Tigres Trigo', font: 'bold 15px Courier New', color: 'yellow', stroke: { color: 'red' } },
              }), capaPrueba.getFeatures()[0]));
            } else {
              auxButton.className = 'warningButton';
              console.error('NO_FEATURE_PRESENT_FOR_STYLE:', auxName);
            }
          } else if (auxName === 'deserialize') {
            if (capaPrueba.serialize() !== 'dW5kZWZpbmVk') {
              showResult(auxButton, 'deserialize', capaPrueba[auxName](capaPrueba.serialize())); // ONLY USED IN "geojson_001" Because of "cyclic object value" error, setSource requieres "refresh()"
            } else {
              auxButton.className = 'warningButton';
              console.error('TEST_CAN_NOT_BE_DONE_IF_SOURCE_IS_UNDEFINED');
            }
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
