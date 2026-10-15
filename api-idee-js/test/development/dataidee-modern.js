import { map as createMap } from 'IDEE/api-idee';
import DataIDEE from 'IDEE/layer/DataIDEE';
import Generic from 'IDEE/style/Generic';

const map = createMap({
  container: 'map',
  center: [-500000, 4470000],
  zoom: 8,
});
if (map.getImplementation() === 'cesium') {
  // Cesium's native projection uses longitude and latitude in degrees.
  map.setCenter({ x: -6.9056, y: 37.3157 });
  map.setZoom(16);
}

const layer = new DataIDEE({
  url: 'https://api-features.ign.es',
  name: 'nuc',
  legend: 'Núcleos de población (IGN)',
  limit: 100,
  extract: true,
}, {
  style: new Generic({
    polygon: {
      fill: { color: 'rgba(230, 70, 30, 0.35)' },
      stroke: { color: '#b83218', width: 1 },
    },
  }),
});

const item = new DataIDEE({
  url: 'https://api-features.ign.es',
  name: 'nuc',
  id: '100000001',
  legend: 'Entidad IGN 100000001 · La Ribera',
}, {
  style: new Generic({
    polygon: {
      fill: { color: 'rgba(255, 210, 0, 0.5)' },
      stroke: { color: '#172554', width: 3 },
    },
  }),
});

let collectionLoaded = false;
let itemLoaded = false;
const updateStatus = () => {
  if (collectionLoaded && itemLoaded) {
    document.getElementById('status').textContent = `Cargada la colección (${layer.getFeatures().length} entidades) y la entidad 100000001.`;
  }
};
layer.on('load', () => {
  collectionLoaded = true;
  updateStatus();
});
item.on('load', () => {
  itemLoaded = true;
  updateStatus();
});

map.addLayers([layer, item]);

window.map = map;
window.layer = layer;
window.item = item;
