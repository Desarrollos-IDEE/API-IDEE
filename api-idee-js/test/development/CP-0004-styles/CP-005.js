/* eslint-disable no-console,no-underscore-dangle,no-loop-func,no-proto,max-len,no-param-reassign,spaced-comment,no-plusplus,no-unused-vars,camelcase */
import { map as Mmap } from 'M/mapea';
import Choropleth from 'M/style/Choropleth';
import WFS from 'M/layer/WFS';
import { JENKS } from 'M/style/Quantification';

const mapa = Mmap({
  container: 'map',
  projection: 'EPSG:3857*m',
  bbox: [-1558215.73316107, 4168698.8601280265, 789929.7757595448, 5275507.029697379],
});

let lyProv = new WFS({
  name: "Provincias",
  url: "http://geostematicos-sigc.juntadeandalucia.es/geoserver/tematicos/wfs?",
  name: "Provincias",
  legend: "Provincias - COROPLETAS",
  geometry: 'POLYGON',
});

let choropleth = new Choropleth(
                     'u_cod_prov', 
                     ['#000000', '#008000', '#FFFFFF'], 
                     JENKS(4));

lyProv.setStyle(choropleth);

mapa.addLayers(lyProv);