import ZoomPanel from 'facade/zoompanel';

M.language.setLang('en');

const map = M.map({
  container: 'mapjs',
});
const mp = new ZoomPanel({
  position: 'BL',
  collapsed: true,
  collapsible: true,
});
mp.on('finished:draw', (feature) => {
  console.log(feature);
});

map.addPlugin(mp);
window.map = map;
