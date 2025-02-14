/* eslint-disable max-len,object-property-newline */
import PrintViewManagement from 'facade/printviewmanagement';

M.language.setLang('es');
// M.language.setLang('en');

/* / Capa de Suelo
const suelo = new M.layer.WMTS({
  url: 'https://servicios.idee.es/wmts/ocupacion-suelo?',
  name: 'LU.ExistingLandUse', legend: 'Ocupación del suelo WMTS',
  matrixSet: 'GoogleMapsCompatible',
  minZoom: 4, maxZoom: 20, visibility: true,
}, { crossOrigin: 'anonymous' }); window.suelo = suelo; // */

const map = M.map({
  container: 'mapjs',
  minZoom: 4, maxZoom: 20, zoom: 9,
  // layers: [suelo],
  center: [-467062, 4683459],
});
window.map = map;

// TODAS LAS CAPAS

// Capa GeoJSON
const capaGeoJSON = new M.layer.GeoJSON({
  url: 'http://geostematicos-sigc.juntadeandalucia.es/geoserver/tematicos/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=tematicos:Provincias&maxFeatures=50&outputFormat=application%2Fjson',
  name: 'Capa GeoJSON', legend: 'Capa GeoJSON',
  extract: true,
});
map.addLayers(capaGeoJSON); window.capaGeoJSON = capaGeoJSON; // */

// Capa WFS
const capaWFS = new M.layer.WFS({
  url: 'http://geostematicos-sigc.juntadeandalucia.es/geoserver/sepim/ows?',
  name: 'campamentos', legend: 'Capa WFS l',
  namespace: 'sepim',
  geometry: 'MPOINT',
});
map.addLayers(capaWFS); window.capaWFS = capaWFS; // */

/* / Capa OSM
const capaOSM = new M.layer.OSM({
  url: 'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
  name: 'Capa OSM', legend: 'Capa OSM',
  transparent: true,
  matrixSet: 'EPSG:3857',
});
map.addLayers(capaOSM); window.capaOSM = capaOSM; // */

// Capa KML
const capaKML = new M.layer.KML({
  url: 'https://www.ign.es/web/resources/delegaciones/delegacionesIGN.kml',
  name: 'Capa KML', legend: 'Capa KML',
  extract: true,
}, { crossOrigin: 'anonymous' });
map.addLayers(capaKML); window.capaKML = capaKML; // */

/* / Capa KML1
const capaKML1 = new M.layer.KML({
  url: 'https://www.ign.es/web/resources/delegaciones/delegacionesIGN.kml',
  name: 'Capa KML1', legend: 'Capa KML1',
  extract: true,
}, {extractStyles: false,style: new M.style.Point({ radius: 5, fill: { color: 'green', opacity: 0.5 }, stroke: { color: '#FF0000' } }) });
map.addLayers(capaKML1); window.capaKML1 = capaKML1; // */

/* / Capa MVT
const capaMVT = new M.layer.MVT({
  url: 'https://www.ign.es/web/resources/mapa-base-xyz/vt/{z}/{x}/{y}.pbf',
  // layers: ['camino_lin'],
  name: 'Capa MVT', legend: 'Capa MVT',
  projection: 'EPSG:3857',
  extract: true,
}, { crossOrigin: 'anonymous' });
map.addLayers(capaMVT); window.capaMVT = capaMVT; // */

/* / Capa OGCAPIFeatures
const capaOGCAPIFeatures = new M.layer.OGCAPIFeatures({
  url: 'https://api-features.idee.es/collections/',
  name: 'hidrografia/Falls', legend: 'Capa OGCAPIFeatures L',
  limit: 20,
});
map.addLayers(capaOGCAPIFeatures); window.capaOGCAPIFeatures = capaOGCAPIFeatures; // */

/* / Capa TMS
const capaTMS = new M.layer.TMS({
  url: 'https://tms-mapa-raster.ign.es/1.0.0/mapa-raster/{z}/{x}/{-y}.jpeg',
  name: 'Capa TMS', legend: 'Capa TMS L',
  projection: 'EPSG:3857',
}, { crossOrigin: 'anonymous' });
map.addLayers(capaTMS); window.capaTMS = capaTMS; // */

/* / Capa Vector
const capaVector = new M.layer.Vector({
  name: 'capaVector', legend: 'vector legend',
  attribution: {
    url: 'https://www.google.es',
    nameLayer: 'Nombre capa',
    name: 'Otro nombre', // se puede llamar description?
    contentAttributions: 'https://mapea-lite.desarrollo.guadaltel.es/api-core/files/attributions/WMTS_PNOA_20170220/atribucionPNOA_Url.kml',
    contentType: 'kml',
  },
});
const feature = new M.Feature('localizacion', {
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
const capaWMS = new M.layer.WMS({
  url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
  name: 'AU.AdministrativeUnit', legend: 'Capa WMS l',
}, { crossOrigin: 'anonymous' });
map.addLayers(capaWMS); window.capaWMS = capaWMS; // */

/* / Capa WMTS
const capaWMTS = new M.layer.WMTS({
  url: 'https://servicios.idee.es/wmts/ocupacion-suelo',
  name: 'LC.LandCoverSurfaces', legend: 'LC.LandCoverSurfaces l',
  matrixSet: 'GoogleMapsCompatible',
  format: 'image/png',
}, { crossOrigin: 'anonymous' });
map.addLayers(capaWMTS); window.capaWMTS = capaWMTS; // */

/* / Capa XYZ
const capaXYZ = new M.layer.XYZ({
  url: 'https://www.ign.es/web/catalogo-cartoteca/resources/webmaps/data/cresques/{z}/{x}/{y}.jpg',
  name: 'Capa XYZ', legend: 'Capa XYZ l',
  projection: 'EPSG:3857',
}, { crossOrigin: 'anonymous' });
map.addLayers(capaXYZ); window.capaXYZ = capaXYZ; // */

/* / Capa MBTiles fetch
window.fetch('./cabrera.mbtiles').then((response) => {
  const mbtile = new M.layer.MBTiles({
    name: 'mbtiles', legend: 'Capa MBTiles L',
    source: response,
  });
  map.addLayers(mbtile); window.mbtile = mbtile;
}).catch((e) => { throw e; }); // */

/* / Capa MBTilesVector fetch
window.fetch('./countries.mbtiles').then((response) => {
  const mbtilesvector = new M.layer.MBTilesVector({
    name: 'mbtiles_vector', legend: 'Capa MBTilesVector L',
    source: response,
    // maxZoomLevel: 5,
  });
  map.addLayers(mbtilesvector); window.mbtilesvector = mbtilesvector;
}).catch((e) => { throw e; }); // */

// Capa GeoTIFF
const geotiff = new M.layer.GeoTIFF({
  url: 'http://ftpcdd.cnig.es/Vuelos_2021/Vuelos_2021/catalunya_2021/Costa/01.VF/01.08_PNOA_2021_CAT_COSTA_22cm_VF_img8c_rgb_hu31/h50_0219_fot_002-0001_cog.tif',
  name: 'Nombre geotiff',
  legend: 'Leyenda geotiff',
  transparent: true,
}, {
  convertToRGB: 'auto',
  nodata: 0,
});
map.addLayers(geotiff); window.geotiff = geotiff; // */

/* / Capa MapLibre 1
const mapLibre1 = new M.layer.MapLibre({
  name: 'MapaLibre_1_NAME', legend: 'MapaLibre_1_LEGEND',
  url: 'https://demotiles.maplibre.org/style.json',
  extract: false,
  disableBackgroundColor: true,
}, { opacity: 0.7 });// , { mapLibreOptions: { style: 'https://demotiles.maplibre.org/style.json', preserveDrawingBuffer: true } });
map.addLayers(mapLibre1); window.mapLibre1 = mapLibre1; // */
/* / Capa MapLibre 2
const mapLibre2 = new M.layer.MapLibre({
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
  serverUrl: 'https://componentes.cnig.es/geoprint',
  printStatusUrl: 'https://componentes.cnig.es/geoprint/print/status',
  defaultOpenControl: 1, // 1 (printermap), 2 (georefImage), 3 (georefImageEpsg) OR 0 , >=4 (Ninguno) Abre el control indicado inicialmente.
  // printermap: true,
  printermap: { // serverUrl y printStatusUrl añadidos fuera de este.
    tooltip: 'TEST TOOLTIP printermap', // Tooltip del botón para escoger esta opción
    printTemplateUrl: 'https://componentes.cnig.es/geoprint/print/CNIG', // Templates a los cuales se añade este mapa
    fixedDescription: true, // Si es true no se puede cambiar la descripción
    // headerLegend es usado por algunas de las opciones de papel, como "A4 Horizontal (Cabecera)" en mitad del header(izquierda de "logo")
    headerLegend: 'data:image/png;base64,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',
    // filterTemplates: ['A3 Horizontal'], // Fuerza que en el selector de papeles solo aparezcan estos
    logo: 'https://www.idee.es/csw-codsi-idee/images/cabecera-CODSI.png', // logo de la esquina superior derecha del template
    credits: 'Ejemplo Guadaltel de prueba de Credits', // TEXTO de créditos abajo del template
  },
  // georefImage: true,
  georefImage: { // serverUrl y printStatusUrl añadidos fuera de este.
    tooltip: 'TEST TOOLTIP georefImage',
    printTemplateUrl: 'https://componentes.cnig.es/geoprint/print/mapexport',
    printSelector: true, // Activa las opciones de escoger configuraciones de este, si es false se usa "printType" para definir el método default
    printType: 'client', // 'client' | 'server'
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
