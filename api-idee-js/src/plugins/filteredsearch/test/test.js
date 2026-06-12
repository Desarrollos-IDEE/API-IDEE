import FilteredSearch from 'facade/filteredsearch';

// IDEE.language.setLang('en');
IDEE.language.setLang('es');

window.FilteredSearch = FilteredSearch;

const map = IDEE.map({
  container: 'mapjs',
  controls: ['panzoom'],

});

const geodesia = new IDEE.layer.WFS({
  url: 'https://www.ign.es/wfs/redes-geodesicas?',
  legend: 'Red Geodésica Nacional por Técnicas Espaciales (REGENTE)',
  name: 'RED_REGENTE',
  geometry: 'POINT',
  extract: true,
});

const provincias = new IDEE.layer.WFS({
  url: 'https://hcsigc.juntadeandalucia.es/geoserver/wfs?',
  namespace: 'IECA',
  name: 'sigc_provincias_1724753768757',
  legend: 'Provincias',
  geometry: 'MPOLYGON',
});

map.addWFS(geodesia);
map.addWFS(provincias);

const mp = new FilteredSearch({
  position: 'TL',
});

map.addPlugin(mp);

map.addPlugin(new IDEE.plugin.Help({}));