import { map as createMap } from 'IDEE/api-idee';
import DataIDEE from 'IDEE/layer/DataIDEE';
import Generic from 'IDEE/style/Generic';

const requestCountElement = document.getElementById('request-count');
const featureCountElement = document.getElementById('feature-count');
const statusElement = document.getElementById('status');
const areas = {
  sevilla: { center: [-670000, 4495000], geographic: [-6.018712403600794, 37.399933891921] },
  'dos-hermanas': { center: [-665000, 4477500], geographic: [-5.973796639394817, 37.275] },
};
let requestCount = 0;
let previousRequestCount = 0;
let loadCount = 0;

// Cuenta únicamente las peticiones del servicio de esta demostración.
const originalOpen = XMLHttpRequest.prototype.open;
const originalSend = XMLHttpRequest.prototype.send;
XMLHttpRequest.prototype.open = function open(method, url, ...args) {
  this.dataIdeeDemoUrl = String(url);
  return originalOpen.call(this, method, url, ...args);
};
XMLHttpRequest.prototype.send = function send(...args) {
  if (this.dataIdeeDemoUrl?.includes('api-features.ign.es/collections/nuc/items')) {
    requestCount += 1;
    requestCountElement.textContent = String(requestCount);
  }
  return originalSend.apply(this, args);
};

const map = createMap({
  container: 'map',
  center: areas.sevilla.center,
  zoom: 13,
});

const moveToArea = (area) => {
  const center = map.getImplementation() === 'cesium' ? area.geographic : area.center;
  map.setCenter({ x: center[0], y: center[1] });
  map.setZoom(13);
};
moveToArea(areas.sevilla);

const layer = new DataIDEE({
  url: 'https://api-features.ign.es',
  name: 'nuc',
  legend: 'Núcleos de población (IGN)',
  limit: 100,
  extract: true,
}, {
  bboxStrategy: true,
  cache: { ttlMs: 60000, maxEntries: 32, maxBytes: 33554432 },
  throttleMs: 300,
  style: new Generic({
    polygon: {
      fill: { color: 'rgba(230, 70, 30, 0.35)' },
      stroke: { color: '#b83218', width: 1 },
    },
  }),
});

layer.on('load', () => {
  loadCount += 1;
  const newRequests = requestCount - previousRequestCount;
  previousRequestCount = requestCount;
  featureCountElement.textContent = String(layer.getFeatures().length);
  document.getElementById('load-count').textContent = String(loadCount);
  statusElement.textContent = newRequests === 0
    ? 'Entidades aplicadas por la capa sin nuevas peticiones de red.'
    : `Entidades aplicadas por la capa tras ${newRequests} petición(es) nueva(s).`;
});
layer.on('load:error', (error) => {
  statusElement.textContent = `Error al cargar DataIDEE: ${error?.message || 'revisa la consola y la conexión.'}`;
});
map.addLayers(layer);

// Los controles solo mueven la vista o llaman a la API pública.
// DataIDEE consulta el bbox, gestiona la caché y aplica las entidades automáticamente.
const onInitialView = () => {
  document.getElementById('query-area').value = 'sevilla';
  moveToArea(areas.sevilla);
};
const onRefresh = () => {
  statusElement.textContent = 'Solicitando datos frescos para la vista actual…';
  layer.refresh();
};
const onClearCache = () => {
  layer.clearCache();
  statusElement.textContent = 'Caché vaciada. La próxima carga consultará el servicio.';
};
const onAreaChange = (event) => moveToArea(areas[event.target.value]);

document.getElementById('initial-view').addEventListener('click', onInitialView);
document.getElementById('refresh-layer').addEventListener('click', onRefresh);
document.getElementById('clear-cache').addEventListener('click', onClearCache);
document.getElementById('query-area').addEventListener('change', onAreaChange);

window.map = map;
window.dataIdeeLayer = layer;
