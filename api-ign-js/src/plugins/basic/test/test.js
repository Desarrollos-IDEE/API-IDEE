import Basic from 'facade/basic';

// M.language.setLang('es');
// M.language.setLang('en');

const map = M.map({
  container: 'mapjs',
});
window.map = map;

const mp = new Basic({
  position: 'TL', // TR, BR, TL, BL
  collapsed: true,
  collapsible: true,
  tooltip: 'Plantilla',
  isDraggable: true,
});
window.mp = mp;

map.addPlugin(mp);

map.addPlugin(new M.plugin.Help({}));
