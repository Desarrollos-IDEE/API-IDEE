/* eslint-disable camelcase,max-len,no-unused-vars */
import { map as Mmap } from 'M/mapea';
import { layerGroup_001, layerGroup_002 } from '../layers/layerGroup/layerGroup';


const mapa = Mmap({
  container: 'map',
  // projection: 'EPSG:4326*d',
  center: [-443273.10081370454, 4757481.749296248],
  // layers: [urlAPI],
  // layers: ['OSM'],
  zoom: 6,
  // controls: ['scale', 'attributions'],
});
window.mapa = mapa;

mapa.addLayerGroups([layerGroup_001, layerGroup_002]);

