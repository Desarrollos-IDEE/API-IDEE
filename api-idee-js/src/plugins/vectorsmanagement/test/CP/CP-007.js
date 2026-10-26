import VectorsManagement from 'facade/vectorsmanagement';

IDEE.language.setLang('es');

const map = IDEE.map({
  container: 'mapjs',
  center: [-458756.9690741142, 4682774.665868655],
  layers: ['OSM'],
  zoom: 6,
});

const mbtileVector = new IDEE.layer.MBTilesVector({
  name: 'mbtilesvector',
  legend: 'Capa personalizada MBTilesVector',
  extract: true,
  tileLoadFunction: (z, x, y) => {
    return new Promise((resolve) => {
      fetch(`https://ahocevar.com/geoserver/gwc/service/tms/1.0.0/ne:ne_10m_admin_0_countries@EPSG%3A900913@pbf/${z}/${x}/${y}.pbf`).then((response) => {
        resolve(response.arrayBuffer());
      });
    });
  },
});

map.addLayers([mbtileVector]);

// probar funcionalidad de estilado de features
const mp = new VectorsManagement({
  position: 'left',
  tooltip: 'Gestionar mis vectores',
  collapsed: false,
  // Herramientas
  selection: true,
  // addlayer: false,
  // creation: false,
  // edition: false,
  style: true,
  // analysis: false,
  // download: false,
  // snapping: false,
  // turf: false,
  help: true,
});

map.addPlugin(mp);

window.map = map;
