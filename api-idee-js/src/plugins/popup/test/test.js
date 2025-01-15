import Popup from 'facade/popup';

M.language.setLang('es');

const map = M.map({
  container: 'mapjs',
});

const mp = new Popup({
  position: 'TR',
  collapsed: true,
  collapsible: true,
  url_es: 'https://visores-cnig-gestion-publico.desarrollo.guadaltel.es/fototeca/api/help/html/es',
  url_en: 'https://visores-cnig-gestion-publico.desarrollo.guadaltel.es/fototeca/api/help/html/en',
  tooltip: 'Ayuda',
});

// map.removeControls('panzoom');
window.map = map;

map.addPlugin(mp);
