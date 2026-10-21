import VectorsManagement from 'facade/vectorsmanagement';

IDEE.language.setLang('es');

const map = IDEE.map({
  container: 'mapjs',
  center: [-410000, 4930000],
  layers: ['OSM'],
  zoom: 11,
});

// probar funcionalidad de Turf
const geojson = new IDEE.layer.GeoJSON({
  name: 'turf_test',
  legend: 'Capa Turf',
  source: {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { name: 'P1' }, geometry: { type: 'Point', coordinates: [-3.70, 40.42] } },
      { type: 'Feature', properties: { name: 'P2' }, geometry: { type: 'Point', coordinates: [-3.62, 40.45] } },
      { type: 'Feature', properties: { name: 'L1' }, geometry: { type: 'LineString', coordinates: [[-3.78, 40.38], [-3.72, 40.40], [-3.66, 40.37], [-3.60, 40.39]] } },
      { type: 'Feature', properties: { name: 'A' }, geometry: { type: 'Polygon', coordinates: [[[-3.74, 40.40], [-3.66, 40.40], [-3.66, 40.46], [-3.74, 40.46], [-3.74, 40.40]]] } },
      { type: 'Feature', properties: { name: 'B' }, geometry: { type: 'Polygon', coordinates: [[[-3.69, 40.43], [-3.60, 40.43], [-3.60, 40.49], [-3.69, 40.49], [-3.69, 40.43]]] } },
    ],
  },
});

map.addLayers(geojson);

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
  // download: false,
  // snapping: false,
  turf: true,
  help: true,
});

map.addPlugin(mp);

window.map = map;
