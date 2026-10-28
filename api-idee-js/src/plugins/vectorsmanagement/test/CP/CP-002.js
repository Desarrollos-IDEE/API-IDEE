import VectorsManagement from 'facade/vectorsmanagement';

IDEE.language.setLang('es');

const map = IDEE.map({
  container: 'mapjs',
  center: [-458756.9690741142, 4682774.665868655],
  layers: ['OSM'],
  zoom: 6,
});

const lAguasSupRediam = new IDEE.layer.WFS({
  url: 'http://geostematicos-sigc.juntadeandalucia.es/geoserver/tematicos/ows?',
  namespace: 'tematicos',
  name: 'provincias_pob',
  legend: 'Provincias',
  geometry: 'MPOLYGON',
});

map.addLayers([lAguasSupRediam]);

// probar funcionalidad de creación de capas vectoriales
const mp = new VectorsManagement({
  position: 'left',
  tooltip: 'Gestionar mis vectores',
  collapsed: false,
  // Herramientas
  addlayer: true,
  // creation: false,
  // edition: false,
  // style: false,
  // analysis: false,
  // download: false,
  // snapping: false,
  // turf: false,
  help: true,
});

map.addPlugin(mp);

const mp1 = new IDEE.plugin.StyleManager({
  collapsed: true,
  collapsible: true,
  position: 'left',
});
map.addPlugin(mp1);

const mp2 = new IDEE.plugin.PrintViewManagement({});

map.addPlugin(mp2);

window.map = map;
