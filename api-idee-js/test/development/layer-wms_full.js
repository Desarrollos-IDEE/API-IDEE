import { map as Mmap } from 'M/api-idee';

const mapjs = Mmap({
  container: 'map',
  wmc: ['callejeroCacheado'],
  layers: ['WMS_FULL*http://www.juntadeandalucia.es/medioambiente/mapwms/REDIAM_Permeabilidad_Andalucia?'],
});

window.mapjs = mapjs;
