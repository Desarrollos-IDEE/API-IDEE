import Calendar from 'facade/calendar';

IDEE.language.setLang('es');

const map = IDEE.map({
  container: 'mapjs',
});

const mp = new Calendar({
  position: 'TR',
});

// map.removeControls('panzoom');
window.map = map;

map.addPlugin(mp);
