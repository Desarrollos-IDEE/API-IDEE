/* eslint-disable max-len */
import VectorsManagement from 'facade/vectorsmanagement';

IDEE.language.setLang('es');
// IDEE.language.setLang('en');

const map = IDEE.map({
  container: 'mapjs',
  center: [-458756.9690741142, 4682774.665868655],
  controls: ['measurebar'],
  layers: ['OSM'],
  zoom: 6,
});
window.map = map;

// map.addPlugin(new IDEE.plugin.Layerswitcher({ collapsed: true, position: 'TR' }));

/* / Capa Vector
map.addLayers(new IDEE.layer.Vector({
  name: 'vector_a',
  legend: 'Capa Vector',
}, { displayInLayerSwitcher: true })); // */

/* / Capa WFS
map.addLayers(new IDEE.layer.WFS({
  url: 'http://geostematicos-sigc.juntadeandalucia.es/geoserver/tematicos/ows?',
  namespace: 'tematicos',
  name: 'Provincias',
  legend: 'Capa WFS',
  geometry: 'MPOLYGON',
})); // */

/* / Capa GeoJSON
map.addLayers(new IDEE.layer.GeoJSON({
  name: 'Municipios',
  legend: 'Capa GeoJSON',
  url: 'https://geostematicos-sigc.juntadeandalucia.es/geoserver/tematicos/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=tematicos:Municipios&maxFeatures=500000&outputFormat=application%2Fjson',
})); // */

/* / Capa KML
map.addLayers(new IDEE.layer.KML({
  url: 'https://www.ign.es/web/resources/delegaciones/delegacionesIGN.kml',
  name: 'capaKML',
  legend: 'Capa KML',
  extract: true,
})); // */

/* / Capa MVT
map.addLayers(new IDEE.layer.MVT({
  // url: 'https://vts.larioja.org/rioja/{z}/{x}/{y}.pbf', name: 'MVT', 404 error
  url: 'https://vt-fedme.idee.es/vt.senderogr/{z}/{x}/{y}.pbf',
  name: 'sendero_gr',
  mode: 'feature',
  projection: 'EPSG:3857',
})); // */

/* / Capa OGCAPIFeatures
map.addLayers(new IDEE.layer.OGCAPIFeatures({
  url: 'https://api-features.idee.es/collections/',
  name: 'hidrografia/Falls',
  legend: 'Capa OGCAPIFeatures',
  limit: 20,
})); // */

/* / Capa MBTilesVector
window.fetch(`${IDEE.config.STATIC_RESOURCES_URL}/Datos/mbtiles/countries.mbtiles`).then((response) => {
  const mbtilesvector = new IDEE.layer.MBTilesVector({
    name: 'mbtiles_vector',
    legend: 'Capa MBTilesVector L',
    source: response,
  });
  map.addLayers(mbtilesvector);
}).catch((e) => { throw e; }); // */

let mp = null;

const createPlugin = (options) => {
  mp = new VectorsManagement(options);
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
const inputOrder = document.getElementById('inputOrder');
const selectSelection = document.getElementById('selectSelection');
const selectAddlayer = document.getElementById('selectAddlayer');
const selectAnalysis = document.getElementById('selectAnalysis');
const selectCreation = document.getElementById('selectCreation');
const selectDownload = document.getElementById('selectDownload');
const selectEdition = document.getElementById('selectEdition');
const selectHelp = document.getElementById('selectHelp');
const selectStyle = document.getElementById('selectStyle');
const inputSnapping = document.getElementById('inputSnapping');

const boolVal = (select, defaultVal = true) => {
  const v = select.options[select.selectedIndex].value;
  if (v === '') return defaultVal;
  return v === 'true';
};

const updatePlugin = () => {
  const options = {};
  options.position = selectPosition.options[selectPosition.selectedIndex].value || 'right';
  options.collapsed = boolVal(selectCollapsed, false);
  options.order = Number(inputOrder.value);
  // Si selection es false automaticamente desactiva "edition" y "analysis"
  options.selection = boolVal(selectSelection);
  options.addlayer = boolVal(selectAddlayer);
  options.analysis = boolVal(selectAnalysis);
  options.creation = boolVal(selectCreation);
  options.download = boolVal(selectDownload);
  options.edition = boolVal(selectEdition);
  options.help = boolVal(selectHelp);
  options.style = boolVal(selectStyle);
  // true, false, JSON o base64 (lo valida el plugin)
  options.snapping = inputSnapping.value.trim() || undefined;

  removePlugin();
  createPlugin(options);
};

[
  selectPosition,
  selectCollapsed,
  inputOrder,
  selectSelection,
  selectAddlayer,
  selectAnalysis,
  selectCreation,
  selectDownload,
  selectEdition,
  selectHelp,
  selectStyle,
  inputSnapping,
].forEach((ctrl) => {
  ctrl.addEventListener('change', updatePlugin);
});

updatePlugin();

// vectorsmanagement=position*!collapsed*!order*!selection*!addlayer*!analysis*!creation*!download*!edition*!help*!style*!snapping
