import Basic from 'facade/basic';

// IDEE.language.setLang('es');
// IDEE.language.setLang('en');

const map = IDEE.map({
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

map.addPlugin(new IDEE.plugin.Help({}));
