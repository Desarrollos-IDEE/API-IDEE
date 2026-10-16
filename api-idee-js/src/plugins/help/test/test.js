import Help from 'facade/help';

IDEE.language.setLang('es');

const map = IDEE.map({
  container: 'mapjs',
  controls: ['scale'],
});
window.map = map;

let mp;

const createPlugin = (options) => {
  mp = new Help(options);
  window.mp = mp;
  map.addPlugin(mp);
};

const removePlugin = () => {
  if (mp) {
    map.removePlugins(mp);
  }
};

const removeButton = document.getElementById('removeButton');
removeButton.addEventListener('click', () => {
  removePlugin();
});

const selectPosition = document.getElementById('selectPosition');
const inputOrder = document.getElementById('inputOrder');
const inputTooltip = document.getElementById('inputTooltip');
const selectExtend = document.getElementById('selectExtend');
const inputInitialIndex = document.getElementById('inputInitialIndex');
const inputHeaderTitle = document.getElementById('inputHeaderTitle');
const textareaHeaderImages = document.getElementById('textareaHeaderImages');

const parseBool = (val) => {
  if (val === 'true') {
    return true;
  }
  if (val === 'false') {
    return false;
  }
  return undefined;
};

const parseHeaderImages = (raw) => {
  return raw
    .split(',')
    .map((url) => url.trim())
    .filter((url) => url.length > 0);
};

const updatePlugin = () => {
  const options = {};
  options.position = selectPosition.value;
  options.order = Number(inputOrder.value);
  options.tooltip = inputTooltip.value.trim();
  options.extendInitialExtraContents = parseBool(selectExtend.value);
  options.initialIndex = Number(inputInitialIndex.value);
  options.header = {
    title: inputHeaderTitle.value.trim(),
    images: parseHeaderImages(textareaHeaderImages.value),
  };
  options.initialExtraContents = [
    {
      title: 'Índice 1',
      content: '<div><h2 style="text-align: center; color: var(--idee-color-white, #fff); background-color: var(--idee-color-neutral-80, #364b5f); padding: 8px 10px;">Título 1</h2><div><p>Contenido 1</p></div></div>',
    },
  ];
  options.finalExtraContents = [
    {
      title: 'Índice final',
      content: '<div><h2 style="text-align: center; color: var(--idee-color-white, #fff); background-color: var(--idee-color-neutral-80, #364b5f); padding: 8px 10px;">Título final</h2><div><p>Contenido final</p></div></div>',
    },
  ];

  removePlugin();
  createPlugin(options);
};

selectPosition.addEventListener('change', updatePlugin);
inputOrder.addEventListener('change', updatePlugin);
inputTooltip.addEventListener('change', updatePlugin);
selectExtend.addEventListener('change', updatePlugin);
inputInitialIndex.addEventListener('change', updatePlugin);
inputHeaderTitle.addEventListener('change', updatePlugin);
textareaHeaderImages.addEventListener('change', updatePlugin);

updatePlugin();
