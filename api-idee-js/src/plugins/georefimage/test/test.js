import Georefimage from 'facade/georefimage';

// IDEE.language.setLang('en');

// const map = IDEE.map({
//   container: 'mapjs',
//   layers: ['WMTS*http://www.ign.es/wmts/mapa-raster?*MTN*EPSG:4326*label*false'],
//   projection: 'EPSG:4326*d',
//   controls: [''],
//   center: { x: -6, y: 37.4 },
// });

const map = IDEE.map({
  container: 'mapjs',
  zoom: 9,
  maxZoom: 20,
  minZoom: 4,
  center: [-467062.8225, 4683459.6216],
  // layers: ['WMTS*http://www.ign.es/wmts/ign-base?*IGNBaseTodo*GoogleMapsCompatible*IGNBaseTodo*false*image/png*false*false*true'],
  // layer: ['OSM'],
  // layers: ['WMTS*http://www.ign.es/wmts/ign-base?*IGNBaseTodo*GoogleMapsCompatible*IGNBaseTodo*false*image/png*false*false*true'],
});

// const wmts = new IDEE.layer.WMTS({
//   url: 'http://www.ign.es/wmts/ign-base?',
//   name: 'IGNBaseTodo',
//   matrixSet: 'EPSG:25830',
//   // legend: 'IGNBaseTodo',
//   tiled: false,
// }, {
//   format: 'image/png',
// });
// map.addWMTS(wmts);

// layers: ['WMTS*http://www.ign.es/wmts/ign-base?*IGNBaseTodo*EPSG:25830*IGNBaseTodo*false*image/png*false*false*true'],
//   projection: 'EPSG:25830*m',

// layers: ['WMTS*http://www.ign.es/wmts/ign-base?*IGNBaseTodo*GoogleMapsCompatible*IGNBaseTodo*false*image/png*false*false*true'],
//   projection: 'EPSG:3857*m',

// 25830 ANDALUCIA

// layers: ['WMTS*http://www.ign.es/wmts/pnoa-ma?*OI.OrthoimageCoverage*EPSG:25830*PNOA'],

// const map = IDEE.map({
//   container: 'mapjs',
//   center: {
//     x: 360020,
//     y: 4149045,
//   },
//   zoom: 5,
//   layers: [
//     'WMTS*http://www.ideandalucia.es/geowebcache/service/wmts?*toporaster*SIG-C:25830*WMTS*false',
//   ],
// });

const layerinicial = new IDEE.layer.WMS({
  url: 'http://www.ign.es/wms-inspire/unidades-administrativas?',
  name: 'AU.AdministrativeBoundary',
  legend: 'Limite administrativo',
  tiled: false,
}, {});

const georefimage = new Georefimage({
  collapsed: true,
  collapsible: true,
  position: 'TR',
});

//map.addLayers([layerinicial]);
map.addPlugin(georefimage);

const back = new IDEE.plugin.BackImgLayer({
   position: 'TR',
   collapsible: true,
   collapsed: false,
   layerId: 0,
   layerVisibility: true,
   columnsNumber: 4,
   layerOpts: [
       {
           id: 'imagen',
           title: 'PNOA Imagen',
           preview: 'https://componentes.ign.es/api-idee/plugins/backimglayer/images/svqimagen.png',
           layers: [new IDEE.layer.WMTS({
               url: 'https://www.ign.es/wmts/pnoa-ma?',
               name: 'OI.OrthoimageCoverage',
               legend: 'Imagen (PNOA)',
               matrixSet: 'EPSG:4326',
               transparent: false,
               displayInLayerSwitcher: false,
               queryable: false,
               visible: true,
               format: 'image/jpeg',
           })],
       },
       {
           id: 'hibrido',
           title: 'PNOA Híbrido',
           preview: 'https://componentes.ign.es/api-idee/plugins/backimglayer/images/svqhibrid.png',
           layers: [new IDEE.layer.WMTS({
                   url: 'https://www.ign.es/wmts/pnoa-ma?',
                   name: 'OI.OrthoimageCoverage',
                   legend: 'Imagen (PNOA)',
                   matrixSet: 'EPSG:4326',
                   transparent: true,
                   displayInLayerSwitcher: false,
                   queryable: false,
                   visible: true,
                   format: 'image/jpeg',
               }),
               new IDEE.layer.WMTS({
                   url: 'https://www.ign.es/wmts/ign-base?',
                   name: 'IGNBaseOrto',
                   matrixSet: 'EPSG:4326',
                   legend: 'Mapa IGN',
                   transparent: false,
                   displayInLayerSwitcher: false,
                   queryable: false,
                   visible: true,
                   format: 'image/png',
               })
           ],
       },
       {
           id: 'lidar',
           preview: 'https://componentes.ign.es/api-idee/plugins/backimglayer/images/svqlidar.png',
           title: 'LiDAR',
           layers: [new IDEE.layer.WMTS({
               url: 'https://wmts-mapa-lidar.idee.es/lidar?',
               name: 'EL.GridCoverageDSM',
               legend: 'Modelo Digital de Superficies LiDAR',
               matrixSet: 'EPSG:4326',
               transparent: true,
               displayInLayerSwitcher: false,
               queryable: false,
               visible: true,
               format: 'image/png',
               })
           ],
       },
       {
           id: 'lidarhibrido',
           preview: 'https://componentes.ign.es/api-idee/plugins/backimglayer/images/svqlidar.png',
           title: 'LiDAR Híbrido',
           layers: [new IDEE.layer.WMTS({
               url: 'https://wmts-mapa-lidar.idee.es/lidar?',
               name: 'EL.GridCoverageDSM',
               legend: 'Modelo Digital de Superficies LiDAR',
               matrixSet: 'EPSG:4326',
               transparent: true,
               displayInLayerSwitcher: false,
               queryable: false,
               visible: true,
               format: 'image/png',
           }),
           new IDEE.layer.WMTS({
                   url: 'https://www.ign.es/wmts/ign-base?',
                   name: 'IGNBaseOrto',
                   matrixSet: 'EPSG:4326',
                   legend: 'Mapa IGN',
                   transparent: false,
                   displayInLayerSwitcher: false,
                   queryable: false,
                   visible: true,
                   format: 'image/png',
               })
           ],
       },
       {
           id: 'mapa',
           preview: 'https://componentes.ign.es/api-idee/plugins/backimglayer/images/svqmapa.png',
           title: 'Cartociudad',
           layers: [new IDEE.layer.WMTS({
               url: 'https://www.ign.es/wmts/ign-base?',
               name: 'IGNBaseTodo',
               legend: 'Mapa IGN',
               matrixSet: 'EPSG:4326',
               transparent: false,
               displayInLayerSwitcher: false,
               queryable: false,
               visible: true,
               format: 'image/jpeg',
           })],
       },

   ],
 }
);

map.addPlugin(back);
map.addPlugin(new IDEE.plugin.FullTOC());

window.map = map;
