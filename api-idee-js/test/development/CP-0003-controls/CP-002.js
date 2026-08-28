import { map as Mmap } from 'IDEE/api-idee';

// eslint-disable-next-line no-unused-vars
const mapa = Mmap({
  container: 'map',
  projection: 'EPSG:3857',
  controls: ['scale', 'scaleline', 'panzoom', 'panzoombar'],
  // controls: ['scale*true', 'scaleline', 'panzoom', 'panzoombar'],
  center: [-443273.10081370454, 4757481.749296248],
  zoom: 6,
});
