/* eslint-disable no-console,no-underscore-dangle,no-loop-func,no-proto,max-len,no-param-reassign,spaced-comment,no-plusplus,no-unused-vars,camelcase */
import { map as Mmap } from 'M/mapea';
import Generic from 'M/style/Generic';
import Vector from 'M/layer/Vector';
import Feature from 'M/feature/Feature';

import FlowLine from 'M/style/FlowLine';
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

const vector_001 = new Vector({
  name: 'capaVectorial',
  legend: 'Capa Vector',
});

const lineFeature = new Feature('featurePrueba003', {
  'type': 'Feature',
  'id': 'prueba_pol_wfst.1987',
  'geometry': {
    'type': 'LineString',
    'coordinates': [
      [-232910.00600234355, 4033901.3328427672],
      [-290293.77947248437, 4019678.0840030923],
      [-290293.77947248437, 4033901.3328427672],
    ],
    'geometry_name': 'geometry',
    'properties': {
      'cod_ine_municipio': '41091',
      'cod_ine_provincia': '-',
      'area': 1234,
      'perimetro': 345,
      'cod_ine_comunidad': '-',
      'nombre': 'feature2',
      'nom_provincia': 'Cádiz',
      'alias': 'f2',
      'nom_ccaa': 'Andalucía',
    },
  },
});

// lo añadimos a la capa
vector_001.addFeatures([lineFeature]);
  

mapa.addLayers([vector_001]);

let style = new FlowLine({
  color: 'blue',
  color2: 'pink',
  width: 2,
  width2: 25,
  arrow: -1,
  arrowColor: 'grey',
  lineCap: 'butt',
});

vector_001.setStyle(style);