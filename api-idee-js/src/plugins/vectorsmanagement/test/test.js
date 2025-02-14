/* eslint-disable max-len */
import VectorsManagement from 'facade/vectorsmanagement';

IDEE.language.setLang('es');
// IDEE.language.setLang('en');

const map = IDEE.map({
  container: 'mapjs',
  center: [-458756.9690741142, 4682774.665868655],
  layers: ['OSM'],
  zoom: 6,
});
window.map = map;

map.addPlugin(new IDEE.plugin.Layerswitcher({ collapsed: true, position: 'TR' }));

/* / Capa Vector
map.addLayers(new IDEE.layer.Vector({
  name: 'vector_a',
  legend: 'Capa Vector',
}, { displayInLayerSwitcher: true })); // */

/* / Capa WFS
map.addLayers(new IDEE.layer.WFS({
  url: 'http://geostematicos-sigc.juntadeandalucia.es/geoserver/tematicos/ows?',
  namespace: 'tematicos',
  name: 'Provincias',
  legend: 'Capa WFS',
  geometry: 'MPOLYGON',
})); // */

/* / Capa GeoJSON
map.addLayers(new IDEE.layer.GeoJSON({
  name: 'Municipios',
  legend: 'Capa GeoJSON',
  url: 'https://geostematicos-sigc.juntadeandalucia.es/geoserver/tematicos/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=tematicos:Municipios&maxFeatures=500000&outputFormat=application%2Fjson',
})); // */

/* / Capa KML
map.addLayers(new IDEE.layer.KML({
  url: 'https://www.ign.es/web/resources/delegaciones/delegacionesIGN.kml',
  name: 'capaKML',
  legend: 'Capa KML',
  extract: true,
})); // */

/* / Capa MVT
map.addLayers(new IDEE.layer.MVT({
  // url: 'https://vts.larioja.org/rioja/{z}/{x}/{y}.pbf', name: 'MVT', 404 error
  url: 'https://vt-fedme.idee.es/vt.senderogr/{z}/{x}/{y}.pbf',
  name: 'sendero_gr',
  mode: 'feature',
  projection: 'EPSG:3857',
})); // */

/* / Capa OGCAPIFeatures
map.addLayers(new IDEE.layer.OGCAPIFeatures({
  url: 'https://api-features.idee.es/collections/',
  name: 'hidrografia/Falls',
  legend: 'Capa OGCAPIFeatures',
  limit: 20,
})); // */

/* / Capa MBTilesVector
window.fetch('./countries.mbtiles').then((response) => {
  const mbtilesvector = new IDEE.layer.MBTilesVector({
    name: 'mbtiles_vector',
    legend: 'Capa MBTilesVector L',
    source: response,
  });
  map.addLayers(mbtilesvector);
}).catch((e) => { throw e; }); // */

const mp = new VectorsManagement({
  position: 'TL', // 'TL' | 'TR' | 'BR' | 'BL'
  collapsible: false,
  collapsed: false,
  isDraggable: true,
  // tooltip: 'TOOLTIP TEST Gestionar mis vectores',
  // useProxy => falta implementar

  // Herramientas
  help: true,
  addlayer: true,
  selection: true, // Automaticamente desactiva "edition" y "analysis"
  creation: true,
  edition: true,
  style: true,
  analysis: true,
  download: true,

  order: null,
});

map.addPlugin(mp); window.mp = mp;