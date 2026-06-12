import { map as Mmap } from 'IDEE/api-idee';
import Feature from 'IDEE/feature/Feature';
import Vector from 'IDEE/layer/Vector';
import Generic from 'IDEE/style/Generic';
import { CLAMP_TO_GROUND, CLAMP_TO_TERRAIN, NONE } from 'IDEE/style/HeightReference';

const mapa = Mmap({
  container: 'map',
  center: [-3.913643280093657, 37.730089374170156],
  zoom: 8,
});
window.mapa = mapa;

const capa = new Vector({
  name: 'Capa vectorial',
});
window.capa = capa;

mapa.addLayers(capa);

// Example #1: Etiquetas en puntos 2D
const point = new Feature('point_2d', {
  'type': 'Feature',
  'properties': {},
  'geometry': {
    'type': 'Point',
    'coordinates': [
      -3.7038,
      40.4168,
    ],
  },
});
window.point = point;
capa.addFeatures([point]);

const estilo_point = new Generic({
  point: {
    radius: 20,
    fill: {
      color: 'red',
    },
    label: {
      text: 'Punto',
      font: 'bold 16px Courier New',
      scale: 0.8,
      align: 'center',
      baseline: 'center',
      color: 'blue',
      // offset: [0, -20],
    },
    heightReference: CLAMP_TO_TERRAIN,
  },
});
capa.setStyle(estilo_point);

// Example #2: Etiquetas en puntos 3D
// const point_3d = new Feature('point_3d', {
//   'type': 'Feature',
//   'properties': {},
//   'geometry': {
//     'type': 'Point',
//     'coordinates': [
//       -3.7038,
//       40.4168,
//       10667,
//     ],
//   },
// });
// window.point_3d = point_3d;
// capa.addFeatures([point_3d]);

// const estilo_point_3d = new Generic({
//   point: {
//     radius: 20,
//     fill: {
//       color: 'red',
//     },
//     label: {
//       text: 'Punto',
//       font: 'bold 16px Courier New',
//       scale: 0.8,
//       align: 'center',
//       baseline: 'center',
//       color: 'blue',
//       offset: [0, -20],
//     },
//   },
// });
// capa.setStyle(estilo_point_3d);

// Example #3: Etiquetas en polígonos 2D
// const polygon = new Feature('polygon_2d', {
//   'type': 'Feature',
//   'properties': {},
//   'geometry': {
//     'type': 'Polygon',
//     'coordinates': [
//       [
//         [-3.7156228440037515, 38.53704121621672],
//         [-1.2900078769890575, 38.544780365403625],
//         [-2.3691589242827553, 38.26563992005367],
//         [-3.171097541564646, 37.586610085487976],
//         [-4.933381112424118, 38.2423293549536],
//         [-3.161196642485784, 39.13052967351828],
//         [-3.7156228440037515, 38.53704121621672],
//       ],
//     ],
//   },
// });
// window.polygon = polygon;

// capa.addFeatures([polygon]);

// const estilo_polygon = new Generic({
//   polygon: {
//     fill: {
//       color: 'blue',
//       // opacity: 0.5,
//     },
//     label: {
//       text: 'Polígono',
//       font: 'bold 16px Courier New',
//       scale: 0.8,
//       align: 'center',
//       baseline: 'center',
//       // offset: [0, -20],
//     },
//     heightReference: CLAMP_TO_GROUND,
//   },
// });

// capa.setStyle(estilo_polygon);

// Example #4: Etiquetas en polígonos 3D
// const polygon_3d = new Feature('polygon_3d', {
//   'type': 'Feature',
//   'properties': {},
//   'geometry': {
//     'type': 'Polygon',
//     'coordinates': [
//       [
//         [-3.897084726562509, 37.843534777598265, 394.376],
//         [-3.4686179296875093, 38.11199327312772, 345.8],
//         [-3.4026999609375093, 38.00819035261267, 740.267],
//         [-3.8915915625000093, 37.84787254170713, 467.741],
//         [-3.897084726562509, 37.843534777598265, 394.376],
//       ],
//     ],
//   },
// });
// window.polygon_3d = polygon_3d;

// capa.addFeatures([polygon_3d]);

// const estilo_polygon_3d = new Generic({
//   polygon: {
//     fill: {
//       color: 'blue',
//       // opacity: 0.5,
//     },
//     label: {
//       text: 'Polígono',
//       font: 'bold 16px Courier New',
//       scale: 0.8,
//       align: 'center',
//       baseline: 'center',
//       // offset: [0, -20],
//     },
//     extrudedHeight: 10000,
//   },
// });

// capa.setStyle(estilo_polygon_3d);

// Example #5: Etiquetas en líneas 2D
// const line = new Feature('line_2d', {
//   'type': 'Feature',
//   'properties': {},
//   'geometry': {
//     'type': 'LineString',
//     'coordinates': [
//       [-4.5387840672967625, 36.689359474719424],
//       [-4.5209312840936375, 36.75650477236586],
//       [-4.46119312491395, 36.75210360063561],
//       [-4.4371605321405125, 36.775206935145206],
//       [-4.3767357274530125, 36.75155343641612],
//     ],
//   },
// });

// // const line = new Feature('line_2d', {
// //   'type': 'Feature',
// //   'properties': {},
// //   'geometry': {
// //     'type': 'LineString',
// //     'coordinates': [
// //       [-5.973815917968764, 37.38761749978394],
// //       [-4.784545898437513, 37.907366581454966],
// //     ],
// //   },
// // });
// window.line = line;

// capa.addFeatures([line]);

// const estilo_line = new Generic({
//   line: {
//     fill: {
//       color: 'green',
//       width: 15,
//     },
//     stroke: {
//       color: 'red',
//       width: 20,
//     },
//     label: {
//       text: 'Línea',
//       font: 'bold 16px Courier New',
//       scale: 0.8,
//       align: 'center',
//       baseline: 'center',
//       color: 'blue',
//       // offset: [0, -20],
//     },
//     heightReference: CLAMP_TO_TERRAIN,
//   },
// });

// capa.setStyle(estilo_line);

// Example #6: Etiquetas en líneas 3D
// const line_3d = new Feature('line_3d', {
//   'type': 'Feature',
//   'properties': {},
//   'geometry': {
//     'type': 'LineString',
//     'coordinates': [
//       [-3.7982077734375097, 38.10767109165957, 408.312], // 10408.312
//       [-7.725820078125008, 38.12495828299171, 0],
//     ],
//   },
// });
// window.line_3d = line_3d;

// capa.addFeatures([line_3d]);

// const estilo_line_3d = new Generic({
//   line: {
//     fill: {
//       color: 'green',
//       width: 5,
//     },
//     stroke: {
//       color: 'red',
//       width: 15,
//     },
//     label: {
//       text: 'Línea',
//       font: 'bold 16px Courier New',
//       scale: 0.8,
//       align: 'center',
//       baseline: 'center',
//       color: 'blue',
//       offset: [0, -10],
//     },
//   },
// });

// capa.setStyle(estilo_line_3d);
