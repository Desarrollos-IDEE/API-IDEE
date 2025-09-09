import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';

// OSM
export const OSM = new TileLayer({
  source: new XYZ({
    url: 'http://tile.openstreetmap.org/{z}/{x}/{y}.png',
  }),
});

// ArcGIS
export const ArcGIS = new TileLayer({
  source: new XYZ({
    url: 'http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
  }),
});
