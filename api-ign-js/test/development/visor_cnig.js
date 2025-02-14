import IGNSearch from 'plugins/ignsearch/src/facade/js/ignsearch';
import Attributions from 'plugins/attributions/src/facade/js/attributions';
import ShareMap from 'plugins/sharemap/src/facade/js/sharemap';
import XYLocator from 'plugins/xylocator/src/facade/js/xylocator';
import ZoomExtent from 'plugins/zoomextent/src/facade/js/zoomextent';
import MouseSRS from 'plugins/mousesrs/src/facade/js/mousesrs';
import TOC from 'plugins/toc/src/facade/js/toc';

const mapjs = M.map({
  container: 'map',
  controls: ['panzoom', 'scale*true', 'scaleline', 'rotate', 'location', 'backgroundlayers', 'getfeatureinfo'],
  zoom: 5,
  maxZoom: 20,
  minZoom: 4,
  center: [-467062.8225, 4683459.6216],
});

window.mapjs = mapjs;

const layerinicial = new M.layer.WMS({
  url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
  name: 'AU.AdministrativeBoundary',
  legend: 'Limite administrativo',
  tiled: false,
}, {});

const layerUA = new M.layer.WMS({
  url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
  name: 'AU.AdministrativeUnit',
  legend: 'Unidad administrativa',
  tiled: false,
}, {});

const ocupacionSuelo = new M.layer.WMTS({
  url: 'http://wmts-mapa-lidar.idee.es/lidar',
  name: 'EL.GridCoverageDSM',
  legend: 'Modelo Digital de Superficies LiDAR',
  matrixSet: 'GoogleMapsCompatible',
}, {
  visibility: false,
});


const kml = new M.layer.KML('KML*Delegaciones IGN*https://www.ign.es/web/resources/delegaciones/delegacionesIGN.kml*false*false');

mapjs.addLayers([ocupacionSuelo, layerinicial, layerUA, kml]);
// mapjs.addLayers([ocupacionSuelo]);
// mapjs.addLayers([layerinicial]);
// mapjs.addLayers([layerUA]);
// mapjs.addLayers([kml]);


const mp = new IGNSearch({
  servicesToSearch: 'gn',
  maxResults: 10,
  isCollapsed: false,
  noProcess: 'municipio,poblacion',
  countryCode: 'es',
  reverse: true,
});

const mp2 = new Attributions({
  mode: 1,
  scale: 10000,
  // defaultAttribution: 'Instituto Geográfico Nacional',
  // defaultURL: 'https://www.ign.es/',
  // url: 'https://mapea-lite.desarrollo.guadaltel.es/api-core/files/attributions/WMTS_PNOA_20170220/atribucionPNOA_Url.kml',
  // type: 'kml',
});

const mp3 = new ShareMap({
  baseUrl: window.location.href.substring(0, window.location.href.indexOf('api-core')) + "api-core/",
  position: 'BR',
});

const mp4 = new XYLocator({
  position: 'TL',
});
const mp6 = new ZoomExtent();
const mp7 = new MouseSRS({
  srs: 'EPSG:4326',
  label: 'WGS84',
  precision: 6,
  geoDecimalDigits: 4,
  utmDecimalDigits: 2,
});
const mp8 = new TOC();


mapjs.addPlugin(mp);
mapjs.addPlugin(mp2);
mapjs.addPlugin(mp3);
mapjs.addPlugin(mp4);
mapjs.addPlugin(mp6);
mapjs.addPlugin(mp7);
mapjs.addPlugin(mp8);
