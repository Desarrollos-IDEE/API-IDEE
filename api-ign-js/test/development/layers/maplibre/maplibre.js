/* eslint-disable max-len,camelcase,import/prefer-default-export */
import MapLibre from 'M/layer/MapLibre';

export const maplibre_001 = new MapLibre({
  name: 'Mapa Libre',
  extract: true,
  // transparent: false, isBase: true // NO APLICABLES, se ponen con default predefinidos.
  // infoEventType: 'click',
  // visibility: true,
  // maxExtent: [-1259872.4694101033, 4359275.566199489, -85799.71494979598, 4620384.454821652],
  url: 'https://vt-mapabase.idee.es/files/styles/mapaBase_scn_color1_CNIG.json',
  // url: 'https://demotiles.maplibre.org/style.json', // JSON, URL
  /*
  maplibrestyle: {
    version: 8,
    sources: {
      osm: {
        type: 'raster',
        tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '&copy; OpenStreetMap Contributors',
        maxzoom: 19,
      },
      // Use a different source for terrain and hillshade layers, to improve render quality
      terrainSource: {
        type: 'raster-dem',
        url: 'https://demotiles.maplibre.org/terrain-tiles/tiles.json',
        tileSize: 256,
      },
      hillshadeSource: {
        type: 'raster-dem',
        url: 'https://demotiles.maplibre.org/terrain-tiles/tiles.json',
        tileSize: 256,
      },
    },
    layers: [
      {
        id: 'osm',
        type: 'raster',
        source: 'osm',
      },
      {
        id: 'hills',
        type: 'hillshade',
        source: 'hillshadeSource',
        layout: { visibility: 'visible' },
        paint: { 'hillshade-shadow-color': '#473B24' },
      },
    ],
    terrain: {
      source: 'terrainSource',
      exaggeration: 1,
    },
  },
  */
  legend: 'Mapa Libre',
}, {
  // opacity: 0.5,
  // minZoom: 5,
  // maxZoom: 7,
  // minScale: 2000000,
  // maxScale: 7000000,
  // minScale: 2000000, maxScale: 6000000, // Out of range start test
  // minResolution: 705.5551745557614,
  // maxResolution: 2469.443110945165,
  // minResolution: 705, maxResolution: 2300, // Out of range start test
  // disableBackgroundColor: false, // Color Gris
  // disableBackgroundColor: true, // Aplicada Transparencia
  // disableBackgroundColor: undefined, // Color Original
});

export const maplibre_002 = new MapLibre({
  name: 'Mapa Libre DEMO',
  extract: true,
  url: 'https://demotiles.maplibre.org/style.json', // JSON, URL
  legend: 'Mapa Libre DEMO Legend',
}, {
  disableBackgroundColor: false,
});

export const maplibre_003 = new MapLibre({
  name: 'Mapa Libre MANUALSTYLE',
  extract: true,
  maplibrestyle: {
    version: 8,
    sources: {
      osm: {
        type: 'raster',
        tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '&copy; OpenStreetMap Contributors',
        maxzoom: 19,
      },
      // Use a different source for terrain and hillshade layers, to improve render quality
      terrainSource: {
        type: 'raster-dem',
        url: 'https://demotiles.maplibre.org/terrain-tiles/tiles.json',
        tileSize: 256,
      },
      hillshadeSource: {
        type: 'raster-dem',
        url: 'https://demotiles.maplibre.org/terrain-tiles/tiles.json',
        tileSize: 256,
      },
    },
    layers: [
      {
        id: 'osm',
        type: 'raster',
        source: 'osm',
      },
      {
        id: 'hills',
        type: 'hillshade',
        source: 'hillshadeSource',
        layout: { visibility: 'visible' },
        paint: { 'hillshade-shadow-color': '#473B24' },
      },
    ],
    terrain: {
      source: 'terrainSource',
      exaggeration: 1,
    },
  },
  legend: 'Mapa Libre MANUALSTYLE Legend',
}, {
  disableBackgroundColor: false,
});

export const maplibre_004 = 'MapLibre*LEGEND_NAME*https://demotiles.maplibre.org/style.json*NAME_TEST*false*false*true*false*false*W3siaWQiOiJjb2FzdGxpbmUiLCJwYWludCI6W3sicHJvcGVydHkiOiJsaW5lLWNvbG9yIiwidmFsdWUiOiIjMDAwIn0seyJwcm9wZXJ0eSI6ImxpbmUtd2lkdGgiLCJ2YWx1ZSI6N31dfSx7ImlkIjoiY291bnRyaWVzLWxhYmVsIiwicGFpbnQiOlt7InByb3BlcnR5IjoidGV4dC1jb2xvciIsInZhbHVlIjoicmVkIn1dfV0=';
// "estilo" es base64 que hay que deserealizar, en concreto este de aquí: const styles = [{ id: 'coastline', paint: [{ property: 'line-color', value: '#000' }, { property: 'line-width', value: 7 }] }, { id: 'countries-label', paint: [{ property: 'text-color', value: 'red' }] }];
