import ViewHistory from 'facade/viewhistory';

M.language.setLang('es');

const map = M.map({
  container: 'mapjs',
  maxZoom: 20,
  minZoom: 4,
  center: [-467062.8225, 4683459.6216],
});

const mp = new ViewHistory({
  position: 'TL',
});

map.addPlugin(mp);

window.map = map;
