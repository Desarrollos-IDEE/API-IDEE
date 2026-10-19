/* eslint-disable max-len,object-property-newline */
import PrintViewManagement from 'facade/printviewmanagement';

window.IDEE.plugin.PrintViewManagement = PrintViewManagement;

IDEE.language.setLang('es');

const map = IDEE.map({
  container: 'mapjs',
  zoom: 9,
  minZoom: 4,
  maxZoom: 20,
  center: [-467062, 4683459],
});
window.map = map;

/*
const capaGeoJSON = new IDEE.layer.GeoJSON({
  url: 'http://geostematicos-sigc.juntadeandalucia.es/geoserver/tematicos/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=tematicos:Provincias&maxFeatures=50&outputFormat=application%2Fjson',
  name: 'Capa GeoJSON', legend: 'Capa GeoJSON',
  extract: true,
});
map.addLayers(capaGeoJSON); window.capaGeoJSON = capaGeoJSON;

const capaWFS = new IDEE.layer.WFS({
  url: 'http://geostematicos-sigc.juntadeandalucia.es/geoserver/sepim/ows?',
  name: 'campamentos', legend: 'Capa WFS l',
  namespace: 'sepim',
  geometry: 'MPOINT',
});
map.addLayers(capaWFS); window.capaWFS = capaWFS;

const capaOSM = new IDEE.layer.OSM({
  url: 'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
  name: 'Capa OSM', legend: 'Capa OSM',
  isBase: false,
  matrixSet: 'EPSG:3857',
});
map.addLayers(capaOSM); window.capaOSM = capaOSM;

const capaKML1 = new IDEE.layer.KML({
  url: 'https://www.ign.es/web/resources/delegaciones/delegacionesIGN.kml',
  name: 'Capa KML1', legend: 'Capa KML1',
  extract: true,
}, {extractStyles: false,style: new IDEE.style.Point({ radius: 5, fill: { color: 'green', opacity: 0.5 }, stroke: { color: '#FF0000' } }) });
map.addLayers(capaKML1); window.capaKML1 = capaKML1;

const capaMVT = new IDEE.layer.MVT({
  url: 'https://www.ign.es/web/resources/mapa-base-xyz/vt/{z}/{x}/{y}.pbf',
  // layers: ['camino_lin'],
  name: 'Capa MVT', legend: 'Capa MVT',
  projection: 'EPSG:3857',
  extract: true,
}, { crossOrigin: 'anonymous' });
map.addLayers(capaMVT); window.capaMVT = capaMVT;

const capaOGCAPIFeatures = new IDEE.layer.OGCAPIFeatures({
  url: 'https://api-features.idee.es/collections/',
  name: 'hidrografia/Falls', legend: 'Capa OGCAPIFeatures L',
  limit: 20,
});
map.addLayers(capaOGCAPIFeatures); window.capaOGCAPIFeatures = capaOGCAPIFeatures;

const capaTMS = new IDEE.layer.TMS({
  url: 'https://tms-mapa-raster.ign.es/1.0.0/mapa-raster/{z}/{x}/{-y}.jpeg',
  name: 'Capa TMS', legend: 'Capa TMS L',
  projection: 'EPSG:3857',
}, { crossOrigin: 'anonymous' });
map.addLayers(capaTMS); window.capaTMS = capaTMS;

const capaVector = new IDEE.layer.Vector({
  name: 'capaVector', legend: 'vector legend',
  attribution: {
    url: 'https://www.google.es',
    nameLayer: 'Nombre capa',
    name: 'Otro nombre', // se puede llamar description?
    contentAttributions: `${IDEE.config.STATIC_RESOURCES_URL}/Datos/reconocimientos/WMTS_PNOA_20170220/atribucionPNOA_Url.kml`,
    contentType: 'kml',
  },
});
const feature = new IDEE.Feature('localizacion', {
  type: 'Feature',
  properties: { text: 'prueba' },
  geometry: {
    type: 'Point',
    coordinates: [-458757.1288, 4795217.2530],
  },
});
capaVector.addFeatures(feature);
map.addLayers(capaVector); window.capaVector = capaVector;

const capaWMS = new IDEE.layer.WMS({
  url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
  name: 'AU.AdministrativeUnit', legend: 'Capa WMS l',
}, { crossOrigin: 'anonymous' });
map.addLayers(capaWMS); window.capaWMS = capaWMS;

const capaWMTS = new IDEE.layer.WMTS({
  url: 'https://servicios.idee.es/wmts/ocupacion-suelo',
  name: 'LC.LandCoverSurfaces', legend: 'LC.LandCoverSurfaces l',
  matrixSet: 'GoogleMapsCompatible',
  format: 'image/png',
}, { crossOrigin: 'anonymous' });
map.addLayers(capaWMTS); window.capaWMTS = capaWMTS;

const capaXYZ = new IDEE.layer.XYZ({
  url: 'https://www.ign.es/web/catalogo-cartoteca/resources/webmaps/data/cresques/{z}/{x}/{y}.jpg',
  name: 'Capa XYZ', legend: 'Capa XYZ l',
  projection: 'EPSG:3857',
}, { crossOrigin: 'anonymous' });
map.addLayers(capaXYZ); window.capaXYZ = capaXYZ;

window.fetch(`${IDEE.config.STATIC_RESOURCES_URL}/Datos/mbtiles/cabrera.mbtiles`).then((response) => {
  const mbtile = new IDEE.layer.MBTiles({
    name: 'mbtiles', legend: 'Capa MBTiles L',
    source: response,
  });
  map.addLayers(mbtile); window.mbtile = mbtile;
}).catch((e) => { throw e; });

window.fetch(`${IDEE.config.STATIC_RESOURCES_URL}/Datos/mbtiles/countries.mbtiles`).then((response) => {
  const mbtilesvector = new IDEE.layer.MBTilesVector({
    name: 'mbtiles_vector', legend: 'Capa MBTilesVector L',
    source: response,
    // maxZoomLevel: 5,
  });
  map.addLayers(mbtilesvector); window.mbtilesvector = mbtilesvector;
}).catch((e) => { throw e; });

const geotiff = new IDEE.layer.GeoTIFF({
  url: 'http://ftpcdd.cnig.es/Vuelos_2021/Vuelos_2021/catalunya_2021/Costa/01.VF/01.08_PNOA_2021_CAT_COSTA_22cm_VF_img8c_rgb_hu31/h50_0219_fot_002-0001_cog.tif',
  name: 'Nombre geotiff',
  legend: 'Leyenda geotiff',
  isBase: false,
}, {
  convertToRGB: 'auto',
  nodata: 0,
});
map.addLayers(geotiff); window.geotiff = geotiff;

const mapLibre1 = new IDEE.layer.MapLibre({
  name: 'MapaLibre_1_NAME', legend: 'MapaLibre_1_LEGEND',
  url: 'https://demotiles.maplibre.org/style.json',
  extract: false,
  disableBackgroundColor: true,
}, { opacity: 0.7 });// , { mapLibreOptions: { style: 'https://demotiles.maplibre.org/style.json', preserveDrawingBuffer: true } });
map.addLayers(mapLibre1); window.mapLibre1 = mapLibre1;

const mapLibre2 = new IDEE.layer.MapLibre({
  name: 'MapaLibre_2_NAME', legend: 'MapaLibre_2_LEGEND',
  url: 'https://vt-mapabase.idee.es/files/styles/mapaBase_scn_color1_CNIG.json',
  extract: true,
  disableBackgroundColor: false,
}, { opacity: 0.7 });// , { mapLibreOptions: { style: 'https://vt-mapabase.idee.es/files/styles/mapaBase_scn_color1_CNIG.json', preserveDrawingBuffer: true } });
map.addLayers(mapLibre2); window.mapLibre2 = mapLibre2;
*/
// const capaKML = new IDEE.layer.KML({
//   url: 'https://tms-ign-base.idee.es/1.0.0/IGNBaseTodo.kml',
//   name: 'Capa KML', legend: 'Capa KML',
//   extract: true,
// }, { crossOrigin: 'anonymous' });
// map.addLayers(capaKML); window.capaKML = capaKML;

const layerinicial = new IDEE.layer.WMS({
  url: 'http://www.ign.es/wms-inspire/unidades-administrativas?',
  name: 'AU.AdministrativeBoundary',
  legend: 'Limite administrativo',
  tiled: false,
}, {});
map.addLayers([layerinicial]);

let mp;

const createPlugin = (options) => {
  mp = new IDEE.plugin.PrintViewManagement(options);
  window.mp = mp;
  map.addPlugin(mp);
};

const removePlugin = () => {
  if (mp) map.removePlugins(mp);
};

const removeButton = document.getElementById('removeButton');
removeButton.addEventListener('click', () => { removePlugin(); });

const selectPosition = document.getElementById('selectPosition');
const selectCollapsed = document.getElementById('selectCollapsed');
const inputOrder = document.getElementById('inputOrder');
const inputTooltip = document.getElementById('inputTooltip');
const inputDefaultOpenControl = document.getElementById('inputDefaultOpenControl');
const inputGeorefImageEpsg = document.getElementById('inputGeorefImageEpsg');
const inputGeorefImage = document.getElementById('inputGeorefImage');
const inputPrintermap = document.getElementById('inputPrintermap');

const safeParseJSON = (val, fallback) => {
  try { return val ? JSON.parse(val) : fallback; } catch (e) { return fallback; }
};

const updatePlugin = () => {
  const options = {};
  options.position = selectPosition.options[selectPosition.selectedIndex].value;
  options.collapsed = selectCollapsed.options[selectCollapsed.selectedIndex].value === '' || selectCollapsed.options[selectCollapsed.selectedIndex].value === 'true';
  options.order = Number(inputOrder.value);
  options.tooltip = inputTooltip.value !== '' ? options.tooltip = inputTooltip.value : '';
  options.defaultOpenControl = Number(inputDefaultOpenControl.value) || 0;
  options.georefImageEpsg = safeParseJSON(inputGeorefImageEpsg.value, true);
  options.georefImage = safeParseJSON(inputGeorefImage.value, true);
  options.printermap = safeParseJSON(inputPrintermap.value, true);

  removePlugin();
  createPlugin(options);
};

[
  selectPosition,
  selectCollapsed,
  inputOrder,
  inputTooltip,
  inputDefaultOpenControl,
  inputGeorefImageEpsg,
  inputGeorefImage,
  inputPrintermap,
].forEach((ctrl) => {
  ctrl.addEventListener('change', updatePlugin);
});

updatePlugin();
