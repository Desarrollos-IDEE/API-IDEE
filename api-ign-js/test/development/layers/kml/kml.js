/* eslint-disable camelcase */
import KML from 'M/layer/KML';
import Generic from 'M/style/Generic';
import VectorSource from 'ol/source/Vector';
import OLKMLFormat from 'ol/format/KML';

export const kml_001 = new KML({
  // url: 'https://www.ign.es/web/resources/delegaciones/delegacionesIGN.kml',
  url: 'https://componentes.cnig.es/api-core/files/attributions/WMTS_PNOA_20170220/atribucionPNOA_Url.kml',
  // url: 'http://mapea4-sigc.juntadeandalucia.es/files/kml/arbda_sing_se.kml',
  name: 'capaKML',
  // extract: false,
  extract: true,
  // infoEventType: 'click',
  // infoEventType: 'hover',
  // removeFolderChildren: false,
  // removeFolderChildren: true,
  // label: false,
  // label: true,
  // visibility: false,
  visibility: true,
  // layers: ['Layer__0'],
  // layers: 'Layer__0',
  // layers: [],
  // maxExtent: [-1259872.4694101033, 4359275.566199489, -85799.71494979598, 4620384.454821652],
  // isBase: false,
  // isBase: true,
  // transparent: false,
  // transparent: true,
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
  // extractStyles: false,
  // extractStyles: true,
  // scaleLabel: 3,
  // displayInLayerSwitcher: false,
  // displayInLayerSwitcher: true,
  // opacity: 0,
  // opacity: 0.5,
  // opacity: 1,
}, {
  // source: {},
});

// ERROR: infoEventType en hover no cierra el popup al salir
// ERROR: No funciona opacity al 0

export const kml_002 = new KML({
  url: 'https://www.ign.es/resources/CaminoDeSantiago_PRE/rutas/04/04-Via%20de%20la%20Plata%20-%20Camino%20Moz%C3%A1rabe%20a%20Santiago.kml',
  name: 'routeKmlLayer',
  extract: true,
});

export const kml_003 = new KML({
  url: 'https://componentes.cnig.es/api-core/files/attributions/WMTS_PNOA_20170220/atribucionPNOA_Url.kml',
  name: 'capaKML',
  extract: true,
  visibility: true,
}, {
  minZoom: 5,
}, {
  source: new VectorSource({
    format: new OLKMLFormat(),
    url: 'https://www.ign.es/resources/CaminoDeSantiago_PRE/rutas/04/04-Via%20de%20la%20Plata%20-%20Camino%20Moz%C3%A1rabe%20a%20Santiago.kml',
  }),
});
