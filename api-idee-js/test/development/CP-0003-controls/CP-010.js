import { map as Mmap } from 'M/mapea';
import WMS from 'M/layer/WMS';
import WMTS from 'M/layer/WMTS';

let getfeatureinfoLayers
// Escoger el Control que se quiere probar:
// const textoControlPrueba = 'backgroundlayers';
// const textoControlPrueba = 'scale*false';
// const textoControlPrueba = 'scale*true';
// const textoControlPrueba = 'scaleline';
// const textoControlPrueba = 'panzoom';
// const textoControlPrueba = 'panzoombar';
// const textoControlPrueba = 'getfeatureinfo*true'; getfeatureinfoLayers = [new WMS({url: 'https://www.ign.es/wms-inspire/unidades-administrativas?', name: 'AU.AdministrativeBoundary', legend: 'Limite administrativo', tiled: false}, {}), new WMTS({url: 'http://www.ign.es/wmts/pnoa-ma', name: 'OI.OrthoimageCoverage', matrixSet: 'EPSG:25830', legend: 'PNOA'}, {format: 'image/png'})];
// const textoControlPrueba = 'getfeatureinfo*false'; getfeatureinfoLayers = [new WMS({url: 'https://www.ign.es/wms-inspire/unidades-administrativas?', name: 'AU.AdministrativeBoundary', legend: 'Limite administrativo', tiled: false}, {}), new WMTS({url: 'http://www.ign.es/wmts/pnoa-ma', name: 'OI.OrthoimageCoverage', matrixSet: 'EPSG:25830', legend: 'PNOA'}, {format: 'image/png'})];
// const textoControlPrueba = 'location*true*false';
// const textoControlPrueba = 'location*false*true';
// const textoControlPrueba = 'rotate';
const textoControlPrueba = 'attributions*<p>Contenido del control</p>';// const textoControlPrueba = 'attributions*Contenido del control';
window.textoControlPrueba = textoControlPrueba;

const mapa = Mmap({
  container: 'map',
  projection: 'EPSG:3857*m',
  controls: [textoControlPrueba],
  center: [-443273.10081370454, 4757481.749296248],
  layers: getfeatureinfoLayers ? getfeatureinfoLayers: undefined,
  zoom: 6,
});
window.mapa = mapa;

let controlPrueba = mapa.getControls()[0];
window.controlPrueba = controlPrueba;

// HTMLs de CP-010.html
const tituloCapa = window.document.getElementById('Name_Control_Prueba');
tituloCapa.innerText = controlPrueba.name;
const popupDePruebas = window.document.getElementById('popup_de_test');
const abrirPopup = window.document.getElementById('abrir_test');
const cerrarPopup = window.document.getElementById('cerrar_test');
abrirPopup.addEventListener('click', () => {popupDePruebas.className = 'active'});
cerrarPopup.addEventListener('click', () => {popupDePruebas.className = 'notactive'});

const noParam = window.document.getElementsByClassName('noParameters')[0];
const getWithParam = window.document.getElementsByClassName('getWithParameters')[0];
const addParam = window.document.getElementsByClassName('addFunctions')[0];
const removeParam = window.document.getElementsByClassName('removeFunctions')[0];
const setParam = window.document.getElementsByClassName('setFunctions')[0];
const otherParam = window.document.getElementsByClassName('otherFunctions')[0];

const bottonBorrar = window.document.getElementsByClassName('eliminarControl')[0];
const bottonAñadir = window.document.getElementsByClassName('anadirControl')[0];
bottonAñadir.style.display = 'none';
// Botón para eliminar control.
bottonBorrar.addEventListener('click', ()=>{
  window.mapa.removeControls(window.mapa.getControls());
  noParam.innerHTML = '';
  getWithParam.innerHTML = '';
  addParam.innerHTML = '';
  removeParam.innerHTML = '';
  setParam.innerHTML = '';
  otherParam.innerHTML = '';
  bottonBorrar.style.display = 'none';
  bottonAñadir.style.display = 'block';
});
// Botón para añadir control.
bottonAñadir.addEventListener('click', ()=>{
  window.mapa.addControls(textoControlPrueba);
  bottonAñadir.style.display = 'none';
  bottonBorrar.style.display = 'block';
  let controlPrueba = mapa.getControls()[0];
  window.controlPrueba = controlPrueba;
  generateAllFunctionsTest(controlPrueba, false); // El objeto control
  generateAllFunctionsTest(controlPrueba.impl_, true); // El control seleccionado
});

const generateAllFunctionsTest = (origin, simple) => {
  // Guardar todos los __proto__ del Objeto "origin", usando ... para traerse elementos de estos objetos a un objeto común con el que se trabajará
  let objectWithAllFunctions = {};
  if (simple) {
    objectWithAllFunctions = {...Object.getOwnPropertyDescriptors(origin.__proto__)};
  } else {
    const mergeObjects = (first, second) => {return {...first, ...Object.getOwnPropertyDescriptors(second)}}
    for(let acumuladorObjetos = origin ;acumuladorObjetos.__proto__ !== null;acumuladorObjetos = acumuladorObjetos.__proto__) {
      objectWithAllFunctions = mergeObjects(objectWithAllFunctions, acumuladorObjetos);
    }
  }

  // Creado Array para manejar más adelante el objectWithAllFunctions y ordenado de este sin funciones de "constructor", "destroy", "addTo" y "createView"
  const listAllFunctions = Object.keys(objectWithAllFunctions).sort();
  listAllFunctions.remove('constructor'); listAllFunctions.remove('destroy'); listAllFunctions.remove('addTo'); listAllFunctions.remove('createView');
  const listOnlyShown = [];

  if (listAllFunctions && listAllFunctions.length > 0) { // Confirmar que existen funciones que se quieren probar
    const eventsFuncArray = [];
    const eventsKeyArray = [];
    let clickHandler = 1;

    // Función de escritura al Console del Browser
    const showResult = (button, format, result) => {
      let complete = button.innerText + (format? '_' + format : '');
      if (result instanceof Promise) {
        const resultArray = [];
        result.then((success) => {console.log('PROMISE_SUCCESS:' + complete, success);resultArray.push(success);button.className = 'okButton';}, (error)=> {console.log('PROMISE_ERROR_THEN:' + complete, error);resultArray.push(error);button.className = 'errorButton';}).catch((error)=> {console.log('PROMISE_ERROR_CATCH:' + complete, error);resultArray.push(error);button.className = 'errorButton';});
        return resultArray;
      } else {
        button.className = 'okButton';
        console.log(complete, result);
        return result;
      }
    };

    const checkFunctionArguments = function (func) {
      let hasArguments = false;
      let functString = func.toString().split('\n').splice(0, 2);
      if (functString[0]) {
        hasArguments = functString[0].substring(functString[0].indexOf('(')+1, functString[0].indexOf(')')).trim().length != 0 || functString[0].includes('arguments.length');
      }
      if (!hasArguments && functString[1]) {
        hasArguments = functString[1].includes('arguments.length') || functString[1].includes('[native code]');
      }
      return hasArguments;
    }

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
          parameterTest = () => { // singeParameterTest
            showResult(auxButton, undefined, origin[auxName]());
          };
          appendTo = noParam;
        } else {
          if (auxName.startsWith('get')) {
            // ---------------------------------FUNCIONES GET---------------------------------
            parameterTest = () => { // getParameterTest
              if (auxName == 'getActivationButton') {
                showResult(auxButton, 'GET_getActivationButton', origin[auxName](controlPrueba.element_));
              } else if (auxName == 'getAttributionsFromMap') { // attribution control
                showResult(auxButton, 'GET_getAttributionsFromMap', origin[auxName](mapa.getLayers()));
              } else if (auxName == 'getMapAttributions') { // attribution control
                const vectorAttribution = mapa.getLayers().filter((l) => {
                  if (l.name || l.legend) {
                    return l.name ? l.name.includes(`ejemplo_ID_1234_attributions`) : l.legend.includes(`ejemplo_ID_1234_attributions`); // REQUIERE createVectorLayer
                  }
                  return false;
                });
                if (vectorAttribution.length > 0) {
                  const features = vectorAttribution[0].getFeatures();
                  showResult(auxButton, 'GET_getMapAttributions', origin[auxName](features));
                } else {
                  auxButton.className = 'warningButton';
                  console.error('NO_ATTRIBUTE_LAYER_WITH_FEATURES_PRESENT_ USE_ createVectorLayer');
                }
              } else {
                console.error('NOT_PREPARED_FUNCTION_TEST_FOR_GET:', auxName);
              }
            };
            appendTo = getWithParam;
          } else if (auxName.startsWith('add')) {
            // ---------------------------------FUNCIONES ADD---------------------------------
            parameterTest = () => { // addParameterTest
              if (auxName == 'addAttributions') { // attribution control
                showResult(auxButton, 'ADD_addAttributions', origin[auxName]({id:'abcdefg-123456', attribuccion:'<p>TEST_ADD_ATTRIBUTIONS</p>', contentType:'geojson'}));
              } else if (auxName == 'addContent') { // attribution control
                showResult(auxButton, 'ADD_addContent', origin[auxName]([{name:'name_test', description:'<p>TEST_ADD_CONTENT</p>'}]));
              } else if (auxName == 'addHTMLContent') { // attribution control
                showResult(auxButton, 'ADD_addHTMLContent', origin[auxName]('<p>TEST_ADD_HTML_CONTENT</p>'));
              } else if (auxName == 'addRotationEvent') { // rotate control
                showResult(auxButton, 'ADD_addRotationEvent', origin[auxName](mapa.getMapImpl()));
              } else {
                console.error('NOT_PREPARED_FUNCTION_TEST_FOR_ADD:', auxName);
              }
            };
            appendTo = addParam;
          } else if (auxName.startsWith('remove')) {
            // ---------------------------------FUNCIONES REMOVE---------------------------------
            parameterTest = () => { // removeParameterTest
              if (auxName == '*NOT_DEFINED*') {
                // showResult(auxButton, 'REMOVE_', origin[auxName]());
              } else {
                console.error('NOT_PREPARED_FUNCTION_TEST_FOR_REMOVE:', auxName);
              }
            };
            appendTo = removeParam;
          } else if (auxName.startsWith('set')) {
            // ---------------------------------FUNCIONES SET---------------------------------
            let visibleBool = false;
            parameterTest = () => { // setParameterTest
              if (auxName == 'setAttributions') { // attribution control
                showResult(auxButton, 'SET_setAttributions', origin[auxName]([{attribuccion: '<p>contenido del control</p>', id: 'c7f1f98f-e9c3-4a0f-b2cc-27a74db2b425'}, {attribuccion: '<p><b>IDEE</b>: EMPTY_URL</p>', id: 'bd2bd980-477a-458c-8df4-7bc5e9306372'}]));
              } else if (auxName == 'setCollapsiblePanel') { // attribution control
                showResult(auxButton, 'SET_setCollapsiblePanel', origin[auxName]({target:{innerWidth:window.innerWidth}}));
              } else if (auxName == 'setImpl') {
                showResult(auxButton, 'SET_setImpl', origin[auxName](controlPrueba.impl_));
              } else if (auxName == 'setPanel') {
                showResult(auxButton, 'SET_setPanel', origin[auxName](controlPrueba.panel_));
              } else if (auxName == 'setTracking' && origin.impl_) { // location control
                showResult(auxButton, 'SET_setTracking', origin[auxName](controlPrueba.impl_.tracking_));
              } else if (auxName == 'setTracking') { // location control impl
                if (origin.geolocation_) {
                  showResult(auxButton, 'SET_setTracking', origin[auxName](controlPrueba.impl_.tracking_));
                } else {
                  auxButton.className = 'warningButton';
                  console.error('GEOLOCATION_NOT_ENABLED');
                }
              } else if (auxName == 'setVisible') { // attribution control
                showResult(auxButton, 'SET_setVisible', origin[auxName](visibleBool));
                visibleBool = !visibleBool;
              } else {
                console.error('NOT_PREPARED_FUNCTION_TEST_FOR_SET:', auxName);
              }
            };
            appendTo = setParam;
          } else {
            // ---------------------------------OTRAS FUNCIONES---------------------------------
            let styleBool = true;
            parameterTest = () => { // otherParameterTest
              if (auxName == 'changeStyleResponsive') {
                showResult(auxButton, 'changeStyleResponsive', origin[auxName](styleBool));
                styleBool = !styleBool;
              } else if (auxName == 'accessibilityTab') { // attribution control
                showResult(auxButton, 'accessibilityTab', origin[auxName](controlPrueba.html_)); // "controlPrueba.html_" de control de atribuciones solo
              } else if (auxName == 'checkDefaultAttribution') { // attribution control
                showResult(auxButton, 'checkDefaultAttribution', origin[auxName]({name:'IGNBaseTodo'}));
              } else if (auxName == 'createVectorLayer') { // attribution control
                showResult(auxButton, 'createVectorLayer', origin[auxName]('ejemplo_ID_1234', 'https://www.ign.es/web/resources/delegaciones/delegacionesIGN.kml', 'kml')); //topojson
              } else if (auxName == 'defaultAttribution') { // attribution control
                showResult(auxButton, 'defaultAttribution', origin[auxName]({name:'IGNBaseTodo'}, 10));
              } else if (auxName == 'equals') {
                showResult(auxButton, 'equals_origin', origin[auxName](origin));
                showResult(auxButton, 'equals_EMPTY_OBJ', origin[auxName]({}));
              } else if (auxName == 'fire') {
                showResult(auxButton, 'FIRE_CLICK_EVENT', origin[auxName]('click', {pixel:[0, 0]}));
              } else if (auxName == 'handlerClickDesktop') {
                const eventVar = {target:controlPrueba.html.querySelectorAll('button.m-background-group-btn')[clickHandler]};
                showResult(auxButton, 'handlerClickDesktop', origin[auxName](eventVar, controlPrueba.layers[clickHandler], clickHandler));
                clickHandler += 1;
                if (clickHandler == controlPrueba.layers.length) clickHandler = 0;
              } else if (auxName == 'handlerClickMobile') {
                const eventVar = {target:controlPrueba.html.querySelectorAll('button.m-background-group-btn')[clickHandler]};
                showResult(auxButton, 'handlerClickMobile', origin[auxName](eventVar, controlPrueba.layers[clickHandler], clickHandler));
                clickHandler += 1;
                if (clickHandler == controlPrueba.layers.length) clickHandler = 0;
              } else if (auxName == 'listen') {
                showResult(auxButton, 'listen', origin[auxName](controlPrueba.html)); // Añade evento que causa que el layer escogido sea vacío si son pares, showBaseLayer
              } else if (auxName == 'manageActivation') { // solo funciona si getActivationButton devuelve algo y existe html template del control.
                if (controlPrueba.html) {
                  showResult(auxButton, 'manageActivation_html', origin[auxName](controlPrueba.html));
                } else if (controlPrueba.html_) {
                  showResult(auxButton, 'manageActivation_html_', origin[auxName](controlPrueba.html_));
                } else if (controlPrueba.panelHTML_) {
                  showResult(auxButton, 'manageActivation_panelHTML_', origin[auxName](controlPrueba.panelHTML_));
                } else if (controlPrueba.template_) {
                  showResult(auxButton, 'manageActivation_template_', origin[auxName](controlPrueba.template_));
                } else if (controlPrueba.template) {
                  showResult(auxButton, 'manageActivation_template', origin[auxName](controlPrueba.template));
                } else if (controlPrueba.element && controlPrueba.element.classList.contains('m-control')) {
                  showResult(auxButton, 'manageActivation_element', origin[auxName](controlPrueba.element));
                } else if (controlPrueba.element_ && controlPrueba.element_.classList.contains('m-control')) {
                  showResult(auxButton, 'manageActivation_element_', origin[auxName](controlPrueba.element_));
                } else { // Bastantes controls no tienen ningun guardado de templates.
                  auxButton.className = 'warningButton';
                  console.error('NO_TEMPLATE_ACCESIBLE_FOR_TEST');
                }
              } else if (auxName == 'on') {
                const onDate = new Date().getTime();
                const funcEvent = () => {console.log('ON_FUNCTION:', onDate)}
                eventsFuncArray.push(funcEvent);
                showResult(auxButton, 'ON_CLICK_'+onDate, origin[auxName]('click', funcEvent));
              } else if (auxName == 'onMoveEnd') { // attribution control
                const onDate = new Date().getTime();
                showResult(auxButton, 'onMoveEnd_'+onDate, origin[auxName](()=>console.log('onMoveEnd_FUNCTION:', onDate)));
              } else if (auxName == 'once') {
                const onDate = new Date().getTime();
                eventsKeyArray.push(showResult(auxButton, 'ONCE_CLICK_'+onDate, origin[auxName]('click', () => {console.log('ONCE_FUNCTION:', onDate)})));
              } else if (auxName == 'transformString') { // attribution control
                showResult(auxButton, 'transformString', origin[auxName]('SMALL_TEXT_TEST'));
              } else if (auxName == 'showBaseLayer') {
                const eventVar = {target:controlPrueba.html.querySelectorAll('button.m-background-group-btn')[clickHandler]};
                showResult(auxButton, 'showBaseLayer', origin[auxName](eventVar, controlPrueba.layers[clickHandler], clickHandler));
                clickHandler += 1;
                if (clickHandler == controlPrueba.layers.length) clickHandler = 0;
              } else if (auxName == 'un') {
                if (eventsFuncArray.length > 0) {
                  eventsFuncArray.forEach(f => {showResult(auxButton, 'UN', origin[auxName]('click', f));});
                  eventsFuncArray.splice(0);
                } else {
                  auxButton.className = 'warningButton';
                  console.error('NO_ON_EVENTS_PRESENT_TO_CLEAR:', auxName);
                }
              } else if (auxName == 'unByKey') {
                if (eventsKeyArray.length > 0) {
                  eventsKeyArray.forEach(k => {showResult(auxButton, 'UNBYKEY', origin[auxName]('click', k));});
                  eventsKeyArray.splice(0);
                } else {
                  auxButton.className = 'warningButton';
                  console.error('NO_ONCE_EVENTS_PRESENT_TO_CLEAR:', auxName);
                }
              } else if (auxName == 'renderCB') { // scale control Se puede ver en "window.mapa.getMapImpl().listeners_['postrender']" tiene puesto "bound renderCB"
                showResult(auxButton, 'renderCB', origin[auxName](mapa.getMapImpl().frameState_));
              } else if (auxName == 'buildUrl_') { // getfeatureinfo control
                showResult(auxButton, 'buildUrl_', origin[auxName]({info:(mensaje)=>console.log('Representado sin caja de diálogo:', mensaje)}, {coordinate:[342389.0153226123, 4760572.146776102]}));
              } else if (auxName == 'buildWMSInfoURL') { // getfeatureinfo control
                if (controlPrueba.impl_.evt) {
                  showResult(auxButton, 'buildWMSInfoURL', origin[auxName](mapa.getWMS()));
                } else {
                  auxButton.className = 'warningButton';
                  console.error('NO_POPUP_ACTIVE_WITH_FEATURE_DATA');
                }
              } else if (auxName == 'buildWMTSInfoURL') { // getfeatureinfo control
                if (controlPrueba.impl_.evt) {
                  showResult(auxButton, 'buildWMTSInfoURL', origin[auxName](mapa.getWMTS()));
                } else {
                  auxButton.className = 'warningButton';
                  console.error('NO_POPUP_ACTIVE_WITH_FEATURE_DATA');
                }
              } else if (auxName == 'formatInfo') { // getfeatureinfo control
                showResult(auxButton, 'formatInfo', origin[auxName]('TEXTO CON FORMATO TEXT/HTML', 'text/html', 'NOMBRE_LAYER'));
              } else if (auxName == 'showInfoFromURL_') { // getfeatureinfo control
                showResult(auxButton, 'showInfoFromURL_', origin[auxName]([
                  {layer: 'Limite administrativo', url: 'https://www.ign.es/wms-inspire/unidades-administrativas?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetFeatureInfo&FORMAT=image%2Fpng&TRANSPARENT=true&QUERY_LAYERS=AU.AdministrativeBoundary&LAYERS=AU.AdministrativeBoundary&STYLES=&INFO_FORMAT=text%2Fhtml&FEATURE_COUNT=10&BUFFER=5&I=50&J=50&CRS=EPSG%3A3857&WIDTH=101&HEIGHT=101&BBOX=217142.82357021852%2C4636405.496492527%2C464187.2989879082%2C4883449.971910218'}, // buildWMSInfoURL
                  {layer: 'PNOA', url: 'http://www.ign.es/wmts/pnoa-ma?service=WMTS&request=GetFeatureInfo&version=1.0.0&layer=OI.OrthoimageCoverage&tilematrixset=EPSG%3A25830&tilematrix=6&tilerow=8&tilecol=7&J=204&I=95&infoFormat=text%2Fhtml'} // buildWMTSInfoURL
                ], [-474000, 4806000], mapa.getMapImpl()));
              } else if (auxName == 'toogleSection') { // getfeatureinfo control
                const togglable = document.body.querySelector('.m-arrow-right, .m-arrow-down');
                if (togglable) {
                  showResult(auxButton, 'toogleSection', origin[auxName]({target:togglable}));
                } else {
                  auxButton.className = 'warningButton';
                  console.error('NO_FUNCTION_POPUP_WITH_TOGGLABLE_ARROW_PRESENT');
                }
              } else if (auxName == 'txtToHtmlGeoserver') { // getfeatureinfo control
                showResult(auxButton, 'txtToHtmlGeoserver', origin[auxName]('Valor geoserver', 'nombre_ejemplo_geoserver'));
              } else if (auxName == 'txtToHtmlMapserver') { // getfeatureinfo control
                showResult(auxButton, 'txtToHtmlMapserver', origin[auxName]('Valor mapserver'));
              } else if (auxName == 'registerEvent') { // attribution control
                const onDate = new Date().getTime();
                showResult(auxButton, 'registerEvent_'+onDate, origin[auxName]('click', mapa, ()=>console.log('registerEvent_FUNCTION:', onDate)));
              } else {
                console.error('NOT_PREPARED_FUNCTION_TEST_FOR_OTHER:', auxName);
              }
            };
            appendTo = otherParam;
          }
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
};
generateAllFunctionsTest(controlPrueba, false); // El objeto control
generateAllFunctionsTest(controlPrueba.impl_, true); // El control seleccionado

// Las funciones se generaron con "control" y "control.impl", porque por si solo había muy pocas funciones a probar por cada control.

// [APUNTADO A REDMINE] ERROR control attributions, en el generado de atribuciones hay una opción de "closePanel", que tiene que ser una función. El problema es que se puede insertar algo que no es función.
// [APUNTADO A REDMINE] ERROR control attributions, la función "getAttributionsFromMap" sufre error, parece que obtiene las atribuciones con "layer.getAttributions()", el problema es que los layers de API_CNIG solo tienen "getAttribution"(sin "s" final). Se ve que en el commit "https://github.com/IGN-CNIG/API-CNIG/commit/2c5759cd99d67d278f8cb89ace8e3551c9ce625b" se actualizo el nombre pero se olvido de arreglar esto.
