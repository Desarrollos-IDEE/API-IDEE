import { map as Mmap } from 'M/api-idee';

const mapa = Mmap({
  container: 'map',
  projection: 'EPSG:3857*m',
  controls: ['scale*false', 'scaleline', 'panzoom', 'panzoombar'],
  center: [-443273.10081370454, 4757481.749296248],
  zoom: 6,
});
