const map = IDEE.map({
  container: 'mapjs',
});
const mp = new IDEE.plugin.ShareMap({
  baseUrl: 'https://componentes-desarrollo.idee.es/',
});
map.addPlugin(mp);

window.mp = mp;
