/* eslint-disable no-console,no-underscore-dangle,no-loop-func,no-proto,max-len,no-param-reassign,spaced-comment,no-plusplus,no-unused-vars,camelcase */
import { map as Mmap } from 'M/mapea';
import Chart from 'M/style/Chart';
import WFS from 'M/layer/WFS';
import Heatmap from 'M/style/Heatmap';
import Centroid from '../../../src/impl/ol/js/style/Centroid';


import OLStyle from 'ol/style/Style';
import OLStyleFill from 'ol/style/Fill';
import OLStyleStroke from 'ol/style/Stroke';
import CircleStyle from 'ol/style/Circle';
import OLStyleIcon from 'ol/style/Icon';
import OLStyleRegularShape from 'ol/style/RegularShape';
import {Heatmap as HeatmapLayer} from 'ol/layer.js';
window.ol = { style: { Style: OLStyle, Centroid, Fill: OLStyleFill, Stroke: OLStyleStroke, Circle: CircleStyle, Icon: OLStyleIcon, RegularShape: OLStyleRegularShape } };


const mapa = Mmap({
  container: 'map',
  projection: 'EPSG:3857*m',
  bbox: [-1558215.73316107, 4168698.8601280265, 789929.7757595448, 5275507.029697379],
});

var wfs = new WFS({
  url: "https://hcsigc.juntadeandalucia.es/geoserver/wfs?",
  namespace: "IECA",
  name: "sigc_provincias_pob_centroides_1724756847583",
  legend: "Provincias",
  geometry: 'POINT',
  extract: true
  });
  

  const heatmapLayer = new HeatmapLayer({
    blur: 20,
    radius: 15,
    gradient: ['red', 'black', 'blue', 'pink', 'green', 'white'],
    weight: feature => {
      return feature.get('weight') || 1;
    }
  });

mapa.addLayers([wfs]);

const styleheatmap = new Heatmap('u_cod_prov', undefined, heatmapLayer);

wfs.setStyle(styleheatmap);