/* eslint-disable no-console,no-underscore-dangle,no-loop-func,no-proto,max-len,no-param-reassign,spaced-comment,no-plusplus,no-unused-vars,camelcase */
import { map as Mmap } from 'M/mapea';
import Category from 'M/style/Category';
import WFS from 'M/layer/WFS';
import Generic from 'M/style/Generic';
import Polygon from 'M/style/Polygon';
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


const style1 = new Generic(undefined, new ol.style.Style({ fill: new ol.style.Fill({ color: '#F5470088' }), stroke: new ol.style.Stroke({ color: '#0000ff', width: 10, lineDash: [5, 5, 20], lineDashOffset: 5, lineCap: 'butt' }), image: new ol.style.Circle({ radius: 15, fill: new ol.style.Fill({ color: '#F5470088', width: 20 }), stroke: new ol.style.Stroke({ color: '#0000ff88', width: 5, lineDash: [5, 5, 20], lineDashOffset: 5, lineCap: 'butt' }) }) }));

const style2 = new Polygon(undefined, new ol.style.Style({ fill: new ol.style.Fill({ color: '#F5470088' }), stroke: new ol.style.Stroke({ color: '#0000ff', width: 10, lineDash: [5, 5, 20], lineDashOffset: 5, lineCap: 'butt' }), image: new ol.style.Circle({ radius: 15, fill: new ol.style.Fill({ color: '#F5470088', width: 20 }), stroke: new ol.style.Stroke({ color: '#0000ff88', width: 5, lineDash: [5, 5, 20], lineDashOffset: 5, lineCap: 'butt' }) }) }));

let style3 = new Generic({polygon: {fill: {color: 'red'}}});

let categoryStyle = new Category("provincia", {
  "Granada": style2,
});


layer.setStyle(categoryStyle);