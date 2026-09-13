import RasterManagement from 'facade/rastermanagement';

IDEE.language.setLang('es');
//IDEE.language.setLang('en');

const map = IDEE.map({
  container: 'mapjs',
  controls: ['scale']
  // bbox: [3226511.5398818217, 1735204.4920150614, 4207995.393869615, 2056231.5025902353],
 });
window.map = map;

// map.addLayers(new IDEE.layer.GeoTIFF({
//   url: 'https://e84-earth-search-sentinel-data.s3.us-west-2.amazonaws.com/sentinel-2-pre-c1-l2a/21/N/YC/2022/12/S2B_T21NYC_20221205T140704_L2A/B04.tif',
//   name: 'Sentinel TCI',
//   legend: 'Sentinel-2 color verdadero',
// }, {
//   normalize: true,
//   nodata: 0,
//   style: new IDEE.style.Raster({
//     bands: [1,0,0],
//     // nodata: 0,
//     gamma: 2
//   }),
// }));

map.addLayers(new IDEE.layer.GeoTIFF({
  url: 'https://sentinel-cogs.s3.us-west-2.amazonaws.com/sentinel-s2-l2a-cogs/36/Q/WD/2020/7/S2A_36QWD_20200701_0_L2A/TCI.tif',
  name: 'Sentinel TCI',
  legend: 'Sentinel-2 multibandamultibandamultibandamultibandamultibandamultibandamultibandamultibandamultibandamultibandamultibandamultibandamultibandamultibanda',
}, {
  normalize: true,
}));

// map.addLayers(new IDEE.layer.GeoTIFF({
//   url: 'https://sentinel-cogs.s3.us-west-2.amazonaws.com/sentinel-s2-l2a-cogs/36/Q/WD/2020/7/S2A_36QWD_20200701_0_L2A/TCI.tif',
//   name: 'Sentinel TCI',
//   legend: 'Sentinel-2 color verdadero',
// }, {
//   normalize: true,
//   nodata: 0,
//   style: new IDEE.style.Raster({
//     saturation: 1,
//     nodata: 0,
//   }),
// }));

// NIR: 4
// SWIR: 6
// AZUL: 1
// ROJO: 3
// VERDE: 2

// Para NDVI min: 0,001632 max: 0,46432
// Para NDWI min: -0.45 max: -0.011
// Para NDWI min: -0.09 max: 0.33
// map.addLayers(new IDEE.layer.GeoTIFF({
//   url: './tif/original_COG.tiff',
//   name: 'falsocolor',
//   legend: 'falsocolor',
// }, {
//   normalize: true,
//   nodata: 0,
// }));




const mp = new RasterManagement({
  position: 'TR', // TR, BR, TL, BL
  collapsed: false,
  collapsible: true,
  tooltip: 'Gestor de estilos ráster',
  // order: 1, //
});
window.mp = mp;

map.addPlugin(mp);