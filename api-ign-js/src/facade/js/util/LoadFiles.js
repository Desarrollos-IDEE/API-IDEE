/**
 * Esta clase contiene funciones de utilidad para leer
 * ficheros geográficos y añadir los features al mapa.
 * @module M/loadFiles
 * @example import utils from 'M/loadFiles';
 */
import * as shp from 'shpjs';
import LoadFilesImpl from '../../../impl/ol/js/util/LoadFiles';
import * as Dialog from '../dialog';
import { getValue } from '../i18n/language';
import Vector from '../layer/Vector';

const loadFeaturesLoadFilesImpl = (map, layerName, features) => {
  if (features.length === 0) {
    Dialog.info(getValue('exception').no_geoms);
  } else {
    const layer = new Vector({ name: layerName, legend: layerName, extract: true });
    layer.addFeatures(features);
    map.addLayers(layer);
    LoadFilesImpl.centerFeatures(features, map);
  }
};

/**
 * Esta función añade al mapa una capa vector con los features
 * de un fichero
 * @param {M.map} map objeto mapa
 * @param {Object} source fichero a cargar
 * @param {String} layerName nombre del nuevo layer
 * @param {String} fileExt extension del fichero
 * @function
 * @api
 */
export const loadFeaturesFromSource = (map, source, layerName, fileExt) => {
  try {
    const projection = map.getProjection().code;

    if (fileExt === 'zip') {
      shp.parseZip(source).then((data) => {
        const geojsonArray = [].concat(data);
        const features = LoadFilesImpl.loadAllInGeoJSONLayer(geojsonArray, projection);
        loadFeaturesLoadFilesImpl(map, layerName, features);
      });
    } else {
      let features = [];
      if (fileExt === 'kml') {
        features = LoadFilesImpl.loadKMLLayer(source, projection, false);
      } else if (fileExt === 'gpx') {
        features = LoadFilesImpl.loadGPXLayer(source, projection);
      } else if (fileExt === 'geojson' || fileExt === 'json') {
        features = LoadFilesImpl.loadGeoJSONLayer(source, projection);
      } else if (fileExt === 'gml') {
        features = LoadFilesImpl.loadGMLLayer(source, projection);
      } else {
        Dialog.error(getValue('exception').file_load);
      }
      loadFeaturesLoadFilesImpl(map, layerName, features);
    }
  } catch (e) {
    Dialog.error(getValue('exception').file_load_correct);
  }
};

/**
 * Esta función añade al mapa una capa vector con los features
 * de un fichero
 * @param {M.map} map objeto mapa
 * @param {Object} file fichero del que se obtienen los features
 * @function
 * @api
 */
export const addFileToMap = (map, file) => {
  if (file) {
    if (file.size > 20971520) {
      Dialog.info(getValue('exception').file_size);
    } else {
      // eslint-disable-next-line no-bitwise
      const fileExt = file.name.slice((file.name.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase();
      const layerName = file.name.split('.').slice(0, -1).join('.');
      const fileReader = new window.FileReader();
      fileReader.addEventListener('load', (e) => {
        loadFeaturesFromSource(map, fileReader.result, layerName, fileExt);
      });

      if (fileExt === 'zip') {
        fileReader.readAsArrayBuffer(file);
      } else if (fileExt === 'kml' || fileExt === 'gpx' || fileExt === 'geojson' || fileExt === 'gml' || fileExt === 'json') {
        fileReader.readAsText(file);
      } else {
        Dialog.error(getValue('exception').file_extension);
      }
    }
  }
};

export default {};
