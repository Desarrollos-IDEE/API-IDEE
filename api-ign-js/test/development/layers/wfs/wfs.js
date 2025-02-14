/* eslint-disable camelcase */
import WFS from 'M/layer/WFS';
import Generic from 'M/style/Generic';// eslint-disable-line no-unused-vars
import OLSourceVector from 'ol/source/Vector';
import OLFormatGeoJSON from 'ol/format/GeoJSON';

export const wfs_001 = new WFS({
  url: 'http://geostematicos-sigc.juntadeandalucia.es/geoserver/tematicos/ows?',
  namespace: 'tematicos',
  name: 'provincias_pob',
  legend: 'Provincias',
  geometry: 'MPOLYGON',
  // cql: 'id IN (3,5)'
  // maxExtent: [-1259872.4694101033, 4359275.566199489, -85799.71494979598, 4620384.454821652],
  // extract: false,
  // extract: true,
  // infoEventType: 'click',
  // infoEventType: 'hover',
  // ids: '3,4',
  // version: '',
  // isBase: false,
  // isBase: true,
  // transparent: false,
  // transparent: true,
  // attribution: {
  //   name: 'Name Prueba WFS',
  //   description: 'Description Prueba',
  //   url: 'https://www.ign.es',
  //   contentAttributions: 'https://componentes.cnig.es/api-core/files/attributions/WMTS_PNOA_20170220/atribucionPNOA_Url.kml',
  //   contentType: 'kml',
  // }
}, {
  // minZoom: 5,
  // maxZoom: 10,
  // getFeatureOutputFormat: 'application/json',
  // getFeatureOutputFormat: 'geojson',
  // describeFeatureTypeOutputFormat: 'geojson',
  // visibility: false,
  // visibility: true,
  // displayInLayerSwitcher: false,
  // displayInLayerSwitcher: true,
  // opacity: 0,
  // opacity: 0.5,
  // opacity: 1,
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
// ERROR: No funciona opacity al 0

export const wfs_002 = new WFS({
  url: 'https://www.ign.es/wfs/redes-geodesicas',
  name: 'RED_REGENTE',
  legend: 'RED_REGENTE',
  geometry: 'MPOINT',
});

export const wfs_003 = new WFS({
  // name: 'Municipios Indicadores',
  url: 'http://geostematicos-sigc.juntadeandalucia.es/geoserver/wfs?',
  namespace: 'tematicos',
  name: 'ind_mun_simp',
  geometry: 'POLYGON',
});

export const wfs_004 = new WFS({
  // name: 'Campamentos',
  url: 'http://geostematicos-sigc.juntadeandalucia.es/geoserver/wfs',
  namespace: 'sepim',
  name: 'campamentos',
  geometry: 'POINT',
  extract: true,
});

export const wfs_005 = new WFS(
  {
    // url: 'http://geostematicos-sigc.juntadeandalucia.es/geoserver/wfs',
    namespace: 'sepim',
    name: 'campamentos',
    // geometry: 'POLYGON',
    extract: true,
    cql: "nombre = 'Aljarafe'",
  },
  {
    minZoom: 5,
  },
  {
    source: new OLSourceVector({
      url: 'https://geostematicos-sigc.juntadeandalucia.es/geoserver/wfs?service=WFS&version=1.0.0&request=GetFeature&typename=tematicos:comarcas&outputFormat=application%2Fjson&srsname=EPSG%3A3857',
      format: new OLFormatGeoJSON(),
    }),
  },
);
