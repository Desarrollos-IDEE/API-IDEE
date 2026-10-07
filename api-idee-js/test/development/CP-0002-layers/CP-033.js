import { map as Mmap, proxy } from 'IDEE/api-idee';
import WMS from 'IDEE/layer/WMS';
import GeoJSON from 'IDEE/layer/GeoJSON';
import KMZ from 'IDEE/layer/KMZ';
import XYZ from 'IDEE/layer/XYZ';
import LayerGroup from 'IDEE/layer/LayerGroup';

const query = new URLSearchParams(window.location.search);
const interval = Number(query.get('interval') || 5000);
const ownValue = query.get('own') ?? '1000';
const ownInterval = ownValue.trim() ? Number(ownValue) : undefined;
const mode = query.get('mode') || 'on';
const base = query.get('data') || 'http://localhost:8083/datos-prueba/';
proxy(false);
IDEE.config('baseLayer', []);
IDEE.config('terrain', { default: [] });
// El servidor de desarrollo publica los recursos Cesium en /cesium/.
IDEE.config('CESIUM_URL', new URL('/cesium/', window.location.href).href);
const wms = new WMS({
  name: 'prueba',
  legend: 'WMS propia',
  url: `${base}wms?case=own`,
  useCapabilities: false,
  isBase: false,
  refreshInterval: ownInterval,
});
const inherited = new WMS({
  name: 'prueba',
  legend: 'WMS heredada inicial',
  url: `${base}wms?case=inherited`,
  useCapabilities: false,
  isBase: false,
});
const geojson = new GeoJSON({
  name: 'GeoJSON propia',
  url: `${base}puntos.geojson`,
  refreshInterval: ownInterval,
});
const kmz = new KMZ({
  name: 'KMZ propia',
  url: `${base}puntos.kmz`,
  refreshInterval: ownInterval,
});
const xyz = new XYZ({ name: 'XYZ heredada', url: `${base}tiles/{z}/{x}/{y}.png`, isBase: false });
const params = {
  container: 'map',
  projection: 'EPSG:3857',
  center: [0, 0],
  zoom: 5,
  layers: [wms, inherited, geojson, kmz, xyz],
  controls: [],
};
if (mode === 'on') params.refreshInterval = interval;
if (mode === 'invalid') params.refreshInterval = 0;
const mapa = Mmap(params);
const cesium = !!mapa.getMapImpl().scene;
document.getElementById('engine').textContent = cesium ? 'Cesium (3D)' : 'OpenLayers (2D)';
const capas = [wms, inherited, geojson, kmz, xyz];
window.mapa = mapa;
window.capas = capas;
let sequence = 0;
let last = wms;
document.getElementById('interval').value = interval;
document.getElementById('own').value = ownInterval ?? '';
document.getElementById('mode').value = mode;
document.getElementById('data').value = base;
document.getElementById('params').textContent = JSON.stringify({
  mapa: mode === 'none' ? {} : { refreshInterval: params.refreshInterval },
  WMSPropia: { refreshInterval: ownInterval },
  WMSHeredada: {},
});
document.getElementById('update').onclick = () => {
  const value = document.getElementById('mode').value === 'on'
    ? Number(document.getElementById('interval').value) : undefined;
  mapa.updateLayersRefreshInterval(value);
};
document.getElementById('add-wms').onclick = () => {
  sequence += 1;
  last = new WMS({
    name: 'prueba',
    legend: `WMS heredada ${sequence}`,
    url: `${base}wms?case=later-${sequence}`,
    useCapabilities: false,
    isBase: false,
  });
  capas.push(last);
  mapa.addWMS(last);
};
document.getElementById('add-vector').onclick = () => {
  sequence += 1;
  last = new GeoJSON({
    name: `GeoJSON posterior ${sequence}`,
    url: `${base}puntos.geojson?case=later-${sequence}`,
  });
  capas.push(last);
  mapa.addLayers(last);
};

document.getElementById('add-kmz').onclick = () => {
  sequence += 1;
  last = new KMZ({
    name: `KMZ posterior ${sequence}`,
    url: `${base}puntos.kmz?case=later-${sequence}`,
  });
  capas.push(last);
  mapa.addKMZ(last);
};

document.getElementById('group').disabled = cesium;
document.getElementById('group').onclick = () => {
  sequence += 1;
  const child = new WMS({
    name: 'prueba',
    legend: `WMS de grupo ${sequence}`,
    url: `${base}wms?case=group-${sequence}`,
    useCapabilities: false,
    isBase: false,
  });
  const vectorChild = new GeoJSON({
    name: `GeoJSON de grupo ${sequence}`,
    url: `${base}puntos.geojson?case=group-${sequence}`,
  });
  last = new LayerGroup({ name: `grupo-${sequence}`, layers: [child, vectorChild] });
  capas.push(last, child, vectorChild);
  mapa.addLayers(last);
};
document.getElementById('remove').onclick = () => mapa.removeLayers(last);
document.getElementById('reinsert').onclick = () => mapa.addLayers(last);
const statusTimer = setInterval(() => {
  document.getElementById('status').textContent = JSON.stringify(capas.map((layer) => ({
    nombre: layer.legend || layer.name,
    tipo: layer.type,
    intervaloConfigurado: layer.getAutoRefreshInterval() ?? 'Sin intervalo',
  })), null, 2);
}, 1000);
document.getElementById('destroy').onclick = () => { clearInterval(statusTimer); mapa.destroy(); };
