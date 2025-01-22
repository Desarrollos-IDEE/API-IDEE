import ZoomExtent from 'facade/zoomextent';

// IDEE.language.setLang('en');

const map = IDEE.map({
  container: 'mapjs',
});

const mp = new ZoomExtent();

map.addPlugin(mp);

window.map = map;
