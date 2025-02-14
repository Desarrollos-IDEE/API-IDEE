import { map } from 'M/mapea';
import WFS from 'M/layer/WFS';

const mapjs = map({
  container: 'map',
  zoom: 8,
  center: [-484738.2816316012, 4517252.604665795],
});

const wfs = new WFS({
  namespace: 'gonce',
  name: 'a1666093351106_colegios',
  url: 'https://demos.guadaltel.es/geoserver/gonce/ows?',
  legend: 'Colegios',
});

mapjs.addLayers([wfs]);

window.mapjs = mapjs;
