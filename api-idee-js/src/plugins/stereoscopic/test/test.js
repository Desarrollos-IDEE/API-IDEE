import Stereoscopic from 'facade/stereoscopic';

const map = M.map({
  container: 'map',
  // layers: ['TMS*PNOA-MA*https://tms-pnoa-ma.idee.es/1.0.0/pnoa-ma/{z}/{x}/{-y}.jpeg*true*false*19'],
  layers: ['TMS*MTN*https://tms-mapa-raster.ign.es/1.0.0/mapa-raster/{z}/{x}/{-y}.jpeg*true*false*19'],
  center: [-428106.86611520057, 4884472.25393817],
  minZoom: 8,
  zoom: 8,
});

window.mapjs = map;

const mp = new Stereoscopic({
  position: 'TL',
  collapsible: true,
  collapsed: false,
  orbitControls: false,
  anaglyphActive: true,
  defaultAnaglyphActive: true,
  maxMaginification: 50,
});

map.addPlugin(mp);
