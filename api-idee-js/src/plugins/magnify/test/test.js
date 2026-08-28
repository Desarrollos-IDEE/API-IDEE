import Magnify from 'facade/magnify';

// IDEE.language.setLang('en');
IDEE.language.setLang('es');

const map = IDEE.map({
  container: "mapjs",
  projection: 'EPSG:25830',
  layers: ['OSM'],
});

window.map = map;

// const wmts = new IDEE.layer.WMTS({
//   url: "http://www.ideandalucia.es/geowebcache/service/wmts",
//   name: "toporaster",
//   matrixSet: "EPSG:25830",
//   legend: "Toporaster"
// }, {
//   format: 'image/png'
// });

const wmts = new IDEE.layer.WMTS({
  url: "http://www.ign.es/wmts/pnoa-ma",
  name: "OI.OrthoimageCoverage",
  matrixSet: "EPSG:25830",
  legend: "PNOA"
}, {
  format: 'image/png'
});

map.addLayers([wmts]);


map.addLayers(new IDEE.layer.WMTS({
  url: 'https://wmts-potencial-solar.idee.es/potencial-solar',
  name: 'potencial-solar',
  legend: 'Potencial Solar',
  matrixSet: 'EPSG:25830',
}, {}));

const mp = new Magnify({
  position: 'TL',
  zoomMax: 19,
  zoom: 5,
  layers: 'OI.OrthoimageCoverage,potencial-solar'
});
map.addPlugin(mp);

/* CASO 1. Si no se indica capa en la creación, asumir capa base como capa a magnificar.*/
/*
const map = IDEE.map({
  container: "mapjs",
  layers: ["WMS*Municipios*http://www.ideandalucia.es/wms/dea100_divisiones_administrativas?*terminos_municipales*false*true"],
  controls: ['layerswitcher'],
});

const wms = new IDEE.layer.WMS('WMS*fondo*http://www.ign.es/wms-inspire/mapa-raster');
map.addLayers([wms]);


const mp = new Magnify({ position: 'TL' });
*/



/* CASO 2. La capa indicada en el plugin no existe en el mapa, asumir capa base como capa a magnificar. */
/*
const map = IDEE.map({
  container: "mapjs",
  layers: ["WMS*Municipios*http://www.ideandalucia.es/wms/dea100_divisiones_administrativas?*terminos_municipales*false*true"],
  controls: ['layerswitcher'],
});

const wms = new IDEE.layer.WMS('WMS*fondo*http://www.ign.es/wms-inspire/mapa-raster');
map.addLayers([wms]);

const mp = new Magnify({ position: 'TL', layers: 'capaNoExiste' });
*/



/* CASO 3. En caso de no existir capa base entonces incluir todas en el efecto lupa
La forma para que mapea entienda que no existe una capa base es poniendo el parámetro "transparencia" en true a la hora de crear el mapa. */
/*
const map = IDEE.map({
  container: "mapjs",
  layers: ["WMS*Municipios*http://www.ideandalucia.es/wms/dea100_divisiones_administrativas?*terminos_municipales*true*true"],
  controls: ['layerswitcher'],
});

const wms = new IDEE.layer.WMS('WMS*fondo*http://www.ign.es/wms-inspire/mapa-raster');

const geojson = new IDEE.layer.GeoJSON({
  name: 'Provincias',
  url: 'http://geostematicos-sigc.juntadeandalucia.es/geoserver/tematicos/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=tematicos:Provincias&maxFeatures=50&outputFormat=application/json',
});

map.addLayers([wms, geojson]);

const mp = new Magnify({ position: 'TL' });
*/



/* CASO 4 Capas que existen*/
/*
const map = IDEE.map({
  container: "mapjs",
  layers: ["WMS*Municipios*http://www.ideandalucia.es/wms/dea100_divisiones_administrativas?*terminos_municipales*false*true"],
  controls: ['layerswitcher'],
});

const wms = new IDEE.layer.WMS('WMS*fondo*http://www.ign.es/wms-inspire/mapa-raster');

const geojson = new IDEE.layer.GeoJSON({
  name: 'Provincias',
  url: 'http://geostematicos-sigc.juntadeandalucia.es/geoserver/tematicos/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=tematicos:Provincias&maxFeatures=50&outputFormat=application/json',
});

map.addLayers([wms, geojson]);

const mp = new Magnify({ position: 'TL', layers: 'Provincias,fondo' });
*/


/* Prueba de wmts*/
/*
const map = IDEE.map({
  container: "mapjs",
  layers: ["WMS*Municipios*http://www.ideandalucia.es/wms/dea100_divisiones_administrativas?*terminos_municipales*false*true"],
  controls: ['layerswitcher'],
});

let wmts = new IDEE.layer.WMTS({
  url: "http://www.ideandalucia.es/geowebcache/service/wmts",
  name: "toporaster",
  matrixSet: "EPSG:25830",
  legend: "Toporaster"
}, {
  format: 'image/png'
});
map.addWMTS(wmts);

const mp = new Magnify({ position: 'TL', layers: 'toporaster' });
*/

map.addPlugin(mp);

window.map = map;

map.addPlugin(new IDEE.plugin.Help({}));
