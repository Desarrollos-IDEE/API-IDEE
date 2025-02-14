import { map as Mmap, proxy } from 'IDEE/mapea';
import GeoJSON from 'IDEE/layer/GeoJSON';
import Point from 'IDEE/style/Point';
import Polygon from 'IDEE/style/Polygon';
import Generic from 'IDEE/style/Generic';
import Line from 'IDEE/style/Line';
import { CLAMP_TO_GROUND, RELATIVE_TO_GROUND } from 'IDEE/style/HeightReference';

const mapa = Mmap({
  container: 'map',
  center: [-4.500083297019614, 37.68296192896631],
  // center: [-3.6834651068043116, 40.47460459090459],
  // zoom: 16,
  zoom: 7,
  // center: [-4.74473722181052, 39.64103358675292],
  // zoom: 8,
});
window.mapa = mapa;

proxy(false);

// Example #1
// const geojson = new GeoJSON({
//   url: 'https://hcsigc-geoserver-sigc.desarrollo.guadaltel.es/geoserver/Public/wfs?*&service=WFS&version=1.0.0&request=GetFeature&typename=superadmin_puntos_20220713_133120&outputFormat=application%2Fjson&srsname=EPSG%3A4326',
//   name: 'edificiosBTN',
//   legend: 'edificiosBTN',
//   extract: true,
// }, {
//   clampToGround: true,
//   style: new Point({
//     point: {
//       stroke: {
//         color: 'red',
//         width: 3,
//       },
//       fill: {
//         color: 'blue',
//         opacity: 0.7,
//       },
//       heightReference: CLAMP_TO_GROUND,
//     },
//   }),
// });
// window.geojson = geojson;
// mapa.addLayers(geojson);

// Example #2
// const geojson2 = new GeoJSON({
//   url: 'http://localhost:8081/test/development/CP-0005-cesium/edificiosBTN_2D.geojson',
//   name: 'edificiosBTN',
//   legend: 'edificiosBTN',
//   extract: true,
// }, {
//   clampToGround: true,
//   height: 0,
// });
// window.geojson2 = geojson2;
// mapa.addLayers(geojson2);

// const style = new Polygon({
//   stroke: {
//     color: 'red',
//     width: 3,
//   },
//   fill: {
//     color: 'blue',
//     opacity: 0.7,
//   },
//   perPositionHeight: false,
//   heightReference: CLAMP_TO_GROUND,
//   extrudedHeightReference: RELATIVE_TO_GROUND,
//   extrudedHeight: (feature) => {
//     return feature.getAttribute('n_plantas') * 5;
//   },
// });
// window.style = style;
// geojson2.setStyle(style);

// Example #3
// const geojson3 = new GeoJSON({
//   url: 'http://localhost:8081/test/development/CP-0005-cesium/edificiosBTN.geojson',
//   name: 'edificiosBTN',
//   legend: 'edificiosBTN',
//   extract: true,
// }, {
//   clampToGround: false,
//   height: 0,
//   style: new Polygon({
//     stroke: {
//       color: 'red',
//       width: 3,
//     },
//     fill: {
//       color: 'blue',
//       opacity: 0.7,
//     },
//     perPositionHeight: false,
//     heightReference: CLAMP_TO_GROUND,
//     extrudedHeightReference: RELATIVE_TO_GROUND,
//     extrudedHeight: (feature) => {
//       return feature.getAttribute('n_plantas') * 5;
//     },
//   }),
// });
// window.geojson3 = geojson3;
// // mapa.addLayers(geojson3); // por consola

// Example #4
const geojson = new GeoJSON({
  name: 'edificiosBTN',
  legend: 'edificiosBTN',
  extract: true,
  source: {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: { alumnos: 400, colegios: 2 },
      geometry: {
        type: 'LineString',
        coordinates: [
          [-3.8452148437499996, 37.93553306183642],
          [-1.669921875, 38.42777351132902],
          [-3.27392578125, 37.1165261849112],
        ],
      },
    },
    {
      type: 'Feature',
      properties: { alumnos: 399, colegios: 10 },
      geometry: { type: 'Point', coordinates: [-5.398185534463248, 37.45730370790821] },
    },
    {
      type: 'Feature',
      properties: { alumnos: 400, colegios: 2 },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-5.5810546875, 40.713955826286046],
          [-6.734619140625, 40.153686857794035],
          [-6.383056640625, 39.78321267821705],
          [-6.8994140625, 39.47860556892209],
          [-6.492919921875, 39.39375459224348],
          [-5.833740234375, 39.38526381099774],
          [-5.33935546875, 39.78321267821705],
          [-5.5810546875, 40.713955826286046],
        ]],
      },
    }],
  },
}, {
  clampToGround: true,
  height: 0,
});
window.geojson = geojson;
mapa.addLayers(geojson);

const style = new Generic({
  point: {
    stroke: {
      color: 'red',
      width: 3,
    },
    fill: {
      color: 'blue',
      opacity: 0.7,
    },
    heightReference: CLAMP_TO_GROUND,
  },
  polygon: {
    stroke: {
      color: 'blue',
      width: 3,
    },
    fill: {
      color: 'white',
      opacity: 0.7,
    },
    perPositionHeight: false,
    heightReference: CLAMP_TO_GROUND,
    extrudedHeightReference: RELATIVE_TO_GROUND,
    extrudedHeight: (feature) => {
      return feature.getAttribute('alumnos') * 5;
    },
  },
  line: {
    stroke: {
      color: 'blue',
      width: 5,
    },
    fill: {
      color: 'red',
      opacity: 0.7,
      width: 10,
    },
  },
});
window.style = style;
geojson.setStyle(style);
