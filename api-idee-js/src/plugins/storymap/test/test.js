/* eslint-disable max-len */
import StoryMap from 'facade/storymap';

import StoryMapJSON2 from './StoryMapJSON2'; // https://openlayers.org/en/latest/examples/animation.html
import StoryMapJSON1 from './StoryMapJSON1';

M.language.setLang('es');
// M.language.setLang('en');

const map = M.map({
  container: 'mapjs',
});
window.map = map;

const mp = new StoryMap({
  position: 'TR', // 'TL' | 'TR' | 'BR' | 'BL'
  collapsible: true,
  collapsed: false,
  isDraggable: false,
  // tooltip: 'TEST TOOLTIP',
  content: { // Contenidos
    es: StoryMapJSON2,
    en: StoryMapJSON1,
  },
  // indexInContent: false,
  //
  indexInContent: { // Título de todo este apartado, automáticamente incluye lista y redirección a siguientes apartados
    title: 'Indice StoryMap',
    subtitle: 'Visualizador de Cervantes y el Madrid del siglo XVII',
    js: "console.log('HolaMundo')",
  }, // */
  delay: 2000, // Tiempo entre animaciones de scroll al usar play
});

map.addPlugin(mp); window.mp = mp;

