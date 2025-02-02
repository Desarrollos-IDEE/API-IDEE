import { map as Mmap } from 'IDEE/api-idee';
import GeoJSON from 'IDEE/layer/GeoJSON';
import StylePoint from 'IDEE/style/Point';
import StylePolygon from 'IDEE/style/Polygon';

window.StylePoint = StylePoint;
window.StylePolygon = StylePolygon;

const mapjs = Mmap({
  container: 'map',
});

window.mapjs = mapjs;

// GeoJSON servido
mapjs.addLayers(new GeoJSON({
  name: 'Provincias',
  url: 'http://geostematicos-sigc.juntadeandalucia.es/geoserver/tematicos/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=tematicos:Provincias&maxFeatures=50&outputFormat=application/json',
  extract: true,
}));

// GeoJSON local
mapjs.addLayers(new GeoJSON({
  source: {
    crs: {
      properties: { name: 'EPSG:4326' },
      type: 'name',
    },
    features: [{
      properties: {
        estado: 1,
        vendor: {
          api_idee: {},
        },
        sede: '/Sevilla/CHGCOR003-Oficina de la zona regable del Genil',
        tipo: 'ADSL',
        name: '/Sevilla/CHGCOR003-Oficina de la zona regable del Genil',
      },
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-5.278075, 37.69374444444444],
      },
    }, {
      properties: {
        estado: 0,
        vendor: { api_idee: {} },
        sede: '/Córdoba/CHGCOR014-Presa de Retortillo',
        tipo: 'VSAT',
        name: '/Córdoba/CHGCOR014-Presa de Retortillo',
      },
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-5.347761111111111, 37.84215833333334],
      },
    }, {
      properties: {
        estado: 0,
        vendor: { api_idee: {} },
        sede: '/Córdoba/CHGCOR015-Presa de San Rafael de Navallana',
        tipo: '3G',
        name: '/Córdoba/CHGCOR015-Presa de San Rafael de Navallana',
      },
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-4.629191666666667, 37.95544166666667],
      },
    }, {
      properties: {
        estado: 0,
        vendor: { api_idee: {} },
        sede: '/Granada/CHGGRA008-Presa de Colomera',
        tipo: 'ADSL',
        name: '/Granada/CHGGRA008-Presa de Colomera',
      },
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-3.718202777777778, 37.39816111111111],
      },
    }],
    type: 'FeatureCollection',
  },
  name: 'prueba',
  extract: true,
}));
