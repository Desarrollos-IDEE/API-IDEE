import XYLocator from 'facade/xylocator';

const map = M.map({
  container: 'mapjs',
  projection: 'EPSG:3857*m',
  center: [-443729, 4860856],
  //  controls: ['scale'],
  zoom: 4,
});

const mp = new XYLocator({
  position: 'TL',
});

map.addPlugin(mp);

window.map = map;
/*
Coordenadas de prueba:

Sevilla (WGS84 / EPSG4326)
Longitud: -5.9731700
Latitud: 37.3828300

ETRS89/UTM zone 31N (25831)
x: 234596.23
y: 4142261.27
*/
