import { map as Mmap } from 'IDEE/api-idee';

const mapa = Mmap({
  container: 'map',
  projection: 'EPSG:3857*m',
  controls: ['location*true*false'],
  center: [-443273.10081370454, 4757481.749296248],
  zoom: 6,
});
