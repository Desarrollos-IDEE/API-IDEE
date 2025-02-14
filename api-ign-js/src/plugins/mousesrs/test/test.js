import MouseSRS from 'facade/mousesrs';

// M.language.setLang('en');

const map = M.map({
  container: 'mapjs',
  projection: 'EPSG:3857*m',
  // controls: ['backgroundlayers', 'scale'],
  center: [-443729, 4860856],
  zoom: 8,
});
window.map = map;

const mp = new MouseSRS({
  activeZ: true, // Añade altitud a las coordenadas
  geoDecimalDigits: 6, // Decimales de 'EPSG:4326', 'EPSG:4083', 'EPSG:4258' y 'EPSG:3857'
  utmDecimalDigits: 2, // Decimales de 'EPSG:25829', 'EPSG:25830' y 'EPSG:25831'
  label: 'EPSG:4326', // Solo se visualiza inicialmente, tras modificar se asigna label apropiado de la selección.
  srs: 'EPSG:4326', // 'EPSG:4326' | 'EPSG:4083' | 'EPSG:25829' | 'EPSG:25830' | 'EPSG:25831' | 'EPSG:4258' | 'EPSG:3857'
  // label: 'EPSG:31370', srs: 'EPSG:31370', // Prueba con SRS no existente en las opciones, termina con default
  precision: 3, // Default si en caso no hay geoDecimalDigits o utmDecimalDigits indicado.
  // tooltip: 'Prueba Observación Punto con Plugin',
  helpUrl: 'https://www.ign.es/', // si no se incluye no se añade tampoco.
  epsgFormat: false, // Utilizar otra forma de descripción de label
  draggableDialog: true, // Activa dragging sobre el popup que aparece para escoger EPSG
  order: 1,
  mode: 'ogcapicoverage',
  coveragePrecissions: [
    {
      url: 'https://api-coverages.idee.es/collections/EL.ElevationGridCoverage_4326_1000/coverage',
      minzoom: 10,
      maxzoom: 12,
    },
    {
      url: 'https://api-coverages.idee.es/collections/EL.ElevationGridCoverage_4326_500/coverage',
      minzoom: 13,
    },
  ],
});
map.addPlugin(mp); window.mp = mp;
