import Buffer from 'facade/buffer';

const map = M.map({
  container: 'mapjs',
});

const mp = new Buffer({
  position: 'TL',
  collapsed: true,
  collapsible: true,
  tooltip: 'Buffer de ejemplo',
});

const capa = new M.layer.GeoJSON({
  name: 'jsonejemplo',
  url: 'http://www.ign.es/resources/geodesia/GNSS/SPTR_geo.json',
  extract: false,
});

map.addLayers(capa);
map.addPlugin(mp);
console.log('APIRest: ' + mp.getAPIRest());
//console.log('APIRestBase64: ' + mp.getAPIRestBase64());