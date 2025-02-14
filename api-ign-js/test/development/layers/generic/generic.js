/* eslint-disable camelcase */
import ImageWMS from 'ol/source/ImageWMS';
import GenericRaster from 'M/layer/GenericRaster';
import GenericVector from 'M/layer/GenericVector';
import Polygon from 'M/style/Polygon';// eslint-disable-line no-unused-vars
import { Image, Vector as VectorLayer } from 'ol/layer';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import WKT from 'ol/format/WKT';
import Static from 'ol/source/ImageStatic';
import { bbox as bboxStrategy } from 'ol/loadingstrategy';
import { Fill, Stroke, Style } from 'ol/style';

const sldBody = '<?xml version="1.0" encoding="ISO-8859-1"?>' +
  '<StyledLayerDescriptor version="1.0.0" ' +
  'xmlns="http://www.opengis.net/sld" ' +
  'xmlns:ogc="http://www.opengis.net/ogc" ' +
  'xmlns:xlink="http://www.w3.org/1999/xlink" ' +
  'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
  '<NamedLayer>' +
  '<Name>tematicos:Municipios</Name>' +
  '<UserStyle>' +
  '<FeatureTypeStyle>' +
  '<Rule>' +
  '<Name>Rule 1</Name>' +
  '<Title>RedFill RedOutline</Title>' +
  '<Abstract>50% transparent red fill with a red outline 1 pixel in width</Abstract>' +
  '<PolygonSymbolizer>' +
  '<Fill>' +
  '<CssParameter name="fill">#1E1BE8</CssParameter>' +
  '</Fill>' +
  '<Stroke>' +
  '<CssParameter name="stroke">#E81B8E</CssParameter>' +
  '<CssParameter name="stroke-width">1</CssParameter>' +
  '</Stroke>' +
  '</PolygonSymbolizer>' +
  '</Rule>' +
  '</FeatureTypeStyle>' +
  '</UserStyle>' +
  '</NamedLayer>' +
  '</StyledLayerDescriptor>';

export const generic_001 = new GenericRaster({
  name: 'Nombre de prueba',
  // name: 'Segundo nombre de prueba',
  // isBase: false,
  // isBase: true,
  // transparent: true,
  // transparent: false,
  legend: 'capaGenericRaster',
  // legend: 'capaGenericRaster de prueba',
  // version: '1.2.0',
  // maxExtent: [-952551.7366869409, 4498177.065457279, -669276.1098620776, 4562995.6654431075],
  // attribution: {
  //   name: 'Name Prueba GeoJSON',
  //   description: 'Description Prueba',
  //   url: 'https://www.ign.es',
  //   contentAttributions: 'https://componentes.cnig.es/api-core/files/attributions/WMTS_PNOA_20170220/atribucionPNOA_Url.kml',
  //   contentType: 'kml',
  // },
  // minZoom: 1,
  // maxZoom: 5,
}, {
  // minZoom: 5,
  // maxZoom: 10,
  visibility: true,
  // visibility: false,
  displayInLayerSwitcher: true,
  // displayInLayerSwitcher: false,
  // opacity: 0,
  opacity: 0.5,
  // opacity: 1,
  // minZoom: 5,
  // maxZoom: 7,
  // format: 'image/jpeg',
  // sldBody: sldBody,
  // styles: 'municipios_transparente',
  queryable: true,
  // queryable: false,
  // minScale: 2000000,
  // maxScale: 7000000,
  // minResolution: 705.5551745557614,
  // maxResolution: 2469.443110945165,
}, new Image({
source: new ImageWMS({
  url: 'http://geostematicos-sigc.juntadeandalucia.es/geoserver/tematicos/wms?',
  params: { LAYERS: 'tematicos:Municipios' },
}),
// extent: [-952551.7366869409, 4498177.065457279, -669276.1098620776, 4562995.6654431075],
}));

// ERROR: No funciona opacity al 0

export const generic_002 = new GenericVector({
  // name: 'Nombre Vector generico',
  // legend: 'Leyenda Vector generico',
  // ids: '1,2',
  // version: '1.2.0',
  // extract: true,
  // extract: false,
  // infoEventType: 'hover',
  // infoEventType: 'click',
  // maxExtent: [-952551.7366869409, 4498177.065457279, -669276.1098620776, 4562995.6654431075],
  // attribution: {
  //   name: 'Name Prueba GeoJSON',
  //   description: 'Description Prueba',
  //   url: 'https://www.ign.es',
  //   contentAttributions: 'https://componentes.cnig.es/api-core/files/attributions/WMTS_PNOA_20170220/atribucionPNOA_Url.kml',
  //   contentType: 'kml',
  // },
  // minZoom: 1,
  // maxZoom: 5,
}, {
  // minZoom: 5,
  // maxZoom: 10,
  // sldBody,
  // cql: "nombre LIKE '%ada%'",
  // attribution: {
  //   name: 'Name Prueba GeoJSON',
  //   description: 'Description Prueba',
  //   url: 'https://www.ign.es',
  //   contentAttributions: 'https://componentes.cnig.es/api-core/files/attributions/WMTS_PNOA_20170220/atribucionPNOA_Url.kml',
  //   contentType: 'kml',
  // },
  // displayInLayerSwitcher: false,
  // displayInLayerSwitcher: true,
  // visibility: false,
  // visibility: true,
  // minZoom: 5,
  // maxZoom: 7,
  // opacity: 0,
  // opacity: 0.5,
  // opacity: 1,
  // style: new Polygon({
  //   fill: {
  //     color: 'red',
  //   },
  // }),
}, new VectorLayer({
source: new VectorSource({
  format: new GeoJSON(),
  url: 'https://geostematicos-sigc.juntadeandalucia.es/geoserver/tematicos/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=tematicos:Provincias&maxFeatures=50&outputFormat=application%2Fjson',
  strategy: bboxStrategy,
}),
// extent: [-952551.7366869409, 4498177.065457279, -669276.1098620776, 4562995.6654431075],
style: new Style({
  fill: new Fill({
    color: 'rgba(255, 0, 0, 0.5)', // Relleno rojo semi-transparente
  }),
  stroke: new Stroke({
    color: 'rgba(255, 0, 0, 1)', // Borde rojo
    width: 2, // Ancho del borde
  }),
}),
}));

// ERROR: sldBody no genera ningun efecto
// ERROR: No funciona opacity al 0

export const generic_003 = new GenericRaster({}, {
}, new Image({
  name: 'rasterestatico',
  legend: 'Prueba de leyenda',
  source: new Static({
    attributions: '© <a href="https://xkcd.com/license.html">xkcd</a>',
    url: 'https://imgs.xkcd.com/comics/online_communities.png',
    imageExtent: [-20037508.342789244, -20037508.342789244, 20037508.342789244, 20037508.342789244],
  }),
}));


const wkt = 'POLYGON((-6 30, -6 40,' + '6 40, 6 30, -6 30 ))';
const format = new WKT();

const feature = format.readFeature(wkt, {
  dataProjection: 'EPSG:4326',
  featureProjection: 'EPSG:3857',
});

export const generic_004 = new GenericVector({}, {},
  new VectorLayer({
    source: new VectorSource({
      features: [feature],
    })
  }));