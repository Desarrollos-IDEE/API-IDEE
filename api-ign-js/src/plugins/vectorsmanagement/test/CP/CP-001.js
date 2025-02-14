import VectorsManagement from 'facade/vectorsmanagement';

M.language.setLang('es');

const map = M.map({
  container: 'mapjs',
  center: [-458756.9690741142, 4682774.665868655],
  layers: ['OSM'],
  zoom: 6,
});

const vectorLayers = new M.layer.Vector({
  name: 'capaVectorial',
  legend: 'Capa Vector',
});

// Creamos feature
const featurePolygon = new M.Feature('featurePrueba001', {
  type: 'Feature',
  id: 'mapea_feature_4287706116785215',
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [-361768.3495402032, 4925425.679177235],
        [-58617.78789443352, 4919758.867816422],
        [-73090.34469573358, 4662894.702582537],
        [-398038.4823960919, 4676933.854740876],
        [-361768.3495402032, 4925425.679177235],
      ],
    ],
  },
  geometry_name: 'geometry',
  properties: {},
});

const featurePoint = new M.Feature('featurePrueba002', {
  type: 'Feature',
  id: 'prueba_pol_wfst.1985',
  geometry: {
    type: 'Point',
    coordinates: [-626051.84, 4365196.20],
  },
  geometry_name: 'geometry',
  properties: {},
});

// lo añadimos a la capa
vectorLayers.addFeatures([featurePolygon, featurePoint]);

map.addLayers([vectorLayers]);

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
