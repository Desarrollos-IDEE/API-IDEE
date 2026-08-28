import { map as Mmap } from 'IDEE/api-idee';
import GeoJSON from 'IDEE/layer/GeoJSON';
import Generic from 'IDEE/style/Generic';
import { CLAMP_TO_GROUND } from 'IDEE/style/HeightReference';

const mapa = Mmap({
  container: 'map',
}, {}, {
  // shouldAnimate: true,
});
window.mapa = mapa;

// Capa GeoJSON
const geojson = new GeoJSON({
  name: 'iss',
  legend: 'Satélite',
  extract: true,
  source: {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: {
        'icono': 'Icono 3D',
      },
      geometry: { type: 'Point', coordinates: [-6.96736027777778, 43.2534874666667, 0] }, // [-6.96736027777778, 43.2534874666667, 150] --> CesiumAir
    }],
  },
});
window.geojson = geojson;

// Estilo con icono 3D
const estilo = new Generic({
  point: {
    icon: {
      minimumPixelSize: 50,
      // src: 'http://localhost:8081/images/ISS_stationary.glb',
      // src: 'https://sandcastle.cesium.com/SampleData/models/CesiumAir/Cesium_Air.glb',
      src: 'https://sandcastle.cesium.com/SampleData/models/DracoCompressed/CesiumMilkTruck.gltf',
      // opacity: 0.5,
      scale: 10,
      // rotation: 0.5,
    },
    heightReference: CLAMP_TO_GROUND,
  },
});
window.estilo = estilo;
geojson.setStyle(estilo);

// Estilo con stroke azul
const estilo2 = new Generic({
  point: {
    stroke: { color: 'blue', width: 5 },
    radius: 4,
  },
});
window.estilo2 = estilo2;
// geojson.setStyle(estilo2);

mapa.addLayers(geojson);
