/**
 * Esta clase contiene funciones de utilidad para leer
 * ficheros geográficos y añadir los features al mapa.
 * @module IDEE/loadFiles
 * @example import utils from 'IDEE/loadFiles';
 */
import * as shp from 'shpjs';
import * as Gdal from './Gdal';
import LoadFilesImpl from '../../../impl/ol/js/util/LoadFiles';
import * as Dialog from '../dialog';
import { getValue } from '../i18n/language';
import Vector from '../layer/Vector';
import GeoTIFF from '../layer/GeoTIFF';

/**
 * Esta función añade al mapa una capa vector con los features
 * de un fichero
 * @param {IDEE.map} map objeto mapa
 * @param {String} layerName nombre del nuevo layer
 * @param {object[]} features conjunto de funcinalidades que conforman una capa
 * @function
 * @api
 */
export const loadFeaturesLoadFilesImpl = (map, layerName, features) => {
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
 * Crea una capa de tipo Geotiff
 * @param {IDEE.map} map objeto mapa
 * @param {URL | Blob} source
 * @param {string} name nombre de la capa
 * @param {string} legend leyenda de la capa
 * @function
 * @api
 */
export const loadGeotiffLayer = (
  map,
  source,
  name,
  legend = name,
) => {
  const geoTiffLayer = new GeoTIFF({
    blob: IDEE.utils.isUrl(source) ? source : URL.createObjectURL(source),
    name,
    legend,
    visibility: true,
    isBase: false,
    normalize: true,
    displayInLayerSwitcher: true,
  }, {
    opacity: 1,
  });
  map.once(IDEE.evt.ADDED_GEOTIFF, async () => {
    // Get some time to load geotiff
    setTimeout(() => {
      try {
        const extent = geoTiffLayer.getMaxExtent();
        if (Array.isArray(extent) && extent.length === 4) {
          IDEE.impl.loadFiles.fitMapToExtent(map, extent);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn(getValue('exception').invalid_maxextent_param);
      }
    }, 200);
  });
  map.addLayers(geoTiffLayer);
};

/**
 * Esta función añade al mapa una capa vector con los features
 * de un fichero
 * @param {IDEE.map} map objeto mapa
 * @param {Object} source fichero a cargar
 * @param {String} layerName nombre del nuevo layer
 * @param {String} fileExt extension del fichero
 * @function
 * @api
 */
export const loadFeaturesFromSource = async (map, source, layerName, fileExt) => {
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
      } else if (Gdal.extensionFiles.includes(fileExt)) {
        const { vectors } = await Gdal.processFile(source, projection);
        features = LoadFilesImpl.loadAllInGeoJSONLayer(vectors ?? [], projection);
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
 * @param {IDEE.map} map objeto mapa
 * @param {Object} file fichero del que se obtienen los features
 * @function
 * @api
 */
export const addFileToMap = (map, file) => {
  if (file) {
    // eslint-disable-next-line no-bitwise
    const fileExt = file.name.slice((file.name.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase();
    const layerName = file.name.split('.').slice(0, -1).join('.');

    // Formatos binarios (GDAL / comprimidos / raster)
    const binaryFormats = [
      'zip',
    ];

    // Formatos de texto vectorial
    const textFormats = [
      'kml',
      'gpx',
      'geojson',
      'gml',
      'json',
    ];

    // Formatos compatibles con la librería de gdal
    const gdalFormats = [
      'gpkg',
    ];

    // Raster formats
    const rasterFormats = [
      'tif',
      'tiff',
    ];

    if (rasterFormats.includes(fileExt)) {
      loadGeotiffLayer(map, file, layerName);
    } else if (file.size > 20971520) {
      Dialog.info(getValue('exception').file_size);
    } else {
      const fileReader = new window.FileReader();
      fileReader.addEventListener('load', (e) => {
        loadFeaturesFromSource(map, fileReader.result, layerName, fileExt);
      });

      if (binaryFormats.includes(fileExt)) {
        fileReader.readAsArrayBuffer(file);
      } else if (textFormats.includes(fileExt)) {
        fileReader.readAsText(file);
      } else if (gdalFormats.includes(fileExt)) {
        loadFeaturesFromSource(map, file, layerName, fileExt);
      } else {
        Dialog.error(getValue('exception').file_extension);
      }
    }
  }
  // else {
  //   Dialog.error(getValue('exception').file_empty);
  // }
};

export default {};
