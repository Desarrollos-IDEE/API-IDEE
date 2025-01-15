import { map as Mmap } from 'M/mapea';
import OGCAPIFeatures from 'M/layer/OGCAPIFeatures';
import WFS from 'M/layer/WFS';
import Line from 'M/style/Line';
import * as Filter from 'M/filter/Filter';
import { ADDED_LAYER, ADDED_OGCAPIFEATURES } from 'M/event/eventtype';


const mapa = Mmap({
  container: 'map',
  getfeatureinfo: 'plain',
  projection: 'EPSG:3857*m',
  bbox: [-1770541.6193632658, 4068168.5500396686, 577603.8895573488, 4694340.685751832],
  // layers: ['OSM', 'OGCAPIFeatures*Capa*http://ignsolarguadaltel.desarrollo.guadaltel.es/collections/*rutas*30']
  // layers: ['OSM', 'OGCAPIFeatures*Capa*http://ignsolarguadaltel.desarrollo.guadaltel.es/collections/*rutas*30***10*json']
});

// var campamentos = new WFS({
//   name: "Campamentos",
//   url: "http://geostematicos-sigc.juntadeandalucia.es/geoserver/wfs",
//   namespace: "sepim",
//   name: "campamentos",
//   geometry: 'POINT',
//   extract: true
// });
// mapa.addLayers(campamentos);


window.mapa = mapa;

const capa = new OGCAPIFeatures({
  url: 'http://ignsolarguadaltel.desarrollo.guadaltel.es/collections/',
  name: 'rutas',
  legend: 'Capa de rutas',
  limit: 20,
  // bbox: [-4.976807, 36.668419, -3.938599, 37.112146],
  format: 'json',
  // offset: 10,
  id: 11
  // conditional: {
  //   slug: 'Puerto-del-Leon-por-Totalan'
  // }
}, {
  style: new Line({
    fill: {
      color: 'blue',
      width: 5
    }
  }),
  // minZoom: 7,
  // maxZoom: 10,
}, {
  // cql: 'id IN (3,5)'
});
window.capa = capa;

// capa.setStyle(new Line({
//   fill: {
//     color: 'blue',
//     width: 5
//   }
// }));

// mapa.on(ADDED_LAYER, () => {
//   console.log('Capa cargada');
// });

// mapa.on(ADDED_OGCAPIFEATURES, () => {
//   console.log('Capa cargada');
// });

mapa.addOGCAPIFeatures(capa);


const a = new Line({
  fill: {
    color: 'blue',
    width: 5
  }
});

console.log(a.serialize())
