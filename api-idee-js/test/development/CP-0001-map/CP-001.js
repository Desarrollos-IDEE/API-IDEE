import { map as Mmap } from 'IDEE/api-idee';

const mapa = Mmap({
  container: 'map',
  projection: 'EPSG:3857*m',
});

window.mapa = mapa;
