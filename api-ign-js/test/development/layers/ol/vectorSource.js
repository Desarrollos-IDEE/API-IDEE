/* eslint-disable new-cap */
import olTopoJSON from 'ol/format/TopoJSON';
import KML from 'ol/format/KML';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import WFS from 'ol/format/WFS';
import GeoJSON from 'ol/format/GeoJSON';
import { bbox } from 'ol/loadingstrategy';
import Generic from 'M/style/Generic';// eslint-disable-line no-unused-vars

// import { bbox as bboxStrategy } from 'ol/loadingstrategy.js';

// TopoJSON
export const TopoJSON = new VectorLayer({
  source: new VectorSource({
    format: new olTopoJSON(),
    url: 'https://openlayers.org/en/latest/examples/data/topojson/world-110m.json',
  }),
  legend: '1',
});

// WFS
// url: https://www.ign.es/wfs/redes-geodesicas?
// name: RED_REGENTE
// [ ] Don't work
export const typeWFS = new VectorLayer({
  source: new VectorSource({
    format: new WFS(),
    url: 'https://sig.asturias.es/servicios/services/UnidadesAdministrativas/MapServer/WFSServer',
    params: {
      'LAYERS': 'UnidadesAdministrativas:Asturias',
      'TYPENAME': 'Asturias',
      'VERSION': '2.0.0',
    },
    strategy: bbox,
  }),
});

const wfsUrl = 'https://geostematicos-sigc.juntadeandalucia.es/geoserver/tematicos/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=tematicos:Provincias&maxFeatures=50&outputFormat=application%2Fjson';

// kml
export const kml = new VectorLayer({
  source: new VectorSource({
    url: 'https://www.ign.es/web/resources/delegaciones/DelegacionesIGN-APICNIG.kml',
    format: new KML({
      extractStyles: false,
    }),
  }),
});

export const wfsLayer = new VectorLayer({
  source: new VectorSource({
    format: new GeoJSON(),
    url: wfsUrl,
    strategy: bbox,
  }),
  // style: new Style({
  //   stroke: new Stroke({
  //     color: 'red',
  //     width: 2
  //   })
  // })
});

// flatGeobuf -> Se necesita instalar https://github.com/flatgeobuf/flatgeobuf
// export const flatGeobuf = new VectorLayer({
//     source: new VectorSource({
//         loader: async function () {
//             // Fetch the flatgeobuffer
//             const response = await fetch('https://flatgeobuf.org/test/data/UScounties.fgb')
//             // ...and parse all its features
//             for await (let feature of flatgeobuf.deserialize(response.body)) {
//                 feature.getGeometry().transform('EPSG:4326', 'EPSG:3857')
//                 // add each feature to the map, after projecting it to
//                 console.log(feature)
//                 this.addFeature(feature)
//             }
//         }
//     })
// })
