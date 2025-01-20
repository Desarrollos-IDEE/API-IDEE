import InfoCatastro from 'facade/infocatastro';

M.language.setLang('es');

const map = M.map({
  container: 'mapjs',
});

const mp = new InfoCatastro({
  position: 'TR',
  tooltip: 'Consultar Catastro',
});

map.addPlugin(mp);
