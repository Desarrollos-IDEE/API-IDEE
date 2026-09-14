import Magnify from 'facade/magnify';

IDEE.language.setLang(window.localStorage.getItem('language') || 'es');

const map = IDEE.map({
  container: 'mapjs',
  projection: 'EPSG:25830',
});

window.map = map;
window.IDEE.plugin.Magnify = Magnify;

const wmts = new IDEE.layer.WMTS({
  url: 'http://www.ign.es/wmts/pnoa-ma',
  name: 'OI.OrthoimageCoverage',
  matrixSet: 'EPSG:25830',
  legend: 'PNOA',
}, {
  format: 'image/png',
});

map.addLayers([wmts]);

map.addLayers(new IDEE.layer.WMTS({
  url: 'https://wmts-potencial-solar.idee.es/potencial-solar',
  name: 'potencial-solar',
  legend: 'Potencial Solar',
  matrixSet: 'EPSG:25830',
}, {}));

let mp = null;

const createPlugin = (options) => {
  mp = new Magnify(options);
  window.mp = mp;
  map.addPlugin(mp);
};

const removePlugin = () => {
  if (mp) {
    map.removePlugins(mp);
    mp = null;
  }
};

const selectPosition = document.getElementById('selectPosition');
const selectCollapsed = document.getElementById('selectCollapsed');
const inputOrder = document.getElementById('inputOrder');
const inputTooltip = document.getElementById('inputTooltip');
const inputLayers = document.getElementById('inputLayers');
const inputZoomMax = document.getElementById('inputZoomMax');
const inputZoom = document.getElementById('inputZoom');
const removeButton = document.getElementById('removeButton');

const updatePlugin = () => {
  removePlugin();
  createPlugin({
    position: selectPosition.value,
    collapsed: selectCollapsed.value === 'true',
    order: Number(inputOrder.value),
    tooltip: inputTooltip.value,
    layers: inputLayers.value,
    zoomMax: Number(inputZoomMax.value),
    zoom: Number(inputZoom.value),
  });
};

removeButton.addEventListener('click', removePlugin);

[
  selectPosition,
  selectCollapsed,
  inputOrder,
  inputTooltip,
  inputLayers,
  inputZoomMax,
  inputZoom,
].forEach((ctrl) => {
  ctrl.addEventListener('change', updatePlugin);
});

updatePlugin();
