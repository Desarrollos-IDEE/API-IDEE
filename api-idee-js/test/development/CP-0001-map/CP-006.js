import { map as Mmap } from 'M/mapea';
import WMTS from 'M/layer/WMTS';

const mapa1 = Mmap({
  container: 'map1',
  projection: 'EPSG:3857*m',
  center: [-443273.10081370454, 4757481.749296248],
  zoom: 6,
});

const mapa2 = Mmap({
  container: 'map2',
  projection: 'EPSG:3857*m',
  center: [-443273.10081370454, 4757481.749296248],
  zoom: 6,
});

window.WMTS = WMTS;
window.map = mapa1;
window.map2 = mapa2;
