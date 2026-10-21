import VectorsManagement from 'facade/vectorsmanagement';

IDEE.language.setLang('es');

const map = IDEE.map({
  container: 'mapjs',
  center: [-458756.9690741142, 4682774.665868655],
  layers: ['OSM'],
  zoom: 6,
});

const ogc = new IDEE.layer.OGCAPIFeatures({
  url: 'https://api-features.idee.es/collections/',
  name: 'falls',
  legend: 'Capa OGCAPIFeatures',
});

map.addLayers([ogc]);

// probar funcionalidad de edición de features
const mp = new VectorsManagement({
  position: 'left',
  tooltip: 'Gestionar mis vectores',
  collapsed: false,
  // Herramientas
  selection: true,
  // addlayer: false,
  // creation: false,
  edition: true,
  // style: false,
  // analysis: false,
  // download: false,
  // snapping: false,
  // turf: false,
  help: true,
});

map.addPlugin(mp);

window.map = map;
