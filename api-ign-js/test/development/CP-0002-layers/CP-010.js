import { map as Mmap } from 'M/mapea';
import { xyz_001 } from '../layers/xyz/xyz';


const mapa = Mmap({
  container: 'map',
  // projection: 'EPSG:4326*d',
  center: [-443273.10081370454, 4757481.749296248],
  zoom: 6,
  layers: ['OSM'],
  controls: ['panzoom', 'scale', 'getfeatureinfo'],
});

mapa.addLayers([xyz_001]);


window.mapa = mapa;
