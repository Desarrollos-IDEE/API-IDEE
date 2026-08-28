import { map as Mmap, proxy } from 'IDEE/api-idee';
import WFS from 'IDEE/layer/WFS';
import Vector from 'IDEE/layer/Vector';
import Feature from 'IDEE/feature/Feature';
import Generic from 'IDEE/style/Generic';
import { CLAMP_TO_GROUND } from 'IDEE/style/HeightReference';

proxy(false);

const mapa = Mmap({
  container: 'map',
  center: [-5.916880483608407, 37.6841924131165],
  zoom: 7,
});
window.mapa = mapa;

// Example #1: Patrones en polígonos
// Nota: Geometrías en 2D con CLAMP_TO_GROUND no tienen stroke
const estilo = new Generic({
  polygon: {
    stroke: {
      color: '#ff5588',
      width: 4,
    },
    fill: {
      color: 'blue',
      opacity: 0.9,
      pattern: {
        name: 'square',
        scale: 5,
        spacing: 20,
        // rotation: 20,
        // offset: [21, 21],
        color: '#fff',
        // opacity: 0.5,
        repeat: [7, 7],
      },
    },
  },
});

// Example #2: Patrones con imágenes en polígonos
// const estilo = new Generic({
//   polygon: {
//     stroke: {
//       color: '#ff5588',
//       width: 4,
//     },
//     fill: {
//       pattern: {
//         name: 'IMAGE',
//         src: 'https://es.wikipedia.org/static/images/icons/wikipedia.png',
//         scale: 1,
//         repeat: [2, 2],
//       },
//     },
//   },
// });

const distritosSan = new WFS({
  url: 'https://hcsigc.juntadeandalucia.es/geoserver/IECA/wfs?',
  name: 'sigc_distrito_sanitario_1724755018396',
  legend: 'Distritos Sanitarios',
  geometry: 'POLYGON',
  ids: '28',
  extract: true,
});

distritosSan.setStyle(estilo);
mapa.addLayers(distritosSan);

// Example #3: Patrones en líneas
// const estilo = new Generic({
//   line: {
//     // stroke: {
//     //   color: '#ff5588',
//     //   width: 10,
//     // },
//     fill: {
//       width: 40,
//       color: 'blue',
//       opacity: 0.6,
//       pattern: {
//         name: 'circle',
//         scale: 2,
//         spacing: 10,
//         // rotation: 20,
//         // offset: 100,
//         color: '#fff',
//         // opacity: 0.5,
//         repeat: [7, 2],
//       },
//     },
//   },
// });

// Example #4: Patrones con imágenes en líneas
// const estilo = new Generic({
//   line: {
//     stroke: {
//       color: '#ff5588',
//       width: 4,
//     },
//     fill: {
//       width: 40,
//       pattern: {
//         name: 'Image',
//         src: 'https://es.wikipedia.org/static/images/icons/wikipedia.png',
//         scale: 1,
//         // repeat: [2, 2],
//       },
//     },
//   },
// });

// const capaVectorial = new Vector({
//   name: 'Capa 2',
// });

// const f1 = new Feature('f1', {
//   'type': 'Feature',
//   'properties': {},
//   'geometry': {
//     'type': 'LineString',
//     'coordinates': [
//       [-3.7982077734375097, 38.10767109165957, 408.312],
//       [-7.725820078125008, 38.12495828299171, 0],
//     ],
//   },
// });

// capaVectorial.addFeatures([f1]);

// capaVectorial.setStyle(estilo);
// mapa.addLayers(capaVectorial);
