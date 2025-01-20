/* eslint-disable no-unused-vars */
import Comparators from 'facade/comparators';

M.language.setLang('es');
// M.proxy(false);

const map = M.map({
  container: 'mapjs',
  zoom: 6,
  bbox: [323020, 4126873, 374759, 4152013],
  // layers: ['OSM'],
});

const mp = new Comparators({
  position: 'TR',
  collapsed: false,
  collapsible: true,
  transparencyParams: false,
  lyrcompareParams: false,
  mirrorpanelParams: false,
  windowsyncParams: true,
});

map.addPlugin(mp);
window.map = map;

// ** CAPAS **
// * RASTER *
const capaWMS = new M.layer.WMS({
  url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
  name: 'AU.AdministrativeUnit',
  legend: 'Capa WMS l',
});

// map.addLayers(capaWMS);

const capaWMTS = new M.layer.WMTS({
  url: 'https://servicios.idee.es/wmts/ocupacion-suelo',
  name: 'LC.LandCoverSurfaces',
  legend: 'LC.LandCoverSurfaces l',
  matrixSet: 'GoogleMapsCompatible',
  format: 'image/png',
});

// map.addLayers(capaWMTS);

// XYZ - String
// map.addLayers('XYZ*PNOA-MA*https://tms-pnoa-ma.idee.es/1.0.0/pnoa-ma/{z}/{x}/{-y}.jpeg*true*true');

const capaTMS = new M.layer.TMS({
  url: 'https://tms-pnoa-ma.idee.es/1.0.0/pnoa-ma/{z}/{x}/{-y}.jpeg',
  legend: 'PNOA_MA',
  name: 'PNOA_MA',
  visible: true,
  transparent: false,
  tileGridMaxZoom: 19,
});

// map.addLayers(capaTMS);

const capaOSM = new M.layer.OSM({
  name: 'Capa OSM',
  legend: 'Capa OSM',
  transparent: true,
  url: 'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
  matrixSet: 'EPSG:3857',
});

// map.addLayers(capaOSM);

// ? No se puede compartir porque no tiene URL
/*
const mbtile = new M.layer.MBTiles({
  name: 'mbtilesLoadFunction',
  legend: 'Capa personalizada MBTiles',
  tileLoadFunction: (z, x, y) => {
    return new Promise((resolve) => {
      if (z > 4) {
        resolve('https://cdn-icons-png.flaticon.com/512/4616/4616040.png');
      } else {
        resolve('https://cdn.icon-icons.com/icons2/2444/PNG/512/location_map_pin_direction_icon_148665.png');
      }
    });
  },
});
*/

const mbtile = new M.layer.MBTiles({
  name: 'mbtiles',
  legend: 'Capa',
  url: './prueba1.mbtiles',
});

// map.addLayers(mbtile);

// !--
// !--

// *CAPAS VECTORIALES*
const capaVector = new M.layer.Vector({
  name: 'capaVector',
  legend: 'vector legend',
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

// map.addLayers(capaVector);

const capaGeoJSON = new M.layer.GeoJSON({
  name: 'Capa GeoJSON',
  legend: 'Capa GeoJSON',
  url: 'http://geostematicos-sigc.juntadeandalucia.es/geoserver/tematicos/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=tematicos:Provincias&maxFeatures=50&outputFormat=application%2Fjson',
  extract: true,
});

// map.addLayers(capaGeoJSON);

const capaKML = new M.layer.KML({
  url: 'https://www.ign.es/web/resources/delegaciones/delegacionesIGN.kml',
  name: 'Capa KML',
  legend: 'Capa KML',
  extract: true,
});

// map.addLayers(capaKML);

/*
const capaWFS = new M.layer.WFS({
  url: 'http://geostematicos-sigc.juntadeandalucia.es/geoserver/tematicos/ows?',
  namespace: 'tematicos',
  name: 'Provincias',
  legend: 'Capa WFS l',
  geometry: 'MPOLYGON',
});
*/
// map.addLayers(capaWFS);

/*
window.fetch('./prueba1.mbtiles').then((response) => {
  const mbtilesvector = new M.layer.MBTilesVector({
    name: 'mbtiles_vector',
    legend: 'Capa MBTilesVector L',
    source: response,
  });
  map.addLayers(mbtilesvector);
}).catch((e) => {
  throw e;
});
*/

const mbtileVector = new M.layer.MBTilesVector({
  name: 'mbtilesvector',
  legend: 'Capa personalizada MBTilesVector',
  tileLoadFunction: (z, x, y) => {
    return new Promise((resolve) => {
      window.fetch(`https://ahocevar.com/geoserver/gwc/service/tms/1.0.0/ne:ne_10m_admin_0_countries@EPSG%3A900913@pbf/${z}/${x}/${y}.pbf`).then((response) => {
        resolve(response.arrayBuffer());
      });
    });
  },
});
// map.addLayers(mbtileVector);

const capaMVT = new M.layer.MVT({
  url: 'https://www.ign.es/web/resources/mapa-base-xyz/vt/{z}/{x}/{y}.pbf',
  // layers: ['camino_lin'],
  name: 'Capa MVT',
  legend: 'Capa MVT',
  projection: 'EPSG:3857',
  extract: true,
});

// map.addLayers(capaMVT);

const capaOGCAPIFeatures = new M.layer.OGCAPIFeatures({
  url: 'https://api-features.idee.es/collections',
  name: 'hidrografia/Falls',
  legend: 'Capa OGCAPIFeatures',
});

// map.addLayers(capaOGCAPIFeatures);
