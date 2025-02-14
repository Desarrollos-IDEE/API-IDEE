/* eslint-disable no-console,no-underscore-dangle,no-loop-func,no-proto,max-len,no-param-reassign,spaced-comment,no-plusplus,no-unused-vars,camelcase */
import { map as Mmap } from 'M/mapea';
import Generic from 'M/style/Generic';
import Choropleth from 'M/style/Choropleth';
import Proportional from 'M/style/Proportional';
import Category from 'M/style/Category';
import Chart from 'M/style/Chart';
import Heatmap from 'M/style/Heatmap';
import Cluster from 'M/style/Cluster';
import FlowLine from 'M/style/FlowLine';
import { schemes } from 'M/chart/types';
import {
  JENKS, QUANTILE, EQUAL_INTERVAL, MEDIA_SIGMA, ARITHMETIC_PROGRESSION, GEOMETRIC_PROGRESSION,
} from 'M/style/Quantification';
import { info } from 'M/dialog';
import {
  wfs_001, wfs_002, wfs_003, wfs_004,
} from '../layers/wfs/wfs';
import { geojson_003 } from '../layers/geojson/geojson';

const mapa = Mmap({
  container: 'map',
  projection: 'EPSG:3857*m',
  bbox: [-1558215.73316107, 4168698.8601280265, 789929.7757595448, 5275507.029697379],
});

// COROPLETAS
const getCoropletasStyle = () => {
  const estilo = new Choropleth(
    'u_cod_prov',
    ['#000000', '#008000', '#FFFFFF'],
    JENKS(4),
  );
  if (window.layer) {
    mapa.removeLayers(window.layer);
  }
  window.layer = wfs_001;
  mapa.addLayers(window.layer);
  return estilo;
};

// PROPORCIONAL
const getProportionalStyle = () => {
  const estilo = new Proportional('tot_ibi', 5, 20, new Generic({ // estilo del punto
    point: {
      fill: {
        color: '#000000',
      },
      stroke: {
        color: '#FFFFFF',
        width: 2,
      },
    },
  }));
  if (window.layer) {
    mapa.removeLayers(window.layer);
  }
  window.layer = wfs_003;
  mapa.addLayers(window.layer);
  return estilo;
};

// CATEGORICO
const getCategoricStyle = () => {
  const verde = new Generic({ polygon: { fill: { color: 'green' } } });
  const amarillo = new Generic({ polygon: { fill: { color: 'pink' } } });
  const rojo = new Generic({ polygon: { fill: { color: 'red' } } });
  const azul = new Generic({ polygon: { fill: { color: 'grey' } } });
  const naranja = new Generic({ polygon: { fill: { color: 'orange' } } });
  const marron = new Generic({ polygon: { fill: { color: 'brown' } } });
  const magenta = new Generic({ polygon: { fill: { color: '#e814d9' } } });
  const morado = new Generic({ polygon: { fill: { color: '#b213dd' } } });

  const estilo = new Category('provincia', {
    'Almería': marron,
    'Cádiz': amarillo,
    'Córdoba': magenta,
    'Granada': verde,
    'Jaén': naranja,
    'Málaga': azul,
    'Sevilla': rojo,
    'Huelva': morado,
  });
  if (window.layer) {
    mapa.removeLayers(window.layer);
  }
  window.layer = wfs_003;
  mapa.addLayers(window.layer);
  return estilo;
};

// / ESTADÍSTICOS
const getEstadisticStyle = (graphicType) => {
  const opcionesEstilo = {
    // Características generales de la gráfica
    type: graphicType || 'pie',
    radius: 25,
    stroke: { color: 'black', width: 1 },
    scheme: schemes.Custom, // usaremos nuestros propios colores

    // Variables que queremos representar
    variables: [{
      attribute: 'es_0_15', // población entre 0 y 15 años
      legend: '0-15 años',
      fill: '#F2F2F2',
      label: {
        stroke: { color: 'white', width: 2 },
        radiusIncrement: 10,
        fill: 'black',
        text: '{{es_0_15}}',
        font: 'Comic Sans MS',
      },
    }, {
      attribute: 'es_16_45', // población entre 16 y 45 años
      legend: '16-45 años',
      fill: 'blue',
      label: {
        text(value, values, feature) {
          return value.toString();
        },
        radiusIncrement: 10,
        stroke: { color: '#fff', width: 2 },
        fill: 'blue',
        font: 'Comic Sans MS',
      },
    }, {
      attribute: 'es_45_65', // población entre 45 y 65 años
      legend: '45-65 años',
      fill: 'pink',
      label: {
        text: '{{es_45_65}}',
        stroke: { color: '#fff', width: 2 },
        fill: 'red',
        font: 'Comic Sans MS',
      },
    }, {
      attribute: 'es_65', // población mayor de 65 años
      legend: '65 años o más',
      fill: 'orange',
      label: {
        text: '{{es_65}}',
        stroke: { color: '#fff', width: 2 },
        fill: '#886A08',
        font: 'Comic Sans MS',
      },
    }],
  };
  const estilo = new Chart(opcionesEstilo);
  if (window.layer) {
    mapa.removeLayers(window.layer);
  }
  window.layer = wfs_001;
  mapa.addLayers(window.layer);
  return estilo;
};

// MAPA DE CALOR
const getHeatmapStyle = () => {
  const estilo = new Heatmap('numero', {
    blur: 15,
    radius: 10,
    gradient: ['blue', 'cyan', 'green', 'yellow', 'orange', 'red'],
  });
  if (window.layer) {
    mapa.removeLayers(window.layer);
  }
  window.layer = wfs_002;
  mapa.addLayers(window.layer);
  return estilo;
};

// CLUSTER
const getClusterStyle = () => {
  const clusterOptions = {
    ranges: [{
      min: 2,
      max: 4,
      style: new Generic({
        point: {
          stroke: {
            color: '#5789aa',
          },
          fill: {
            color: '#99ccff',
          },
          radius: 20,
        },
      }),
    }, {
      min: 5,
      max: 9,
      style: new Generic({
        point: {
          stroke: {
            color: '#5789aa',
          },
          fill: {
            color: '#3399ff',
          },
          radius: 30,
        },
      }),
    },
    // Se pueden definir más rangos
    ],
    animated: true,
    hoverInteraction: true,
    displayAmount: true,
    selectInteraction: true,
    distance: 80,
    label: {
      font: 'bold 19px Comic Sans MS',
      color: '#FFFFFF',
    },
  };
  const estilo = new Cluster(clusterOptions);
  if (window.layer) {
    mapa.removeLayers(window.layer);
  }
  window.layer = wfs_004;
  mapa.addLayers(window.layer);
  return estilo;
};

// LINEA DE FLUJO
const getFlowLineStyle = () => {
  const estilo = new FlowLine({
    color: 'blue',
    color2: 'pink',
    width: (feature) => {
      return feature.getAttribute('inicio') * 0.2;
    },
    width2: (feature) => {
      return feature.getAttribute('final') * 0.2;
    },
    arrow: -1,
    arrowColor: 'grey',
    lineCap: 'butt',
  });
  if (window.layer) {
    mapa.removeLayers(window.layer);
  }
  window.layer = geojson_003;
  mapa.addLayers(window.layer);
  return estilo;
};

// COMPOSICION
const getCompositeStyle = () => {
  // Estilo genérico: puntos amarillos con borde rojo
  const estilo_base = new Generic({
    point: {
      radius: 5,
      fill: {
        color: 'yellow',
        opacity: 0.5,
      },
      stroke: {
        color: '#FF0000',
      },
    },
  });

  // Estilo cluster por defecto
  const estilo_cluster = new Cluster();

  // Cluster permite Composite, así que se le puede agregar el estilo base
  const estilo = estilo_cluster.add(estilo_base);
  if (window.layer) {
    mapa.removeLayers(window.layer);
  }
  window.layer = wfs_004;
  mapa.addLayers(window.layer);
  return estilo;
};

window.mapa = mapa;

const popupDePruebas = window.document.getElementById('popup_de_test');
const abrirPopup = window.document.getElementById('abrir_test');
abrirPopup.addEventListener('click', () => { popupDePruebas.className = 'active'; });

const cerrarPopup = window.document.getElementById('cerrar_test');
cerrarPopup.addEventListener('click', () => { popupDePruebas.className = 'notactive'; });

const styleTypeDiv = window.document.getElementsByClassName('styleType')[0];

const styleOptionsDiv = window.document.getElementsByClassName('styleOptions')[0];

const showStyleBtn = window.document.getElementById('showStyleOptions');

const resetDefaultBtn = window.document.getElementById('resetDefault');

const setParam = window.document.getElementsByClassName('setFunctions')[0];
const getWithParam = window.document.getElementsByClassName('getWithParameters')[0];
const noParam = window.document.getElementsByClassName('noParameters')[0];
const otherParam = window.document.getElementsByClassName('otherFunctions')[0];

let estilo = null;
let styleType = null;

const styles = {
  coropletas: {
    funcion: getCoropletasStyle,
    opciones: {},
  },
  proportional: {
    funcion: getProportionalStyle,
    opciones: {},
  },
  categoric: {
    funcion: getCategoricStyle,
    opciones: {},
  },
  estadistic: {
    funcion: getEstadisticStyle,
    opciones: [
      {
        id: 'pie', value: 'pie', texto: 'Tarta', default: true,
      }, {
        id: 'pie3D', value: 'pie3D', texto: 'Tarta 3D', default: false,
      }, {
        id: 'donut', value: 'donut', texto: 'Donut', default: false,
      }, {
        id: 'bar', value: 'bar', texto: 'Barras', default: false,
      },
    ],
  },
  heatmap: {
    funcion: getHeatmapStyle,
    opciones: {},
  },
  cluster: {
    funcion: getClusterStyle,
    opciones: {},
  },
  flowline: {
    funcion: getFlowLineStyle,
    opciones: {},
  },
  composite: {
    funcion: getCompositeStyle,
    opciones: {},
  },
};

const removeClassFromElement = (element, className) => {
  element.classList.remove(className);
};

const removeClassFromListElements = (elements, className) => {
  elements.forEach((e) => removeClassFromElement(e, className));
};

const setStyle = (type) => {
  estilo = styles[type].funcion();
  window.layer.setStyle(estilo);
  window.estilo = estilo;
};

const resetDefaultStyle = () => {
  const activeBtn = document.querySelector('.activeButton');
  const okButtons = document.querySelectorAll('.okButton');
  removeClassFromListElements(okButtons, 'okButton');
  const warningButtons = document.querySelectorAll('.warningButton');
  removeClassFromListElements(warningButtons, 'warningButton');
  const errorButtons = document.querySelectorAll('.errorButton');
  removeClassFromListElements(errorButtons, 'errorButton');
  setStyle(activeBtn.id);
};
resetDefaultBtn.addEventListener('click', () => resetDefaultStyle());

const deleteChilds = (element) => {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
};

const activateStyleTypeBtn = (idBtn) => {
  const buttons = window.document.querySelectorAll('.styleType>button');
  buttons.forEach((b) => {
    b.classList.remove('activeButton');
    if (b.id === idBtn) {
      b.classList.add('activeButton');
    }
  });
};

const showTestSections = () => {
  const testSections = window.document.getElementById('test_sections');
  testSections.classList.remove('hidden');
};

const setStyleWithParam = (type, param) => {
  estilo = styles[type].funcion(param);
  window.layer.setStyle(estilo);
  window.estilo = estilo;
};

const refreshStyleOptions = (type) => {
  const options = styles[type].opciones;
  deleteChilds(styleOptionsDiv);
  for (let i = 0; i < options.length; i++) {
    const btn = document.createElement('button');
    btn.innerText = options[i].texto;
    btn.id = options[i].id;
    if (options[i].default) {
      btn.classList.add('activeButton');
    }
    styleOptionsDiv.appendChild(btn);
  }
};

const refreshStyle = (evt) => {
  const idBtn = evt.target.id;
  if (idBtn) {
    removeClassFromListElements(styleOptionsDiv.querySelectorAll('.activeButton'), 'activeButton');
    evt.target.classList.add('activeButton');
    const value = styles[styleType].opciones.find((o) => o.id === idBtn).value;
    setStyleWithParam(styleType, value);
  }
};
styleOptionsDiv.addEventListener('click', (evt) => refreshStyle(evt));

const showStyleDialog = () => {
  const options = estilo.getOptions();
  const jsonFormateado = JSON.stringify(options, null, 2);
  console.log(options);
  info(jsonFormateado);
};
showStyleBtn.addEventListener('click', () => showStyleDialog());

///////////////////////
////// FUNCIONES //////
///////////////////////

// Función de escritura al Console del Browser
const showResult = (button, format, result) => {
  const complete = button.innerText + (format ? `_${format}` : '');
  if (result instanceof Promise) {
    const resultArray = [];
    result.then((success) => {
      console.log(`PROMISE_SUCCESS: ${complete}`, success);
      resultArray.push(success);
      button.className = 'okButton';
    }, (error) => {
      console.log(`PROMISE_ERROR_THEN: ${complete}`, error);
      resultArray.push(error);
      button.className = 'errorButton';
    }).catch((error) => {
      console.log(`PROMISE_ERROR_CATCH: ${complete}`, error);
      resultArray.push(error);
      button.className = 'errorButton';
    });
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

const addTestFunctions = () => {
  // Guardar todos los __proto__ del Objeto "estilo", usando ... para traerse elementos de estos objetos a un objeto común con el que se trabajará
  const objectWithAllFunctions = {
    ...Object.getOwnPropertyDescriptors(estilo.__proto__),
    ...Object.getOwnPropertyDescriptors(estilo.__proto__.__proto__),
    ...Object.getOwnPropertyDescriptors(estilo.__proto__.__proto__.__proto__),
    ...Object.getOwnPropertyDescriptors(estilo.__proto__.__proto__.__proto__.__proto__),
  };

  // Creado Array para manejar más adelante el objectWithAllFunctions y ordenado de este sin funciones de "constructor" y "destroy"
  const listOfAllFunctions = Object.keys(objectWithAllFunctions).sort();
  listOfAllFunctions.remove('constructor');
  listOfAllFunctions.remove('destroy');
  listOfAllFunctions.remove('equals');
  listOfAllFunctions.remove('setImpl');
  listOfAllFunctions.remove('loadCanvasImages_'); listOfAllFunctions.remove('loadCanvasImage'); // se llama internamente con updateCanvas
  listOfAllFunctions.remove('drawGeometryToCanvas'); // se llama internamente con updateCanvas
  /* if (styleType !== 'composite') {
    // listOfAllFunctions.remove('add');
    listOfAllFunctions.remove('unapplySoft');
    listOfAllFunctions.remove('updateInternal_');
  } */
  const listOnlyShown = [];
  // Confirmar que existen funciones que se quieren probar
  if (listOfAllFunctions && listOfAllFunctions.length > 0) {
    const eventsFuncArray = [];
    const eventsKeyArray = [];
    // Comenzar a generar botones del HTML
    for (let i = 0; i < listOfAllFunctions.length; i++) {
      const auxName = listOfAllFunctions[i]; // Nombre de Función
      // Comprobar que es una función y no un objeto
      if (objectWithAllFunctions[auxName].value && objectWithAllFunctions[auxName].value instanceof Function) {
        // El botón de esta función
        const auxButton = document.createElement('button');
        auxButton.innerText = auxName;
        let appendTo;
        let parameterTest;
        listOnlyShown.push(auxName);

        if (objectWithAllFunctions[auxName].value && !checkFunctionArguments(objectWithAllFunctions[auxName].value)) {
          // ---------------------------------FUNCIONES SIN PARÁMETROS-----------------------------
          parameterTest = () => { // singeParameterTest
            showResult(auxButton, undefined, estilo[auxName]());
          };
          appendTo = noParam;
        } else if (auxName.startsWith('get')) {
          // ---------------------------------FUNCIONES GET---------------------------------
          parameterTest = () => { // getParameterTest
            if (auxName === 'get') {
              showResult(auxButton, 'fill.color', estilo[auxName]('fill.color'));
            } else if (auxName === 'getStyleForCategory') {
              showResult(auxButton, 'SEVILLA', estilo[auxName]('Sevilla'));
            } else if (auxName === 'getRange') {
              showResult(auxButton, '2-4', estilo[auxName](2, 4));
            } else {
              console.error('NOT_PREPARED_FUNCTION_TEST_FOR_GET:', auxName);
            }
          };
          appendTo = getWithParam;
        } else if (auxName.startsWith('set')) {
          // ---------------------------------FUNCIONES SET---------------------------------
          parameterTest = () => { // setParameterTest
            if (auxName === 'set') {
              showResult(auxButton, 'fill.color', estilo[auxName]('fill.color', 'pink'));
            } else if (auxName === 'setAttributeName') {
              showResult(auxButton, 'es_0_15', estilo[auxName]('es_0_15'));
            } else if (auxName === 'setQuantification') {
              // const rangos = [10, 20, 30, 40, 50];
              showResult(auxButton, 'JENKS', estilo[auxName](EQUAL_INTERVAL(4)));
            } else if (auxName === 'setStyles') {
              showResult(auxButton, 'EMPTY_STYLES', estilo[auxName]([]));
            } else if (auxName === 'setMaxRadius') {
              showResult(auxButton, '30', estilo[auxName](30));
            } else if (auxName === 'setMinRadius') {
              showResult(auxButton, '3', estilo[auxName](3));
            } else if (auxName === 'setProportionalFunction') {
              const miFuncionProporcional = (value, minValue, maxValue, minRadius, maxRadius) => {
                const radio = value * (maxValue / maxRadius);
                return radio;
              };
              showResult(auxButton, 'function', estilo[auxName](miFuncionProporcional));
            } else if (auxName === 'setStyle') {
              showResult(auxButton, 'setStyle', estilo[auxName](estilo.style_));
            } else if (auxName === 'setCategories') {
              const categories = {};
              showResult(auxButton, 'empty_object', estilo[auxName](categories));
            } else if (auxName === 'setStyleForCategory') {
              const negro = new Generic({ polygon: { fill: { color: 'black' } } });
              showResult(auxButton, 'black', estilo[auxName]('Sevilla', negro));
            } else if (auxName === 'setBlurSize') {
              showResult(auxButton, '10', estilo[auxName](10));
            } else if (auxName === 'setGradient') {
              const gradient = ['red', 'green', 'blue'];
              showResult(auxButton, '[red, green, blue]', estilo[auxName](gradient));
            } else if (auxName === 'setRadius') {
              showResult(auxButton, '20', estilo[auxName](20));
            } else if (auxName === 'setAnimated') {
              showResult(auxButton, 'false', estilo[auxName](false));
            } else if (auxName === 'setRanges') {
              const rangos = [{
                min: 1,
                max: 3,
                style: new Generic({
                  point: {
                    stroke: {
                      color: '#5789aa',
                    },
                    fill: {
                      color: '#99ccff',
                    },
                    radius: 20,
                  },
                }),
              }, {
                min: 4,
                max: 7,
                style: new Generic({
                  point: {
                    stroke: {
                      color: '#5789aa',
                    },
                    fill: {
                      color: '#3399ff',
                    },
                    radius: 30,
                  },
                }),
              },
              // Se pueden definir más rangos
              ];
              showResult(auxButton, null, estilo[auxName](rangos));
            } else {
              console.error('NOT_PREPARED_FUNCTION_TEST_FOR_SET:', auxName);
            }
          };
          appendTo = setParam;
        } else {
          // ---------------------------------OTRAS FUNCIONES---------------------------------
          parameterTest = () => { // otherParameterTest
            if (auxName === 'add') {
              showResult(auxButton, 'add', estilo[auxName](styles[styleType]));
            } else if (auxName === 'apply' || auxName === 'applyInternal') {
              showResult(auxButton, null, estilo[auxName](window.layer));
            } else if (auxName === 'applyToFeature') {
              const feature = window.layer.getFeatures()[0];
              showResult(auxButton, null, estilo[auxName](feature));
            } else if (auxName === 'calculateStyle_') {
              const feature = window.layer.getFeatures()[0];
              let style = estilo.style_;
              if (style === null || style === undefined) {
                style = feature.getStyle() ? feature.getStyle() : this.layer_.getStyle();
              }
              showResult(auxButton, null, estilo[auxName](feature, {
                minRadius: estilo.minRadius_,
                maxRadius: estilo.maxRadius_,
                minValue: estilo.minValue_,
                maxValue: estilo.maxValue_,
              }, style));
            } else if (auxName === 'refresh') {
              showResult(auxButton, null, estilo[auxName]());
            } else if (auxName === 'remove') {
              showResult(auxButton, 'remove', estilo[auxName](styles[styleType]));
            } else if (auxName === 'unapply' || auxName === 'unapplyInternal') {
              showResult(auxButton, null, estilo[auxName](window.layer));
            } else if (auxName === 'fire') {
              showResult(auxButton, 'FIRE_CLICK_EVENT', estilo[auxName]('click', { pixel: [0, 0] }));
            } else if (auxName === 'on') {
              const onDate = new Date().getTime();
              const funcEvent = () => { console.log('ON_FUNCTION:', onDate); };
              eventsFuncArray.push(funcEvent);
              showResult(auxButton, `ON_CLICK_${onDate}`, estilo[auxName]('click', funcEvent));
            } else if (auxName === 'once') {
              const onDate = new Date().getTime();
              eventsKeyArray.push(showResult(auxButton, `ONCE_CLICK_${onDate}`, estilo[auxName]('click', () => { console.log('ONCE_FUNCTION:', onDate); })));
            } else if (auxName === 'un') {
              if (eventsFuncArray.length > 0) {
                eventsFuncArray.forEach((f) => { showResult(auxButton, 'UN', estilo[auxName]('click', f)); });
                eventsFuncArray.splice(0);
              } else {
                auxButton.className = 'warningButton';
                console.error('NO_ON_EVENTS_PRESENT_TO_CLEAR:', auxName);
              }
            } else if (auxName === 'unByKey') {
              if (eventsKeyArray.length > 0) {
                eventsKeyArray.forEach((k) => { showResult(auxButton, 'UNBYKEY', estilo[auxName]('click', k)); });
                eventsKeyArray.splice(0);
              } else {
                auxButton.className = 'warningButton';
                console.error('NO_ONCE_EVENTS_PRESENT_TO_CLEAR:', auxName);
              }
            } else if (auxName === 'unapplySoft') {
              showResult(auxButton, 'unapplySoft', estilo[auxName](undefined));
            } else if (auxName === 'updateInternal_') {
              if (estilo.layer_) {
                showResult(auxButton, 'updateInternal_', estilo[auxName](estilo.layer_));
              } else {
                auxButton.className = 'warningButton';
                console.error('NO_LAYER_PRESENT_FOR UPDATE:');
              }
            } else if (auxName === 'updateRange') {
              showResult(auxButton, 'updateRange', estilo[auxName](1, 3, new Generic({
                point: {
                  stroke: { color: '#5789aa' },
                  fill: { color: '#99ccff' },
                  radius: 20,
                },
              })));
            } else {
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

  window.listOfAllFunctions = listOfAllFunctions; // Para tener acceso a toda la lista de funciones.
  window.listOnlyShown = listOnlyShown; // Solo las funciones mostradas en las pruebas.
};

const refreshFuntions = () => {
  deleteChilds(setParam);
  deleteChilds(getWithParam);
  deleteChilds(noParam);
  deleteChilds(otherParam);
  addTestFunctions();
};

const styleTypeEvent = (evt) => {
  const idTarget = evt.target.id;
  if (idTarget) {
    styleType = idTarget;
    activateStyleTypeBtn(idTarget);
    refreshStyleOptions(idTarget);
    setStyle(idTarget);
    refreshFuntions();
    showTestSections();
  }
};
styleTypeDiv.addEventListener('click', (evt) => styleTypeEvent(evt));

//////////////////////////
// ERRORES develop y ol //
//////////////////////////

// "TypeError: layer is null" en "remove Composite.js:93" NO ES ERROR si no se ha dejado tiempo al layer a cargar antes de lanzar la función responsable.

/*
Coropletas y Categorico
  + set --> this.getImpl(...).updateFacadeOptions is not a function

Estilo Coropletas
  + setQuantification --> no funciona pasandole array de rangos, función que devuelve rangos ni con funciones de Quantification

Proporcional
  + set --> this.getImpl(...).updateFacadeOptions is not a function
  + update_ --> Cannot read properties of null (reading 'getStyle')
  + setAttributeName, setMaxRadius, setMinRadius, setProportionaFunction, apply, applyInternal, refresh  --> fallan por el error en el update
  + setStyle --> "TypeError: this.layer_ is null" en "update_ Proportional.js:226"

Mapa de calor
  + clone --> "Uncaught El nombre de atributo no puede ser nulo. Especifique cadena o función" en "_loop CP-004.js:649", ocurre porque el contructor del "/src/facade/js/style/Heatmap.js" espera que el parámetro de atributo sea string o función, pero en este caso es un objeto "(attribute && !(isString(attribute) || isFunction(attribute)))".
              Tras algunas pruebas se ha podido ver que aquí en la misma prueba se añade "numero" en el "PESO" del heatmap stile que se supone que es desde 0 a 1.
              Ya que el clonado es por parte de "style" posiblemente no haya forma desde ahí de solucionarlo, pero se podría en el heatmap constructor probar si es objeto y sacar de este el "attribute.weight" al "attribute".

Cluster
  + setRanges --> Cannot set properties of null (setting 'style')
  + set --> "TypeError: clusterSource.getSource is not a function" en "deactivateChangeEvent Cluster.js:617". No ocurre siempre, hay que probar cambiar a Composición y probar el set ahí.
  + updateRange --> "TypeError: this.layer_ is null" en "updateRange Cluster.js:195"

Linea de flujo
  + applyToFeature --> Cannot read properties of null (reading 'getOptions')
  + set --> Cannot read properties of null (reading 'getOptions') //El estilo no tiene opciones
  + set --> También hay error "TypeError: feature.getStyle() is null" en "applyToFeature Feature.js:47"

Composición
  + setRanges --> Error "TypeError: feature.getStyle() is null" en "applyToFeature Feature.js:47"
  + set --> "TypeError: clusterSource.getSource is not a function" en "deactivateChangeEvent Cluster.js:617". No ocurre siempre, hay que probar cambiar a Cluster y probar el set ahí.
  + updateRange --> "TypeError: this.layer_ is null" en "updateRange Cluster.js:195"
*/
