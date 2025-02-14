/* eslint-disable camelcase */
import { map as Mmap } from 'M/mapea';
import {
  geotiff_001, geotiff_002, geotiff_003, geotiff_004,
} from '../layers/geotiff/geotiff';

const mapa = Mmap({
  container: 'map',
  // projection: 'EPSG:4326*d',
  center: [-443273.10081370454, 4757481.749296248],
  zoom: 6,
  layers: ['OSM'],
  controls: ['scale', 'getfeatureinfo'],
});
window.mapa = mapa;

mapa.addLayers([geotiff_001, geotiff_002, geotiff_003, geotiff_004]);
