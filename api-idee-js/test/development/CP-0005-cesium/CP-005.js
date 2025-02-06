import { map as Mmap, proxy } from 'IDEE/mapea';
import WFS from 'IDEE/layer/WFS';
import Polygon from 'IDEE/style/Polygon';
import Point from 'IDEE/style/Point';
import Generic from 'IDEE/style/Generic';
import Line from 'IDEE/style/Line';
import { CLAMP_TO_GROUND, RELATIVE_TO_GROUND } from 'IDEE/style/HeightReference';

proxy(false);

const mapa = Mmap({
  container: 'map',
  // center: [-7.2514912225943045, 42.389254280567364],
  // zoom: 9,
  center: [-4.411786942903639, 38.623999248484395],
  zoom: 8,
});
window.mapa = mapa;

// Example #1
// const wfs = new WFS({
//   namespace: 'Public',
//   name: 'superadmin_poligonos_20220713_133056',
//   url: 'https://hcsigc-geoserver-sigc.desarrollo.guadaltel.es/geoserver/Public/ows?',
//   legend: 'Poligonos',
// }, {
//   clampToGround: true,
//   height: 0,
//   style: new Polygon({
//     fill: {
//       color: 'red',
//       opacity: 0.6,
//     },
//     stroke: {
//       color: 'blue',
//       width: 3,
//     },
//     perPositionHeight: false,
//     heightReference: CLAMP_TO_GROUND,
//     extrudedHeight: (feature) => {
//       return feature.getAttribute('x_geometry_row') * 100;
//     },
//     extrudedHeightReference: RELATIVE_TO_GROUND,
//   }),
// });
// window.wfs = wfs;
// mapa.addLayers(wfs);

// Example #2
// const wfs = new WFS({
//   namespace: 'Public',
//   name: 'superadmin_lineas_20220713_13318',
//   url: 'https://hcsigc-geoserver-sigc.desarrollo.guadaltel.es/geoserver/Public/ows?',
//   legend: 'Lineas',
// }, {
//   clampToGround: true,
// });
// window.wfs = wfs;
// mapa.addLayers(wfs);

// const style = new Line({
//   fill: {
//     color: 'red',
//     opacity: 0.6,
//     width: 8,
//   },
//   stroke: {
//     color: 'blue',
//     width: 3,
//   },
// });
// window.style = style;
// wfs.setStyle(style);

// Example #3
// const wfs = new WFS({
//   namespace: 'gonce',
//   name: 'a1666093351106_colegios',
//   url: 'https://demos.guadaltel.es/geoserver/gonce/ows?',
//   legend: 'Colegios',
//   cql: "MUNICIPIO LIKE '%Granada%'",
// }, {
//   clampToGround: true,
//   style: new Point({
//     fill: {
//       color: 'red',
//       opacity: 0.6,
//     },
//     stroke: {
//       color: 'blue',
//       width: 3,
//     },
//     heightReference: CLAMP_TO_GROUND,
//   }),
// });
// window.wfs = wfs;
// mapa.addLayers(wfs);

// Example #4
const wfs = new WFS({
  namespace: 'gonce',
  name: 'a1666093351106_colegios',
  url: 'https://demos.guadaltel.es/geoserver/gonce/ows?',
  legend: 'Colegios',
  cql: "MUNICIPIO LIKE '%Ronda%'",
}, {
  clampToGround: true,
});
window.wfs = wfs;
mapa.addLayers(wfs);

const style = new Generic({
  point: {
    fill: {
      color: 'red',
      opacity: 0.6,
    },
    stroke: {
      color: 'blue',
      width: 3,
    },
    heightReference: CLAMP_TO_GROUND,
  },
});
window.style = style;
wfs.setStyle(style);
