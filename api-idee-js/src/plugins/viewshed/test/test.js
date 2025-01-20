import ViewShed from 'facade/viewshed';

M.language.setLang('es');

const map = M.map({
  container: 'mapjs',
});

const mp = new ViewShed({
  position: 'TR',
  url: 'https://componentes-desarrollo.idee.es/geoprocess-services',
  collapsed: true,
  collapsible: true,
});

map.addPlugin(mp);
