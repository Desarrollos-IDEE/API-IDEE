import InfoCatastro from 'facade/infocatastro';

IDEE.language.setLang('es');

const map = IDEE.map({
  container: 'mapjs',
});

const mp = new InfoCatastro({
  position: 'TR',
  tooltip: 'Consultar Catastro',
});

map.addPlugin(mp);
