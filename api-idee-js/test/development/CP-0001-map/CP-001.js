import { map as Mmap } from 'IDEE/api-idee';
import { ScaleLine } from 'ol/control';

const mapa = Mmap({
  container: 'map',
  projection: 'EPSG:3857',
});

window.mapa = mapa;
