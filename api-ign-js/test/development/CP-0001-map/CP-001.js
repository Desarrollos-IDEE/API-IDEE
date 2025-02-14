import { map as Mmap } from 'M/mapea';

const mapa = Mmap({
  container: 'map',
  projection: 'EPSG:3857*m',
});

window.mapa = mapa;
