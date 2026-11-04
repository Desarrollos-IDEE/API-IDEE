import Incicarto from 'facade/incicarto';

window.Incicarto = Incicarto;

IDEE.language.setLang('en');
// IDEE.language.setLang('en');
// https://componentes-beta.idee.es

const map = IDEE.map({
  container: 'mapjs',
  center: {
    x: -667143,
    y: 4493011,
    draw: false,
  },
  controls: ['rotate'],
  projection: 'EPSG:3857',
  zoom: 6,
  /* / Capas precargadas
  layers: [
    'WMTS*http://www.ideandalucia.es/geowebcache/service/wmts?*toporaster*SIG-C:25830*WMTS*false',
    'WFS*CampamentosCampamentosCampamentosCampamentos*http://geostematicos-sigc.juntadeandalucia.es/geoserver/sepim/ows*sepim:campamentos*POINT***eyJwYXJhbWV0ZXJzIjpbeyJpY29uIjp7ImZvcm0iOiJDSVJDTEUiLCJjbGFzcyI6ImctY2FydG9ncmFmaWEtYmFuZGVyYSIsImZvbnRzaXplIjowLjUsInJhZGl1cyI6MTUsImZpbGwiOiJ3aGl0ZSJ9LCJyYWRpdXMiOjV9XSwiZGVzZXJpYWxpemVkTWV0aG9kIjoiKChzZXJpYWxpemVkUGFyYW1ldGVycykgPT4gTS5zdHlsZS5TaW1wbGUuZGVzZXJpYWxpemUoc2VyaWFsaXplZFBhcmFtZXRlcnMsICdNLnN0eWxlLlBvaW50JykpIn0',
  ], // */
});
window.map = map;

/* / Añadimos el BackImgLayer
const mpBIL = new IDEE.plugin.BackImgLayer({
  position: 'TR',
  collapsible: true,
  collapsed: true,
  layerId: 0,
  layerVisibility: true,
  columnsNumber: 3,
  layerOpts: [
    { // LiDAR Híbrido
      id: 'pnoa-hibido',
      title: 'PNOA Híbrido',
      preview: 'https://componentes.idee.es/api-idee/plugins/backimglayer/images/svqhibrid.png',
      layers: [new IDEE.layer.WMTS({
        url: 'https://www.ign.es/wmts/pnoa-ma?',
        name: 'OI.OrthoimageCoverage',
        legend: 'Imagen (PNOA)',
        isBase: false,
        matrixSet: 'EPSG:4326', displayInLayerSwitcher: false, queryable: false, visible: true,
        format: 'image/jpeg',
      }),
      new IDEE.layer.WMTS({
        url: 'https://www.ign.es/wmts/ign-base?',
        name: 'IGNBaseOrto',
        legend: 'Mapa IGN',
        isBase: true,
        matrixSet: 'EPSG:4326', displayInLayerSwitcher: false, queryable: false, visible: true,
        format: 'image/png',
      })],
    },
    { // PNOA Híbrido
      id: 'lidar-hibrido',
      title: 'LiDAR Híbrido',
      preview: 'https://componentes.idee.es/api-idee/plugins/backimglayer/images/svqlidar.png',
      layers: [new IDEE.layer.WMTS({
        url: 'https://wmts-mapa-lidar.idee.es/lidar?',
        name: 'EL.GridCoverageDSM',
        legend: 'Modelo Digital de Superficies LiDAR',
        isBase: false,
        matrixSet: 'EPSG:4326', displayInLayerSwitcher: false, queryable: false, visible: true,
        format: 'image/png',
      }),
      new IDEE.layer.WMTS({
        url: 'https://www.ign.es/wmts/ign-base?',
        name: 'IGNBaseOrto',
        legend: 'Mapa IGN',
        isBase: false,
        matrixSet: 'EPSG:4326', displayInLayerSwitcher: false, queryable: false, visible: true,
        format: 'image/png',
      })],
    },
    { // Mapa base
      id: 'mapa',
      preview: 'https://componentes.idee.es/api-idee/plugins/backimglayer/images/svqmapa.png',
      title: 'Mapa',
      layers: [new IDEE.layer.WMTS({
        url: 'https://www.ign.es/wmts/ign-base?',
        name: 'IGNBaseTodo',
        legend: 'Mapa IGN',
        isBase: true,
        matrixSet: 'EPSG:4326', displayInLayerSwitcher: false, queryable: false, visible: true,
        format: 'image/jpeg',
      })],
    },
    { //PNOA sin textos
      id: 'imagen',
      title: 'Imagen',
      preview: 'https://componentes.idee.es/api-idee/plugins/backimglayer/images/svqimagen.png',
      layers: [new IDEE.layer.WMTS({
        url: 'https://www.ign.es/wmts/pnoa-ma?',
        name: 'OI.OrthoimageCoverage',
        legend: 'Imagen (PNOA)',
        isBase: true,
        matrixSet: 'EPSG:4326', displayInLayerSwitcher: false, queryable: false, visible: true,
        format: 'image/jpeg',
      })],
    },
    { // LiDAR sin textos
      id: 'lidar',
      preview: 'https://componentes.idee.es/api-idee/plugins/backimglayer/images/svqlidar.png',
      title: 'LIDAR',
      layers: [new IDEE.layer.WMTS({
        url: 'https://wmts-mapa-lidar.idee.es/lidar?',
        name: 'EL.GridCoverageDSM',
        legend: 'Modelo Digital de Superficies LiDAR',
        isBase: true,
        matrixSet: 'EPSG:4326', displayInLayerSwitcher: false, queryable: false, visible: true,
        format: 'image/png',
      })],
    },
    { // SIOSE
      id: 'MAPAMTN',
      preview: 'https://componentes.idee.es/api-idee/plugins/backimglayer/images/svqmapa.png', // 'img/mtnactual.jpg' No esta esta imagen para probar
      title: 'Mapa MTN',
      layers: [new IDEE.layer.WMTS({
        url: 'https://www.ign.es/wmts/mapa-raster',
        name: 'MTN',
        legend: 'Mapa MTN',
        matrixSet: 'GoogleMapsCompatible',
        format: 'image/jpeg'
      })],
    },
  ],
}
);
map.addPlugin(mpBIL); // */

// addWMSLayer('AU.AdministrativeUnit', 'Líneas límite', 'https://www.ign.es/wms-inspire/unidades-administrativas?', '1.3.0', true, { visibility: false, displayInLayerSwitcher: true, queryable: false, zIndex: 501 });
// addWMSLayer('Catastro', 'Catastro', 'https://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx?', '1.1.1', false, { visibility: false, displayInLayerSwitcher: true, queryable: false, zIndex: 502 });
// addWMSLayer('Grid-ETRS89-lonlat-50k', 'Distribuidor MTN50', 'https://www.ign.es/wms-inspire/cuadriculas?', '1.3.0', false, { visibility: false, displayInLayerSwitcher: true, queryable: false, zIndex: 503 });
// addWMSLayer('Grid-ETRS89-lonlat-25k', 'Distribuidor MTN25', 'https://www.ign.es/wms-inspire/cuadriculas?', '1.3.0', false, { visibility: false, displayInLayerSwitcher: true, queryable: false, zIndex: 504 });
// addWMSLayer('GN.GeographicalNames', 'Topónimos', 'https://www.ign.es/wms-inspire/ign-base?', '1.3.0', true, { visibility: false, displayInLayerSwitcher: true, queryable: false, zIndex: 505 });
// addWMSLayer('TN.RoadTransportNetwork.RoadLink', 'Vías de comunicación por carretera', 'https://www.ign.es/wms-inspire/ign-base?', '1.3.0', true, { visibility: false, displayInLayerSwitcher: true, queryable: false, zIndex: 506 });
// addWMSLayer('TN.RailTransportNetwork.RailwayLink', 'Vías de comunicación ferroviarias', 'https://www.ign.es/wms-inspire/ign-base?', '1.3.0', true, { visibility: false, displayInLayerSwitcher: true, queryable: fals

/* / PRUEBA con capas WMS
const objLyrREDNAP = new IDEE.layer.WMS({ url: 'https://www.ign.es/wms-inspire/redes-geodesicas?',
  name: 'RED_NAP', legend: 'Red de Nivelación de Alta Precisión',
  tiled: false, visibility: false,
}, {});

const objLyrBDLJE = new IDEE.layer.WMS({ url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
  name: 'AU.AdministrativeBoundary', legend: 'Líneas Límite',
  tiled: false, visibility: false,
}, {});

const objLyrRTRoads = new IDEE.layer.WMS({ url: 'https://servicios.idee.es/wms-inspire/transportes?',
  name: 'TN.RoadTransportNetwork.RoadLink', legend: 'Vías de comunicación por carretera',
  tiled: false, visibility: false,
}, {});

const objLyrRTRailways = new IDEE.layer.WMS({ url: 'https://servicios.idee.es/wms-inspire/transportes?',
  name: 'TN.RailTransportNetwork.RailwayLink', legend: 'Vías de comunicación por ferrocarril',
  tiled: false, visibility: false,
}, {});

const objLyrNGBE = new IDEE.layer.WMS({ url: 'https://www.ign.es/wms-inspire/ngbe?',
  name: 'GN.GeographicalNames', legend: 'Nombres geográficos - NGBE',
  tiled: false, visibility: false,
}, {});
map.addLayers([objLyrREDNAP, objLyrBDLJE, objLyrRTRoads, objLyrRTRailways, objLyrNGBE]); // */

// const nameTest = 'alvaro';
// const emailTest = 'alvaroramirez@guadaltel.com';
// const mp = new Incicarto({
//   collapsed: false,
//   collapsible: true,
//   position: 'right',
//   interfazmode: 'simple', // simple, advance, both
//   buzones: [
//     {
//       name: nameTest,
//       email: emailTest,
//     },
//   ],
//   controllist: [
//     {
//       id: 'themeList',
//       name: 'Temas de errores',
//       mandatory: true,
//     },
//     {
//       id: 'errorList',
//       name: 'Tipos de errores',
//       mandatory: true,
//     },
//     {
//       id: 'productList',
//       name: 'Lista de productos',
//       mandatory: true,
//     },
//   ],
//   themeList: [
//     {
//       idTheme: 1,
//       nameTheme: `${nameTest}1`,
//       emailTheme: emailTest,
//     },
//     {
//       idTheme: 2,
//       nameTheme: `${nameTest}2`,
//       emailTheme: emailTest,
//     },
//   ],
//   errorList: [
//     'No especificado',
//     'Omisión',
//     'Comisión',
//     '...',
//   ],
//   productList: [
//     'No especificado',
//     'Serie MTN25',
//     'Serie MTN50',
//     '...',
//   ],
// });
// window.mp = mp;

/* / PRUEBA con múltiples plugins
const mp2 = new IDEE.plugin.Infocoordinates({
  position: 'TR',
  decimalGEOcoord: 4,
  decimalUTMcoord: 4
});
const mp3 = new IDEE.plugin.Information({ position: 'TR', buffer: 100 });
const mp4 = new IDEE.plugin.MeasureBar({ position: 'TR' });

const provincias = new IDEE.layer.WFS({ url: "http://geostematicos-sigc.juntadeandalucia.es/geoserver/tematicos/ows?",
  name: "Provincias", legend: "Provincias",
  namespace: "tematicos", geometry: 'MPOLYGON',
});
//map.addWFS(provincias);

const viales = new IDEE.layer.WFS({ url: "http://g-gis-online-lab.desarrollo.guadaltel.es/geoserver/ggiscloud_root/wms?",
  name: "a1585302352391_viales_almeria", legend: "Viales",
  namespace: "ggiscloud_root", geometry: 'LINE',
});
//map.addWFS(viales);

map.addPlugin(mp2); window.mp2 = mp2;
map.addPlugin(mp3); window.mp3 = mp3;
map.addPlugin(mp4); window.mp4 = mp4; // */

// map.addPlugin(mp);
// map.addPlugin(new IDEE.plugin.MeasureBar({ position: 'TR' }));
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
  inputOrder,
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
