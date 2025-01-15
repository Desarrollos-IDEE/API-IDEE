/* eslint-disable no-console,no-underscore-dangle,no-loop-func,no-proto,max-len,no-param-reassign,spaced-comment,no-plusplus,no-unused-vars,camelcase */
import { map as Mmap } from 'M/mapea';
import Proportional from 'M/style/Proportional';
import WFS from 'M/layer/WFS';
import Generic from 'M/style/Generic';
import Point from 'M/style/Point';
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

let layer = new WFS({
  name: "Municipios Indicadores",
  url: "http://geostematicos-sigc.juntadeandalucia.es/geoserver/wfs?",
  namespace: "tematicos",
  name: "ind_mun_simp",  
  geometry: 'POLYGON',
});

mapa.addLayers(layer);

// definimos un estilo proporcional 
let styleProp = new Proportional('tot_ibi', 5, 20, 
  new Generic({ //estilo del punto
    point: {
      fill: {
        color: '#000000'
      },
      stroke: {
        color: '#FFFFFF',
        width: 2
      }
    }
  })
);

let styleProp2 = new Proportional('tot_ibi', 5, 20, 
  new Point({ //estilo del punto
      fill: {
        color: '#000000'
      },
      stroke: {
        color: '#FFFFFF',
        width: 2
      }
  })
);

let styleProp5 = new Proportional('tot_ibi', 5, 20);


let estilo = new Generic(undefined, [new ol.style.Style({ fill: new ol.style.Fill({ color: '#F5470088' }), stroke: new ol.style.Stroke({ color: '#0000ff88', width: 5, lineDash: [5, 5, 20], lineDashOffset: 5, lineCap: 'butt' }), image: new ol.style.Circle({ radius: 15, fill: new ol.style.Fill({ color: '#F5470088', width: 20 }), stroke: new ol.style.Stroke({ color: '#0000ff88', width: 5, lineDash: [5, 5, 20], lineDashOffset: 5, lineCap: 'butt' }) }) }), new ol.style.Style({ fill: new ol.style.Fill({ color: '#00ff00' }), stroke: new ol.style.Stroke({ color: '#ff0000', width: 2 }), image: new ol.style.Circle({ radius: 5, fill: new ol.style.Fill({ color: '#00ffff', width: 20 }), stroke: new ol.style.Stroke({ color: '#ff0000', width: 2, lineDash: [10, 10], lineDashOffset: 5, lineCap: 'butt' }) }) })]);
let styleProp3 = new Proportional('tot_ibi', 5, 20, 
  new Generic({}, estilo)
);

const estilo2 = new Point(undefined, new ol.style.Style({ image: new ol.style.Circle({ radius: 25, fill: new ol.style.Fill({ color: '#0000ff88' }), stroke: new ol.style.Stroke({ color: '#F54700', width: 5, lineDash: [10, 10], lineDashOffset: 5, lineCap: 'butt' }) }) }));
let styleProp4 = new Proportional('tot_ibi', 5, 20, estilo2);

// lo establecemos a la capa
layer.setStyle(styleProp5);