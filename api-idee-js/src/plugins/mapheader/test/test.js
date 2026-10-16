import Mapheader from 'facade/mapheader';

IDEE.language.setLang(window.localStorage.getItem('language') || 'es');

const DEFAULT_HTML = `
<header>
<div id="header-pc">
  <div class="col-12">
    <div class="col-3 marginTop20px">
      <a href="https://www.ign.es" target="_blank" title="Instituto Geográfico Nacional y O. A. Centro Nacional de Información Geográfica">
      <img src="https://centrodedescargas.cnig.es/CentroDescargas/imgCdD/escudoInstitucional.png" alt="Instituto Geográfico Nacional y O. A. Centro Nacional de Información Geográfica" class="img-fluid imgMinisterio "></a>
    </div>
    <div class="col-6 col-m-12 marginTop20px">
      <div class="col-12 txtCenter"><a href="https://centrodedescargas.cnig.es/CentroDescargas/home" class="txtSupCdDCabenlace" title="Centro de Descargas">Centro de Descargas</a></div>
      <div class="marginTop10px col-12 colorVerdeClaro txtCenter paddingBottom10px">Instituto Geográfico Nacional</div>
      <div class="col-12 colorVerdeClaro txtCenter">Organismo Autónomo Centro Nacional de Información Geográfica</div>
    </div>
  </div>
</div>
</header>
`;

const map = IDEE.map({
  container: 'mapjs',
});
window.map = map;

map.addControls(['scaleline', 'panzoombar']);

const textareaHtmlCode = document.getElementById('textareaHtmlCode');
textareaHtmlCode.value = DEFAULT_HTML;

let mp;

const createPlugin = (options) => {
  mp = new Mapheader(options);
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
const selectCollapsed = document.getElementById('selectCollapsed');
const selectCollapsible = document.getElementById('selectCollapsible');
const inputOrder = document.getElementById('inputOrder');
const inputTooltip = document.getElementById('inputTooltip');
const inputCssList = document.getElementById('inputCssList');
const buttonApi = document.getElementById('buttonAPI');

const boolVal = (select) => select.options[select.selectedIndex].value === 'true';

const updatePlugin = () => {
  const options = {
    position: selectPosicion.options[selectPosicion.selectedIndex].value,
    collapsed: boolVal(selectCollapsed),
    collapsible: boolVal(selectCollapsible),
    order: Number(inputOrder.value),
    tooltip: inputTooltip.value,
    htmlCode: textareaHtmlCode.value,
    cssList: inputCssList.value
      ? inputCssList.value.split(',').map((s) => s.trim()).filter(Boolean)
      : [],
  };

  removePlugin();
  createPlugin(options);
};

[
  selectPosicion,
  selectCollapsed,
  selectCollapsible,
  inputOrder,
  inputTooltip,
  inputCssList,
  textareaHtmlCode,
].forEach((ctrl) => {
  ctrl.addEventListener('change', updatePlugin);
});

buttonApi.addEventListener('click', () => {
  const posicion = selectPosicion.options[selectPosicion.selectedIndex].value;
  const collapsed = selectCollapsed.options[selectCollapsed.selectedIndex].value;
  const order = inputOrder.value;
  const tooltip = inputTooltip.value;
  const collapsible = selectCollapsible.options[selectCollapsible.selectedIndex].value;

  window.location.href = `${window.location.href.substring(0, window.location.href.indexOf('api-idee'))}api-idee/?mapheader=${posicion}*${collapsed}*${order}*${tooltip}*${collapsible}`;
});

updatePlugin();

try {
  map.addPlugin(new IDEE.plugin.Help({}));
} catch (err) {
  // Help puede fallar en algunos entornos sin afectar al plugin
}
