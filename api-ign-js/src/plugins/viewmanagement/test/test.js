/* eslint-disable max-len */
import ViewManagement from 'facade/viewmanagement';

M.language.setLang('es');
// M.language.setLang('en');

const map = M.map({
  container: 'mapjs',
});
window.map = map;

const mp = new ViewManagement({
  position: 'TL', // 'TL' | 'TR' | 'BR' | 'BL'
  collapsible: true,
  collapsed: true,
  isDraggable: true,
  // tooltip: 'TEST TOOLTIP',
  // predefinedZoom: false, // Prueba de excluir
  // predefinedZoom: true, // Prueba default
  // Prueba de predefinedZoom predefinido por usuario
  predefinedZoom: [{
    name: 'Zoom con CENTER',
    center: [-428106.86611520057, 4334472.25393817],
    zoom: 4,
  },
  {
    name: 'Zoom con BBOX',
    bbox: [-2392173.2372, 3033021.2824, 1966571.8637, 6806768.1648],
  }], // */
  zoomExtent: true,
  viewhistory: true,
  zoompanel: true,
  order: 1,
});

map.addPlugin(mp); window.mp = mp;
