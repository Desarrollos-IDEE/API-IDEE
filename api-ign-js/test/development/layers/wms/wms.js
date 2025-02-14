/* eslint-disable camelcase */
import WMS from 'M/layer/WMS';
import OLSourceImageWMS from 'ol/source/ImageWMS';
import OLSourceTileWMS from 'ol/source/TileWMS';

// eslint-disable-next-line no-unused-vars
const sldBody = '<?xml version="1.0" encoding="ISO-8859-1"?>'
  + '<StyledLayerDescriptor version="1.0.0" '
  + 'xmlns="http://www.opengis.net/sld" '
  + 'xmlns:ogc="http://www.opengis.net/ogc" '
  + 'xmlns:xlink="http://www.w3.org/1999/xlink" '
  + 'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
  + '<NamedLayer>'
  + '<Name>tematicos:Municipios</Name>'
  + '<UserStyle>'
  + '<FeatureTypeStyle>'
  + '<Rule>'
  + '<Name>Rule 1</Name>'
  + '<Title>RedFill RedOutline</Title>'
  + '<Abstract>50% transparent red fill with a red outline 1 pixel in width</Abstract>'
  + '<PolygonSymbolizer>'
  + '<Fill>'
  + '<CssParameter name="fill">#1E1BE8</CssParameter>'
  + '</Fill>'
  + '<Stroke>'
  + '<CssParameter name="stroke">#E81B8E</CssParameter>'
  + '<CssParameter name="stroke-width">1</CssParameter>'
  + '</Stroke>'
  + '</PolygonSymbolizer>'
  + '</Rule>'
  + '</FeatureTypeStyle>'
  + '</UserStyle>'
  + '</NamedLayer>'
  + '</StyledLayerDescriptor>';

export const wms_001 = new WMS({
  url: 'http://geostematicos-sigc.juntadeandalucia.es/geoserver/tematicos/wms?',
  name: 'tematicos:Municipios',
  legend: 'Capa WMS',
  // url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
  // name: 'AU.AdministrativeUnit',
  // legend: 'Unidades Administrativas',
  // useCapabilities: true,
  // maxExtent: [-1259872.4694101033, 4359275.566199489, -85799.71494979598, 4620384.454821652],
  // tiled: false,
  // tiled: true,
  // visibility: false,
  // visibility: true,
  // queryable: false,
  // queryable: true,
  // displayInLayerSwitcher: false,
  // displayInLayerSwitcher: true,
  // version: '',
  // isBase: false,
  // isBase: true,
  // transparent: false,
  // transparent: true,
  // attribution: {
  //     name: 'Name Prueba WMS',
  //     description: 'Description Prueba',
  //     url: 'https://www.ign.es',
  //     contentAttributions: 'https://componentes.cnig.es/api-core/files/attributions/WMTS_PNOA_20170220/atribucionPNOA_Url.kml',
  //     contentType: 'kml',
  // },
}, {
  // minZoom: 5,
  // maxZoom: 10,
  // numZoomLevels: 4,
  // numZoomLevels: 20,
  // singleTile: false,
  // singleTile: true,
  // animated: false,
  // animated: true,
  // format: 'image/png',
  // styles: 'municipios_transparente',
  // sldBody: sldBody,
  // ratio: 1,
  // ratio: 100,
  // crossOrigin: true,
  // crossOrigin: 'anonymous',
  // minScale: 2000000,
  // maxScale: 7000000,
  // minResolution: 705.5551745557614,
  // maxResolution: 2469.443110945165,
  // params: {},
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

export const wms_002 = 'WMS*Unidadesadministrativa*http://www.ign.es/wms-inspire/unidades-administrativas?*AU.AdministrativeUnit*false*true**1.3.0*true*true*true';

export const wms_003 = new WMS(
  {
    url: 'http://geostematicos-sigc.es/geoserver/tematicos/wms?',
    name: 'tematicos:Municipios',
    tiled: false,
    transparent: true,
  },
  {
    styles: 'infrarrojo',
  },
  {
    source: new OLSourceImageWMS({
      url: 'http://geostematicos-sigc.juntadeandalucia.es/geoserver/tematicos/wms?',
      params: {
        'LAYERS': 'tematicos:Provincias',
        'TILED': true,
        'TRANSPARENT': false,
        'STYLES': 'polygon',
      },
      ratio: 1,
      serverType: 'geoserver',
    }),
  },
);
