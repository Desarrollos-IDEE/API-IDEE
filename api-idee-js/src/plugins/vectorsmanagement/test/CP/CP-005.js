import VectorsManagement from 'facade/vectorsmanagement';

IDEE.language.setLang('es');

const map = IDEE.map({
  container: 'mapjs',
  center: [-458756.9690741142, 4682774.665868655],
  layers: ['OSM'],
  zoom: 6,
});

const mvt = new IDEE.layer.MVT({
  url: 'https://vt-fedme.idee.es/vt.senderogr/{z}/{x}/{y}.pbf',
  name: 'sendero_gr',
  mode: 'feature',
});

map.addLayers([mvt]);

// probar funcionalidad de descarga
const mp = new VectorsManagement({
  position: 'left',
  tooltip: 'Gestionar mis vectores',
  collapsed: false,
  // Herramientas
  selection: true,
  // addlayer: false,
  // creation: false,
  // edition: false,
  // style: false,
  // analysis: false,
  // snapping: false,
  // turf: false,
  download: true,
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
