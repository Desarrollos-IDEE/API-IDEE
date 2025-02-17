import GeometryDraw from 'facade/geometrydraw';

IDEE.language.setLang('en');

const map = IDEE.map({
  container: 'mapjs',
  // controls: ['layerswitcher'],
});

const mp = new GeometryDraw({
  collapsed: true,
  collapsible: false,
  position: 'TL',
});

map.addControls(new IDEE.control.GetFeatureInfo('gml', { buffer: 1000 }));

map.addPlugin(mp);

window.map = map;
