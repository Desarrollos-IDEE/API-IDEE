// import { map as Mmap } from 'M/mapea';
import IGNSearch from 'plugins/ignsearch/src/facade/js/ignsearch';
import Attributions from 'plugins/attributions/src/facade/js/attributions';
import ShareMap from 'plugins/sharemap/src/facade/js/sharemap';
import XYLocator from 'plugins/xylocator/src/facade/js/xylocator';
import ZoomExtent from 'plugins/zoomextent/src/facade/js/zoomextent';
import MouseSRS from 'plugins/mousesrs/src/facade/js/mousesrs';
import TOC from 'plugins/toc/src/facade/js/toc';
import BackImgLayer from 'plugins/backimglayer/src/facade/js/backimglayer';

const mapjs = M.map({
  container: 'map',
  controls: ['panzoom', 'scale*true', 'scaleline', 'rotate', 'location', 'getfeatureinfo'],
  zoom: 5,
  maxZoom: 20,
  minZoom: 4,
  center: [-467062.8225, 4683459.6216],
});

window.mapjs = mapjs;

const mp = new IGNSearch({
  servicesToSearch: 'gn',
  maxResults: 10,
  isCollapsed: false,
  noProcess: 'municipio,poblacion',
  countryCode: 'es',
  reverse: true,
});

const mp2 = new Attributions({
  mode: 1,
  scale: 10000,
});

const mp3 = new ShareMap({
  baseUrl: 'https://mapea-lite.desarrollo.guadaltel.es/api-core/',
  position: 'BR',
});

const mp4 = new XYLocator({
  position: 'TL',
});
const mp6 = new ZoomExtent();
const mp7 = new MouseSRS({
  srs: 'EPSG:4326',
  label: 'WGS84',
  precision: 6,
  geoDecimalDigits: 4,
  utmDecimalDigits: 2,
});
const mp8 = new TOC();

const mp9 = new BackImgLayer({
  position: 'TR',
  layerId: 0,
  layerVisibility: true,
  layerOpts: [{
      id: 'mapa',
      preview: 'svqmapa.png',
      title: 'Mapa',
      layers: [new M.layer.WMTS({
        url: 'http://www.ign.es/wmts/ign-base?',
        name: 'IGNBaseTodo',
        legend: 'Mapa IGN',
        matrixSet: 'GoogleMapsCompatible',
      }, {
        format: 'image/jpeg',
      })],
    },
    {
      id: 'imagen',
      title: 'Imagen',
      preview: 'svqimagen.png',
      layers: [new M.layer.WMTS({
        url: 'http://www.ign.es/wmts/pnoa-ma?',
        name: 'OI.OrthoimageCoverage',
        legend: 'Imagen (PNOA)',
        matrixSet: 'GoogleMapsCompatible',
      }, {
        format: 'image/png',
      })],
    },
    {
      id: 'hibrido',
      title: 'Híbrido',
      preview: 'svqhibrid.png',
      layers: [new M.layer.WMTS({
        url: 'http://www.ign.es/wmts/pnoa-ma?',
        name: 'OI.OrthoimageCoverage',
        legend: 'Imagen (PNOA)',
        matrixSet: 'GoogleMapsCompatible',
      }, {
        format: 'image/png',
      }), new M.layer.WMTS({
        url: 'http://www.ign.es/wmts/ign-base?',
        name: 'IGNBaseOrto',
        matrixSet: 'GoogleMapsCompatible',
        legend: 'Mapa IGN',
      }, {
        format: 'image/png',
      })],
    },
    {
      id: 'lidar',
      preview: 'svqlidar.png',
      title: 'LIDAR',
      layers: [new M.layer.WMTS({
        url: 'https://wmts-mapa-lidar.idee.es/lidar?',
        name: 'EL.GridCoverageDSM',
        legend: 'Modelo Digital de Superficies LiDAR',
        matrixSet: 'GoogleMapsCompatible',
      }, {
        format: 'image/png',
      })],
    },
  ],
});

mapjs.addPlugin(mp);
mapjs.addPlugin(mp2);
mapjs.addPlugin(mp3);
mapjs.addPlugin(mp4);
mapjs.addPlugin(mp6);
mapjs.addPlugin(mp7);
mapjs.addPlugin(mp8);
mapjs.addPlugin(mp9);
