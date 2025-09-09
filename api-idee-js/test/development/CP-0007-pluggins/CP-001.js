import { map as Mmap } from 'IDEE/api-idee';

import 'plugins/layerswitcher/dist/layerswitcher.ol.min.js';
import 'plugins/layerswitcher/dist/layerswitcher.ol.min.css';


const mapa = Mmap({
  container: 'map',
  projection: 'EPSG:3857',
});

window.mapa = mapa;

const mp = new plugin.Layerswitcher({
  collapsed: false,
  position: 'TL',
  tooltip: 'Capas',
  collapsible: true,
  isDraggable: true,
  modeSelectLayers: 'eyes',
  tools: ['transparency', 'legend', 'zoom', 'information', 'style', 'delete'],
  isMoveLayers: true,
  https: true,
  http: true,
  showCatalog: false,
  displayLabel: true,
});

mapa.addPlugin(mp);
