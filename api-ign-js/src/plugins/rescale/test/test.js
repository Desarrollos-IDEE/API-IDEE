/* eslint-disable max-len,object-property-newline */
import Rescale from 'facade/rescale';

M.language.setLang('es');
// M.language.setLang('en');

const map = M.map({
  container: 'mapjs',
  controls: ['scale*true'],
  minZoom: 4, zoom: 4,
  center: [-428106, 4334472],
  // maxZoom: 18, center: [-363801.6403681238, 4147987.099271644],
  // bbox: [-2485874.09002167, 3070874.568008104, 1629660.3577912687, 5598069.939868236],
  /* /
  resolutions: [51444.18059766173, 25722.090298830866, 12861.045149415433,
    6430.522574707717, 3215.2612873538583, 1607.6306436769291, 803.8153218384646,
    401.9076609192323, 200.95383045961614, 100.47691522980807, 50.238457614904036,
    25.119228807452018, 12.559614403726009, 6.2798072018630045, 3.1399036009315022,
    1.5699518004657511, 0.7849759002328756, 0.3699518004657511, 0.18497590023287555,
  ], // */
});
window.map = map;

const mp = new Rescale({
  collapsible: true,
  collapsed: false,
  position: 'TL', // 'TL' | 'TR' | 'BR' | 'BL'
  // tooltip: 'TOOLTIP TEST Rescale',
});
map.addPlugin(mp); window.mp = mp;
