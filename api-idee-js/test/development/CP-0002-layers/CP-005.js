import { map as Mmap } from 'IDEE/api-idee';
import { tms_001, tms_002 } from '../layers/tms/tms';


const mapa = Mmap({
  container: 'map',
  projection: 'EPSG:3857',
  center: [-443273.10081370454, 4757481.749296248],
  zoom: 6,
  controls: ['panzoom', 'scale', 'getfeatureinfo'],
  layers: [tms_001]
});

// mapa.addLayers([tms_002]);


window.mapa = mapa;
