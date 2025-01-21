import Comparators from 'facade/comparators';

const map = IDEE.map({
  container: 'mapjs',
  zoom: 6,
  bbox: [323020, 4126873, 374759, 4152013],
  // layers: ['OSM'],
});

const mp2 = new IDEE.plugin.Infocoordinates({
  position: 'TL',
  decimalGEOcoord: 4,
  decimalUTMcoord: 2,
});

const mp = new Comparators({
  position: 'TR',
  collapsed: false,
  collapsible: true,
  transparencyParams: false,
  lyrcompareParams: false,
  mirrorpanelParams: false,
  windowsyncParams: {
    controls: ['scale'],
    plugins: [
      {
        name: 'Layerswitcher',
        params: {
          position: 'TL',
        },
      },
    ],
  },
});

map.addPlugin(mp);
window.map = map;

map.addPlugin(mp2);

const mp3 = new IDEE.plugin.Layerswitcher({
  position: 'TL',
});

map.addPlugin(mp3);
