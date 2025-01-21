import { map as Mmap } from 'IDEE/api-idee';
import WMS from 'IDEE/layer/WMS';

const mapjs = Mmap({
  container: 'map',
  controls: ['backgroundlayers'],
  layers: [],
});
const layerUA = new WMS({
  url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
  name: 'AU.AdministrativeUnit',
  legend: 'Unidad administrativa',
  tiled: false
}, {});
window.mapjs = mapjs;
mapjs.addWMS(layerUA);
