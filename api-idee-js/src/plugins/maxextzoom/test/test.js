import MaxExtZoom from 'facade/maxextzoom';

// IDEE.language.setLang('es');
IDEE.language.setLang('en');

const map = IDEE.map({
  container: 'mapjs',
});

window.map = map;

const mp = new MaxExtZoom({
  position: 'TL',
});

map.addPlugin(mp);
map.addPlugin(new IDEE.plugin.Help({}));
