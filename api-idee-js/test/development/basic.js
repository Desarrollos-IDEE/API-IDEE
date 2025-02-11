import { map as Mmap } from 'IDEE/api-idee';

const mapjs = Mmap({
  container: 'map',
  controls: ['panzoombar'],
});
window.mapjs = mapjs;
