import { map as Mmap } from 'IDEE/api-idee';

const mapjs = Mmap({
  container: 'map',
  controls: ['layerswitcher', 'scale', 'scaleline', 'mouse'],
  wmcfile: ['callejero', 'ortofoto'],
  bbox: '230193,4134494,245972,4146730',
});

window.mapjs = mapjs;
