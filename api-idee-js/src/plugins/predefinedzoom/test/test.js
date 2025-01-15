import PredefinedZoom from 'facade/predefinedzoom';

const map = M.map({
  container: 'mapjs',
  controls: ['panzoom', 'panzoombar'],
  //bbox: [-2563852.2025329857, 3178130.5783665525, 567008.4760278338, 5443112.600512895],
  center: [-428106.86611520057, 4334472.25393817],
  zoom: 4,
});

const mp = new PredefinedZoom({
  position: 'TL',
  savedZooms: [{
    name: 'Zoom a la extensión del mapa',
    //bbox: [-2563852.2025329857, 3178130.5783665525, 567008.4760278338, 5443112.600512895],
    center: [-428106.86611520057, 4334472.25393817],
    zoom: 4,
  }],
});

window.map = map;

map.addPlugin(mp);
