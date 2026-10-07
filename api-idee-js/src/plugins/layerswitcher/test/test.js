import Layerswitcher from 'facade/layerswitcher';

window.IDEE.plugin.Layerswitcher = Layerswitcher;

IDEE.language.setLang('es');

const map = IDEE.map({
  container: 'mapjs',
  zoom: 5,
  maxZoom: 20,
  minZoom: 2,
  center: [-467062.8225, 4783459.6216],
  controls: ['attributions']
});
window.map = map;

const capaGeoJSON = new IDEE.layer.GeoJSON({
  name: 'Capa GeoJSON',
  url: 'https://www.ign.es/resources/geodesia/GNSS/SPTR_geo.json',
  extract: false,
});

map.addLayers(capaGeoJSON);

const capaWMS = new IDEE.layer.WMS({
  url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
  name: 'AU.AdministrativeUnit',
  legend: 'Capa WMS',
});

map.addLayers(capaWMS);

let mp = null;

const createPlugin = (options) => {
  mp = new IDEE.plugin.Layerswitcher(options);
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
const inputTooltip = document.getElementById('inputTooltip');
const inputOrder = document.getElementById('inputOrder');
const selectAdd = document.getElementById('selectAddLayers');
const selectStatus = document.getElementById('selectStatusLayers');
const inputTools = document.getElementById('inputTools');
const selectMoveLayer = document.getElementById('isMoveLayers');
const selectModeSelectLayers = document.getElementById('modeSelectLayers');
const inputPrecharged = document.getElementById('inputPrecharged');
const selectHttp = document.getElementById('isHttp');
const selectHttps = document.getElementById('isHttps');
const selectShowCatalog = document.getElementById('isShowCatalog');
const selectProxy = document.getElementById('selectProxy');
const selectDisplay = document.getElementById('selectDisplay');
const selectUseAttributions = document.getElementById('selectUseAttributions');

const boolVal = (select, defaultVal = true) => {
  const v = select.options[select.selectedIndex].value;
  if (v === '') return defaultVal;
  return v === 'true';
};

const updatePlugin = () => {
  const options = {};
  options.position = selectPosition.options[selectPosition.selectedIndex].value;
  options.collapsed = selectCollapsed.options[selectCollapsed.selectedIndex].value === '' || selectCollapsed.options[selectCollapsed.selectedIndex].value === 'true';
  options.order = Number(inputOrder.value);
  options.addLayers = boolVal(selectAdd, true);
  options.statusLayers = boolVal(selectStatus, true);
  options.tooltip = inputTooltip.value || '';
  options.tools = inputTools.value !== '' ? inputTools.value.split(', ') : [];
  options.isMoveLayers = boolVal(selectMoveLayer, false);
  options.modeSelectLayers = selectModeSelectLayers.options[selectModeSelectLayers.selectedIndex].value || 'eyes';
  const prechargedOption = [...document.querySelectorAll('#prechargedSug option')]
    .find((option) => option.value === inputPrecharged.value);
  if (prechargedOption) inputPrecharged.value = prechargedOption.dataset.precharged;
  options.precharged = inputPrecharged.value.trim() || undefined;
  options.http = boolVal(selectHttp, true);
  options.https = boolVal(selectHttps, true);
  options.showCatalog = boolVal(selectShowCatalog, false);
  options.useProxy = boolVal(selectProxy, true);
  options.displayLabel = boolVal(selectDisplay, false);
  options.useAttributions = boolVal(selectUseAttributions, false);

  removePlugin();
  createPlugin(options);
};

[
  selectPosition,
  selectCollapsed,
  inputOrder,
  inputTooltip,
  selectAdd,
  selectStatus,
  inputTools,
  selectMoveLayer,
  selectModeSelectLayers,
  inputPrecharged,
  selectHttp,
  selectHttps,
  selectShowCatalog,
  selectProxy,
  selectDisplay,
  selectUseAttributions,
].forEach((ctrl) => {
  ctrl.addEventListener('change', updatePlugin);
});

updatePlugin();
