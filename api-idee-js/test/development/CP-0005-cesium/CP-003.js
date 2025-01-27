import { map as Mmap, proxy } from 'IDEE/mapea';
import OGCAPIFeatures from 'IDEE/layer/OGCAPIFeatures';
import Polygon from 'IDEE/style/Polygon';
import Point from 'IDEE/style/Point';
import Generic from 'IDEE/style/Generic';
import Line from 'IDEE/style/Line';
import { CLAMP_TO_GROUND, RELATIVE_TO_GROUND } from 'IDEE/style/HeightReference';

proxy(false);

const mapa = Mmap({
  container: 'map',
  center: [-7.2514912225943045, 42.389254280567364],
  zoom: 9,
  // zoom: 12,
});
window.mapa = mapa;

// Example #1
// const ogc = new OGCAPIFeatures({
//   url: 'https://api-features.idee.es/collections/',
//   name: 'falls',
//   legend: 'Capa OGCAPIFeatures',
//   limit: 20,
// }, {
//   clampToGround: true,
//   style: new Point({
//     radius: 10,
//     stroke: {
//       color: 'red',
//       width: 3,
//     },
//     fill: {
//       color: 'blue',
//       opacity: 0.7,
//     },
//     heightReference: CLAMP_TO_GROUND,
//   }),
// });
// window.ogc = ogc;
// mapa.addLayers(ogc);

// Example #2
const ogc = new OGCAPIFeatures({
  url: 'https://api-features.idee.es/collections/',
  name: 'falls',
  legend: 'Capa OGCAPIFeatures',
  limit: 20,
}, {
  clampToGround: true,
  style: new Generic({
    point: {
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
    },
  }),
});
window.ogc = ogc;
mapa.addLayers(ogc);

// Example #3
// const ogc = new OGCAPIFeatures({
//   url: 'https://api-features.idee.es/collections/',
//   name: 'falls',
//   legend: 'Capa OGCAPIFeatures',
//   limit: 20,
// }, {
//   clampToGround: true,
// });
// window.ogc = ogc;
// mapa.addLayers(ogc);

// const style = new Point({
//   radius: 10,
//   stroke: {
//     color: 'red',
//     width: 3,
//   },
//   fill: {
//     color: 'blue',
//     opacity: 0.7,
//   },
//   heightReference: CLAMP_TO_GROUND,
// });
// window.style = style;
// // ogc.setStyle(style); // por consola

// Example #4
// const ogc = new OGCAPIFeatures({
//   url: 'https://api-features.idee.es/collections/',
//   name: 'falls',
//   legend: 'Capa OGCAPIFeatures',
//   limit: 20,
// }, {
//   clampToGround: true,
//   style: new Generic({
//     point: {
//       radius: 10,
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
// window.ogc = ogc;
// // mapa.addLayers(ogc); // por consola

// Example #5
// const ogc = new OGCAPIFeatures({
//   url: 'https://api-features.idee.es/collections/',
//   name: 'watercourselinksequence',
//   legend: 'Capa de rutas',
//   limit: 20,
// }, {
//   clampToGround: true,
//   style: new Line({
//     stroke: {
//       color: 'red',
//       width: 3,
//     },
//     fill: {
//       color: 'blue',
//       opacity: 0.7,
//     },
//   }),
// });
// window.ogc = ogc;
// mapa.addLayers(ogc);

// Example #6
// const ogc = new OGCAPIFeatures({
//   url: 'https://api-features.idee.es/collections/',
//   name: 'riverbasin',
//   legend: 'Cuencas hidrográficas',
//   limit: 20,
// }, {
//   clampToGround: true,
//   height: 0,
// });
// window.ogc = ogc;
// mapa.addLayers(ogc);

// const style = new Polygon({
//   fill: {
//     color: 'blue',
//     opacity: 0.6,
//   },
//   stroke: {
//     color: 'red',
//   },
//   perPositionHeight: false,
//   heightReference: CLAMP_TO_GROUND,
//   extrudedHeight: (feature) => {
//     return feature.getAttribute('area') / 100000;
//   },
//   extrudedHeightReference: RELATIVE_TO_GROUND,
// });
// window.style = style;
// ogc.setStyle(style);
