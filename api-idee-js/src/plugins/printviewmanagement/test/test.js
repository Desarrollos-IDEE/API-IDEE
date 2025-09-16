/* eslint-disable max-len,object-property-newline */
import PrintViewManagement from 'facade/printviewmanagement';

IDEE.language.setLang('es');
// IDEE.language.setLang('en');

/* / Capa de Suelo
const suelo = new IDEE.layer.WMTS({
  url: 'https://servicios.idee.es/wmts/ocupacion-suelo?',
  name: 'LU.ExistingLandUse', legend: 'Ocupación del suelo WMTS',
  matrixSet: 'GoogleMapsCompatible',
  minZoom: 4, maxZoom: 20, visibility: true,
}, { crossOrigin: 'anonymous' }); window.suelo = suelo; // */

const map = IDEE.map({
  container: 'mapjs',
  minZoom: 4, maxZoom: 20, zoom: 9,
  // layers: [suelo],
  center: [-467062, 4683459],
});
window.map = map;

// TODAS LAS CAPAS

// Capa GeoJSON
const capaGeoJSON = new IDEE.layer.GeoJSON({
  url: 'http://geostematicos-sigc.juntadeandalucia.es/geoserver/tematicos/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=tematicos:Provincias&maxFeatures=50&outputFormat=application%2Fjson',
  name: 'Capa GeoJSON', legend: 'Capa GeoJSON',
  extract: true,
});
map.addLayers(capaGeoJSON); window.capaGeoJSON = capaGeoJSON; // */

// Capa WFS
const capaWFS = new IDEE.layer.WFS({
  url: 'http://geostematicos-sigc.juntadeandalucia.es/geoserver/sepim/ows?',
  name: 'campamentos', legend: 'Capa WFS l',
  namespace: 'sepim',
  geometry: 'MPOINT',
});
map.addLayers(capaWFS); window.capaWFS = capaWFS; // */

/* / Capa OSM
const capaOSM = new IDEE.layer.OSM({
  url: 'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
  name: 'Capa OSM', legend: 'Capa OSM',
  isBase: false,
  matrixSet: 'EPSG:3857',
});
map.addLayers(capaOSM); window.capaOSM = capaOSM; // */

// Capa KML
const capaKML = new IDEE.layer.KML({
  url: 'https://www.ign.es/web/resources/delegaciones/delegacionesIGN.kml',
  name: 'Capa KML', legend: 'Capa KML',
  extract: true,
}, { crossOrigin: 'anonymous' });
map.addLayers(capaKML); window.capaKML = capaKML; // */

/* / Capa KML1
const capaKML1 = new IDEE.layer.KML({
  url: 'https://www.ign.es/web/resources/delegaciones/delegacionesIGN.kml',
  name: 'Capa KML1', legend: 'Capa KML1',
  extract: true,
}, {extractStyles: false,style: new IDEE.style.Point({ radius: 5, fill: { color: 'green', opacity: 0.5 }, stroke: { color: '#FF0000' } }) });
map.addLayers(capaKML1); window.capaKML1 = capaKML1; // */

/* / Capa MVT
const capaMVT = new IDEE.layer.MVT({
  url: 'https://www.ign.es/web/resources/mapa-base-xyz/vt/{z}/{x}/{y}.pbf',
  // layers: ['camino_lin'],
  name: 'Capa MVT', legend: 'Capa MVT',
  projection: 'EPSG:3857',
  extract: true,
}, { crossOrigin: 'anonymous' });
map.addLayers(capaMVT); window.capaMVT = capaMVT; // */

/* / Capa OGCAPIFeatures
const capaOGCAPIFeatures = new IDEE.layer.OGCAPIFeatures({
  url: 'https://api-features.idee.es/collections/',
  name: 'hidrografia/Falls', legend: 'Capa OGCAPIFeatures L',
  limit: 20,
});
map.addLayers(capaOGCAPIFeatures); window.capaOGCAPIFeatures = capaOGCAPIFeatures; // */

/* / Capa TMS
const capaTMS = new IDEE.layer.TMS({
  url: 'https://tms-mapa-raster.ign.es/1.0.0/mapa-raster/{z}/{x}/{-y}.jpeg',
  name: 'Capa TMS', legend: 'Capa TMS L',
  projection: 'EPSG:3857',
}, { crossOrigin: 'anonymous' });
map.addLayers(capaTMS); window.capaTMS = capaTMS; // */

/* / Capa Vector
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
map.addLayers(capaVector); window.capaVector = capaVector; // */

/* /Capa WMS
const capaWMS = new IDEE.layer.WMS({
  url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
  name: 'AU.AdministrativeUnit', legend: 'Capa WMS l',
}, { crossOrigin: 'anonymous' });
map.addLayers(capaWMS); window.capaWMS = capaWMS; // */

/* / Capa WMTS
const capaWMTS = new IDEE.layer.WMTS({
  url: 'https://servicios.idee.es/wmts/ocupacion-suelo',
  name: 'LC.LandCoverSurfaces', legend: 'LC.LandCoverSurfaces l',
  matrixSet: 'GoogleMapsCompatible',
  format: 'image/png',
}, { crossOrigin: 'anonymous' });
map.addLayers(capaWMTS); window.capaWMTS = capaWMTS; // */

/* / Capa XYZ
const capaXYZ = new IDEE.layer.XYZ({
  url: 'https://www.ign.es/web/catalogo-cartoteca/resources/webmaps/data/cresques/{z}/{x}/{y}.jpg',
  name: 'Capa XYZ', legend: 'Capa XYZ l',
  projection: 'EPSG:3857',
}, { crossOrigin: 'anonymous' });
map.addLayers(capaXYZ); window.capaXYZ = capaXYZ; // */

/* / Capa MBTiles fetch
window.fetch(`${IDEE.config.STATIC_RESOURCES_URL}/Datos/mbtiles/cabrera.mbtiles`).then((response) => {
  const mbtile = new IDEE.layer.MBTiles({
    name: 'mbtiles', legend: 'Capa MBTiles L',
    source: response,
  });
  map.addLayers(mbtile); window.mbtile = mbtile;
}).catch((e) => { throw e; }); // */

/* / Capa MBTilesVector fetch
window.fetch(`${IDEE.config.STATIC_RESOURCES_URL}/Datos/mbtiles/countries.mbtiles`).then((response) => {
  const mbtilesvector = new IDEE.layer.MBTilesVector({
    name: 'mbtiles_vector', legend: 'Capa MBTilesVector L',
    source: response,
    // maxZoomLevel: 5,
  });
  map.addLayers(mbtilesvector); window.mbtilesvector = mbtilesvector;
}).catch((e) => { throw e; }); // */

// Capa GeoTIFF
const geotiff = new IDEE.layer.GeoTIFF({
  url: 'http://ftpcdd.cnig.es/Vuelos_2021/Vuelos_2021/catalunya_2021/Costa/01.VF/01.08_PNOA_2021_CAT_COSTA_22cm_VF_img8c_rgb_hu31/h50_0219_fot_002-0001_cog.tif',
  name: 'Nombre geotiff',
  legend: 'Leyenda geotiff',
  isBase: false,
}, {
  convertToRGB: 'auto',
  nodata: 0,
});
map.addLayers(geotiff); window.geotiff = geotiff; // */

/* / Capa MapLibre 1
const mapLibre1 = new IDEE.layer.MapLibre({
  name: 'MapaLibre_1_NAME', legend: 'MapaLibre_1_LEGEND',
  url: 'https://demotiles.maplibre.org/style.json',
  extract: false,
  disableBackgroundColor: true,
}, { opacity: 0.7 });// , { mapLibreOptions: { style: 'https://demotiles.maplibre.org/style.json', preserveDrawingBuffer: true } });
map.addLayers(mapLibre1); window.mapLibre1 = mapLibre1; // */
/* / Capa MapLibre 2
const mapLibre2 = new IDEE.layer.MapLibre({
  name: 'MapaLibre_2_NAME', legend: 'MapaLibre_2_LEGEND',
  url: 'https://vt-mapabase.idee.es/files/styles/mapaBase_scn_color1_CNIG.json',
  extract: true,
  disableBackgroundColor: false,
}, { opacity: 0.7 });// , { mapLibreOptions: { style: 'https://vt-mapabase.idee.es/files/styles/mapaBase_scn_color1_CNIG.json', preserveDrawingBuffer: true } });
map.addLayers(mapLibre2); window.mapLibre2 = mapLibre2; // */

const mp = new PrintViewManagement({
  collapsible: true,
  collapsed: true,
  isDraggable: true,
  position: 'TL', // 'TL' | 'TR' | 'BR' | 'BL'
  tooltip: 'Imprimir',
  defaultOpenControl: 1, // 1 (printermap), 2 (georefImage), 3 (georefImageEpsg) OR 0 , >=4 (Ninguno) Abre el control indicado inicialmente.
  // printermap: true,
  printermap: {
    tooltip: 'TEST TOOLTIP printermap', // Tooltip del botón para escoger esta opción
    filterTemplates: [
      `${IDEE.config.STATIC_RESOURCES_URL}/plantillas/html/templateConBorde.html`,
      `${IDEE.config.STATIC_RESOURCES_URL}/plantillas/html/templateConCabezeraYBorde.html`,
      `${IDEE.config.STATIC_RESOURCES_URL}/plantillas/html/templateConFooterYBorde.html`,
    ], // Array de paths que hacen referencia a las plantillas a elegir por el usuario
    showDefaultTemplate: true, // Si se quiere mostrar la opción de elegir la plantilla por defecto que tiene el plugin
    defaultDpiOptions: [72, 150, 300], // Valores DPI a elegir en el modo de impresión printermap
    layoutsRestraintFromDpi: ['screensize', 'A0', 'A1', 'A2'], // Plantillas en las que no se puede elegir el DPI
  },
  // georefImage: true,
  georefImage: {
    tooltip: 'TEST TOOLTIP georefImage',
    printSelector: true, // Activa las opciones de escoger configuraciones de este, si es false se usa "printType" para definir el método default
    printType: 'client', // 'client' | 'server'
    defaultDpiOptions: [72, 150, 300], // Valores DPI a elegir en el modo de impresión georefImage
  }, // */
  georefImageEpsg: true,
  /* /
  georefImageEpsg: {
    tooltip: 'TEST TOOLTIP georefImageEpsg',
    layers: [{ // WMTS -> OK
        url: 'http://www.ign.es/wms-inspire/mapa-raster?',
        name: 'mtn_rasterizado', legend: 'Mapa ETRS89 UTM',
        format: 'image/jpeg',
        EPSG: 'EPSG:4326',
      },
      {
        url: 'http://www.ign.es/wms-inspire/pnoa-ma?',
        name: 'OI.OrthoimageCoverage', legend: 'Imagen (PNOA) ETRS89 UTM',
        format: 'image/jpeg',
        EPSG: 'EPSG:4258',
      },
    ],
  }, // */
  useProxy: true,
  order: 1,
});
map.addPlugin(mp); window.mp = mp;
