const map = M.map({
  container: 'mapjs',
});
const mp = new M.plugin.ShareMap({
  baseUrl: 'http://mapea4-sigc.juntadeandalucia.es/',
});
map.addPlugin(mp);

window.mp = mp;
