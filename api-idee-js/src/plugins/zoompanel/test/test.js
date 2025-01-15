import ZoomPanel from 'facade/zoompanel';

M.language.setLang('en');

const map = M.map({
  container: 'mapjs',
});
const mp = new ZoomPanel({
  position: 'TL',
  collapsed: true,
  collapsible: true,
  center: [-428106.86611520057, 4334472.25393817],
  zoom: 4,
});

map.addPlugin(mp);
window.map = map;
