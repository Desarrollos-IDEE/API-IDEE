import { map as Mmap } from 'M/mapea';
// import WMS from 'M/layer/WMS';
// import WMTS from 'M/layer/WMTS';
import MVT from 'M/layer/MVT';
import XYZ from 'M/layer/XYZ';


const mapa = Mmap({
  container: 'map',
  getfeatureinfo: 'plain',
  controls: ['location', 'attributions'],
  projection: 'EPSG:3857*m', // CASO EPSG:4326 'EPSG:4326*d',
  // layers: ['OSM'],
});

const mvt = new MVT({
  url: 'https://vts.larioja.org/igo/{z}/{x}/{y}.pbf',
  name: 'vectortile',
  projection: 'EPSG:3857',
});

const mvt2 = new MVT({
  url: 'https://vts.larioja.org/rioja/{z}/{x}/{y}.pbf',
  name: 'vectortile2',
  projection: 'EPSG:3857',
});

const mvt3 = new MVT({
  url: 'https://vts.larioja.org/osm/{z}/{x}/{y}.pbf',
  name: 'vectortile3',
  projection: 'EPSG:3857',
  // extract: false,
});

const mvt4 = new MVT({
  url: 'https://vts.larioja.org/srtm/{z}/{x}/{y}.pbf',
  name: 'vectortile4',
  projection: 'EPSG:3857',
});

const xyz = new XYZ({
  url: 'https://api.maptiler.com/maps/outdoor/256/{z}/{x}/{y}@2x.png?key=7oapAXDXQ3uctBopr1Wx',
  name: 'pruebaXYZ',
  projection: 'EPSG:3857'
})

// mapa.addLayers(mvt);
// mapa.addLayers(mvt2);
mapa.addLayers(mvt3);
// mapa.addXYZ(xyz);
// mapa.addLayers(mvt4);
// M.Popup.options.takeMeThere = true;
window.map = mapa;


// const map = Mmap({
//   container: 'map',
//   // controls: ['backgroundlayers*2*false'],
//   controls: ['backgroundlayers', 'location', 'getfeatureinfo'],
//   maxZoom: 20,
//   layers: [],
// });

// const layerUA = new WMS({
//   url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
//   name: 'AU.AdministrativeUnit',
//   legend: 'Unidad administrativa',
//   tiled: false
// }, {});
// map.addLayers(new WMTS("WMTS*http://wmts-mapa-lidar.idee.es/lidar*EL.GridCoverageDSM*GoogleMapsCompatible*Modelo%20Digital%20de%20Superficies%20LiDAR*true*image/png*true*true*true"));
// map.addLayers(new WMS("WMS*Leyenda*http://www.ign.es/wms-inspire/unidades-administrativas?*AU.AdministrativeBoundary*true*false**1.1.1*false*true*false"));
// const ocupacionSuelo = new WMTS({
//   url: 'http://wmts-mapa-lidar.idee.es/lidar',
//   name: 'EL.GridCoverageDSM',
//   legend: 'Modelo Digital de Superficies LiDAR',
//   matrixSet: 'GoogleMapsCompatible',
// });

// map.addLayers([ocupacionSuelo]);
// window.map = map;

// map.addLayers(new WMTS({
//   url: 'http://wmts-mapa-lidar.idee.es/lidar',
//   name: 'EL.GridCoverageDSM',
//   legend: 'Modelo Digital de Superficies LiDAR',
//   matrixSet: 'GoogleMapsCompatible',
//   visibility: true,
// }, {}));

// const layerUA = new WMS({
//   url: 'http://www.ign.es/wms-inspire/unidades-administrativas?',
//   name: 'AU.AdministrativeUnit',
//   legend: 'Unidad administrativa',
//   tiled: false,
// }, {});

// map.addLayers(layerUA);
