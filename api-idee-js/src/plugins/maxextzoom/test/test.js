import MaxExtZoom from 'facade/maxextzoom';

IDEE.language.setLang(window.localStorage.getItem('language') || 'es');

const map = IDEE.map({
  container: 'mapjs',
});
window.map = map;

let mp;

const createPlugin = (options) => {
  mp = new MaxExtZoom(options);
  window.mp = mp;
  map.addPlugin(mp);
};

const removePlugin = () => {
  if (mp) {
    map.removePlugins(mp);
    mp = null;
  }
};

const botonEliminar = document.getElementById('botonEliminar');
botonEliminar.addEventListener('click', () => { removePlugin(); });

const selectPosicion = document.getElementById('selectPosicion');
const inputOrder = document.getElementById('inputOrder');
const inputTooltip = document.getElementById('inputTooltip');
const buttonApi = document.getElementById('buttonAPI');

const updatePlugin = () => {
  const options = {};
  options.position = selectPosicion.options[selectPosicion.selectedIndex].value;
  options.order = Number(inputOrder.value);
  options.tooltip = inputTooltip.value;

  removePlugin();
  createPlugin(options);
};

[
  selectPosicion,
  inputOrder,
  inputTooltip,
].forEach((ctrl) => {
  ctrl.addEventListener('change', updatePlugin);
});

buttonApi.addEventListener('click', () => {
  const posicion = selectPosicion.options[selectPosicion.selectedIndex].value;
  const order = inputOrder.value;
  const tooltip = inputTooltip.value;

  window.location.href = `${window.location.href.substring(0, window.location.href.indexOf('api-idee'))}api-idee/?maxextzoom=${posicion}*${order}*${tooltip}`;
});

updatePlugin();

try {
  map.addPlugin(new IDEE.plugin.Help({}));
} catch (err) {
  // Help puede fallar en algunos entornos sin afectar al plugin
}
