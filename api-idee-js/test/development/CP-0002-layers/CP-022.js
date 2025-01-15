/* eslint-disable camelcase */
import { map as Mmap } from 'M/mapea';
import GeoJSON from 'M/layer/GeoJSON';
import WFS from 'M/layer/WFS';

const geojson = new GeoJSON({
  name: 'Municipios',
  url: 'http://geostematicos-sigc.juntadeandalucia.es/geoserver/tematicos/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=tematicos:Municipios&maxFeatures=50&outputFormat=application/json',
  extract: true,
  infoEventType: 'hover',
});
window.geojson = geojson;
const wfs = new WFS({
  url: 'http://geostematicos-sigc.juntadeandalucia.es/geoserver/tematicos/ows?',
  namespace: 'tematicos',
  name: 'Provincias',
  legend: 'Provincias',
  geometry: 'MPOLYGON',
  extract: true,
  infoEventType: 'hover',
});
window.wfs = wfs;

const arrayCapas = [geojson, wfs];

// En el constructor
const mapa = Mmap({
  container: 'map',
  controls: ['scale'],
  zoom: 8,
  center: { x: -514830, y: 4455225 },
  layers: arrayCapas,
});
window.mapa = mapa;

// mapa.addLayers(arrayCapas);
