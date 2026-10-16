/* eslint-disable */
import WFSTControls from 'facade/wfstcontrols';

IDEE.language.setLang('es');

const map = IDEE.map({
  container: 'mapjs',
});
window.map = map;

const wfsLayer = new IDEE.layer.WFS({
  url: 'https://www.ign.es/wfs/redes-geodesicas?',
  legend: 'Red Geodésica Nacional por Técnicas Espaciales (REGENTE)',
  name: 'RED_REGENTE',
  geometry: 'POINT',
  extract: true,
});

map.addWFS(wfsLayer);

let mp = null;
let updateTimeout = null;

const selectPosition = document.getElementById('selectPosition');
const selectCollapsed = document.getElementById('selectCollapsed');
const inputOrder = document.getElementById('inputOrder');
const inputTooltip = document.getElementById('inputTooltip');
const inputFeatures = document.getElementById('inputFeatures');
const inputLayername = document.getElementById('inputLayername');
const selectGeometry = document.getElementById('selectGeometry');
const botonEliminar = document.getElementById('botonEliminar');

const removePlugin = () => {
  if (!mp) {
    return;
  }

  try {
    map.removePlugins(mp);
  } catch (err) {
    console.error(err);
  }

  mp = null;
  window.mp = null;
};

const createPlugin = () => {
  removePlugin();

  const position = selectPosition?.value || 'right';
  const collapsed = (selectCollapsed?.value || 'true') === 'true';
  const orderValue = inputOrder?.value;
  const tooltip = inputTooltip?.value || 'Herramientas de edición';
  const features = inputFeatures?.value
    || 'drawfeature,modifyfeature,deletefeature,editattribute';
  const layername = inputLayername?.value || 'RED_REGENTE';
  const geometry = selectGeometry?.value || 'POINT';

  mp = new WFSTControls({
    position,
    collapsed,
    order: orderValue === '' ? undefined : Number(orderValue),
    tooltip,
    features,
    layername,
    geometry,
    proxy: {
      status: true,
      disable: false,
    },
  });

  window.mp = mp;
  map.addPlugin(mp);
};

const updatePluginImmediately = () => {
  if (updateTimeout !== null) {
    clearTimeout(updateTimeout);
    updateTimeout = null;
  }

  createPlugin();
};

const schedulePluginUpdate = () => {
  if (updateTimeout !== null) {
    clearTimeout(updateTimeout);
  }

  updateTimeout = setTimeout(() => {
    updateTimeout = null;
    createPlugin();
  }, 250);
};

[
  selectPosition,
  selectCollapsed,
  selectGeometry,
].forEach((control) => {
  if (control) {
    control.addEventListener('change', updatePluginImmediately);
  }
});

[
  inputOrder,
  inputTooltip,
  inputFeatures,
  inputLayername,
].forEach((control) => {
  if (control) {
    control.addEventListener('input', schedulePluginUpdate);
    control.addEventListener('change', updatePluginImmediately);
  }
});

if (botonEliminar) {
  botonEliminar.addEventListener('click', () => {
    if (updateTimeout !== null) {
      clearTimeout(updateTimeout);
      updateTimeout = null;
    }

    removePlugin();
  });
}

createPlugin();
