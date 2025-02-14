/* eslint-disable no-console,no-underscore-dangle,camelcase */
import { map as Mmap } from 'M/mapea';
// import MapLibre from 'M/layer/MapLibre';
import { maplibre_001 } from '../layers/maplibre/maplibre';
// import { maplibre_003 } from '../layers/maplibre/maplibre'; // PRUEBA JSON ESTILO
// import { maplibre_004 } from '../layers/maplibre/maplibre'; // PRUEBA STRING

const mapa = Mmap({
  container: 'map',
  center: [-443273.10081370454, 4757481.749296248],
  zoom: 6,
  // layers: [maplibre_001],
});
window.mapa = mapa;

// Añadido con función addLayers
mapa.addLayers([
  maplibre_001,
  // maplibre_003, // Obejto sin URL
  // maplibre_004, // STRING
]); // */

// Prueba de setLayoutProperty(maplibre_001)
// maplibre_001.setLayoutProperty('fondo', 'visibility', 'visible');

// Prueba de mapa diferente
// maplibre_001.setStyle('https://demotiles.maplibre.org/style.json');

/* / Prueba con estilo generados con array(demotiles.maplibre)
maplibre_001.setStyle('https://demotiles.maplibre.org/style.json'); // Solo se aplica sobre este mapa.
const styles = [{
  id: 'coastline',
  paint: [{
    property: 'line-color', value: '#000',
  }, {
    property: 'line-width', value: 7,
  }],
}, {
  id: 'countries-label',
  paint: [{
    property: 'text-color', value: 'red',
  }],
}];
maplibre_001.setStyle(styles);
// */

/* / Prueba de setPaintProperty(demotiles.maplibre)
maplibre_001.url = 'https://demotiles.maplibre.org/style.json'; // Solo se aplica sobre este mapa.
maplibre_001.setPaintProperty('coastline', 'line-color', '#000');
maplibre_001.setPaintProperty('coastline', 'line-width', 7);
maplibre_001.setPaintProperty('countries-label', 'text-color', 'red');
// */

/* / Prueba de aplicado de maplibrestyle.
maplibre_001.maplibrestyle = {
  version: 8,
  sources: {
    cmdsl003w: {
      type: 'raster-dem',
      tiles: ['https://xyz-mdt.idee.es/1.0.0/raster-dem/{z}/{x}/{y}.png'],
      minzoom: 5,
      maxzoom: 15,
    },
  },
  layers: [
    {
      id: 'dem',
      type: 'hillshade',
      source: 'cmdsl003w',
      filter: ['all', ['==', 'name', '']],
      layout: { visibility: 'visible' },
      paint: {
        'hillshade-illumination-anchor': 'map',
        'hillshade-exaggeration': 1,
        'hillshade-shadow-color': 'rgba(185, 185, 185, 1)',
      },
    },
  ],
};
maplibre_001.setPaintProperty('dem', 'hillshade-shadow-color', '#000');
// */

window.mapLibre = maplibre_001; // console.log(maplibre_001);
// window.mapLibre = maplibre_004; console.log('STRING_MAPLIBRE:', maplibre_004);
// window.mapLibre = maplibre_003; // console.log(maplibre_003);
