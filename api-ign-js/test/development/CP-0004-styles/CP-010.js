/* eslint-disable no-console,no-underscore-dangle,no-loop-func,no-proto,max-len,no-param-reassign,spaced-comment,no-plusplus,no-unused-vars,camelcase */
import { map as Mmap } from 'M/mapea';
import Generic from 'M/style/Generic';
import WFS from 'M/layer/WFS';
import Cluster from 'M/style/Cluster';
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

var wfs = new WFS({
  name: "Campamentos",
  url: "http://geostematicos-sigc.juntadeandalucia.es/geoserver/wfs",
  namespace: "sepim",
  name: "campamentos",
  geometry: 'POINT',
  extract: true
});

const generic = new Generic(undefined, [
  new ol.style.Style({ 
      image: new ol.style.Circle({ 
        radius: 15, 
        fill: new ol.style.Fill({ 
          color: '#99ccff',
        }), 
        stroke: new ol.style.Stroke({ 
          color: '#5789aa', 
        }) 
      })}), 
]);


mapa.addLayers([wfs]);

let clusterOptions = {
  ranges: [{
    min: 2,
    max: 4,
    style: generic,
  }, {
    min: 5,
    max: 9,
    style: generic
  }
],
  animated: true,
  hoverInteraction: true,
  displayAmount: true,
  selectInteraction: true,
  distance: 80,
  label: {
    font: 'bold 19px Comic Sans MS',
    color: '#FFFFFF'
  }
};

const convexHullStyle = {
  fill: {
      color: '#000000',
      opacity: 0.5
  },
  stroke: {
      color: '#000000',
      width: 1
  }
}

//generamos un cluster personalizado
const styleCluster = new Cluster(clusterOptions, {
  // animationDuration: 700, // -> API (AnimatedCluster) 
  // convexHullStyle, // -> API (FACADE)
  // animationMethod: x, // -> ol/easing
  // distanceSelectFeatures: 25 // -> ol/interaction/SelectedCluster
});

wfs.setStyle(styleCluster);