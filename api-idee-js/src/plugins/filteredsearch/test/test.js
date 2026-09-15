import FilteredSearch from 'facade/filteredsearch';

IDEE.language.setLang(window.localStorage.getItem('language') || 'es');

window.IDEE.plugin.FilteredSearch = FilteredSearch;

const map = IDEE.map({
  container: 'mapjs',
  controls: ['panzoom'],
});

window.map = map;

const geodesia = new IDEE.layer.WFS({
  url: 'https://www.ign.es/wfs/redes-geodesicas?',
  legend: 'Red Geodésica Nacional por Técnicas Espaciales (REGENTE)',
  name: 'RED_REGENTE',
  geometry: 'POINT',
  extract: true,
});

const provincias = new IDEE.layer.WFS({
  url: 'https://hcsigc.juntadeandalucia.es/geoserver/wfs?',
  namespace: 'IECA',
  name: 'sigc_provincias_1724753768757',
  legend: 'Provincias',
  geometry: 'MPOLYGON',
});

map.addWFS(geodesia);
map.addWFS(provincias);

let mp = null;

const createPlugin = (options) => {
  mp = new FilteredSearch(options);
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
const removeButton = document.getElementById('removeButton');

const updatePlugin = () => {
  removePlugin();
  createPlugin({
    position: selectPosition.value,
    collapsed: selectCollapsed.value === 'true',
    order: Number(inputOrder.value),
    tooltip: inputTooltip.value,
  });
};

removeButton.addEventListener('click', removePlugin);

[
  selectPosition,
  selectCollapsed,
  inputOrder,
  inputTooltip,
].forEach((ctrl) => {
  ctrl.addEventListener('change', updatePlugin);
});

updatePlugin();

try {
  map.addPlugin(new IDEE.plugin.Help({}));
} catch (err) {
  console.error(err);
}
