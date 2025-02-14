/* eslint-disable max-len,camelcase,no-console,no-unused-vars */
import { map as Mmap } from 'M/mapea';
// import { vector_001 } from '../layers/vector/vector';
// import { geojson_001 } from '../layers/geojson/geojson';
// import { wfs_001 } from '../layers/wfs/wfs';
// import { kml_001 } from '../layers/kml/kml';
import { mvt_001 } from '../layers/mvt/mvt';
// import { mbtileVector_001 } from '../layers/mbTilesVector/mbTilesVector';
// import { ogcAPIFeatures_001 } from '../layers/ogcApiFeatures/ogcApiFeatures';
// import { generic_002 } from '../layers/generic/generic';
// import { geotiff_001 } from '../layers/geotiff/geotiff';
// import { maplibre_001 } from '../layers/maplibre/maplibre';

const mapa = Mmap({
  container: 'map',
  // projection: 'EPSG:3857*m',
  // projection: 'EPSG:4326*d',
  // layers: ['OSM'],
  // center: [-443273.10081370454, 4757481.749296248],
  // zoom: 6,
  // center: [-443273.10081370454, 4757481.749296248], zoom: 6, layers: ['OSM'], controls: ['scale', 'getfeatureinfo'], // GeoTIFF TEST
});

mapa.addLayers([
  // vector_001,
  // vector_002,
  // geojson_001,
  // wfs_001,
  // kml_001,
  mvt_001,
  // mbtileVector_001,
  // ogcAPIFeatures_001,
  // generic_002,
  // geotiff_001,
  // maplibre_001,
]);

const genericTestFunction = (layerToTest, layerNaming) => {
  if (layerToTest.toGeoJSON) {
    console.log(`Capa ${layerNaming} - toGeoJSON - RESULT:`, layerToTest.toGeoJSON());
  } else {
    console.error(`Capa ${layerNaming} - toGeoJSON - FUNCTION DOES NOT EXIST IN LAYER`);
  }
  if (layerToTest.getFeatures) {
    const testFeature = layerToTest.getFeatures()[0];
    if (testFeature) {
      if (testFeature.getGeoJSON) {
        console.log(`Capa ${layerNaming} - getFeatures - getGeoJSON - RESULT:`, testFeature.getGeoJSON());
      } else {
        console.error(`Capa ${layerNaming} - getFeatures - getGeoJSON - FUNCTION DOES NOT EXIST IN FEATURE`);
      }
    } else {
      console.error(`Capa ${layerNaming} - getFeatures - TEST FEATURE IS undefined OR null`);
    }
  } else {
    console.error(`Capa ${layerNaming} - getFeatures - FUNCTION DOES NOT EXIST IN LAYER`);
  }
};

// ? proyección, si no pone nada 4326 si lo pone el que ponga
// ? Es necesario que este la capa incluida en el mapa

setTimeout(() => {
  /* / ++++++++++++++++ Capa vector. +++++++++++++++
  console.log('Capa Vector - toGeoJSON');
  console.log(vector_001.toGeoJSON());
  console.log('Capa Vector - getFeatures - getGeoJSON');
  console.log(vector_001.getFeatures()[0].getGeoJSON()); // */

  /* / Feature sin crs
  console.log('Capa Vector - toGeoJSON');
  console.log(vector_002.toGeoJSON());
  console.log('Capa Vector - getFeatures - getGeoJSON');
  console.log(vector_002.getFeatures()[0].getGeoJSON()); // */

  /* / ++++++++++++++++ Capa GeoJSON. +++++++++++++++
  console.log('Capa GeoJSON - toGeoJSON');
  console.log(geojson_001.toGeoJSON());
  console.log('Capa GeoJSON - getFeatures - getGeoJSON');
  console.log(geojson_001.getFeatures()[0].getGeoJSON()); // */

  /* / ++++++++++++++++ Capa WFS. +++++++++++++++
  console.log('Capa WFS - toGeoJSON');
  console.log(wfs_001.toGeoJSON());
  console.log('Capa WFS - getFeatures - getGeoJSON');
  console.log(wfs_001.getFeatures()[0].getGeoJSON()); // */

  /* / ++++++++++++++++ Capa KML. +++++++++++++++
  console.log('Capa KML - toGeoJSON');
  console.log(kml_001.toGeoJSON());
  console.log('Capa KML - Feature - getGeoJSON');
  console.log(kml_001.getFeatures()[0].getGeoJSON()); // */

  /* / ++++++++++++++++ Capa MVT. +++++++++++++++
  console.log('Capa MVT - toGeoJSON');
  console.log(mvt_001.toGeoJSON()); // ! Método vacío/undefined
  console.log('Capa MVT - getFeatures - getGeoJSON');
  console.log(mvt_001.getFeatures()[0].getGeoJSON()); // */

  // ++++++++++++++++ Capa mbtileVector. +++++++++++++++
  // genericTestFunction(mbtileVector_001, 'mbtileVector');
  // ! toGeoJSON devuelve undefined
  // ! No existe función getFeatures // ! RenderFeatures - es necesario feature (implementar)

  /* / ++++++++++++++++ Capa ogcAPIFeatures. +++++++++++++++
  console.log('Capa ogcAPIFeatures - toGeoJSON'); // ! Error index
  console.log(ogcAPIFeatures_001.toGeoJSON());
  console.log('Capa ogcAPIFeatures - getFeatures - getGeoJSON');
  console.log(ogcAPIFeatures_001.getFeatures()[0].getGeoJSON()); // */

  /* / ++++++++++++++++ Capa Generic. +++++++++++++++
  console.log('Capa Generic - toGeoJSON');
  console.log(generic_002.toGeoJSON());
  console.log('Capa Generic - getFeatures - getGeoJSON');
  console.log(generic_002.getFeatures()[0].getGeoJSON()); // */

  // ++++++++++++++++ Capa GeoTIFF. +++++++++++++++
  // genericTestFunction(geotiff_001, 'GeoTIFF');
  // ! No existe función toGeoJSON
  // ! No existe función getFeatures

  // ++++++++++++++++ Capa MapLibre. +++++++++++++++
  // genericTestFunction(maplibre_001, 'MapLibre');
  // ! toGeoJSON devuelve undefined
  // ! getFeatures devuelve un array vacío

  // **********************************************
}, 1000);

window.mapa = mapa;
