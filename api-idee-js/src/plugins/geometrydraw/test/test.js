import GeometryDraw from 'facade/geometrydraw';

M.language.setLang('en');

const map = M.map({
  container: 'mapjs',
  // controls: ['layerswitcher'],
});

const mp = new GeometryDraw({
  collapsed: true,
  collapsible: false,
  position: 'TL',
});

map.addControls(new M.control.GetFeatureInfo('gml', { buffer: 1000 }));

map.addPlugin(mp);

window.map = map;
