import VectorsManagement from 'facade/vectorsmanagement';

IDEE.language.setLang('es');

const map = IDEE.map({
  container: 'mapjs',
  center: [-458756.9690741142, 4682774.665868655],
  layers: ['OSM'],
  zoom: 6,
});

const geojson = new IDEE.layer.GeoJSON({
  name: 'Municipios',
  url: 'http://geostematicos-sigc.juntadeandalucia.es/geoserver/tematicos/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=tematicos:Municipios&maxFeatures=50&outputFormat=application/json',
});

map.addLayers([geojson]);

// probar funcionalidad de analisis de features
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
  analysis: true,
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
