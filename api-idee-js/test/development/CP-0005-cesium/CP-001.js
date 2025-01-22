import { map as Mmap, proxy } from 'IDEE/mapea';
import GeoJSON from 'IDEE/layer/GeoJSON';

import Generic from 'IDEE/style/Generic';
import { CLAMP_TO_GROUND, RELATIVE_TO_GROUND, RELATIVE_TO_TERRAIN } from 'IDEE/style/HeightReference';

const mapa = Mmap({
  container: 'map',
  center: [-3.6834651068043116, 40.47460459090459],
  zoom: 16,
});
window.mapa = mapa;

proxy(false);

const geojson = new GeoJSON({
  url: 'http://localhost:8081/test/development/CP-0005-Cesium/edificiosBTN.geojson',
  name: 'edificiosBTN',
  legend: 'edificiosBTN',
  extract: true,
}, {
  clampToGround: false,
  height: 0,
  style: new Generic({
    polygon: {
      stroke: {
        color: 'red',
        width: 3,
      },
      fill: {
        color: 'blue',
        opacity: 0.7,
      },
      perPositionHeight: false,
      heightReference: CLAMP_TO_GROUND,
      extrudedHeightReference: RELATIVE_TO_GROUND,
      extrudedHeight: (feature) => {
        return feature.getAttribute('n_plantas') * 5;
      },
    },
  }),
});
window.geojson = geojson;
mapa.addLayers(geojson);

const style = new Generic({
  polygon: {
    stroke: {
      color: 'red',
      width: 3,
    },
    fill: {
      color: 'blue',
      opacity: 0.7,
    },
    perPositionHeight: false,
    heightReference: CLAMP_TO_GROUND,
    extrudedHeightReference: RELATIVE_TO_GROUND,
    extrudedHeight: (feature) => {
      return feature.getAttribute('n_plantas') * 5;
    },
  },
});
window.style = style;
