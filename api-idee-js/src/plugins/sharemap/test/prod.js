const map = M.map({
  container: 'mapjs',
});
const mp = new M.plugin.ShareMap({
  baseUrl: 'https://componentes-desarrollo.idee.es/',
});
map.addPlugin(mp);

window.mp = mp;
