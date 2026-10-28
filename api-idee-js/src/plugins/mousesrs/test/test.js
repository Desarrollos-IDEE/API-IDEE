import MouseSRS from 'facade/mousesrs';

window.IDEE.plugin.MouseSRS = MouseSRS;

IDEE.language.setLang('es');

const map = IDEE.map({
  container: 'mapjs',
  projection: 'EPSG:3857',
  center: [-443729, 4860856],
  controls: ['scale', "rotate*position='left'"],
  zoom: 8,
});
window.map = map;

let mp = null;

const createPlugin = (options) => {
  mp = new MouseSRS(options);
  window.mp = mp;
  map.addPlugin(mp);
};

const removePlugin = () => {
  if (mp) map.removePlugins(mp);
};

const removeButton = document.getElementById('removeButton');
removeButton.addEventListener('click', () => { removePlugin(); });

const selectPosition = document.getElementById('selectPosition');
const inputTooltip = document.getElementById('inputTooltip');
const inputSrs = document.getElementById('inputSrs');
const inputLabel = document.getElementById('inputLabel');
const inputPrecision = document.getElementById('inputPrecision');
const inputGeoDecimalDigits = document.getElementById('inputGeoDecimalDigits');
const inputUtmDecimalDigits = document.getElementById('inputUtmDecimalDigits');
const selectActiveZ = document.getElementById('selectActiveZ');
const selectEpsgFormat = document.getElementById('selectEpsgFormat');
const selectMode = document.getElementById('selectMode');
const inputCoveragePrecissions = document.getElementById('inputCoveragePrecissions');
const inputHelpUrl = document.getElementById('inputHelpUrl');
const inputOrder = document.getElementById('inputOrder');

const boolVal = (select, defaultVal = true) => {
  const v = select.options[select.selectedIndex].value;
  if (v === '') return defaultVal;
  return v === 'true';
};

const updatePlugin = () => {
  const options = {};
  options.position = selectPosition.options[selectPosition.selectedIndex].value;
  options.tooltip = inputTooltip.value;
  options.srs = inputSrs.value;
  options.label = inputLabel.value;
  options.precision = Number(inputPrecision.value);
  options.geoDecimalDigits = inputGeoDecimalDigits.value !== '' ? Number(inputGeoDecimalDigits.value) : undefined;
  options.utmDecimalDigits = inputUtmDecimalDigits.value !== '' ? Number(inputUtmDecimalDigits.value) : undefined;
  options.activeZ = boolVal(selectActiveZ, false);
  options.epsgFormat = boolVal(selectEpsgFormat, false);
  options.mode = selectMode.options[selectMode.selectedIndex].value;
  if (inputCoveragePrecissions.value.trim()) {
    try {
      options.coveragePrecissions = JSON.parse(inputCoveragePrecissions.value);
    } catch (e) {
      options.coveragePrecissions = inputCoveragePrecissions.value;
    }
  }
  options.helpUrl = inputHelpUrl.value;
  options.order = Number(inputOrder.value);

  removePlugin();
  createPlugin(options);
};

[
  selectPosition,
  inputTooltip,
  inputSrs,
  inputLabel,
  inputPrecision,
  inputGeoDecimalDigits,
  inputUtmDecimalDigits,
  selectActiveZ,
  selectEpsgFormat,
  selectMode,
  inputCoveragePrecissions,
  inputHelpUrl,
  inputOrder,
].forEach((ctrl) => {
  ctrl.addEventListener('change', updatePlugin);
});

updatePlugin();
