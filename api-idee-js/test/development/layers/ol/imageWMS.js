/* eslint-disable import/prefer-default-export */
import ImageWMS from 'ol/source/ImageWMS.js';
import { Image } from 'ol/layer.js';

// WMS
export const imageWMS = new Image({
  source: new ImageWMS({
    url: 'http://geostematicos-sigc.juntadeandalucia.es/geoserver/tematicos/wms?',
    params: { 'LAYERS': 'tematicos:Municipios' },
  }),
  legend: 'Capa WMS',
});
