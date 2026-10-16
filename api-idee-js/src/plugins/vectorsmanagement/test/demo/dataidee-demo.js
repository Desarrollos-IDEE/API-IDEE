const modeSelect = document.getElementById('demo-mode');
const status = document.getElementById('demo-status');
const mode = new URLSearchParams(window.location.search).get('mode') || 'local';
const isTeunesco = mode.startsWith('teunesco-');
modeSelect.value = mode;
IDEE.config('terrain', { ...IDEE.config.terrain, default: '' });
IDEE.config('baseLayer', []);

const map = IDEE.map({
  container: 'map',
  projection: 'EPSG:3857',
  bbox: isTeunesco ? [-750000, 4400000, -600000, 5000000]
    : [-1000000, -1000000, 1000000, 1000000],
});
const serviceUrl = isTeunesco ? `${window.location.origin}/teunesco/data-idee-api`
  : `${window.location.origin}/local`;
const collections = {
  local: 'demo',
  'teunesco-farmacias': 'farmacias',
  'teunesco-rutas': 'eurovelo_rutas',
  'teunesco-terminos': 'terminosmunicipales',
};
const collection = collections[mode] || mode;
const layer = new IDEE.layer.DataIDEE({
  url: serviceUrl,
  name: collection,
  legend: isTeunesco ? `Colección ${collection} TEUNESCO` : `Colección local ${collection}`,
  limit: 250,
}, {
  bboxStrategy: false,
  editingLimits: {
    pageSize: 2, maxFeatures: 1000, maxCoordinates: 100000, maxBytes: 10 * 1024 * 1024,
  },
  dataideeDefaultProperties: mode === 'local' ? { category: 'demo' } : {},
});

layer.on('load', () => {
  status.textContent = `Cargadas ${layer.getFeatures().length} entidades.`;
});
layer.on('loaderror', () => {
  status.textContent = 'No se pudo cargar la colección.';
});
map.addLayers(layer);
map.addPlugin(new IDEE.plugin.VectorsManagement({
  selection: true,
  creation: true,
  edition: true,
  download: false,
  analysis: false,
  style: false,
  help: false,
  addlayer: false,
}));

modeSelect.addEventListener('change', (event) => {
  window.location.search = `?mode=${encodeURIComponent(event.target.value)}`;
});

window.dataideeDemo = { map, layer };
