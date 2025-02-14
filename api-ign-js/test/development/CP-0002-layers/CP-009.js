import { map as Mmap } from 'M/mapea';
import { kml_001 } from '../layers/kml/kml';


const mapa = Mmap({
  container: 'map',
  // projection: 'EPSG:4326*d',
  center: [-443273.10081370454, 4757481.749296248],
  zoom: 6,
  layers: ['OSM'],
  controls: ['scale', 'getfeatureinfo'],
  controls: ['panzoom', 'scale', 'getfeatureinfo'],
});

mapa.addLayers([kml_001]);


window.mapa = mapa;
