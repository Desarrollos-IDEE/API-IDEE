import { map as Mmap } from 'M/mapea';
import { wms_001 } from '../layers/wms/wms';


const mapa = Mmap({
  container: 'map',
  // projection: 'EPSG:4326*d',
  center: [-443273.10081370454, 4757481.749296248],
  zoom: 6,
  layers: ['OSM'],
  controls: ['panzoom', 'scale', 'getfeatureinfo'],
  layers: [
    wms_001,
  ],
});

// mapa.addLayers([wms_001]);


window.mapa = mapa;
