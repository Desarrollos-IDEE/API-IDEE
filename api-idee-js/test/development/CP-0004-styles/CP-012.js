/* eslint-disable no-console,no-underscore-dangle,no-loop-func,no-proto,max-len,no-param-reassign,spaced-comment,no-plusplus,no-unused-vars,camelcase */
import { map as Mmap } from 'IDEE/api-idee';
import Generic from 'IDEE/style/Generic';
import WFS from 'IDEE/layer/WFS';
import Feature from 'IDEE/feature/Feature';

import Cluster from 'IDEE/style/Cluster';
import Centroid from '../../../src/impl/ol/js/style/Centroid';


import OLStyle from 'ol/style/Style';
import OLStyleFill from 'ol/style/Fill';
import OLStyleStroke from 'ol/style/Stroke';
import CircleStyle from 'ol/style/Circle';
import OLStyleIcon from 'ol/style/Icon';
import OLStyleRegularShape from 'ol/style/RegularShape';
window.ol = { style: { Style: OLStyle, Centroid, Fill: OLStyleFill, Stroke: OLStyleStroke, Circle: CircleStyle, Icon: OLStyleIcon, RegularShape: OLStyleRegularShape } };


const mapa = Mmap({
  container: 'map',
  projection: 'EPSG:3857*m',
  bbox: [-1558215.73316107, 4168698.8601280265, 789929.7757595448, 5275507.029697379],
});

var campamentos = new WFS({
  url: "http://geostematicos-sigc.juntadeandalucia.es/geoserver/sepim/ows?",
  name: "campamentos",
  legend: "Campamentos",
  geometry: 'MPOINT'
  });

mapa.addLayers(campamentos);

const estilo_base = new Generic({
  point: {
    radius: 5,
    fill: {
      color: 'yellow',
      opacity: 0.5
    },
    stroke: {
      color: '#FF0000'
    }
  }
});

const estilo_cluster = new Cluster();

const composite = estilo_cluster.add(estilo_base);

campamentos.setStyle(composite);
