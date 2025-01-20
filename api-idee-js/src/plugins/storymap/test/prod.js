M.language.setLang('en');

const map = M.map({
  container: 'mapjs',
});
const mp = new M.plugin.StoryMap();
map.addPlugin(mp);
