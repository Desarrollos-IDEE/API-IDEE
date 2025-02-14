import MeasureBar from 'facade/measurebar';

// M.language.setLang('en');

const map = M.map({
  container: 'mapjs',
});
window.map = map;

const mp = new MeasureBar({
  position: 'TL', // 'TL' | 'TR' | 'BR' | 'BL'
  collapsed: true,
  collapsible: true,
  tooltip: 'MeasureBar plugin',
  order: 1,
});
map.addPlugin(mp); window.mp = mp;

const mp2 = new M.plugin.Infocoordinates({ position: 'TR', decimalGEOcoord: 4, decimalUTMcoord: 4 }); map.addPlugin(mp2);

const mp3 = new M.plugin.Information({ position: 'TR', buffer: 100 }); map.addPlugin(mp3);

const mp4 = new M.plugin.Vectors({ collapsed: true, collapsible: true, position: 'TR', wfszoom: 12 }); map.addPlugin(mp4);
