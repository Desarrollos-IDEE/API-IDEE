import { map as Mmap, proxy } from 'IDEE/mapea';
import KML from 'IDEE/layer/KML';
import Polygon from 'IDEE/style/Polygon';
import Point from 'IDEE/style/Point';
import Line from 'IDEE/style/Line';
import Generic from 'IDEE/style/Generic';
import Feature from 'IDEE/feature/Feature';
import { RELATIVE_TO_GROUND, CLAMP_TO_GROUND } from 'IDEE/style/HeightReference';

const mapa = Mmap({
  container: 'map',
  // center: [-2.6500293374200043, 38.084110463186356],
  // zoom: 16,
  // center: [-2.4346338172007647, 38.21091566529102],
  // zoom: 13,
  center: [-2.4102567843683675, 38.01344516161474],
  zoom: 10,
});
window.mapa = mapa;

proxy(false);

// Example #1
const kml = new KML({
  url: 'http://localhost:8081/test/development/CP-0005-cesium/KML/Poligonos.kml',
  name: 'KML',
}, {
  clampToGround: true,
  extractStyles: true,
  height: 0,
  style: new Polygon({
    fill: {
      color: 'red',
      opacity: 0.5,
    },
    stroke: {
      color: 'blue',
    },
    heightReference: CLAMP_TO_GROUND,
    perPositionHeight: false,
    extrudedHeight: 1,
    extrudedHeightReference: RELATIVE_TO_GROUND,
  }),
});
window.kml = kml;
mapa.addLayers(kml);

// Example #2
// const kml = new KML({
//   url: 'http://localhost:8081/test/development/CP-0005-cesium/KML/Lineas.kml',
//   name: 'KML',
// }, {
//   clampToGround: true,
//   extractStyles: false,
// });
// window.kml = kml;
// mapa.addLayers(kml);

// const style = new Line({
//   stroke: {
//     color: 'red',
//     width: 3,
//   },
//   fill: {
//     color: 'blue',
//     opacity: 0.6,
//     width: 8,
//   },
// });
// window.style = style;
// kml.setStyle(style);

// Example #3
// const kml = new KML({
//   url: 'http://localhost:8081/test/development/CP-0005-cesium/KML/Puntos_1.kml',
//   name: 'KML',
// }, {
//   clampToGround: true,
//   extractStyles: false,
//   style: new Point({
//     radius: 10,
//     stroke: {
//       color: 'red',
//       width: 3,
//     },
//     fill: {
//       color: 'blue',
//       opacity: 0.5,
//     },
//     heightReference: CLAMP_TO_GROUND,
//   }),
// });
// window.kml = kml;
// mapa.addLayers(kml);

// Example #4
// const kml = new KML({
//   url: 'http://localhost:8081/test/development/CP-0005-cesium/KML/Poligonos.kml',
//   name: 'KML',
// }, {
//   clampToGround: true,
//   extractStyles: false,
//   height: 0,
// });
// window.kml = kml;
// mapa.addLayers(kml);

// const style = new Generic({
//   polygon: {
//     stroke: {
//       color: 'red',
//       width: 3,
//     },
//     fill: {
//       color: 'blue',
//       opacity: 0.5,
//     },
//     heightReference: CLAMP_TO_GROUND,
//     perPositionHeight: false,
//     extrudedHeight: 500,
//     extrudedHeightReference: RELATIVE_TO_GROUND,
//   },
// });
// window.style = style;
// kml.setStyle(style);
