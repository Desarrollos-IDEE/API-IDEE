import { map as Mmap } from 'IDEE/api-idee';
import { generic_001 } from '../layers/generic/generic';

IDEE.config.backgroundlayers = [{
  id: 'mapa',
  title: 'Implementation Switcher',
  layers: [
    generic_001,
  ],
}];

Mmap({
  container: 'map',
  projection: 'EPSG:3857*m',
  controls: ['implementationswitcher'],
  center: [-443273.10081370454, 4757481.749296248],
  zoom: 6,
});
