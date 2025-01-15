import { map as Mmap } from 'M/mapea';
import WMS from 'M/layer/WMS';
import { compileSync } from 'M/util/Template';

let VERSION = '1.3.0';
let TILED = false;
const FORMAT = 'image/png';
let PROJECTION = 'EPSG:4326*d';

const init = (version, tiled, format, projection) => {
  const mapa = Mmap({
    container: 'mapa',
    projection,
    layers: ['WMTS*https://www.ign.es/wmts/ign-base?*IGNBaseTodo*EPSG:4258*Callejero*false'],
  });

  const LAYERS = [{
      url: 'http://servicios.idee.es/wms-inspire/transportes?',
      names: [
        'TN.RailTransportNetwork.RailwayLink',
        'TN.RoadTransportNetwork.RoadLink',
        'TN.RoadTransportNetwork.RoadServiceArea',
      ],
    }, {
      url: 'http://geostematicos-sigc.juntadeandalucia.es/geoserver/tematicos/wms?',
      names: [
        'Provincias',
        'comarcas',
      ],
    },
    {
      url: 'http://www.juntadeandalucia.es/medioambiente/mapwms/REDIAM_Permeabilidad_Andalucia?',
      names: [
        'permeabilidad',
      ],
    }, {
      url: 'http://www.juntadeandalucia.es/medioambiente/mapwms/REDIAM_temp_maxima_mensual_prov_2005?',
      names: [
        'tmax_2005_11',
      ],
    }, {
      url: 'http://servicios.idee.es/wms-inspire/mdt?',
      names: [
        'EL.GridCoverage',
        'sombreado',
        'Pendientes',
      ],
    }, {
      url: 'http://servicios.idee.es/wms-inspire/riesgos-naturales/inundaciones?',
      names: [
        'NZ.Flood.FluvialT10',
        'NZ.Flood',
      ],
    }
  ];


  const layers = LAYERS.map((layer) => {
    return layer.names.map((name) => {
      const wms = new WMS({
        version,
        tiled,
        name,
        url: layer.url,
      }, {
        format,
      });
      return wms;
    });
  }).reduce((current, next) => current.concat(next), []);

  mapa.addLayers(layers);

  const TEMPLATE = '<div class="toc"><ul>{{#each layers}} <li> <input type="checkbox" checked="true" name="{{this.name}}"/><label>{{this.name}}</label></li> {{/each}}</ul></div>';


  const html = compileSync(TEMPLATE, {
    vars: {
      layers,
    },
  });
  document.body.appendChild(html);

  const onChange = (evt) => {
    mapa.getWMS({ name: evt.target.name })[0].setVisible(evt.target.checked);
  };

  html.querySelectorAll('input').forEach((element) => {
    element.addEventListener('change', onChange);
  });

  window.mapa = mapa;
};

init(VERSION, TILED, FORMAT, PROJECTION);


document.querySelector('#version').addEventListener('change', (evt) => {
  window.mapa.destroy();
  VERSION = evt.target.value;
  init(VERSION, TILED, FORMAT, PROJECTION);
});

document.querySelector('#tiled').addEventListener('change', (evt) => {
  window.mapa.destroy();
  TILED = evt.target.value === 'true';
  init(VERSION, TILED, FORMAT, PROJECTION);
});

document.querySelector('#proj').addEventListener('change', (evt) => {
  window.mapa.destroy();
  PROJECTION = evt.target.value;
  init(VERSION, TILED, FORMAT, PROJECTION);
});
