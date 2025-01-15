import { map as Mmap } from 'M/mapea';
import { WMS } from 'M/layer/WMS';
import { wms_001, wms_002, wms_003 } from '../layers/wms/wms';

const mapa = Mmap({
  container: 'map',
  projection: 'EPSG:3857*m',
  controls: ['getfeatureinfo*false'],
  center: [-443273.10081370454, 4757481.749296248],
  zoom: 6,
});

mapa.addLayers([wms_001, wms_002, wms_003]);