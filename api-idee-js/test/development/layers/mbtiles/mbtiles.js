/* eslint-disable camelcase,import/prefer-default-export */
import MBTiles from 'M/layer/MBTiles';
import { XYZ } from 'ol/source';
import { get as getProj } from 'ol/proj';
import TileGrid from 'ol/tilegrid/TileGrid';

export const mbtile_01 = new MBTiles({
  // url:'',
  // source:{},
  name: 'mbtilesLoadFunction',
  legend: 'Capa personalizada MBTiles',
  // maxExtent: [-1259872.4694101033, 4359275.566199489, -85799.71494979598, 4620384.454821652],
  tileLoadFunction: (z, x, y) => {
    return new Promise((resolve) => {
      if (z > 4) {
        resolve('https://cdn-icons-png.flaticon.com/512/4616/4616040.png');
      } else {
        resolve('https://cdn.icon-icons.com/icons2/2444/PNG/512/location_map_pin_direction_icon_148665.png');
      }
    });
  },
  // opacity: 0,
  // opacity: 0.5,
  // opacity: 1,
  // maxZoomLevel: 4,
  // maxZoomLevel: 12,
  // visibility: false,
  visibility: true,
  // isBase: false,
  // isBase: true,
  // transparent: true,
  // transparent: false,
  // infoEventType: 'hover',
  // infoEventType: 'click',
  // attribution: {
  //     name: 'Name Prueba KML',
  //     description: 'Description Prueba',
  //     url: 'https://www.ign.es',
  //     contentAttributions: 'https://componentes.cnig.es/api-core/files/attributions/WMTS_PNOA_20170220/atribucionPNOA_Url.kml',
  //     contentType: 'kml',
  //   },
}, {
  // minZoom: 5,
  // maxZoom: 10,
  // crossOrigin: true,
  // displayInLayerSwitcher: true,
  // displayInLayerSwitcher: false,
}, {

});

const loadFunction = (z, x, y) => {
  return new Promise((resolve) => {
    if (z > 4) {
      resolve('https://cdn.icon-icons.com/icons2/4222/PNG/512/albert_einstein_avatar_icon_263209.png');
    } else {
      resolve('https://cdn-icons-png.flaticon.com/512/4616/4616039.png');
    }
  });
};

const loadTile = (tile) => {
  const imgTile = tile;
  const tileCoord = tile.getTileCoord();
  loadFunction(tileCoord[0], tileCoord[1], -tileCoord[2] - 1).then((tileSrc) => {
    if (tileSrc) {
      imgTile.getImage().src = tileSrc;
    }
  });
};

export const mbtile_02 = new MBTiles({
  // url: '',
  // source:{},
  name: 'mbtilesLoadFunction',
  legend: 'Capa personalizada MBTiles',
}, {
  crossOrigin: true,
}, {
  source: new XYZ({
    url: '{z},{x},{y}',
    projection: getProj('EPSG:3857'),
    crossOrigin: 'anonymus',
    tileLoadFunction: (tile) => loadTile(tile),
    tileGrid: new TileGrid({
      extent: [-20037508.342789244, -20037508.342789244, 20037508.342789244, 20037508.342789244],
      origin: [-20037508.342789244, -20037508.342789244],
      resolutions: [156543.03392804097, 78271.51696402048, 39135.75848201024, 19567.87924100512, 9783.93962050256, 4891.96981025128, 2445.98490512564, 1222.99245256282, 611.49622628141, 305.748113140705, 152.8740565703525, 76.43702828517625, 38.21851414258813, 19.109257071294063, 9.554628535647032, 4.777314267823516, 2.388657133911758, 1.194328566955879, 0.5971642834779395, 0.29858214173896974, 0.14929107086948487, 0.07464553543474244, 0.03732276771737122, 0.01866138385868561, 0.009330691929342804, 0.004665345964671402, 0.002332672982335701, 0.0011663364911678506, 0.0005831682455839253],
    }),
  }),
});
