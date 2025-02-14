import VectorsManagement from 'facade/vectorsmanagement';

M.language.setLang('es');

const map = M.map({
  container: 'mapjs',
  center: [-458756.9690741142, 4682774.665868655],
  layers: ['OSM'],
  zoom: 6,
});

const mvt = new M.layer.MVT({
  url: 'https://vt-fedme.idee.es/vt.senderogr/{z}/{x}/{y}.pbf',
  name: 'sendero_gr',
  mode: 'feature',
});

map.addLayers([mvt]);

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

const mp1 = new M.plugin.StyleManager({
  collapsed: true,
  collapsible: true,
  position: 'TL',
});
map.addPlugin(mp1);

const mp2 = new M.plugin.PrintViewManagement({});

map.addPlugin(mp2);

window.map = map;
