import Mapfooter from 'facade/mapfooter';

IDEE.language.setLang(window.localStorage.getItem('language') || 'es');

const DEFAULT_HTML = `<div class="col-12 col-m-12 displayInlineBlock txtCenter fontSize09em">
  <p class="marginBottom0">© Organismo Autónomo Centro Nacional de Información Geográfica (CNIG)</p>
  <div id="dirCnigPC" class="row paddingBottom1por">
    <div class="col-12">
      Calle General Ibáñez de Ibero, 3. 28003 - Madrid - España.
    </div>
    <div class="col-12">
      NIF: ES Q2817024I  - NIPO: 798-20-071-1 - DOI: 10.7419/162.09.2020
    </div>
  </div>
</div>`;

const map = IDEE.map({
  container: 'mapjs',
});
window.map = map;

map.addControls(['scaleline', 'panzoombar']);

const textareaHtmlCode = document.getElementById('textareaHtmlCode');
textareaHtmlCode.value = DEFAULT_HTML;

let mp;

const createPlugin = (options) => {
  mp = new Mapfooter(options);
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

  window.location.href = `${window.location.href.substring(0, window.location.href.indexOf('api-idee'))}api-idee/?mapfooter=${posicion}*${collapsed}*${order}*${tooltip}*${collapsible}`;
});

updatePlugin();

try {
  map.addPlugin(new IDEE.plugin.Help({}));
} catch (err) {
  // Help puede fallar en algunos entornos sin afectar al plugin
}
