import { map as Mmap, proxy } from 'IDEE/mapea';
import GenericVector from 'IDEE/layer/GenericVector';
import Polygon from 'IDEE/style/Polygon';
import Point from 'IDEE/style/Point';
import Generic from 'IDEE/style/Generic';
import Line from 'IDEE/style/Line';
import { CLAMP_TO_GROUND, RELATIVE_TO_GROUND } from 'IDEE/style/HeightReference';
import { GeoJsonDataSource } from 'cesium';

proxy(false);

const mapa = Mmap({
  container: 'map',
  // center: [-3.6834651068043116, 40.47460459090459],
  // zoom: 16,
  center: [-4.74473722181052, 39.64103358675292],
  zoom: 8,
});
window.mapa = mapa;

// Example #1
// const geojson = new GeoJsonDataSource();
// geojson.load('http://localhost:8081/test/development/CP-0005-cesium/edificiosBTN_2D.geojson');

// const generic_vector = new GenericVector({
//   name: 'Poligonos',
//   legend: 'Capa Generic',
// }, {
//   height: 0,
//   style: new Polygon({
//     stroke: {
//       color: 'red',
//     },
//     fill: {
//       color: 'blue',
//       opacity: 0.7,
//     },
//     perPositionHeight: false,
//     heightReference: CLAMP_TO_GROUND,
//     extrudedHeight: 100,
//     extrudedHeightReference: RELATIVE_TO_GROUND,
//   }),
// }, geojson);
// window.generic = generic_vector;
// mapa.addLayers(generic_vector);

// Example #2
// const geojson = new GeoJsonDataSource();
// geojson.load('https://hcsigc-geoserver-sigc.desarrollo.guadaltel.es/geoserver/Public/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=Public%3Asuperadmin_lineas_20220713_13318&maxFeatures=50&outputFormat=application%2Fjson&srsname=EPSG:4326');

// const generic_vector = new GenericVector({
//   name: 'Lineas',
//   legend: 'Capa Generic',
// }, {}, geojson);
// window.generic = generic_vector;
// mapa.addLayers(generic_vector);

// const style = new Line({
//   stroke: {
//     color: 'red',
//     width: 3,
//   },
//   fill: {
//     width: 8,
//     color: 'blue',
//     opacity: 0.7,
//   },
// });
// window.style = style;
// generic_vector.setStyle(style);

// Example #3
const geojson = new GeoJsonDataSource();
geojson.load('https://hcsigc-geoserver-sigc.desarrollo.guadaltel.es/geoserver/Public/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=Public%3Asuperadmin_puntos_20220713_133120&maxFeatures=50&outputFormat=application%2Fjson&srsname=EPSG:4326');

const generic_vector = new GenericVector({
  name: 'Puntos',
  legend: 'Capa Generic',
}, {
  style: new Point({
    radius: 10,
    stroke: {
      color: 'red',
      width: 3,
    },
    fill: {
      color: 'blue',
      opacity: 0.7,
    },
    heightReference: CLAMP_TO_GROUND,
  }),
}, geojson);
window.generic = generic_vector;
mapa.addLayers(generic_vector);

// Example #4
// const geojson = new GeoJsonDataSource();
// geojson.load('https://hcsigc-geoserver-sigc.desarrollo.guadaltel.es/geoserver/Public/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=Public%3Asuperadmin_lineas_20220713_13318&maxFeatures=50&outputFormat=application%2Fjson&srsname=EPSG:4326');

// const generic_vector = new GenericVector({
//   name: 'Lineas',
//   legend: 'Capa Generic',
// }, {}, geojson);
// window.generic = generic_vector;
// mapa.addLayers(generic_vector);

// const style = new Generic({
//   line: {
//     stroke: {
//       color: 'red',
//       width: 3,
//     },
//     fill: {
//       width: 8,
//       color: 'blue',
//       opacity: 0.7,
//     },
//   },
// });
// window.style = style;
// generic_vector.setStyle(style);
