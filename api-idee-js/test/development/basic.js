import { map as Mmap } from 'IDEE/api-idee';

const mapjs = Mmap({
  container: 'map',
  controls: ['scale*1'],
});
window.mapjs = mapjs;
