import { map } from 'IDEE/api-idee';
import GeoJSON from 'IDEE/layer/GeoJSON';
import { SELECT_FEATURES } from 'IDEE/event/eventtype';
import Feature from 'IDEE/feature/Feature';
import * as jsts from 'jsts';

const mapajs = map({
  container: 'map',
  controls: ['layerswitcher'],
});

// GeoJSON servido
const lyProvincias = new GeoJSON({
  source: {
    'type': 'FeatureCollection',
    'features': [
      {
        'type': 'Feature',
        'id': 'mapea_feature_7983480089679813',
        'geometry': {
          'type': 'Polygon',
          'coordinates': [
            [
              [-7.151086589243164, 37.657144739431686],
              [-4.933381112424118, 37.64931100820789],
              [-5.448205729868163, 36.758769601336226],
              [-6.091735998612838, 37.043621964452996],
              [-7.151086589243164, 37.657144739431686],
            ],
          ],
        },
        'properties': {},
      }, {
        'type': 'Feature',
        'id': 'mapea_feature_3307922415222504',
        'geometry': {
          'type': 'Polygon',
          'coordinates': [
            [
              [-3.7156228440037515, 38.53704121621672],
              [-1.2900078769890575, 38.544780365403625],
              [-2.3691589242827553, 38.26563992005367],
              [-3.171097541564646, 37.586610085487976],
              [-4.933381112424118, 38.2423293549536],
              [-3.161196642485784, 39.13052967351828],
              [-3.7156228440037515, 38.53704121621672],
            ],
          ],
        },
        'properties': {},
      },
    ],
  },
});

const lyEnvelope = new GeoJSON({
  source: {
    crs: {
      properties: {
        name: 'EPSG:25830',
      },
      type: 'name',
    },
    features: [],
    type: 'FeatureCollection',
  },
  name: 'envelope',
});

lyProvincias.on(SELECT_FEATURES, (features) => {
  const parser = new jsts.io.GeoJSONReader();
  const f = parser.read(features[0].getGeoJSON());
  const objEnv = f.geometry.getEnvelopeInternal();

  const fEnv = new Feature(features[0].getAttribute('nombre'), {
    type: 'Feature',
    id: 'fEnv',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [objEnv._minx, objEnv._miny],
        [objEnv._minx, objEnv._maxy],
        [objEnv._maxx, objEnv._maxy],
        [objEnv._maxx, objEnv._miny]
      ]],
    },
    geometry_name: 'the_geom',
    properties: {
      nombre: 'envelope',
    },
  });

  lyEnvelope.clear();
  lyEnvelope.addFeatures(fEnv);
});

mapajs.addLayers([lyProvincias, lyEnvelope]);
