import { map } from 'M/mapea';
import WMTS from 'M/layer/WMTS';

const mapajs = map({
  container: 'map',
  controls: ['panzoom', 'scale*true', 'scaleline', 'rotate', 'location', 'getfeatureinfo'],
  zoom: 5,
  maxZoom: 20,
  minZoom: 0,
  layers: ['OSM'],
  projection: "EPSG:3857*m",
});

const layer3 = new WMTS({
  url: "https://www.ign.es/wmts/ign-base?",
  name: "IGNBaseTodo",
  matrixSet: "GoogleMapsCompatible",
  legend: "Duero",
  format: 'image/jpeg',
});

mapajs.addWMTS(layer3);
