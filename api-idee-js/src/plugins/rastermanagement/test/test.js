import RasterManagement from 'facade/rastermanagement';

IDEE.language.setLang('es');
//IDEE.language.setLang('en');

const map = IDEE.map({
  container: 'mapjs',
  controls: ['scale']
  // bbox: [3226511.5398818217, 1735204.4920150614, 4207995.393869615, 2056231.5025902353],
 });
window.map = map;

map.addLayers(new IDEE.layer.GeoTIFF({
  url: 'https://sentinel-cogs.s3.us-west-2.amazonaws.com/sentinel-s2-l2a-cogs/36/Q/WD/2020/7/S2A_36QWD_20200701_0_L2A/TCI.tif',
  name: 'Sentinel TCI',
}, {
}));

// map.addLayers(new IDEE.layer.GeoTIFF({
//   // url: 'https://mantenimiento-cnig-wps.desarrollo.guadaltel.es/jobs/e0b8b536-b202-11f1-8e09-8ad8591c4530/results',
//     url: 'http://localhost:6123/test/results.tiff',
//   name: 'Sentinel TCI',
// }, {
//   normalize: true,
//   nodata: 0,
// }));

// map.addLayers(new IDEE.layer.GeoTIFF({
//   url: 'http://localhost:6123/test/imagen.tif',
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

// map.addLayers(new IDEE.layer.GeoTIFF({
//   url: 'https://sentinel-cogs.s3.us-west-2.amazonaws.com/sentinel-s2-l2a-cogs/36/Q/WD/2020/7/S2A_36QWD_20200701_0_L2A/TCI.tif',
//   name: 'Sentinel TCI',
//   legend: 'Sentinel-2 multibandamultibandamultibandamultibandamultibandamultibandamultibandamultibandamultibandamultibandamultibandamultibandamultibandamultibanda',
// }, {
//   normalize: true,
//   style: new IDEE.style.Raster({
//     bands: 1,
//     min: 0.2,
//     max: 1,
//     ramp: ['#000080', '#0000ff', '#00ff00', '#ffff00', '#ff0000'],
//   }),
// }));

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
  tooltip: 'Gestión de capas ráster',
  showGeoprocesses: false,
  // order: 1, //
});
window.mp = mp;

map.addPlugin(mp);