/* eslint-disable camelcase */
import WMTS from 'M/layer/WMTS';
import { default as OLSourceWMTS } from 'ol/source/WMTS';
import OLTileGridWMTS from 'ol/tilegrid/WMTS';
import { get as getProj } from 'ol/proj';
import { minZoom } from '../../../../src/facade/js/parameter/parameter';

export const wmts_001 = new WMTS({
  url: 'https://wmts-mapa-lidar.idee.es/lidar',
  name: 'EL.GridCoverageDSM',
  legend: 'Modelo Digital de Superficies LiDAR',
  matrixSet: 'GoogleMapsCompatible',
  // maxExtent: [-1259872.4694101033, 4359275.566199489, -85799.71494979598, 4620384.454821652],
  // useCapabilities: false,
  // useCapabilities: true,
  // isBase: false,
  // isBase: true,
  // transparent: false,
  // transparent: true,
  // attribution: {
  //     name: 'Name Prueba WMTS',
  //     description: 'Description Prueba',
  //     url: 'https://www.ign.es',
  //     contentAttributions: 'https://componentes.cnig.es/api-core/files/attributions/WMTS_PNOA_20170220/atribucionPNOA_Url.kml',
  //     contentType: 'kml',
  //   },
  // minZoom: 1,
  // maxZoom: 5,
}, {
  // minZoom: 5,
  // maxZoom: 10,
  // matrixSet: 'GoogleMapsCompatible',
  // format: 'image/png',
  // useCapabilities: false,
  // useCapabilities: true,
  // crossOrigin: true,
  // crossOrigin: 'anonymous',
  // minScale: 2000000,
  // maxScale: 7000000,
  // minResolution: 705.5551745557614,
  // maxResolution: 2469.443110945165,
  // queryable: false,
  // queryable: true,
  // visibility: false,
  // visibility: true,
  // displayInLayerSwitcher: false,
  // displayInLayerSwitcher: true,
  // opacity: 0,
  // opacity: 0.5,
  // opacity: 1,
}, {
  // capabilitiesMetadata: {
  //  Abstract: '',
  //  Attribution: '',
  //  MetadataURL: '',
  //  Style: '',
  // },
  // source: {},
});

// ERROR: No funciona opacity al 0

export const wmts_002 = 'WMTS*http://www.ign.es/wmts/pnoa-ma?*OI.OrthoimageCoverage*GoogleMapsCompatible*imagen*true*image/jpeg*true*true*true';

export const wmts_003 = new WMTS({
  url: 'https://servicios.es/wmts/ocupacion-suelo',
  name: 'LU.ExistingLandUse',
  legend: 'LU.ExistingLandUse',
  matrixSet: 'EPSG:4326',
}, {
  minZoom: 5,
}, {
  source: new OLSourceWMTS({
    urls: ['https://servicios.idee.es/wmts/ocupacion-suelo'],
    layer: 'LC.LandCoverSurfaces',
    matrixSet: 'GoogleMapsCompatible',
    format: 'image/png',
    projection: getProj('EPSG:3857'),
    crossOrigin: 'anonymus',
    tileGrid: new OLTileGridWMTS({
      origin: [-20037508.34, 20037508],
      resolutions: [156543.03390625, 78271.516953125, 39135.7584765625, 19567.8792382812, 9783.93961914062, 4891.96980957031, 2445.98490478515, 1222.99245239257, 611.496226196289, 305.748113098144, 152.874056549072, 76.4370282745361, 38.218514137268, 19.109257068634, 9.55462853431701, 4.7773142671585, 2.38865713357925, 1.19432856678962, 0.59716428339481, 0.298582141697405, 0.1492910708487025],
      matrixIds: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'],
    }),
  }),
});

export const wmts_004 = new WMTS({
  url: 'https://www.ign.es/wmts/planos?',
  name: 'MancelliMadrid',
  legend: 'MancelliMadrid',
  matrixSet: 'GoogleMapsCompatible',
  format: 'image/png',
});
