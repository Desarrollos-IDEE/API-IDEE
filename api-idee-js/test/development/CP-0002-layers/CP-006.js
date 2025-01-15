import { map as Mmap } from 'M/mapea';
import { wmts_001 } from '../layers/wmts/wmts';


const mapa = Mmap({
  container: 'map',
  // projection: 'EPSG:4326*d',
  center: [-443273.10081370454, 4757481.749296248],
  zoom: 6,
  layers: [
    wmts_001,
    'OSM',
  ],
  controls: ['panzoom', 'scale', 'getfeatureinfo'],
});

// mapa.addLayers([wmts_001]);


window.mapa = mapa;
