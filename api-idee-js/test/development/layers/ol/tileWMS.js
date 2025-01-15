/* eslint-disable import/prefer-default-export */
import TileLayer from 'ol/layer/Tile.js';
import TileWMS from 'ol/source/TileWMS.js';

export const tileWMS = new TileLayer({
  source: new TileWMS({
    url: 'https://www.ign.es/wms-inspire/redes-geodesicas',
    params: { 'LAYERS': 'RED_ERGNSS', 'TILED': true },
    // serverType: 'geoserver',
  }),
});
