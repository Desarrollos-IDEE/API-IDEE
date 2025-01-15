import { map as Mmap } from 'M/mapea';

import WMS from 'M/layer/WMS';
import WMTS from 'M/layer/WMTS';
import KML from 'M/layer/KML';

import IGNSearch from 'plugins/ignsearch/src/facade/js/ignsearch';
import Attributions from 'plugins/attributions/facade/js/attributions';
import ShareMap from 'plugins/sharemap/facade/js/sharemap';
import XYLocator from 'plugins/xylocator/facade/js/xylocator';
import ZoomExtent from 'plugins/zoomextent/facade/js/zoomextent';
import MouseSRS from 'plugins/mousesrs/facade/js/mousesrs';
import TOC from 'plugins/toc/src/facade/js/toc';
import BackImgLayer from 'plugins/backimglayer/src/facade/js/backimglayer';
import ViewHistory from 'plugins/viewhistory/src/facade/js/viewhistory';


const mapjs = Mmap({
  container: 'map',
  controls: ['panzoom', 'scale*true', 'scaleline', 'rotate', 'location', 'backgroundlayers', 'getfeatureinfo'],
  zoom: 5,
  maxZoom: 20,
  minZoom: 4,
  center: [-467062.8225, 4683459.6216],
});

window.mapjs = mapjs;

const layerinicial = new WMS({
  url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
  name: 'AU.AdministrativeBoundary',
  legend: 'Limite administrativo',
  tiled: false,
}, {});

const layerUA = new WMS({
  url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
  name: 'AU.AdministrativeUnit',
  legend: 'Unidad administrativa',
  tiled: false,
}, {});

const ocupacionSuelo = new WMTS({
  url: 'http://wmts-mapa-lidar.idee.es/lidar',
  name: 'EL.GridCoverageDSM',
  legend: 'Modelo Digital de Superficies LiDAR',
  matrixSet: 'GoogleMapsCompatible',
}, {
  visibility: false,
});


const kml = new KML('KML*Delegaciones IGN*https://www.ign.es/web/resources/delegaciones/delegacionesIGN.kml*false*false');

mapjs.addLayers([ocupacionSuelo, layerinicial, layerUA, kml]);

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
  projection: 'EPSG:4326',
});
const mp8 = new TOC();

const mp9 = new BackImgLayer({
  position: 'TR',
  layerId: 0,
  layerVisibility: true,
  layerOpts: [{
      id: 'mapa',
      preview: 'plugins/backimglayer/images/svqmapa.png',
      title: 'Mapa',
      layers: [new M.layer.WMTS({
        url: 'http://www.ign.es/wmts/ign-base?',
        name: 'IGNBaseTodo',
        legend: 'Mapa IGN',
        matrixSet: 'GoogleMapsCompatible',
        transparent: false,
        displayInLayerSwitcher: false,
        queryable: false,
        visible: true,
        format: 'image/jpeg',
      })],
    },
    {
      id: 'imagen',
      title: 'Imagen',
      preview: 'plugins/backimglayer/images/svqimagen.png',
      layers: [new M.layer.WMTS({
        url: 'http://www.ign.es/wmts/pnoa-ma?',
        name: 'OI.OrthoimageCoverage',
        legend: 'Imagen (PNOA)',
        matrixSet: 'GoogleMapsCompatible',
        transparent: false,
        displayInLayerSwitcher: false,
        queryable: false,
        visible: true,
        format: 'image/jpeg',
      })],
    },
    {
      id: 'hibrido',
      title: 'Híbrido',
      preview: 'plugins/backimglayer/images/svqhibrid.png',
      layers: [new M.layer.WMTS({
          url: 'http://www.ign.es/wmts/pnoa-ma?',
          name: 'OI.OrthoimageCoverage',
          legend: 'Imagen (PNOA)',
          matrixSet: 'GoogleMapsCompatible',
          transparent: true,
          displayInLayerSwitcher: false,
          queryable: false,
          visible: true,
          format: 'image/png',
        }),
        new M.layer.WMTS({
          url: 'http://www.ign.es/wmts/ign-base?',
          name: 'IGNBaseOrto',
          matrixSet: 'GoogleMapsCompatible',
          legend: 'Mapa IGN',
          transparent: false,
          displayInLayerSwitcher: false,
          queryable: false,
          visible: true,
          format: 'image/png',
        })
      ],
    },
    {
      id: 'lidar',
      preview: 'plugins/backimglayer/images/svqlidar.png',
      title: 'LIDAR',
      layers: [new M.layer.WMTS({
        url: 'https://wmts-mapa-lidar.idee.es/lidar?',
        name: 'EL.GridCoverageDSM',
        legend: 'Modelo Digital de Superficies LiDAR',
        matrixSet: 'GoogleMapsCompatible',
        transparent: false,
        displayInLayerSwitcher: false,
        queryable: false,
        visible: true,
        format: 'image/png',
      })],
    },
  ],
});

const mp10 = new ViewHistory({
  position: 'TL',
});

mapjs.addPlugin(mp);
mapjs.addPlugin(mp2);
mapjs.addPlugin(mp3);
mapjs.addPlugin(mp4);
mapjs.addPlugin(mp6);
mapjs.addPlugin(mp7);
mapjs.addPlugin(mp8);
mapjs.addPlugin(mp9);
mapjs.addPlugin(mp10);
