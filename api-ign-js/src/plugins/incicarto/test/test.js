import Incicarto from 'facade/incicarto';
window.Incicarto = Incicarto;

M.language.setLang('es'); // Español
// M.language.setLang('en');

const map = M.map({
  container: 'mapjs',
  center: {
    x: -667143,
    y: 4493011,
    draw: false,
  },
  projection: 'EPSG:3857*m',
  zoom: 6,
  /*/ Capas precargadas
  layers: [
    'WMTS*http://www.ideandalucia.es/geowebcache/service/wmts?*toporaster*SIG-C:25830*WMTS*false',
    'WFS*CampamentosCampamentosCampamentosCampamentos*http://geostematicos-sigc.juntadeandalucia.es/geoserver/sepim/ows*sepim:campamentos*POINT***eyJwYXJhbWV0ZXJzIjpbeyJpY29uIjp7ImZvcm0iOiJDSVJDTEUiLCJjbGFzcyI6ImctY2FydG9ncmFmaWEtYmFuZGVyYSIsImZvbnRzaXplIjowLjUsInJhZGl1cyI6MTUsImZpbGwiOiJ3aGl0ZSJ9LCJyYWRpdXMiOjV9XSwiZGVzZXJpYWxpemVkTWV0aG9kIjoiKChzZXJpYWxpemVkUGFyYW1ldGVycykgPT4gTS5zdHlsZS5TaW1wbGUuZGVzZXJpYWxpemUoc2VyaWFsaXplZFBhcmFtZXRlcnMsICdNLnN0eWxlLlBvaW50JykpIn0',
  ], // */
});
window.map = map;

/*/ Añadimos el BackImgLayer
const mpBIL = new M.plugin.BackImgLayer({
  position: 'TR',
  collapsible: true,
  collapsed: true,
  layerId: 0,
  layerVisibility: true,
  columnsNumber: 3,
  layerOpts: [
    { // LiDAR Híbrido
      id: 'pnoa-hibido',
      title: 'PNOA Híbrido',
      preview: 'https://componentes.cnig.es/api-core/plugins/backimglayer/images/svqhibrid.png',
      layers: [new M.layer.WMTS({
        url: 'https://www.ign.es/wmts/pnoa-ma?',
        name: 'OI.OrthoimageCoverage',
        legend: 'Imagen (PNOA)',
        transparent: true,
        matrixSet: 'EPSG:4326', displayInLayerSwitcher: false, queryable: false, visible: true,
        format: 'image/jpeg',
      }),
      new M.layer.WMTS({
        url: 'https://www.ign.es/wmts/ign-base?',
        name: 'IGNBaseOrto',
        legend: 'Mapa IGN',
        transparent: false,
        matrixSet: 'EPSG:4326', displayInLayerSwitcher: false, queryable: false, visible: true,
        format: 'image/png',
      })],
    },
    { // PNOA Híbrido
      id: 'lidar-hibrido',
      title: 'LiDAR Híbrido',
      preview: 'https://componentes.cnig.es/api-core/plugins/backimglayer/images/svqlidar.png',
      layers: [new M.layer.WMTS({
        url: 'https://wmts-mapa-lidar.idee.es/lidar?',
        name: 'EL.GridCoverageDSM',
        legend: 'Modelo Digital de Superficies LiDAR',
        transparent: true,
        matrixSet: 'EPSG:4326', displayInLayerSwitcher: false, queryable: false, visible: true,
        format: 'image/png',
      }),
      new M.layer.WMTS({
        url: 'https://www.ign.es/wmts/ign-base?',
        name: 'IGNBaseOrto',
        legend: 'Mapa IGN',
        transparent: true,
        matrixSet: 'EPSG:4326', displayInLayerSwitcher: false, queryable: false, visible: true,
        format: 'image/png',
      })],
    },
    { // Mapa base
      id: 'mapa',
      preview: 'https://componentes.cnig.es/api-core/plugins/backimglayer/images/svqmapa.png',
      title: 'Mapa',
      layers: [new M.layer.WMTS({
        url: 'https://www.ign.es/wmts/ign-base?',
        name: 'IGNBaseTodo',
        legend: 'Mapa IGN',
        transparent: false,
        matrixSet: 'EPSG:4326', displayInLayerSwitcher: false, queryable: false, visible: true,
        format: 'image/jpeg',
      })],
    },
    { //PNOA sin textos
      id: 'imagen',
      title: 'Imagen',
      preview: 'https://componentes.cnig.es/api-core/plugins/backimglayer/images/svqimagen.png',
      layers: [new M.layer.WMTS({
        url: 'https://www.ign.es/wmts/pnoa-ma?',
        name: 'OI.OrthoimageCoverage',
        legend: 'Imagen (PNOA)',
        transparent: false,
        matrixSet: 'EPSG:4326', displayInLayerSwitcher: false, queryable: false, visible: true,
        format: 'image/jpeg',
      })],
    },
    { // LiDAR sin textos
      id: 'lidar',
      preview: 'https://componentes.cnig.es/api-core/plugins/backimglayer/images/svqlidar.png',
      title: 'LIDAR',
      layers: [new M.layer.WMTS({
        url: 'https://wmts-mapa-lidar.idee.es/lidar?',
        name: 'EL.GridCoverageDSM',
        legend: 'Modelo Digital de Superficies LiDAR',
        transparent: false,
        matrixSet: 'EPSG:4326', displayInLayerSwitcher: false, queryable: false, visible: true,
        format: 'image/png',
      })],
    },
    { // SIOSE
      id: 'MAPAMTN',
      preview: 'https://componentes.cnig.es/api-core/plugins/backimglayer/images/svqmapa.png', // 'img/mtnactual.jpg' No esta esta imagen para probar
      title: 'Mapa MTN',
      layers: [new M.layer.WMTS({
        url: 'https://www.ign.es/wmts/mapa-raster',
        name: 'MTN',
        legend: 'Mapa MTN',
        matrixSet: 'GoogleMapsCompatible',
        format: 'image/jpeg'
      })],
    },
  ],
}
);
map.addPlugin(mpBIL); // */

// addWMSLayer('AU.AdministrativeUnit', 'Líneas límite', 'https://www.ign.es/wms-inspire/unidades-administrativas?', '1.3.0', true, { visibility: false, displayInLayerSwitcher: true, queryable: false, zIndex: 501 });
// addWMSLayer('Catastro', 'Catastro', 'http://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx?', '1.1.1', false, { visibility: false, displayInLayerSwitcher: true, queryable: false, zIndex: 502 });
// addWMSLayer('Grid-ETRS89-lonlat-50k', 'Distribuidor MTN50', 'https://www.ign.es/wms-inspire/cuadriculas?', '1.3.0', false, { visibility: false, displayInLayerSwitcher: true, queryable: false, zIndex: 503 });
// addWMSLayer('Grid-ETRS89-lonlat-25k', 'Distribuidor MTN25', 'https://www.ign.es/wms-inspire/cuadriculas?', '1.3.0', false, { visibility: false, displayInLayerSwitcher: true, queryable: false, zIndex: 504 });
// addWMSLayer('GN.GeographicalNames', 'Topónimos', 'https://www.ign.es/wms-inspire/ign-base?', '1.3.0', true, { visibility: false, displayInLayerSwitcher: true, queryable: false, zIndex: 505 });
// addWMSLayer('TN.RoadTransportNetwork.RoadLink', 'Vías de comunicación por carretera', 'https://www.ign.es/wms-inspire/ign-base?', '1.3.0', true, { visibility: false, displayInLayerSwitcher: true, queryable: false, zIndex: 506 });
// addWMSLayer('TN.RailTransportNetwork.RailwayLink', 'Vías de comunicación ferroviarias', 'https://www.ign.es/wms-inspire/ign-base?', '1.3.0', true, { visibility: false, displayInLayerSwitcher: true, queryable: fals

/*/ PRUEBA con capas WMS
const objLyrREDNAP = new M.layer.WMS({ url: 'https://www.ign.es/wms-inspire/redes-geodesicas?',
  name: 'RED_NAP', legend: 'Red de Nivelación de Alta Precisión',
  tiled: false, visibility: false,
}, {});

const objLyrBDLJE = new M.layer.WMS({ url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
  name: 'AU.AdministrativeBoundary', legend: 'Líneas Límite',
  tiled: false, visibility: false,
}, {});

const objLyrRTRoads = new M.layer.WMS({ url: 'https://servicios.idee.es/wms-inspire/transportes?',
  name: 'TN.RoadTransportNetwork.RoadLink', legend: 'Vías de comunicación por carretera',
  tiled: false, visibility: false,
}, {});

const objLyrRTRailways = new M.layer.WMS({ url: 'https://servicios.idee.es/wms-inspire/transportes?',
  name: 'TN.RailTransportNetwork.RailwayLink', legend: 'Vías de comunicación por ferrocarril',
  tiled: false, visibility: false,
}, {});

const objLyrNGBE = new M.layer.WMS({ url: 'https://www.ign.es/wms-inspire/ngbe?',
  name: 'GN.GeographicalNames', legend: 'Nombres geográficos - NGBE',
  tiled: false, visibility: false,
}, {});
map.addLayers([objLyrREDNAP, objLyrBDLJE, objLyrRTRoads, objLyrRTRailways, objLyrNGBE]); // */

const nameTest = 'alvaro';
const emailTest = 'alvaroramirez@guadaltel.com';
const mp = new Incicarto({
  collapsed: false,
  collapsible: true,
  position: 'TL',
  interfazmode: 'simple', //simple, advance, both
  buzones: [
  {
    name: nameTest,
    email: emailTest,
  },
  ],
  controllist: [
    {
      id: 'themeList',
      name: 'Temas de errores',
      mandatory: true,
    },
    {
      id: 'errorList',
      name: 'Tipos de errores',
      mandatory: true,
    },
    {
      id: 'productList',
      name: 'Lista de productos',
      mandatory: true,
    }
  ],
  themeList: [
    {
      idTheme: 1,
      nameTheme: nameTest+'1',
      emailTheme: emailTest,
    },
    {
      idTheme: 2,
      nameTheme: nameTest+'2',
      emailTheme: emailTest,
    },
  ],
  errorList: [
    'No especificado',
    'Omisión',
    'Comisión',
    '...',
  ],
  productList: [
    'No especificado',
    'Serie MTN25',
    'Serie MTN50',
    '...',
  ],
});
window.mp = mp;

/*/ PRUEBA con múltiples plugins
const mp2 = new M.plugin.Infocoordinates({ position: 'TR', decimalGEOcoord: 4, decimalUTMcoord: 4 });
const mp3 = new M.plugin.Information({ position: 'TR', buffer: 100 });
const mp4 = new M.plugin.MeasureBar({ position: 'TR' });

const provincias = new M.layer.WFS({ url: "http://geostematicos-sigc.juntadeandalucia.es/geoserver/tematicos/ows?",
  name: "Provincias", legend: "Provincias",
  namespace: "tematicos", geometry: 'MPOLYGON',
});
//map.addWFS(provincias);

const viales = new M.layer.WFS({ url: "http://g-gis-online-lab.desarrollo.guadaltel.es/geoserver/ggiscloud_root/wms?",
  name: "a1585302352391_viales_almeria", legend: "Viales",
  namespace: "ggiscloud_root", geometry: 'LINE',
});
//map.addWFS(viales);

map.addPlugin(mp2); window.mp2 = mp2;
map.addPlugin(mp3); window.mp3 = mp3;
map.addPlugin(mp4); window.mp4 = mp4; // */

map.addPlugin(mp);
// map.addPlugin(new M.plugin.MeasureBar({ position: 'TR' }));

