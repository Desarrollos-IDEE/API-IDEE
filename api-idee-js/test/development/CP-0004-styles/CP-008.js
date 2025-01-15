/* eslint-disable no-console,no-underscore-dangle,no-loop-func,no-proto,max-len,no-param-reassign,spaced-comment,no-plusplus,no-unused-vars,camelcase */
import { map as Mmap } from 'M/mapea';
import Chart from 'M/style/Chart';
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

var layer = new WFS({
  url: "https://hcsigc.juntadeandalucia.es/geoserver/wfs?",
  namespace: "IECA",
  name: "sigc_provincias_pob_centroides_1724756847583",
  legend: "Provincias",
  geometry: 'POINT'
  });
  
mapa.addWFS(layer);

let stylechart = new Chart({
  type: 'pie',
  donutRatio: 0.5,
  radius: 25,
  //offsetX: 0,
 // offsetY: 0,
  stroke: {
    color: 'black',
    width: 1
  },
//  animation: true,
  // scheme: M.style.chart.schemes.Custom,
 // rotateWithView: true,
 // fill3DColor: '#CC33DD',
  variables: [{
    attribute: 'd0_15_es',
    legend: '0-15 años',
    fill: '#F2F2F2',
    label: {
    	stroke:{
      	color:'white',
        width: 2
      },
      radiusIncrement: 10,
      fill: 'black',
      text: function(value, values, feature) {
        return value.toString();
      },
      font: 'Comic Sans MS',
      //scale: 1.25
    }
  }, {
    attribute: 'd16_45_es',
    legend: '16-45 años',
    fill: 'blue',
    label: {
      text: function(value, values, feature) {
        return value.toString();
      },
      radiusIncrement: 10,
      stroke: {
        color: '#fff',
        width: 2
      },
      fill: 'blue',
      font: 'Comic Sans MS',
      //scale: 1.25
    }
  }, {
    attribute: 'd45_65_es',
    legend: '45-65 años',
    fill: 'pink',
    label: {
      text: function(value, values, feature) {
        // return new String(value).toString();
        return value.toString();
      },
      //radiusIncrement: 10,
      stroke: {
        color: '#fff',
        width: 2
      },
      fill: 'red',
      font: 'Comic Sans MS',
      //scale: 1.25
    }
  }, {
    attribute: 'd65_es',
    legend: '65 años o más',
    fill: 'orange',
    label: {
      text: function(value, values, feature) {
        return value.toString();
      },
      radiusIncrement: 10,
      stroke: {
        color: '#fff',
        width: 2
      },
      fill: '#886A08',
      font: 'Comic Sans MS',
      //scale: 1.25
    }
  }]
});

layer.setStyle(stylechart);

