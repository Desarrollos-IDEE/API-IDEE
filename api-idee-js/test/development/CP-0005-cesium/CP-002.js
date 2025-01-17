import { map as Mmap, proxy } from 'M/mapea';
import KML from 'M/layer/KML';

const mapa = Mmap({
  container: 'map',
  center: [-2.6500293374200043, 38.084110463186356],
  zoom: 16,
});
window.mapa = mapa;

proxy(false);

const kml = new KML({
  url: 'http://localhost:8081/test/development/CP-0005-Cesium/KML/Puntos_2_alturas relativas.kml',
  name: 'KML',
}, {
  // clampToGround: true,
  clampToGround: false,
  // extractStyles: false,
  // extractStyles: true,
  // height: 0,
  // style: new Point({
  //   fill: {
  //     color: 'red',
  //     opacity: 0.5,
  //   },
  //   stroke: {
  //     color: 'blue',
  //   },
  //   heightReference: RELATIVE_TO_GROUND,
  //   // perPositionHeight: false,
  //   //   // extrudedHeight: 1,
  //   //   // extrudedHeightReference: RELATIVE_TO_GROUND,
  // }),
});
mapa.addLayers(kml);
