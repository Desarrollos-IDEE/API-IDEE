import Attributions from 'facade/attributions';

const map = M.map({
  container: 'mapjs',
  controls: ['scale'],
  zoom: 6,
  bbox: [-3132050.401125163, 3036505.360983581, 983484.0466877755, 5563700.732843714],
  layers: [
    new M.layer.WMTS({
      url: 'http://www.ign.es/wmts/pnoa-ma?',
      name: 'OI.OrthoimageCoverage',
      legend: 'Imagen (PNOA)',
      matrixSet: 'GoogleMapsCompatible',
      transparent: false,
      displayInLayerSwitcher: false,
      queryable: false,
      visible: true,
      format: 'image/jpeg',
    }),
  ],
});

window.map = map;

const mp = new Attributions({
  // mode: 1,
  scale: 10000,
  // url: 'http://www.ign.es/resources/viewer/data/20200206_atribucionPNOA-3857.geojson',
  // type: 'geojson',
  // layerName: 'AtribicionPNOA-3857',
  position: 'BL',
  tooltip: 'Plugin atribuciones',
  // layer: new M.layer.KML({ name: 'attributions', url: 'https://mapea-lite.desarrollo.guadaltel.es/api-core/files/attributions/WMTS_PNOA_20170220/atribucionPNOA_Url.kml', displayInLayerSwitcher: false }),
});

map.addPlugin(mp);
