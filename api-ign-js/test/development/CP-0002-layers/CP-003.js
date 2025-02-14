import { map as Mmap } from 'M/mapea';
import { osm } from '../layers/osm/osm';

const mapa = Mmap({
  container: 'map',
  projection: 'EPSG:3857*m',
  center: [-443273.10081370454, 4757481.749296248],
  zoom: 6,
  // layers: ['OSM']
  layers: [osm],
});

// mapa.addLayers('OSM*nombre*legend*https://a.tile.opentopomap.org/{z}/{x}/{y}.png*true*true')
// mapa.addLayers(osm);

window.mapa = mapa;
// window.osm = osm


