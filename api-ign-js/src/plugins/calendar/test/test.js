import Calendar from 'facade/calendar';

M.language.setLang('es');

const map = M.map({
  container: 'mapjs',
});

const mp = new Calendar({
  position: 'TR',
});

// map.removeControls('panzoom');
window.map = map;

map.addPlugin(mp);
