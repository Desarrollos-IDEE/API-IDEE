import { map as Mmap } from 'M/mapea';
import WMS from 'M/layer/WMS';
import WFS from 'M/layer/WFS';
import Generic from 'M/layer/Generic';
import ImageWMS from 'ol/source/ImageWMS.js';
import { Image, Vector as VectorLayer } from 'ol/layer.js';
import VectorSource from 'ol/source/Vector.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import { bbox as bboxStrategy } from 'ol/loadingstrategy.js';
import Style from 'ol/style/Style';
import Stroke from 'ol/style/Stroke';
import Polygon from 'M/style/Polygon';
import { EQUAL } from 'M/filter/Filter';

const mapa = Mmap({
  container: 'map',
  projection: 'EPSG:3857*m',
  layers: ['OSM'],
  controls: ['scale', 'getfeatureinfo'],
  bbox: [-2453322.859841021, 4116592.5953264493, 1460252.9883600033, 4967795.342310172]
});
window.mapa = mapa;

// WMS
const layer = new Generic(null, null, new Image({
  source: new ImageWMS({
    url: 'http://geostematicos-sigc.juntadeandalucia.es/geoserver/tematicos/wms?',
    params: { 'LAYERS': 'tematicos:Municipios' },
  }),
}));
window.generic = layer;
mapa.addLayers(layer);





// var sldBody = '<?xml version="1.0" encoding="ISO-8859-1"?>' +
//   '<StyledLayerDescriptor version="1.0.0" ' +
//   'xmlns="http://www.opengis.net/sld" ' +
//   'xmlns:ogc="http://www.opengis.net/ogc" ' +
//   'xmlns:xlink="http://www.w3.org/1999/xlink" ' +
//   'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
//   '<NamedLayer>' +
//   '<Name>tematicos:Municipios</Name>' +
//   '<UserStyle>' +
//   '<FeatureTypeStyle>' +
//   '<Rule>' +
//   '<Name>Rule 1</Name>' +
//   '<Title>RedFill RedOutline</Title>' +
//   '<Abstract>50% transparent red fill with a red outline 1 pixel in width</Abstract>' +
//   '<PolygonSymbolizer>' +
//   '<Fill>' +
//   '<CssParameter name="fill">#1E1BE8</CssParameter>' +
//   '</Fill>' +
//   '<Stroke>' +
//   '<CssParameter name="stroke">#E81B8E</CssParameter>' +
//   '<CssParameter name="stroke-width">1</CssParameter>' +
//   '</Stroke>' +
//   '</PolygonSymbolizer>' +
//   '</Rule>' +
//   '</FeatureTypeStyle>' +
//   '</UserStyle>' +
//   '</NamedLayer>' +
//   '</StyledLayerDescriptor>';


// // WMS
// // const layer = new Generic({ name: 'capaGenerica', legend: 'leyenda de la capa', /*maxExtent: [-906390.2814056224, 4469273.043834256, -612872.0927905457, 4542958.3391011655]*/ }, {
// //   // minZoom: 6,
// //   // maxZoom: 10,
// //   // opacity: 0.2
// //   // visibility: true,
// //   // displayInLayerSwitcher: false,
// //   // queryable: false,
// //   // version: '1.2.0',
// //   // format: 'image/jpeg'
// //   // maxScale: 7000000,
// //   // minScale: 2000000
// //   // maxResolution: 2469.443110945165,
// //   // minResolution: 705.5551745557614
// //   // styles: 'municipios_transparente'
// //   //sldBody: sldBody
// // }, new Image({
// //   // extent: [-906390.2814056224, 4469273.043834256, -612872.0927905457, 4542958.3391011655],
// //   source: new ImageWMS({
// //     url: 'http://geostematicos-sigc.juntadeandalucia.es/geoserver/tematicos/wms?',
// //     params: { 'LAYERS': 'tematicos:Municipios' },
// //   }),
// // }));
// // window.generic = layer;
// // mapa.addLayers(layer);


// // WFS

// const s = new Polygon({
//   fill: {
//     color: 'orange',
//     opacity: 0.5,
//   },
//   stroke: {
//     color: 'black',
//     width: 1,
//   },
//   label: {
//     text(feature) {
//       return (feature.getAttribute('nombre'));
//     },
//     color: 'black',
//     stroke: {
//       color: '#E5FFCC',
//       width: 3,
//     },
//   },
// });
// window.s = s;

// var wfsUrl = 'https://geostematicos-sigc.juntadeandalucia.es/geoserver/tematicos/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=tematicos:Provincias&maxFeatures=50&outputFormat=application%2Fjson';


// var wfsLayer = new VectorLayer({
//   source: new VectorSource({
//     format: new GeoJSON(),
//     url: wfsUrl,
//     strategy: bboxStrategy
//   }),
//   // style: new Style({
//   //   stroke: new Stroke({
//   //     color: 'red',
//   //     width: 2
//   //   })
//   // })
// });
// window.wfsLayer = wfsLayer;

// const layerWFS = new Generic({ name: 'Provincias', namespace: 'tematicos', legend: 'leyenda de la capa' /*, ids: '1,2', cql: "nombre LIKE '%ada%'"*/ }, {}, wfsLayer);

// window.generic = layerWFS;
// // window.o = generic.getImpl().getOL3Layer();
// mapa.addLayers(layerWFS);

// const filtro = EQUAL("nombre", "Sevilla");
// window.f = filtro;

// const lyProvincias = new WFS({
//   name: 'Provincias',
//   url: 'http://geostematicos-sigc.juntadeandalucia.es/geoserver/tematicos/wfs',
//   namespace: 'tematicos',
//   // ids: '1,2',
//   cql: "nombre LIKE '%ada%'"
// });
// window.w = lyProvincias;
// // mapa.addLayers(lyProvincias);





// // const a = new ImageLayer({
// //   source: new ImageWMS({
// //     url: 'https://geoserver.ayesa.link/geoserver/sbvArch/wms',
// //     params: { 'LAYERS': 'sbvArch:SBV_ARCHIVOS_PROV' },
// //     ratio: 1,
// //     serverType: 'geoserver',
// //   }),
// // });
// // window.a = a;
// // mapa.getMapImpl().addLayer(a);

// // const layer = new Generic({ /*legend: 'Capa Genérica', name: 'nombreCapa'*/ }, {
// //   // visibility: true /*, maxZoom: 6, minZoom: 4*/ ,
// //   // displayInLayerSwitcher: true,
// //   // format: 'image/jpeg'
// //   // styles: 'municipios_transparente'
// //   // sldBody: sldBody
// //   // minResolution: 2469.443110945165,
// //   // maxResolution: 4938.88622189033
// //   /*, minScale: 7000000, maxScale: 14000000*/
// // }, new Image({
// //   // extent: [-906390.2814056224, 4469273.043834256, -612872.0927905457, 4542958.3391011655],
// //   source: new ImageWMS({
// //     url: 'http://geostematicos-sigc.juntadeandalucia.es/geoserver/tematicos/wms?',
// //     params: { 'LAYERS': 'tematicos:Municipios' },
// //     // ratio: 1,
// //     // serverType: 'geoserver',
// //   }),
// // }));
// // window.layer = layer;
// // mapa.addLayers(layer);

// // const layerUA = new WMS({
// //   url: 'http://geostematicos-sigc.juntadeandalucia.es/geoserver/tematicos/wms?',
// //   name: 'tematicos:Municipios',
// //   legend: 'Capa WMS',
// // }, { /*sldBody: sldBody*/ /*styles: 'municipios_transparente'*/ numZoomLevels: 10 });
// // window.capaWMS = layerUA;

// const layerUA = new WMS({
//   url: 'http://geostematicos-sigc.juntadeandalucia.es/geoserver/tematicos/wms?',
//   name: 'tematicos:Provincias',
//   legend: 'Capa WMS',
//   maxExtent: [-906390.2814056224, 4469273.043834256, -612872.0927905457, 4542958.3391011655]
// }, { maxExtent: [-906390.2814056224, 4469273.043834256, -612872.0927905457, 4542958.3391011655] });
// window.wms = layerUA;
// // mapa.addLayers(layerUA);
