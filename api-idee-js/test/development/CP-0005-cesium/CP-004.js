import { map as Mmap } from 'IDEE/mapea';
import Vector from 'IDEE/layer/Vector';
import Point from 'IDEE/style/Point';
import Polygon from 'IDEE/style/Polygon';
import Line from 'IDEE/style/Line';
import Generic from 'IDEE/style/Generic';
import Feature from 'IDEE/feature/Feature';
import { CLAMP_TO_GROUND, RELATIVE_TO_GROUND } from 'IDEE/style/HeightReference';

const mapa = Mmap({
  container: 'map',
  // center: [-5.349371009561882, 36.0172568255245],
  // zoom: 9,
  // center: [-3.532867280382688, 38.31095144315678],
  // zoom: 10,
  center: [-2.855277858955945, 38.494034306623384],
  zoom: 7,
});
window.mapa = mapa;

const f1 = new Feature('feature1', {
  'type': 'Feature',
  'properties': {},
  'geometry': {
    'type': 'Point',
    'coordinates': [
      -5.5810546875,
      36.19995805932895,
    ],
  },
});

const f2 = new Feature('feature2', {
  'type': 'Feature',
  'properties': {},
  'geometry': {
    'type': 'LineString',
    'coordinates': [
      [-3.7982077734375097, 38.10767109165957, 408.312],
      [-7.725820078125008, 38.12495828299171, 0],
    ],
  },
});

const f3 = new Feature('feature3', {
  'type': 'Feature',
  'properties': {},
  'geometry': {
    'type': 'Polygon',
    'coordinates': [
      [
        [-3.897084726562509, 37.843534777598265, 394.376],
        [-3.4686179296875093, 38.11199327312772, 345.8],
        [-3.4026999609375093, 38.00819035261267, 740.267],
        [-3.8915915625000093, 37.84787254170713, 467.741],
        [-3.897084726562509, 37.843534777598265, 394.376],
      ],
    ],
  },
});

// Example #1
// const vector = new Vector({ name: 'Capa' }, {
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
//     heightReference: CLAMP_TO_GROUND,
//     perPositionHeight: false,
//     extrudedHeight: 100,
//     extrudedHeightReference: RELATIVE_TO_GROUND,
//   }),
// });
// window.vector = vector;
// // mapa.addLayers(vector);
// vector.addFeatures([f3]);

// Example #2
// const vector = new Vector({ name: 'Capa' });
// window.vector = vector;
// mapa.addLayers(vector);
// vector.addFeatures([f2]);

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
// vector.setStyle(style);

// Example #3
// const vector = new Vector({ name: 'Capa' }, {
//   style: new Point({
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
// window.vector = vector;
// mapa.addLayers(vector);
// vector.addFeatures([f1]);

// Example #4
const vector = new Vector({ name: 'Capa' }, {
  height: 0,
});
window.vector = vector;
mapa.addLayers(vector);
vector.addFeatures([f1, f2, f3]);

const style = new Generic({
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
  line: {
    stroke: {
      color: 'red',
      width: 3,
    },
    fill: {
      width: 8,
      color: 'blue',
      opacity: 0.7,
    },
  },
  polygon: {
    stroke: {
      color: 'red',
      width: 3,
    },
    fill: {
      color: 'blue',
      opacity: 0.7,
    },
    heightReference: CLAMP_TO_GROUND,
    perPositionHeight: false,
    extrudedHeight: 100,
    extrudedHeightReference: RELATIVE_TO_GROUND,
  },
});
window.style = style;
vector.setStyle(style);
