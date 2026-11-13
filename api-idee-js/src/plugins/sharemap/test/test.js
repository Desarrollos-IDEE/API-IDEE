import ShareMap from 'facade/sharemap';

window.IDEE.plugin.ShareMap = ShareMap;

IDEE.language.setLang('es');

const map = IDEE.map({
  container: 'mapjs',
  zoom: 7,
  minZoom: 4,
  maxZoom: 20,
  center: [144112, 4839064],
  controls: ['scale*exactScale=true', 'location', 'backgroundlayers'],
});
window.map = map;

const geoJSON = new IDEE.layer.GeoJSON({
  name: 'cosas1_poligono',
  source: {
    type: 'FeatureCollection',
    crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } },
    features: [
      { type: 'Feature', properties: { fecha_entero: 1950, fecha_fecha: '1950-01-01' }, geometry: { type: 'Polygon', coordinates: [[[-7.803961, 43.786743], [-9.241927, 43.167196], [-8.882436, 41.964781], [-6.590677, 41.819828], [0.584174, 40.716535], [1.632691, 41.214197], [3.010741, 41.730462], [3.205466, 42.486095], [-1.842394, 43.417953], [-1.842394, 43.417953], [-7.803961, 43.786743]]] } },
      { type: 'Feature', properties: { fecha_entero: 1955, fecha_fecha: '1955-01-01' }, geometry: { type: 'Polygon', coordinates: [[[-7.788982, 43.786743], [-9.226948, 43.167196], [-8.867457, 41.964781], [-8.70269, 41.135274], [-6.635614, 41.349271], [-2.965805, 40.739237], [0.134809, 40.180801], [1.647669, 41.214197], [3.02572, 41.730462], [3.220445, 42.486095], [-1.827415, 43.417953], [-1.827415, 43.417953], [-7.788982, 43.786743]]] } },
      { type: 'Feature', properties: { fecha_entero: 1960, fecha_fecha: '1960-01-01' }, geometry: { type: 'Polygon', coordinates: [[[-7.788982, 43.786743], [-9.226948, 43.167196], [-8.867457, 41.964781], [-8.70269, 41.135274], [-8.762605, 40.409295], [-4.224025, 40.203685], [-0.284597, 39.560014], [0.134809, 40.180801], [1.647669, 41.214197], [3.02572, 41.730462], [3.220445, 42.486095], [-1.827415, 43.417953], [-1.827415, 43.417953], [-7.788982, 43.786743]]] } },
      { type: 'Feature', properties: { fecha_entero: 1965, fecha_fecha: '1965-01-01' }, geometry: { type: 'Polygon', coordinates: [[[-7.788982, 43.786743], [-9.226948, 43.167196], [-8.867457, 41.964781], [-8.70269, 41.135274], [-9.032224, 39.663869], [-4.763262, 39.293901], [0.179746, 38.770311], [-0.284597, 39.560014], [0.134809, 40.180801], [1.647669, 41.214197], [3.02572, 41.730462], [3.220445, 42.486095], [-1.827415, 43.417953], [-1.827415, 43.417953], [-7.788982, 43.786743]]] } },
      { type: 'Feature', properties: { fecha_entero: 1970, fecha_fecha: '1970-01-01' }, geometry: { type: 'Polygon', coordinates: [[[-7.788982, 43.786743], [-9.226948, 43.167196], [-8.867457, 41.964781], [-8.70269, 41.135274], [-9.032224, 39.663869], [-9.451631, 38.781988], [-4.778241, 38.548076], [-0.778898, 37.628537], [0.179746, 38.770311], [-0.284597, 39.560014], [0.134809, 40.180801], [1.647669, 41.214197], [3.02572, 41.730462], [3.220445, 42.486095], [-1.827415, 43.417953], [-1.827415, 43.417953], [-7.788982, 43.786743]]] } },
      { type: 'Feature', properties: { fecha_entero: 1975, fecha_fecha: '1975-01-01' }, geometry: { type: 'Polygon', coordinates: [[[-7.788982, 43.786743], [-9.226948, 43.167196], [-8.867457, 41.964781], [-8.70269, 41.135274], [-9.032224, 39.663869], [-9.451631, 38.781988], [-8.777584, 38.325152], [-4.898072, 37.367093], [-2.126991, 36.733501], [-0.778898, 37.628537], [0.179746, 38.770311], [-0.284597, 39.560014], [0.134809, 40.180801], [1.647669, 41.214197], [3.02572, 41.730462], [3.220445, 42.486095], [-1.827415, 43.417953], [-1.827415, 43.417953], [-7.788982, 43.786743]]] } },
      { type: 'Feature', properties: { fecha_entero: 1980, fecha_fecha: '1980-01-01' }, geometry: { type: 'Polygon', coordinates: [[[-7.788982, 43.786743], [-9.226948, 43.167196], [-8.867457, 41.964781], [-8.70269, 41.135274], [-9.032224, 39.663869], [-9.451631, 38.781988], [-8.777584, 38.325152], [-8.95733, 37.033025], [-6.785402, 37.164442], [-4.478665, 36.685469], [-2.126991, 36.733501], [-0.778898, 37.628537], [0.179746, 38.770311], [-0.284597, 39.560014], [0.134809, 40.180801], [1.647669, 41.214197], [3.02572, 41.730462], [3.220445, 42.486095], [-1.827415, 43.417953], [-1.827415, 43.417953], [-7.788982, 43.786743]]] } },
      { type: 'Feature', properties: { fecha_entero: 1985, fecha_fecha: '1985-01-01' }, geometry: { type: 'Polygon', coordinates: [[[-7.788982, 43.786743], [-9.226948, 43.167196], [-8.867457, 41.964781], [-8.70269, 41.135274], [-9.032224, 39.663869], [-9.451631, 38.781988], [-8.777584, 38.325152], [-8.95733, 37.033025], [-6.785402, 37.164442], [-6.141313, 36.288055], [-5.826758, 35.997749], [-5.332457, 36.082533], [-4.478665, 36.685469], [-2.126991, 36.733501], [-0.778898, 37.628537], [0.179746, 38.770311], [-0.284597, 39.560014], [0.134809, 40.180801], [1.647669, 41.214197], [3.02572, 41.730462], [3.220445, 42.486095], [-1.827415, 43.417953], [-1.827415, 43.417953], [-7.788982, 43.786743]]] } },
    ],
  },
});
map.addLayers(geoJSON);

let mp;

const createPlugin = (options) => {
  mp = new IDEE.plugin.ShareMap(options);
  window.mp = mp;
  map.addPlugin(mp);
};

const removePlugin = () => {
  if (mp) map.removePlugins(mp);
};

const removeButton = document.getElementById('removeButton');
removeButton.addEventListener('click', () => { removePlugin(); });

const selectPosition = document.getElementById('selectPosition');
const inputOrder = document.getElementById('inputOrder');
const inputTooltip = document.getElementById('inputTooltip');
const inputBaseUrl = document.getElementById('inputBaseUrl');
const selectUrlAPI = document.getElementById('selectUrlAPI');
const selectMinimize = document.getElementById('selectMinimize');
const selectShareLayer = document.getElementById('selectShareLayer');
const inputFilterLayers = document.getElementById('inputFilterLayers');
const selectOverwriteStyles = document.getElementById('selectOverwriteStyles');
const inputPrimaryColor = document.getElementById('inputPrimaryColor');
const inputSecondaryColor = document.getElementById('inputSecondaryColor');
const inputTitle = document.getElementById('inputTitle');
const inputText = document.getElementById('inputText');
const inputBtn = document.getElementById('inputBtn');
const inputCopyBtn = document.getElementById('inputCopyBtn');
const inputCopyBtnHtml = document.getElementById('inputCopyBtnHtml');
const inputTooltipCopy = document.getElementById('inputTooltipCopy');
const inputQrImage = document.getElementById('inputQrImage');

const parseBool = (val) => {
  if (val === 'true') return true;
  if (val === 'false') return false;
  return undefined;
};

const updatePlugin = () => {
  const options = {};

  options.position = selectPosition.value;
  options.order = Number(inputOrder.value);
  options.tooltip = inputTooltip.value.trim();
  options.baseUrl = inputBaseUrl.value;
  options.urlAPI = parseBool(selectUrlAPI.value);
  options.minimize = parseBool(selectMinimize.value);
  options.shareLayer = parseBool(selectShareLayer.value);
  options.filterLayers = inputFilterLayers.value.trim().split(',').map((l) => l.trim());
  options.overwriteStyles = parseBool(selectOverwriteStyles.value);
  options.styles = {};
  options.styles.primaryColor = inputPrimaryColor.value.trim();
  options.styles.secondaryColor = inputSecondaryColor.value.trim();
  options.title = inputTitle.value.trim();
  options.text = inputText.value.trim();
  options.btn = inputBtn.value.trim();
  options.copyBtn = inputCopyBtn.value.trim();
  options.copyBtnHtml = inputCopyBtnHtml.value.trim();
  options.tooltipCopy = inputTooltipCopy.value.trim();
  options.qrImage = inputQrImage.value.trim();

  removePlugin();
  createPlugin(options);
};

[
  selectPosition,
  inputOrder,
  inputTooltip,
  inputBaseUrl,
  selectUrlAPI,
  selectMinimize,
  selectShareLayer,
  inputFilterLayers,
  selectOverwriteStyles,
  inputPrimaryColor,
  inputSecondaryColor,
  inputTitle,
  inputText,
  inputBtn,
  inputCopyBtn,
  inputCopyBtnHtml,
  inputTooltipCopy,
  inputQrImage,
].forEach((ctrl) => {
  ctrl.addEventListener('change', updatePlugin);
});

updatePlugin();
