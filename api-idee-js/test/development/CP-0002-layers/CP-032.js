import { map as Mmap, proxy } from 'IDEE/api-idee';
import WMS from 'IDEE/layer/WMS';
import WMTS from 'IDEE/layer/WMTS';
import XYZ from 'IDEE/layer/XYZ';
import TMS from 'IDEE/layer/TMS';
import OSM from 'IDEE/layer/OSM';
import GeoJSON from 'IDEE/layer/GeoJSON';
import WFS from 'IDEE/layer/WFS';
import OGCAPIFeatures from 'IDEE/layer/OGCAPIFeatures';
import KML from 'IDEE/layer/KML';
import KMZ from 'IDEE/layer/KMZ';
import MBTiles from 'IDEE/layer/MBTiles';
import MVT from 'IDEE/layer/MVT';
import MBTilesVector from 'IDEE/layer/MBTilesVector';
import GeoTIFF from 'IDEE/layer/GeoTIFF';
import MapLibre from 'IDEE/layer/MapLibre';
import Vector from 'IDEE/layer/Vector';
import Tiles3D from 'IDEE/layer/Tiles3D';
import Terrain from 'IDEE/layer/Terrain';
import Feature from 'IDEE/feature/Feature';
import Generic from 'IDEE/style/Generic';

const query = new URLSearchParams(window.location.search);
const interval = Number(query.get('interval') || 5000);
const mode = query.get('mode') || 'on';
const route = query.get('route') || 'generic';
const base = query.get('data') || 'http://localhost:8083/datos-prueba/';
proxy(false);
IDEE.config('baseLayer', []);
IDEE.config('terrain', { default: [] });
// El servidor de desarrollo publica los recursos Cesium en /cesium/.
IDEE.config('CESIUM_URL', new URL('/cesium/', window.location.href).href);
IDEE.config('SQL_WASM_URL', new URL('/node_modules/sql.js/dist/', base).href);
const mapa = Mmap({
  container: 'map',
  projection: 'EPSG:3857',
  center: [0, 0],
  zoom: 3,
  layers: [],
  controls: [],
  resolutions: Array.from({ length: 29 }, (_, z) => 156543.03392804097 / (2 ** z)),
});
const cesium = !!mapa.getMapImpl().scene;
const constructors = {
  WMS,
  WMTS,
  XYZ,
  TMS,
  OSM,
  GeoJSON,
  WFS,
  OGCAPIFeatures,
  KML,
  KMZ,
  MBTiles,
  MVT,
  MBTilesVector,
  GeoTIFF,
  MapLibre,
  Vector,
  Tiles3D,
  Terrain,
};
const onlyOL = ['MVT', 'MBTilesVector', 'GeoTIFF', 'MapLibre'];
const available = Object.keys(constructors).filter((type) => (cesium
  ? !onlyOL.includes(type) : !['Tiles3D', 'Terrain'].includes(type)));
const type = available.includes(query.get('type')) ? query.get('type') : 'WMS';
available.forEach((value) => document.getElementById('type').add(
  new window.Option(value === 'Vector' ? 'Vector local (sin recarga remota)' : value, value),
));
document.getElementById('engine').textContent = cesium ? 'Cesium (3D)' : 'OpenLayers (2D)';
const tiled = cesium || query.get('tiled') !== 'false';
const parameters = {
  WMS: {
    url: `${base}wms`, name: 'prueba', tiled, useCapabilities: false,
  },
  WMTS: {
    url: `${base}wmts.png`,
    name: 'prueba',
    matrixSet: 'GoogleMapsCompatible',
    format: 'image/png',
    useCapabilities: false,
    maxExtent: cesium ? [-180, -85, 180, 85] : [-20037508, -20037508, 20037508, 20037508],
  },
  XYZ: { url: `${base}tiles/{z}/{x}/{y}.png` },
  TMS: { url: `${base}tiles/{z}/{x}/{y}.png` },
  OSM: { url: `${base}tiles/{z}/{x}/{y}.png` },
  GeoJSON: { url: `${base}puntos.geojson` },
  WFS: {
    url: `${base}wfs`, namespace: 'prueba', geometry: 'POINT', extract: false,
  },
  OGCAPIFeatures: { url: `${base}collections/`, name: 'puntos', limit: 1 },
  KML: { url: `${base}puntos.kml` },
  KMZ: { url: `${base}puntos.kmz` },
  MBTiles: { url: `${base}raster.mbtiles` },
  MVT: { url: `${base}tiles/{z}/{x}/{y}.pbf`, mode: 'feature' },
  MBTilesVector: { url: `${base}vector.mbtiles` },
  GeoTIFF: { url: `${base}raster.tif` },
  Tiles3D: { url: `${base}tileset.json` },
  Terrain: { url: `${base}terrain/` },
  MapLibre: {
    maplibrestyle: {
      version: 8,
      sources: { puntos: { type: 'geojson', data: `${base}puntos.geojson` } },
      layers: [{
        id: 'puntos',
        type: 'circle',
        source: 'puntos',
        paint: { 'circle-radius': 8, 'circle-color': '#be185d' },
      }],
    },
  },
};
const params = { name: `${type}-refresh`, ...parameters[type], isBase: false };
if (mode === 'on') params.refreshInterval = interval;
if (mode === 'invalid') params.refreshInterval = 0;
const capa = new constructors[type](
  params,
  type === 'WFS' ? { getFeatureOutputFormat: 'json', describeFeatureTypeOutputFormat: 'json' } : {},
);
const direct = typeof mapa[`add${type}`] === 'function' ? `add${type}` : 'addLayers';
const addLayer = () => mapa[route === 'direct' ? direct : 'addLayers'](capa);
addLayer();
if (type === 'Vector') {
  capa.setStyle(new Generic({
    point: { radius: 10, fill: { color: '#e11d48' }, stroke: { color: '#ffffff', width: 2 } },
  }));
  capa.addFeatures(new Feature('punto-local', {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [0, 0] },
    properties: { nombre: 'Punto local: debe conservarse', revision: 1 },
  }));
}
window.mapa = mapa;
window.capa = capa;
['type', 'mode', 'interval', 'route'].forEach((id) => {
  document.getElementById(id).value = {
    type, mode, interval, route,
  }[id];
});
document.querySelector('#route option[value=direct]').textContent = direct;
document.getElementById('tiled').value = String(tiled);
document.getElementById('type').onchange = () => {
  document.getElementById('tiled').disabled = cesium
    || document.getElementById('type').value !== 'WMS';
};
document.getElementById('type').onchange();
document.getElementById('wms-help').textContent = cesium
  ? 'Cesium utiliza WMS por teselas; la opción sin teselas solo está disponible en OpenLayers.'
  : 'Solo WMS: Sí solicita varias imágenes por teselas; No solicita una imagen para la vista.';
document.getElementById('expected').textContent = type === 'Vector'
  ? 'Vector local: debe aparecer un punto rosa en el centro. No tiene URL ni descarga datos. '
    + 'Su revisión permanece en 1 aunque haya intervalo. Es una prueba de conservación de datos locales. '
    + 'Para probar recargas vectoriales elige GeoJSON, WFS, OGCAPIFeatures, KML o KMZ.'
  : 'Con intervalo válido, comprueba nuevas peticiones en Red. GeoJSON/WFS/OGC cambian revision; '
    + 'KML/KMZ cambian name. Los demás archivos e imágenes de prueba son fijos.';
document.getElementById('data').value = base;
document.getElementById('params').textContent = JSON.stringify(params);
document.getElementById('remove').onclick = () => mapa.removeLayers(capa);
document.getElementById('add').onclick = addLayer;
document.getElementById('edit').disabled = !['GeoJSON', 'WFS', 'OGCAPIFeatures', 'KML', 'KMZ'].includes(type);
document.getElementById('resume').disabled = document.getElementById('edit').disabled;
let edited;
document.getElementById('edit').onclick = () => {
  const feature = capa.getFeatures?.()[0];
  if (!feature || edited) return;
  const attribute = ['KML', 'KMZ'].includes(type) ? 'name' : 'revision';
  edited = { feature, attribute, value: feature.getAttribute(attribute) };
  feature.setAttribute(attribute, 'edición local');
};
document.getElementById('resume').onclick = () => {
  if (!edited) return;
  edited.feature.setAttribute(edited.attribute, edited.value);
  capa.resumeAutoRefresh();
  edited = undefined;
};
const statusTimer = setInterval(() => {
  document.getElementById('status').textContent = JSON.stringify({
    motor: cesium ? 'Cesium' : 'OpenLayers',
    intervaloConfigurado: capa.getAutoRefreshInterval() ?? 'Sin intervalo',
    configurado: capa.isAutoRefreshValid(),
    pausa: capa.isAutoRefreshPaused?.(),
    datos: capa.getFeatures?.().slice(0, 2).map((feature) => feature.getAttributes()),
  }, null, 2);
}, 1000);
document.getElementById('destroy').onclick = () => { clearInterval(statusTimer); mapa.destroy(); };
