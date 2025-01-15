/* eslint-disable camelcase,import/prefer-default-export */
import OGCAPIFeatures from 'M/layer/OGCAPIFeatures';
import Generic from 'M/style/Generic';// eslint-disable-line no-unused-vars
import OLSourceVector from 'ol/source/Vector';
import OLFormatGeoJSON from 'ol/format/GeoJSON';
import { bbox } from 'ol/loadingstrategy';

export const ogcAPIFeatures_001 = new OGCAPIFeatures({
  url: 'https://api-features.idee.es/collections/',
  name: 'falls',
  legend: 'Capa OGCAPIFeatures',
  extract: true,
  // extract: false,
  // infoEventType: 'hover',
  // infoEventType: 'click',
  // format: 'json',
  // offset: 10,
  // offset: 2,
  // id: 'ES010HYFLSP0000001528421',
  // conditional: {
  //   slug: 'Puerto-del-Leon-por-Totalan'
  // },
  // limit: 20,
  // crs: '',
  // geometry: 'MPOLYGON',
  // geometry: 'MPOINT',
  // minZoom: 5,
  // maxZoom: 10,
  // bbox: [
  //   -157000.66673495102,
  //   -744037.0439651047,
  //   5403089.153398914,
  //   5099481.277050193
  // ],
  // maxExtent: [-953031.9167337259, 5198473.475942763, -879652.3695799566, 5233405.1978690885],
  // isBase: true,
  // isBase: false,
  // transparent: true,
  // transparent: false,
  // attribution: {
  //   name: 'Name Prueba OGCAPIFeatures',
  //   description: 'Description Prueba',
  //   url: 'https://www.ign.es',
  //   contentAttributions: 'https://componentes.cnig.es/api-core/files/attributions/WMTS_PNOA_20170220/atribucionPNOA_Url.kml',
  //   contentType: 'kml',
  // }
}, {
  // minZoom: 5,
  // maxZoom: 10,
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
  // visibility: true,
  // visibility: false,
  // displayInLayerSwitcher: true,
  // displayInLayerSwitcher: false,
  // opacity: 0,
  // opacity: 0.5,
  // opacity: 1,
  // bbox: [
  //   -157000.66673495102,
  //   -744037.0439651047,
  //   5403089.153398914,
  //   5099481.277050193
  // ],
  // getFeatureOutputFormat: 'application/json',
  // getFeatureOutputFormat: 'geojson',
  // describeFeatureTypeOutputFormat: 'geojson',
}, {
  // cql: 'id IN (3,5)'
  // source: {},
});

// ERROR: infoEventType en hover no cierra el popup al salir

// export const ogcAPIFeatures_002 = new OGCAPIFeatures({
//   url: 'https://api-features.idee.es/collections/',
//   name: 'hidrografia/Wetland',
//   legend: 'Capa OGCAPIFeatures',
// });

export const ogcAPIFeatures_002 = new OGCAPIFeatures({
  url: 'https://api-features.idee.es/collections/',
  name: 'falls', // 'portarea',
  legend: 'Capa OGCAPIFeatures',
  extract: true,
  bbox: [-523124.9709505441, 4814543.778545674, -504780.08416210185, 4823190.717370434],
  id: 'ES010HYFLSP0000001528421',
}, {}, {
  source: new OLSourceVector({
    attributions: ['© Acme Inc.', '© Bacme Inc.'],
    format: new OLFormatGeoJSON(),
    url: 'https://api-features.idee.es/collections/portarea/items?f=json',
    wrapX: false,
  }),
});
