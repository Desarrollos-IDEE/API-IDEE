import Infocoordinates from 'facade/infocoordinates';

M.language.setLang('es');
// M.language.setLang('en');

const map = M.map({
  container: 'mapjs',
  zoom: 7,
  center: [-467062.8225, 4783459.6216],
});
window.map = map;

const mp = new Infocoordinates({
  position: 'TR', // TR | TL | BL | BR
  collapsed: true,
  collapsible: true,
  tooltip: 'Información de coordenadas',
  decimalGEOcoord: 12,
  decimalUTMcoord: 12,
  helpUrl: 'https://www.ign.es/',
  outputDownloadFormat: 'txt', // csv | txt
});
window.mp = mp;
map.addPlugin(mp);

/*/ PRUEBA con otros plugins
const mp2 = new M.plugin.Information({ position: 'TR', buffer: 100 });
const mp3 = new M.plugin.Vectors({ position: 'TR', collapsed: true, collapsible: true, wfszoom: 12 });
const mp4 = new M.plugin.MeasureBar({ position: 'TR' });
map.addPlugin(mp2); window.mp2 = mp2;
map.addPlugin(mp3); window.mp3 = mp3;
map.addPlugin(mp4); window.mp4 = mp4; // */
