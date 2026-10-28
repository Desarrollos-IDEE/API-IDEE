import VectorsManagement from 'facade/vectorsmanagement';

IDEE.language.setLang('es');

const map = IDEE.map({
  container: 'mapjs',
  center: [-458756.9690741142, 4682774.665868655],
  layers: ['OSM'],
  zoom: 6,
});

const generic002 = new IDEE.layer.GenericVector({}, {}, new ol.layer.Vector({
  source: new ol.source.Vector({
    format: new ol.format.GeoJSON(),
    url: 'https://geostematicos-sigc.juntadeandalucia.es/geoserver/tematicos/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=tematicos:Provincias&maxFeatures=50&outputFormat=application%2Fjson',
    strategy: ol.loadingstrategy.bbox,
  }),
}));

map.addLayers(generic002);

// probar funcionalidad de snapping
const mp = new VectorsManagement({
  position: 'left',
  tooltip: 'Gestionar mis vectores',
  collapsed: false,
  // Herramientas
  // selection: false,
  // addlayer: false,
  // creation: false,
  // edition: false,
  // style: false,
  // analysis: false,
  // download: false,
  // snapping: true,
  snapping: {
    vertex: true,
    edge: false,
    intersection: true,
    allLayers: true,
    guides: true,
    pixelTolerance: 15
  },
  help: true,
});

map.addPlugin(mp);

window.map = map;
