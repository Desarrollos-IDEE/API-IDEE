/* eslint-disable max-len,spaced-comment */
import Information from 'facade/information';

// M.language.setLang('en');
M.config('MOVE_MAP_EXTRACT', true);

const map = M.map({
  container: 'mapjs',
  controls: ['location'],
  zoom: 15,
  layers: ['OSM'],
  center: [-698506, 4371375],
});
window.map = map;

const mpLayerswitcher = new M.plugin.Layerswitcher({ collapsed: true, position: 'TL' }); map.addPlugin(mpLayerswitcher);
// const mp2 = new M.plugin.Infocoordinates({position: 'TR', decimalGEOcoord: 4, decimalUTMcoord: 4}); map.addPlugin(mp2);
// const mp3 = new M.plugin.Vectors({position: 'TR', wfszoom: 12}); map.addPlugin(mp3);
// const mp4 = new M.plugin.MeasureBar({ position: 'TR' }); map.addPlugin(mp4);

// Pruebas de layers WMS
const layer1 = new M.layer.WMS({
  url: 'https://www.ign.es/wms-inspire/redes-geodesicas?',
  name: 'RED_NAP',
  legend: 'Red de Nivelación de Alta Presión',
  tiled: true,
  version: '1.1.0', 
}, {});

const layer2 = new M.layer.WMS({
  url: 'https://www.ign.es/wms-inspire/redes-geodesicas?',
  name: 'RED_ROI',
  legend: 'Red de Orden Inferior',
  tiled: true,
  version: '1.1.0',
}, {});

const layer3 = new M.layer.WMS({
  url: 'https://www.ign.es/wms-inspire/redes-geodesicas?',
  name: 'RED_REGENTE',
  legend: 'Red REGENTE',
  tiled: true,
  version: '1.1.0',
}, {});

const layer4 = new M.layer.WMS({
  url: 'https://www.ign.es/wms-inspire/redes-geodesicas?',
  name: 'RED_ERGNSS',
  legend: 'Red de Estaciones permanentes GNSS',
  tiled: true,
  version: '1.3.0',
}, {});

const layer5 = new M.layer.WMS({
  url: 'https://servicios.ine.es/WMS/WMS_INE_SECCIONES_G01/MapServer/WMSServer?',
  name: 'Secciones2021',
  legend: 'Secciones censales',
  version: '1.1.0',
  tiled: false,
  visibility: true,
}, {});
map.addLayers([layer1, layer4]); // */

/*/ Prueba de todos los usables capas WMTS, GenericRaster y WMS
const wmtsLayer = new M.layer.WMTS({
  url: "https://servicios.idee.es/wmts/ocupacion-suelo",
  name: "LC.LandCoverSurfaces", legend: "CORINE / SIOSE",
  matrixSet: "GoogleMapsCompatible", format: 'image/png'
});
const generic_001 = new M.layer.GenericRaster(
  {name: 'Nombre de prueba', legend: 'capaGenericRaster'},
  {visibility: true, displayInLayerSwitcher: true, opacity: 0.5, queryable: true},
  new ol.layer.Image({source: new ol.source.ImageWMS({
    url: 'http://geostematicos-sigc.juntadeandalucia.es/geoserver/tematicos/wms?',
    params: { LAYERS: 'tematicos:Municipios' }
  })})
);
const hidrografia = new M.layer.WMS({
  url: 'https://servicios.idee.es/wms-inspire/hidrografia',
  name: 'HY.Network',
  legend: 'Red hidrográfica',
  tiled: true,
});
map.addLayers([wmtsLayer, generic_001, hidrografia]); // */

/*/ Prueba WMTS
const testLayer = new M.layer.WMTS({
  url: 'https://www.ign.es/wmts/primera-edicion-mtn?',
  name: 'catastrones', legend: 'catastrones',
  matrixSet: 'GoogleMapsCompatible', transparent: true,
  displayInLayerSwitcher: false, queryable: true,
  visible: true, format: 'image/jpeg',
});
map.addLayers([testLayer]); // */

const mp = new Information({
  position: 'TR', // TL | TR | BL | BR
  buffer: 100,
  opened: 'all', // 'one' | 'all' | 'closed'
  featureCount: 3, // 10, 
  format: 'text/html', //  'text/html' como default || ('text/plain'|'plain') | ('application/vnd.ogc.gml'|'gml')
  outputDownloadFormat: 'csv',
});
map.addPlugin(mp);
window.mp = mp;


