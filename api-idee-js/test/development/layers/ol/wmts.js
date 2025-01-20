/* eslint-disable no-loss-of-precision,no-plusplus,camelcase */
import TileLayer from 'ol/layer/Tile';
import WMTS from 'ol/source/WMTS';
import WMTSTileGrid from 'ol/tilegrid/WMTS';
import { get as getProjection } from 'ol/proj';
import { getTopLeft, getWidth } from 'ol/extent.js';

// Create the WMTS layer
export const wmtsLayer_01 = new TileLayer({
  source: new WMTS({
    url: 'https://servicios.idee.es/wmts/ocupacion-suelo?',
    layer: 'LU.ExistingLandUse',
    matrixSet: 'EPSG:4326',
    format: 'image/png',
    projection: getProjection('EPSG:4326'),
    tileGrid: new WMTSTileGrid({
      extent: getProjection('EPSG:4326').getExtent(),
      resolutions: [
        0.703125,
        0.3515625,
        0.17578125,
        0.087890625,
        0.0439453125,
        0.02197265625,
        0.010986328125,
        0.0054931640625,
        0.00274658203125,
        0.001373291015625,
        0.0006866455078125,
        0.00034332275390625,
        0.000171661376953125,
        0.0000858306884765625,
        0.00004291534423828125,
        0.000021457672119140625,
        0.000010728836059570312,
        0.000005364418029785156,
        0.000002682209014892578,
      ],
      matrixIds: [
        'EPSG:4326:0',
        'EPSG:4326:1',
        'EPSG:4326:2',
        'EPSG:4326:3',
        'EPSG:4326:4',
        'EPSG:4326:5',
        'EPSG:4326:6',
        'EPSG:4326:7',
        'EPSG:4326:8',
        'EPSG:4326:9',
        'EPSG:4326:10',
        'EPSG:4326:11',
        'EPSG:4326:12',
        'EPSG:4326:13',
        'EPSG:4326:14',
        'EPSG:4326:15',
        'EPSG:4326:16',
        'EPSG:4326:17',
        'EPSG:4326:18',
      ],
    }),
  }),
  legend: 'Prueba de leyenda',
});

const projection = getProjection('EPSG:3857');
const projectionExtent = projection.getExtent();
const size = getWidth(projectionExtent) / 256;
const resolutions = new Array(19);
const matrixIds = new Array(19);
for (let z = 0; z < 19; ++z) {
  // generate resolutions and matrixIds arrays for this WMTS
  resolutions[z] = size / 2 ** z;
  matrixIds[z] = z;
}
export const wmtsLayer_02 = new TileLayer({
  source: new WMTS({
    url: 'https://www.ign.es/wmts/primera-edicion-mtn?',
    layer: 'catastrones',
    matrixSet: 'GoogleMapsCompatible',
    format: 'image/jpeg',
    projection,
    tileGrid: new WMTSTileGrid({
      origin: getTopLeft(projectionExtent),
      resolutions,
      matrixIds,
    }),
  }),
});
