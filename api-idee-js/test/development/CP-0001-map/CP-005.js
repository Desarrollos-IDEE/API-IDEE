/* eslint-disable no-param-reassign,no-underscore-dangle,spaced-comment,max-len,no-proto,no-plusplus,no-console */
import { map as Mmap } from 'M/mapea';

// Habilitar para pruebas Layers
import KML from 'M/layer/KML'; // eslint-disable-line no-unused-vars
import WMS from 'M/layer/WMS'; // eslint-disable-line no-unused-vars
import WMTS from 'M/layer/WMTS'; // eslint-disable-line no-unused-vars
import GeoJSON from 'M/layer/GeoJSON';
import MBTiles from 'M/layer/MBTiles';
import MBTilesVector from 'M/layer/MBTilesVector';
import OGCAPIFeatures from 'M/layer/OGCAPIFeatures';
import XYZ from 'M/layer/XYZ';
import GeoTIFF from 'M/layer/GeoTIFF'; // eslint-disable-line no-unused-vars
import MapLibre from 'M/layer/MapLibre'; // eslint-disable-line no-unused-vars

// Para otras pruebas
import Polygon from 'M/style/Polygon';
import Feature from 'M/feature/Feature';
import Panel from 'M/ui/Panel';
import Popup from 'M/Popup';
import Label from '../../../src/facade/js/Label'; // eslint-disable-line no-unused-vars

const mapa = Mmap(
  {
    container: 'map',
    controls: ['scale'],
    // controls: ['attributions*<p>EJEMPLO_DE_TEXTO_ATTRIBUTIONS</p>'],
    // viewExtent: [-1781344.2275488114, 4283234.297146627, 566801.2813718033, 5456084.059154372],
    // minZoom: 4,
    // maxZoom: 5,
    // center:  [-143777, 4853122],
    // zoom: 7,
    //resolutions: [156543.03392804097,78271.51696402048,39135.75848201024,19567.87924100512,9783.93962050256,4891.96981025128,2445.98490512564,1222.99245256282,611.49622628141,305.748113140705,152.8740565703525,76.43702828517625,38.21851414258813,19.109257071294063,9.554628535647032,4.777314267823516,2.388657133911758,1.194328566955879,0.5971642834779395,0.29858214173896974,0.14929107086948487,0.07464553543474244,0.03732276771737122,0.01866138385868561,0.009330691929342804,0.004665345964671402,0.002332672982335701,0.0011663364911678506,0.0005831682455839253,0.00029158412279196264,0.00014579206139598132,0.00007289603069799066,0.00003644801534899533,0.000018224007674497665,0.000009112003837248832,0.000004556001918624416,0.000002278000959312208,0.000001139000479656104,5.69500239828052e-7,2.84750119914026e-7,1.42375059957013e-7,7.11875299785065e-8,3.559376498925325e-8],
    // label: 'Estoy aquí'
    // label: {panMapIfOutOfView: true, text:'Texto_de_Prueba_1', coord:[-143777, 4853122]},
    // label: {panMapIfOutOfView: true, text:'Texto_de_Prueba_3', coord:[1, 1]},
    // maxExtent: [-1781344.2275488114, 4283234.297146627, 566801.2813718033, 5456084.059154372]
    layers: ['OSM'],
    // bbox: [-160000, 4800000, -120000, 4860000],
    // projection: 'EPSG:4326*d',
    // kml: 'KML*Delegaciones IGN*https://www.ign.es/web/resources/delegaciones/delegacionesIGN.kml*true', // OK se ven los puntos de ejemplo este
    // wms: 'WMS*Unidad administrativa*http://www.ign.es/wms-inspire/unidades-administrativas?*AU.AdministrativeUnit*false*true*true*1.3.0*true*true*true', // OK se ve sin transparencia.
    // wmts: 'WMTS*http://wmts-mapa-lidar.idee.es/lidar*EL.GridCoverageDSM*GoogleMapsCompatible*Modelo Digital de Superficies LiDAR*true*image/png*true*true*true', // OK se ve mapa satélite LiDAR
    // layers: ['KML*Delegaciones IGN*https://www.ign.es/web/resources/delegaciones/delegacionesIGN.kml*true', 'WMTS*http://wmts-mapa-lidar.idee.es/lidar*EL.GridCoverageDSM*GoogleMapsCompatible*Modelo Digital de Superficies LiDAR*true*image/png*true*true*true'],
  },
  {
  // viewExtent: [-2658785.5918715713, 4280473.583969865, 2037505.425969658, 5474114.217671178],
  },
);

window.mapa = mapa;

// ? 02 y 20. Caso de uso: Pruebas de viewExtent
// console.log('viewExtent:', mapa.getMapImpl().getView().options_.extent);
// ? 02 y 20. Caso de uso: Pruebas de viewExtent

// ? 03 y 04. Caso de uso: Pruebas de minZoom y maxZoom
// console.log('Zoom:'+mapa.getZoom()+' MinZoom:'+mapa.getMinZoom()+' MaxZoom:'+mapa.getMaxZoom());
// ? 03 y 04. Caso de uso: Pruebas de minZoom y maxZoom

// ? 06. Caso de uso: Pruebas de center
// let auxCenter = mapa.getCenter();if (auxCenter) {console.log('Center: X='+auxCenter.x+' Y='+auxCenter.y);}
// ? 06. Caso de uso: Pruebas de center

// ? 11. Caso de uso: Pruebas de label
// window.testLabel1 = { text: 'Texto de prueba1', coord: [0, 0] };
// setTimeout(() => { mapa.addLabel(window.testLabel1); }, 5000);
// ? 11. Caso de uso: Pruebas de label

// ? 12. Caso de uso: Pruebas de maxExtent
// console.log('MaxExtent:'+mapa.getMaxExtent());
// ? 12. Caso de uso: Pruebas de maxExtent

// ? 15. Caso de uso: Pruebas de projection
// let auxProj = mapa.getProjection();console.log('Projection:'+auxProj.code+' Unit:'+auxProj.units+' Extent:'+auxProj.getExtent());
// ? 15. Caso de uso: Pruebas de projection

////////////////////////////////
//////PRUEBAS DE FUNCIONES//////
////////////////////////////////

// HTMLs de CP-005.html
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

// Botón para generar valores de de pruebas necesarias para algunas de estas funciones.
window.document.getElementsByClassName('generarDefaults')[0].addEventListener('click', () => {
  // For RemoveFeatures
  mapa.drawLayer_.addFeatures(new Feature('feature1', {
    type: 'Feature',
    properties: {},
    geometry: { type: 'Point', coordinates: [-598044, 5220448] },
  }));

  // For getGeoJSON and removeLayers
  mapa.addLayers(new GeoJSON({ name: 'Provincias', url: 'http://geostematicos-sigc.juntadeandalucia.es/geoserver/tematicos/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=tematicos:Provincias&maxFeatures=50&outputFormat=application/json', legend: 'TEST_LEGEND' }, { maxZoom: 10, style: new Polygon({ fill: { color: 'red' } }) }, { opacity: 0.5 }));

  // For evtSetAttributions_ y getAttributions
  const auxContAttr = mapa.getControls('attributions')[0];
  if (!auxContAttr) {
    mapa.addControls('attributions');
  }
});

// Ciertas variables necesarias para estas funciones.
const mbtile = new MBTiles({
  name: 'mbtilesLoadFunction',
  legend: 'Capa personalizada MBTiles',
  tileLoadFunction: (z, x, y) => {
    return new Promise((resolve) => {
      if (z > 4) {
        resolve('https://cdn-icons-png.flaticon.com/512/4616/4616040.png');
      } else {
        resolve('https://cdn.icon-icons.com/icons2/2444/PNG/512/location_map_pin_direction_icon_148665.png');
      }
    });
  },
});
const mbtileVector = new MBTilesVector({
  name: 'mbtilesvector',
  legend: 'Capa personalizada MBTilesVector',
  tileLoadFunction: (z, x, y) => {
    return new Promise((resolve) => {
      window.fetch(`https://ahocevar.com/geoserver/gwc/service/tms/1.0.0/ne:ne_10m_admin_0_countries@EPSG%3A900913@pbf/${z}/${x}/${y}.pbf`).then((response) => {
        resolve(response.arrayBuffer());
      });
    });
  },
});
const xyz = new XYZ({
  url: 'https://www.ign.es/web/catalogo-cartoteca/resources/webmaps/data/cresques/{z}/{x}/{y}.jpg',
  name: 'AtlasDeCresques',
  projection: 'EPSG:3857',
  visibility: true,
}, {
  crossOrigin: 'anonymous',
}); // CORS ERROR

// Guardar todos los __proto__ del Objeto "mapa", usando ... para traerse elementos de estos objetos a un objeto común con el que se trabajará
const mergeObjects = (first, second) => { return { ...first, ...Object.getOwnPropertyDescriptors(second) }; };
let objectWithAllFunctions = {};
for (let acumuladorObjetos = mapa; acumuladorObjetos.__proto__ !== null; acumuladorObjetos = acumuladorObjetos.__proto__) {
  objectWithAllFunctions = mergeObjects(objectWithAllFunctions, acumuladorObjetos);
}

// Creado Array para manejar más adelante el objectWithAllFunctions y ordenado de este sin funciones de "constructor" y "destroy"
const listAllFunctions = Object.keys(objectWithAllFunctions).sort();
listAllFunctions.remove('constructor'); listAllFunctions.remove('destroy');
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
        parameterTest = () => { // singeParameterTest
          showResult(auxButton, undefined, mapa[auxName]());
        };
        appendTo = noParam;
      } else if (auxName.startsWith('get')) {
        // ---------------------------------FUNCIONES GET---------------------------------
        parameterTest = () => { // getParameterTest
          if (auxName === 'getAttributions') {
            showResult(auxButton, 'GET_MAP_ATTRIBUTIONS', mapa[auxName]());
            if (mapa.getControls('attributions').length > 0) {
              showResult(auxButton, 'GET_CONTROL_ATTRIBUTIONS', mapa[auxName](true));
            } else {
              auxButton.className = 'warningButton';
              console.error('NO_CONTROL_PRESENT_FOR_SECOND_TEST');
            }
          } else if (auxName === 'getGeoTIFF') {
            showResult(auxButton, 'GET_GeoTIFF', mapa[auxName]());
            showResult(auxButton, 'GET_GeoTIFF_filter', mapa[auxName]({ name: 'Test_layers' }));
          } else if (auxName === 'getControls') {
            showResult(auxButton, 'GET_ALL_CONTROLS', mapa[auxName]());
            showResult(auxButton, 'GET_SCALELINE', mapa[auxName]('scaleline'));
          } else if (auxName === 'getGeoJSON') {
            showResult(auxButton, 'GET_GeoJSON_ALL', mapa[auxName]());
            showResult(auxButton, 'GET_GeoJSON_filter', mapa[auxName]({ name: 'Provincias' })); // {type:, url:, name:, legend:}
          } else if (auxName === 'getKML') {
            showResult(auxButton, 'GET_KML', mapa[auxName]());
            showResult(auxButton, 'GET_KML_LABEL', mapa[auxName]({ label: true })); // parameter.split(/\*/)[params.length - 2].trim() For LABEL
          } else if (auxName === 'getLayers') {
            showResult(auxButton, 'GET_Layers', mapa[auxName]());
            showResult(auxButton, 'GET_Layers_filter', mapa[auxName]({ name: 'Test_layers' }));
          } else if (auxName === 'getMBTiles') {
            showResult(auxButton, 'GET_MBTiles', mapa[auxName]());
            showResult(auxButton, 'GET_MBTiles_filter', mapa[auxName]({ name: 'Test_layers' }));
          } else if (auxName === 'getMBTilesVector') {
            showResult(auxButton, 'GET_MBTilesVector', mapa[auxName]());
            showResult(auxButton, 'GET_MBTilesVector_filter', mapa[auxName]({ name: 'Test_layers' }));
          } else if (auxName === 'getMVT') {
            showResult(auxButton, 'GET_MVT', mapa[auxName]());
            showResult(auxButton, 'GET_MVT_filter', mapa[auxName]({ name: 'Test_layers' }));
          } else if (auxName === 'getMapLibre') {
            showResult(auxButton, 'GET_MapLibre', mapa[auxName]());
            showResult(auxButton, 'GET_MapLibre_filter', mapa[auxName]({ name: 'Test_layers' }));
          } else if (auxName === 'getOGCAPIFeatures') {
            showResult(auxButton, 'GET_OGCAPIFeatures', mapa[auxName]());
            showResult(auxButton, 'GET_OGCAPIFeatures', mapa[auxName]({ name: 'airports' }));
          } else if (auxName === 'getPanels') {
            showResult(auxButton, 'GET_Panels', mapa[auxName]());
            showResult(auxButton, 'GET_Panels_FILTER', mapa[auxName]('toolsExtra'));
          } else if (auxName === 'getPlugins') {
            showResult(auxButton, 'GET_Plugins', mapa[auxName]());
            auxButton.className = 'warningButton';
            console.error('IMPOSIBLE_TO_DO_TEST_IN_DEVELOPMENT'); // POR PROBAR SIN TERMINAR LA PRUEBA, requiere "M." que esta en Pruebas de Producción
          } else if (auxName === 'getRootLayers') {
            showResult(auxButton, 'GET_RootLayers', mapa[auxName]());
            showResult(auxButton, 'GET_RootLayers_FILTER', mapa[auxName]({ name: 'IGNBaseTodo' }));
          } else if (auxName === 'getTMS') {
            showResult(auxButton, 'GET_TMS', mapa[auxName]());
            showResult(auxButton, 'GET_TMS_filter', mapa[auxName]({ name: 'Test_layers' }));
          } else if (auxName === 'getWFS') {
            showResult(auxButton, 'GET_WFS', mapa[auxName]());
            showResult(auxButton, 'GET_WFS_filter', mapa[auxName]({ name: 'Test_layers' }));
          } else if (auxName === 'getWMS') {
            showResult(auxButton, 'GET_WMS', mapa[auxName]());
            showResult(auxButton, 'GET_WMS_filter', mapa[auxName]({ name: 'Test_layers' }));
          } else if (auxName === 'getWMTS') {
            showResult(auxButton, 'GET_WMTS', mapa[auxName]());
            showResult(auxButton, 'GET_WMTS_filter', mapa[auxName]({ name: 'Test_layers' }));
          } else if (auxName === 'getXYZs') {
            showResult(auxButton, 'GET_XYZs', mapa[auxName]());
            showResult(auxButton, 'GET_XYZs_filter', mapa[auxName]({ name: 'Test_layers' }));
          } else if (auxName === 'getZoom') {
            showResult(auxButton, 'GET_ZOOM', mapa[auxName]());
            showResult(auxButton, 'GET_ZOOM_NO_CONSTRAINS', mapa[auxName](true));
          } else {
            auxButton.className = 'errorButton';
            console.error('NOT_PREPARED_FUNCTION_TEST_FOR_GET:', auxName);
          }
        };
        appendTo = getWithParam;
      } else if (auxName.startsWith('add')) {
        // ---------------------------------FUNCIONES ADD---------------------------------
        parameterTest = () => { // addParameterTest
          if (auxName === 'addAttribution') {
            if (mapa.getControls().some(({ name }) => name === 'attributions')) {
              showResult(auxButton, 'ADD_ATTRIBUTION_FALSE', mapa[auxName]({ attribuccion: '<p>EJEMPLO1</p>' }, false));
              showResult(auxButton, 'ADD_ATTRIBUTION_TRUE', mapa[auxName]({ attribuccion: '<p>EJEMPLO2</p>' }, true));
            } else {
              auxButton.className = 'warningButton';
              console.warn('Control Attributions no añadido previamente');
            }
          } else if (auxName === 'addGeoTIFF') {
            showResult(auxButton, 'ADD_GeoTIFF', mapa[auxName](new GeoTIFF({
              url: 'https://sentinel-cogs.s3.us-west-2.amazonaws.com/sentinel-s2-l2a-cogs/36/Q/WD/2020/7/S2A_36QWD_20200701_0_L2A/TCI.tif', // REQUEST FAILED IN 'http://ftpcdd.cnig.es/Vuelos_2022/Vuelos_2022/murcia_2022/01.VF/01.08_PNOA_2022_MUR_35cm_VF_img8c_rgb_hu30/h50_0932_fot_011-0034_cog.tif'
              name: 'Nombre GeoTIFF',
              legend: 'Leyenda GeoTIFF',
              transparent: true,
            }, {
              minZoom: 5, maxZoom: 15, convertToRGB: 'auto', nodata: 1000,
            }))); // window.mapa.setCenter({ x: 554880, y: 1845120});window.mapa.setZoom(13);
          } else if (auxName === 'addControls') {
            showResult(auxButton, 'ADD_SCALELINE', mapa[auxName]('scaleline'));
          } else if (auxName === 'addKML') {
            showResult(auxButton, 'ADD_KML', mapa[auxName]('KML*Delegaciones IGN*https://www.ign.es/web/resources/delegaciones/delegacionesIGN.kml*true')); // new KML()
          } else if (auxName === 'addLabel') {
            showResult(auxButton, 'ADD_label_OBJECT', mapa[auxName]({ panMapIfOutOfView: true, text: 'Texto_de_Prueba_1', coord: [0, 0] })); // OK, only one at a time
            // showResult(auxButton, 'ADD_label_STRING', mapa[auxName]('Texto_de_Prueba_2', [-143777, 4853122])); // OK, only one at a time
          } else if (auxName === 'addLayers') {
            showResult(auxButton, 'ADD_Layers', mapa[auxName](['WMS*Unidad administrativa*http://www.ign.es/wms-inspire/unidades-administrativas?*AU.AdministrativeUnit*true*true*true*1.3.0*true*true*true', 'MVT*https://ahocevar.com/geoserver/gwc/service/tms/1.0.0/ne:ne_10m_admin_0_countries@EPSG%3A900913@pbf/{z}/{x}/{-y}.pbf*vectortile']));
          } else if (auxName === 'addMBTiles') {
            showResult(auxButton, 'ADD_MBTiles', mapa[auxName](mbtile));
          } else if (auxName === 'addMBTilesVector') {
            showResult(auxButton, 'ADD_MBTilesVector', mapa[auxName](mbtileVector));
          } else if (auxName === 'addMVT') {
            showResult(auxButton, 'ADD_MVT', mapa[auxName]('MVT*https://ahocevar.com/geoserver/gwc/service/tms/1.0.0/ne:ne_10m_admin_0_countries@EPSG%3A900913@pbf/{z}/{x}/{-y}.pbf*vectortile'));
          } else if (auxName === 'addMapLibre') {
            showResult(auxButton, 'ADD_MapLibre', mapa[auxName](new MapLibre({
              type: 'MapLibre', name: 'Mapa Libre Name', legend: 'Mapa Libre Legend', url: 'https://vt-mapabase.idee.es/files/styles/mapaBase_scn_color1_CNIG.json', extract: true, disableBackgroundColor: false, visibility: true, transparent: false, displayInLayerSwitcher: false,
            })));
          } else if (auxName === 'addOGCAPIFeatures') {
            showResult(auxButton, 'ADD_OGCAPIFeatures', mapa[auxName](new OGCAPIFeatures({
              url: 'https://api-features.idee.es/collections/', name: 'falls', legend: 'Capa OGCAPIFeatures', limit: 20,
            })));
          } else if (auxName === 'addPanels') {
            showResult(auxButton, 'ADD_panels', mapa[auxName](new Panel('toolsExtra', {
              collapsible: true, className: 'm-tools', collapsedButtonClass: 'g-cartografia-herramienta', position: '.m-top.m-left',
            }))); // M.ui.position.TL
          } else if (auxName === 'addPlugin') {
            // POR PROBAR Hay que hacer la prueba de Plugin en api-idee-js/test/production
            // import GeometryDraw from 'M/plugin/GeometryDraw'; // Hay que crear el test de plugin en Poduction, ya que solo se tiene acceso a este desde ahí.
            // showResult(auxButton, 'ADD_PLUGIN_DRAW', mapa[auxName](new M.plugin.GeometryDraw()));
            // showResult(auxButton, 'ADD_PLUGIN_DRAW', mapa[auxName](new GeometryDraw()));
            auxButton.className = 'warningButton';
            console.error('IMPOSIBLE_TO_DO_TEST_IN_DEVELOPMENT');
          } else if (auxName === 'addPopup') {
            const popup = new Popup();
            popup.addTab({ 'icon': 'g-cartografia-pin', 'title': 'Título', 'content': 'Información' });
            showResult(auxButton, 'ADD_POPUP', mapa[auxName](popup, [240829, 4143088]));// popup.on(M.evt.DESTROY, () => {M.dialog.info('Popup eliminado');  });popup.destroy();
          } else if (auxName === 'addQuickLayers') {
            showResult(auxButton, 'ADD_QuickLayers', mapa[auxName]('QUICK*BASE_PNOA_MA_TMS')); // 403 'QUICK*BASE_IGNBaseOrto_TMS'
          } else if (auxName === 'addTMS') {
            showResult(auxButton, 'ADD_TMS', mapa[auxName]('TMS*TMSBaseIGN*https://tms-ign-base.ign.es/1.0.0/IGNBaseTodo/{z}/{x}/{-y}.jpeg*true*false'));
          } else if (auxName === 'addUnknowLayers_') {
            showResult(auxButton, 'ADD_UnknowLayers_GeoJson', mapa[auxName](new GeoJSON({ name: 'Provincias', url: 'http://geostematicos-sigc.juntadeandalucia.es/geoserver/tematicos/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=tematicos:Provincias&maxFeatures=50&outputFormat=application/json', legend: 'TEST_LEGEND' }, { maxZoom: 10, style: new Polygon({ fill: { color: 'red' } }) }, { opacity: 0.5 })));
          } else if (auxName === 'addWFS') {
            showResult(auxButton, 'ADD_WFS', mapa[auxName]('WFST*Campamentos*http://geostematicos-sigc.juntadeandalucia.es/geoserver/sepim/ows?*sepim:campamentos*MPOINT'));
          } else if (auxName === 'addWMS') {
            showResult(auxButton, 'ADD_WMS', mapa[auxName]('WMS*Unidad administrativa*http://www.ign.es/wms-inspire/unidades-administrativas?*AU.AdministrativeUnit*true*true*true*1.3.0*true*true*true'));
          } else if (auxName === 'addWMTS') {
            showResult(auxButton, 'ADD_WMTS', mapa[auxName]('WMTS*http://wmts-mapa-lidar.idee.es/lidar*EL.GridCoverageDSM*GoogleMapsCompatible*Modelo Digital de Superficies LiDAR*true*image/png*true*true*true'));
          } else if (auxName === 'addXYZ') {
            showResult(auxButton, 'ADD_XYZ', mapa[auxName](xyz)); // CORS ERROR WITH 'XYZ*AtlasDeCresques*https://www.ign.es/web/catalogo-cartoteca/resources/webmaps/data/cresques/{z}/{x}/{y}.jpg*true*true'
          } else {
            auxButton.className = 'errorButton';
            console.error('NOT_PREPARED_FUNCTION_TEST_FOR_ADD:', auxName);
          }
        };
        appendTo = addParam;
      } else if (auxName.startsWith('remove')) {
        // ---------------------------------FUNCIONES REMOVE---------------------------------
        parameterTest = () => { // removeParameterTest
          if (auxName === 'removeAttribution') {
            if (mapa.getControls('attributions').length > 0) {
              const auxAttr = mapa.getAttributions(true)[0] || mapa.getAttributions()[0];
              if (auxAttr) {
                showResult(auxButton, 'REMOVE_ATTRIBUTION', mapa[auxName](auxAttr.id)); // Ejemplo remove con ID "bff4a6ba-e8c6-4741-94b3-04eb543aed75"
              } else {
                auxButton.className = 'warningButton';
                console.error('NO_ATRIBUTIONS_ADDED_TO_SAID_CONTROL');
              }
            } else {
              auxButton.className = 'warningButton';
              console.error('NO_ATRIBUTIONS_PRESENT');
            }
          } else if (auxName === 'removeGeoTIFF') {
            showResult(auxButton, 'REMOVE_GeoTIFF', mapa[auxName](mapa.getGeoTIFF()));
          } else if (auxName === 'removeControls') {
            showResult(auxButton, 'REMOVE_SCALELINE', mapa[auxName]('scaleline'));
          } else if (auxName === 'removeFeatures') { // Removes from DrawLayer of Map
            showResult(auxButton, 'REMOVE_Features', mapa[auxName](mapa.drawLayer_.getFeatures()));
          } else if (auxName === 'removeKML') {
            showResult(auxButton, 'REMOVE_KML', mapa[auxName](mapa.getKML()));
          } else if (auxName === 'removeLayers') {
            if (mapa.getGeoJSON().length > 0) {
              showResult(auxButton, 'REMOVE_Layers_GeoJSON', mapa[auxName](mapa.getGeoJSON()));
            } else {
              showResult(auxButton, 'REMOVE_Layers', mapa[auxName](mapa.getLayers()));
            }
          } else if (auxName === 'removeMBTiles') {
            showResult(auxButton, 'REMOVE_MBTiles', mapa[auxName](mapa.getMBTiles()));
          } else if (auxName === 'removeMBTilesVector') {
            showResult(auxButton, 'REMOVE_MBTilesVector', mapa[auxName](mapa.getMBTilesVector()));
          } else if (auxName === 'removeMVT') {
            showResult(auxButton, 'REMOVE_MVT', mapa[auxName](mapa.getMVT()));
          } else if (auxName === 'removeMapLibre') {
            showResult(auxButton, 'REMOVE_MapLibre', mapa[auxName](mapa.getMapLibre()));
          } else if (auxName === 'removeOGCAPIFeatures') {
            showResult(auxButton, 'REMOVE_OGCAPIFeatures', mapa[auxName](mapa.getOGCAPIFeatures()));
          } else if (auxName === 'removePanel') {
            if (mapa.getPanels()[0]) {
              showResult(auxButton, 'REMOVE_PANELS', mapa[auxName](mapa.getPanels()[0]));
            } else {
              auxButton.className = 'warningButton';
              console.error('NO_PANELS_PRESENT_TO_REMOVE');
            }
          } else if (auxName === 'removePlugins') {
            if (mapa.getPlugins()[0]) {
              showResult(auxButton, 'REMOVE_PLUGINS', mapa[auxName](mapa.getPlugins()));
              auxButton.className = 'warningButton';
              console.error('IMPOSIBLE_TO_DO_TEST_IN_DEVELOPMENT');
            } else {
              auxButton.className = 'warningButton';
              console.error('NO_PLUGINS_PRESENT_TO_REMOVE');
            }
          } else if (auxName === 'removeTMS') {
            showResult(auxButton, 'REMOVE_TMS', mapa[auxName](mapa.getTMS()));
          } else if (auxName === 'removeWFS') {
            showResult(auxButton, 'REMOVE_WFS', mapa[auxName](mapa.getWFS()));
          } else if (auxName === 'removeWMS') {
            showResult(auxButton, 'REMOVE_WMS', mapa[auxName](mapa.getWMS()));
          } else if (auxName === 'removeWMTS') {
            showResult(auxButton, 'REMOVE_WMTS', mapa[auxName](mapa.getWMTS()));
          } else if (auxName === 'removeXYZ') {
            showResult(auxButton, 'REMOVE_XYZ', mapa[auxName](mapa.getXYZs()));
          } else {
            auxButton.className = 'errorButton';
            console.error('NOT_PREPARED_FUNCTION_TEST_FOR_REMOVE:', auxName);
          }
        };
        appendTo = removeParam;
      } else if (auxName.startsWith('set')) {
        // ---------------------------------FUNCIONES SET---------------------------------
        parameterTest = () => { // setParameterTest
          if (auxName === 'setBbox') {
            showResult(auxButton, 'SET_BBOX', mapa[auxName]({ x: { min: -1054179, max: 1191234 }, y: { min: 4246770, max: 6514198 } }));
          } else if (auxName === 'setCenter') {
            showResult(auxButton, 'SET_CENTER', mapa[auxName]({ x: -690278.9143510933, y: 4477348.883930369 }));
          } else if (auxName === 'setImpl') {
            showResult(auxButton, 'SET_IMPL', mapa[auxName](mapa.getImpl()));
          } else if (auxName === 'setMaxExtent') {
            showResult(auxButton, 'SET_MAX_EXTENT', mapa[auxName]([-160000, 4800000, -120000, 4860000])); // Requiere layers: ['OSM'], mínimo para pruebas de "maxExtent"
          } else if (auxName === 'setMaxZoom') {
            showResult(auxButton, 'SET_MAX_ZOOM', mapa[auxName]((Math.round(Math.random() * 10) % 3) + 7));
          } else if (auxName === 'setMinZoom') {
            showResult(auxButton, 'SET_MIN_ZOOM', mapa[auxName]((Math.round(Math.random() * 10) % 3) + 3));
          } else if (auxName === 'setProjection') {
            showResult(auxButton, 'SET_PROJECTION', mapa[auxName]('EPSG:4258*d'));
          } else if (auxName === 'setResolutions') {
            showResult(auxButton, 'SET_RESOLUTIONS', mapa[auxName]('40000,20000,10000,5000,2500,1250,625,312.5,156.25,78.125,39.0625,19.53125,9.765625,4.8828125,2.44140625'));
          } else if (auxName === 'setTicket') {
            // showResult(auxButton, 'SET_Ticket', mapa[auxName](...)); // POR PROBAR KEY necesario para prueba
            auxButton.className = 'warningButton';
            console.error('Prueba no diseñada para esta función');
          } else if (auxName === 'setZoom') {
            showResult(auxButton, 'SET_ZOOM', mapa[auxName](Math.round(Math.random() * 10)));
          } else if (auxName === 'setZoomConstrains') {
            showResult(auxButton, 'SET_ZOOM_CONSTRAINS', mapa[auxName](!mapa.getZoomConstrains()));
          } else {
            auxButton.className = 'errorButton';
            console.error('NOT_PREPARED_FUNCTION_TEST_FOR_SET:', auxName);
          }
        };
        appendTo = setParam;
      } else {
        // ---------------------------------OTRAS FUNCIONES---------------------------------
        parameterTest = () => { // otherParameterTest
          if (auxName === 'collectorCapabilities_') {
            // showResult(auxButton, 'collectorCapabilities_DOES_NOTHING', mapa[auxName](mapa.drawLayer_)); // Se para a medias al ser "__draw__"
            const auxTestWMS = mapa.getLayers().find((l) => l._type === 'WMS');
            if (auxTestWMS) {
              // mapa.collectionCapabilities = []; // Limpiar para ver que lo vuelva a añadir de vuelta.
              showResult(auxButton, 'collectorCapabilities_TESTED_WITH_WMS', mapa[auxName](auxTestWMS));
            } else {
              auxButton.className = 'warningButton';
              console.error('NO_WMS_PREPARED_TO_TEST_THIS_FUCNTION:', auxName);
            }
          } else if (auxName === 'createAttribution') {
            showResult(auxButton, 'createAttribution_NULL', mapa[auxName]());
            // showResult(auxButton, 'createAttribution_EXAMPLE', mapa[auxName]('EJEMPLO'));
          } else if (auxName === 'drawFeatures') {
            showResult(auxButton, 'drawFeatures', mapa[auxName](new Feature('feature1', { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [-500000, 5220000] } })));
          } else if (auxName === 'drawPoints') {
            showResult(auxButton, 'drawPoints', mapa[auxName]({ x: -310000, y: 3940000, click: () => { console.log('CLICK_drawPoints_EVENT'); } }));
          } else if (auxName === 'fire') {
            showResult(auxButton, 'FIRE_CLICK_EVENT', mapa[auxName]('click', { pixel: [0, 0] }));
          } else if (auxName === 'on') {
            const onDate = new Date().getTime();
            const funcEvent = () => { console.log('ON_FUNCTION:', onDate); };
            eventsFuncArray.push(funcEvent);
            showResult(auxButton, `ON_CLICK_${onDate}`, mapa[auxName]('click', funcEvent));
          } else if (auxName === 'once') {
            const onDate = new Date().getTime();
            eventsKeyArray.push(showResult(auxButton, `ONCE_CLICK_${onDate}`, mapa[auxName]('click', () => { console.log('ONCE_FUNCTION:', onDate); })));
          } else if (auxName === 'un') {
            if (eventsFuncArray.length > 0) {
              eventsFuncArray.forEach((f) => { showResult(auxButton, 'UN', mapa[auxName]('click', f)); });
              eventsFuncArray.splice(0);
            } else {
              auxButton.className = 'warningButton';
              console.error('NO_ON_EVENTS_PRESENT_TO_CLEAR:', auxName);
            }
          } else if (auxName === 'unByKey') {
            if (eventsKeyArray.length > 0) {
              eventsKeyArray.forEach((k) => { showResult(auxButton, 'UNBYKEY', mapa[auxName]('click', k)); });
              eventsKeyArray.splice(0);
            } else {
              auxButton.className = 'warningButton';
              console.error('NO_ONCE_EVENTS_PRESENT_TO_CLEAR:', auxName);
            }
          } else if (auxName === 'zoomToMaxExtent') {
            showResult(auxButton, 'ZOOM_TO_MAX_EXTENT_NOT_KEEP_USER_ZOOM', mapa[auxName](false));
            // showResult(auxButton, 'ZOOM_TO_MAX_EXTENT_KEEP_USER_ZOOM', mapa[auxName](true));
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
