import { map as Mmap } from 'M/mapea';
import { wfs_001 } from '../layers/wfs/wfs';


const mapa = Mmap({
  container: 'map',
  // projection: 'EPSG:4326*d',
  center: [-443273.10081370454, 4757481.749296248],
  zoom: 6,
  layers: ['OSM'],
});

mapa.addLayers([wfs_001]);


window.mapa = mapa;
