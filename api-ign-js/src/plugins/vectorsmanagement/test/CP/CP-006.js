import VectorsManagement from 'facade/vectorsmanagement';

M.language.setLang('es');

const map = M.map({
  container: 'mapjs',
  center: [-458756.9690741142, 4682774.665868655],
  layers: ['OSM'],
  zoom: 6,
});

const ogc = new M.layer.OGCAPIFeatures({
  url: 'https://api-features.idee.es/collections/',
  name: 'falls',
  legend: 'Capa OGCAPIFeatures',
});

map.addLayers([ogc]);

const mp = new VectorsManagement({
  position: 'TL',
  tooltip: 'Gestionar mis vectores',
  // isDraggable => falta implementar
  // useProxy => falta implementar
  collapsed: false,
  collapsible: false,
  // Herramientas
  // selection: false,
  // addlayer: false,
  // creation: false,
  // edition: false,
  // style: false,
  // analysis: false,
  // download: false,
  // help: false,
  isDraggable: true,
});

map.addPlugin(mp);

window.map = map;
