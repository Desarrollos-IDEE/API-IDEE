/* eslint-disable camelcase,import/prefer-default-export */
import MBTilesVector from 'M/layer/MBTilesVector';
import Generic from 'M/style/Generic';// eslint-disable-line no-unused-vars
import OLSourceVectorTile from 'ol/source/VectorTile';
import TileGrid from 'ol/tilegrid/TileGrid';
import MVTFormat from 'ol/format/MVT';

export const mbtileVector_001 = new MBTilesVector({
  name: 'mbtilesvector',
  legend: 'Capa personalizada MBTilesVector',
  // maxExtent: [-1259872.4694101033, 4359275.566199489, -85799.71494979598, 4620384.454821652],
  // isBase: true,
  // isBase: false,
  // transparent: true,
  // transparent: false,
  // attribution: {
  //     name: 'Name Prueba KML',
  //     description: 'Description Prueba',
  //     url: 'https://www.ign.es',
  //     contentAttributions: 'https://componentes.cnig.es/api-core/files/attributions/WMTS_PNOA_20170220/atribucionPNOA_Url.kml',
  //     contentType: 'kml',
  //   },
  extract: true,
  // extract: false,
  // visibility: true,
  // visibility: false,
  infoEventType: 'hover',
  // infoEventType: 'click',
  tileLoadFunction: (z, x, y) => {
    return new Promise((resolve) => {
      fetch(`https://ahocevar.com/geoserver/gwc/service/tms/1.0.0/ne:ne_10m_admin_0_countries@EPSG%3A900913@pbf/${z}/${x}/${y}.pbf`).then((response) => {
        resolve(response.arrayBuffer());
      });
    });
  },
}, {
  // minZoom: 5,
  // maxZoom: 10,
  // opacity: 0,
  // opacity: 0.5,
  // opacity: 1,
  // displayInLayerSwitcher: true,
  // displayInLayerSwitcher: false,
  // predefinedStyles: [],
  // style: new Generic({
  //   point: {
  //     radius: 10,
  //     fill: {
  //       color: 'blue'
  //     }
  //   },
  //   polygon: {
  //     fill: {
  //       color: 'red'
  //     }
  //   },
  //   line: {
  //     stroke: {
  //       color: 'black'
  //     }
  //   }
  // }),
}, {
  // source: {},
});

// ERROR: infoEventType en hover no cierra el popup al salir

const tileLoadFunction = (z, x, y) => {
  return new Promise((resolve) => {
    fetch(`https://ahocevar.com/geoserver/gwc/service/tms/1.0.0/ne:ne_10m_admin_0_countries@EPSG%3A900913@pbf/${z}/${x}/${y}.pbf`).then((response) => {
      resolve(response.arrayBuffer());
    });
  });
};

const loadVectorTile = (tile, formatter) => {
  tile.setState(1); // ol/TileState#LOADING
  tile.setLoader((extent, resolution, projection) => {
    const tileCoord = tile.getTileCoord();
    // eslint-disable-next-line
    tileLoadFunction(tileCoord[0], tileCoord[1], -tileCoord[2] - 1).then((_vectorTile) => {
      if (_vectorTile) {
        try {
          const vectorTile = new Uint8Array(_vectorTile);
          const features = formatter.readFeatures(vectorTile, {
            extent,
            featureProjection: projection,
          });
          tile.setFeatures(features);
          tile.setState(2); // ol/TileState#LOADED
        } catch (e) {
          tile.setState(3); // ol/TileState#ERROR
        }
      } else {
        tile.setState(3); // ol/TileState#ERROR
      }
    });
  });
};

export const mbtileVector_002 = new MBTilesVector({
  name: 'mbtilesvector',
  legend: 'Capa personalizada MBTilesVector',
  extract: true,
  tileLoadFunction: (z, x, y) => {
    return new Promise((resolve) => {
      fetch(`https://ahocevar.com/geoserver/gwc/service/tms/1.0.0/ne:ne_10m_admin_0_cities@EPSG%3A900913@pbf/${z}/${x}/${y}.pbf`).then((response) => {
        resolve(response.arrayBuffer());
      });
    });
  },
}, {
  minZoom: 5,
}, {
  source: new OLSourceVectorTile({
    projection: 'EPSG:3857',
    url: '{z},{x},{y}',
    tileLoadFunction: (tile) => loadVectorTile(tile, new MVTFormat()),
    tileGrid: new TileGrid({
      extent: [-20037508.342789244, -20037508.342789244, 20037508.342789244, 20037508.342789244],
      origin: [-20037508.342789244, -20037508.342789244],
      resolutions: [156543.03392804097, 78271.51696402048, 39135.75848201024, 19567.87924100512, 9783.93962050256, 4891.96981025128, 2445.98490512564, 1222.99245256282, 611.49622628141, 305.748113140705, 152.8740565703525, 76.43702828517625, 38.21851414258813, 19.109257071294063, 9.554628535647032, 4.777314267823516, 2.388657133911758, 1.194328566955879, 0.5971642834779395, 0.29858214173896974, 0.14929107086948487, 0.07464553543474244, 0.03732276771737122, 0.01866138385868561, 0.009330691929342804, 0.004665345964671402, 0.002332672982335701, 0.0011663364911678506, 0.0005831682455839253],
    }),
  }),
});
