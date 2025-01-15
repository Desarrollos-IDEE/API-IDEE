import { map as Mmap } from 'M/mapea';
import GeoJSON from 'M/layer/GeoJSON';
import OLSourceVector from 'ol/source/Vector';
import MVT from 'M/layer/MVT';
import Vector from 'M/layer/Vector';
import MBTilesVector from 'M/layer/MBTilesVector';
import WFS from 'M/layer/WFS';
import Generic from 'M/style/Generic';
import Feature from 'M/feature/Feature';

const mapjs = Mmap({
  container: 'map',
  bbox: [-14.000431738376271, 34.65932772351375, 7.093318261623729, 40.67983553601375],
  projection: 'EPSG:4326*d',
  layers: ['OSM']
});
window.mapjs = mapjs;

let estilo = new Generic({
  point: {
    radius: 10,
    fill: {
      color: 'blue'
    }
  },
  polygon: {
    fill: {
      color: 'red'
    }
  },
  line: {
    stroke: {
      color: 'black'
    }
  }
});

// const generic = new GeoJSON({
//   name: 'generic',
//   source: {
//     "type": "FeatureCollection",
//     "features": [{
//         "type": "Feature",
//         "properties": {
//           "alumnos": 4,
//           "colegios": 4
//         },
//         "geometry": {
//           "type": "Polygon",
//           "coordinates": [
//             [
//               [
//                 -7.021386718749999,
//                 38.07939467327645
//               ],
//               [
//                 -9.021142578125,
//                 36.03032838760387
//               ],
//               [
//                 -7.143359374999999,
//                 35.179398571318765
//               ],
//               [
//                 -6.121386718749999,
//                 37.17939467327645
//               ]
//             ]
//           ]
//         }
//       },
//       {
//         "type": "Feature",
//         "properties": {
//           "alumnos": 400,
//           "colegios": 2
//         },
//         "geometry": {
//           "type": "Point",
//           "coordinates": [
//             -4.113134765624999,
//             37.148696585910376
//           ]
//         }
//       },
//       {
//         "type": "Feature",
//         "properties": {
//           "alumnos": 100,
//           "colegios": 100
//         },
//         "geometry": {
//           "type": "LineString",
//           "coordinates": [
//             [
//               -3.1452148437499996,
//               37.13553306183642
//             ],
//             [
//               -1.169921875,
//               38.12777351132902
//             ],
//             [
//               -3.17392578125,
//               37.1165261849112
//             ]
//           ]
//         }
//       }
//     ]
//   }
// });
// mapjs.addLayers(generic);

// generic.setStyle(estilo);

// const mvt = new MVT('MVT*https://ahocevar.com/geoserver/gwc/service/tms/1.0.0/ne:ne_10m_admin_0_countries@EPSG%3A900913@pbf/{z}/{x}/{-y}.pbf*vectortile');
// mapjs.addLayers(mvt);
// mvt.setStyle(estilo);

// const vector = new Vector({ name: 'Capa' });
// vector.setZIndex(9999999999);
// mapjs.addLayers(vector);
// const f1 = new Feature("feature1", {
//   "type": "Feature",
//   "properties": {},
//   "geometry": {
//     "type": "Point",
//     "coordinates": [
//       -5.5810546875,
//       36.19995805932895
//     ]
//   }
// });
// const f2 = new Feature("feature2", {
//   "type": "Feature",
//   "properties": {},
//   "geometry": {
//     "type": "LineString",
//     "coordinates": [
//       [-3.7982077734375097, 38.10767109165957, 408.312],
//       [-7.725820078125008, 38.12495828299171, 0]
//     ]
//   }
// });
// const f3 = new Feature("feature3", {
//   "type": "Feature",
//   "properties": {},
//   "geometry": {
//     "type": "Polygon",
//     "coordinates": [
//       [
//         [-3.897084726562509, 37.843534777598265, 394.376],
//         [-3.4686179296875093, 38.11199327312772, 345.8],
//         [-3.4026999609375093, 38.00819035261267, 740.267],
//         [-3.8915915625000093, 37.84787254170713, 467.741],
//         [-3.897084726562509, 37.843534777598265, 394.376]
//       ]
//     ]
//   }
// });

// vector.addFeatures([f1, f2, f3]);
// vector.setStyle(estilo);

// var campamentos = new WFS({
//   name: "Campamentos",
//   url: "http://geostematicos-sigc.juntadeandalucia.es/geoserver/wfs",
//   namespace: "sepim",
//   name: "campamentos",
//   geometry: 'POINT',
//   extract: true
// });
// mapjs.addLayers(campamentos);
// campamentos.setStyle(estilo);

function load() {
  const input = document.querySelector('#file-input');
  if (input.files.length > 0) {
    const file = input.files[0];
    const vectorLayer = new MBTilesVector({
      name: file.name,
      legend: file.name,
      source: file,
    });
    mapjs.addLayers(vectorLayer);
  } else {
    info('No hay fichero adjuntado.');
  }
}

document.body.onload = () => document.querySelector('#load-button').addEventListener('click', load);
