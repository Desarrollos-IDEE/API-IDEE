/* eslint-disable no-console */
import Buffer from 'facade/buffer';

const map = IDEE.map({
  container: 'mapjs',
});

// Wrong Buffer import detected by eslint
// eslint-disable-next-line no-buffer-constructor
const mp = new Buffer({
  position: 'TL',
  collapsed: true,
  collapsible: true,
  tooltip: 'Buffer de ejemplo',
});

const capa = new IDEE.layer.GeoJSON({
  name: 'jsonejemplo',
  url: 'http://www.ign.es/resources/geodesia/GNSS/SPTR_geo.json',
  extract: false,
});

map.addLayers(capa);
map.addPlugin(mp);
console.log('APIRest:', mp.getAPIRest());
// console.log('APIRestbase64= ' + mp.getAPIRestBase64());
