import { map as Mmap } from 'IDEE/api-idee';
import WMTS from 'IDEE/layer/WMTS';

const mapa1 = Mmap({
  container: 'map1',
  projection: 'EPSG:3857',
  center: [-443273.10081370454, 4757481.749296248],
  zoom: 6,
});

const mapa2 = Mmap({
  container: 'map2',
  projection: 'EPSG:3857',
  center: [-443273.10081370454, 4757481.749296248],
  zoom: 6,
});

window.WMTS = WMTS;
window.map = mapa1;
window.map2 = mapa2;
