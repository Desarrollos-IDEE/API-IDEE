/**
 * @module M/format/GeoJSON
 */
import GeoJSONImpl from 'impl/format/GeoJSON';
import Base from '../Base';
import {
  isUndefined, isArray, isNullOrEmpty, isString,
} from '../util/Utils';
import Exception from '../exception/exception';
import { getValue } from '../i18n/language';

/**
 * @classdesc
 * GeoJSON, a pesar de no ser un estándar OGC (está en camino de convertirse en uno),
 * es un formato de intercambio de información geográfica muy extendido que, al igual que WFS,
 * permite que todos los elementos estén en el cliente.
 * @extends {M.facade.Base}
 * @api
 */
class GeoJSON extends Base {
  /**
   * Constructor principal de la clase. Crea una capa
   * con parámetros especificados por el usuario.
   *
   * @constructor
   * @param {string|Object} options Parámetros opcionales.
   * - dataProjection. Proyección de datos predeterminada. Por defecto 'EPSG:4326'.
   * - featureProjection. Proyección del objeto geográfico leídas o escritas por el formato.
   *   Las opciones pasadas a los métodos de lectura o escritura tendrán prioridad.
   * - geometryName. Nombre de geometría que se utilizará al crear objetos geográficos.
   * - extractGeometryName .Por defecto falso.
   * @api
   */
  constructor(options = {}) {
    /**
     * Implementation of this formatter.
     * @public
     * @type {M.impl.format.GeoJSON}
     */
    const impl = new GeoJSONImpl(options);

    // calls the super constructor
    super(impl);

    // checks if the implementation can create format GeoJSON
    if (isUndefined(GeoJSONImpl)) {
      Exception(getValue('exception').geojson_method);
    }
  }

  /**
   * Crea un GeoJSON con los objetos geográficos que se le pasa por parámetros.
   *
   * @public
   * @function
   * @param {Array<M.Feature>} features Array de objetos geográficos que se transformará
   * en un GeoJSON "FeatureCollection".
   * @return {Array<Object>} Matriz con objetos "FeatureCollection".
   * @api
   */
  write(featuresParam) {
    let features = featuresParam;
    if (!isArray(features)) {
      features = [features];
    }
    return this.getImpl().write(features);
  }

  /**
   * Este método lee los objetos geográficos "FeatureCollection" y
   * los transforma a una matriz de "M.Feature".
   *
   * @public
   * @function
   * @param {object} geojson GeoJSON para analizar como un
   * matriz M.Feature.
   * @return {Array<M.Feature>} Matriz con objetos geográficos.
   * @api
   */
  read(geojsonParam, projection) {
    let geojson = geojsonParam;
    let features = [];
    if (!isNullOrEmpty(geojson)) {
      if (isString(geojson)) {
        geojson = JSON.parse(geojson);
      }
      let geojsonFeatures = [];
      if (geojson.type === 'FeatureCollection') {
        geojsonFeatures = geojson.features;
      } else if (geojson.type === 'Feature') {
        geojsonFeatures = [geojson];
      }
      features = this.getImpl().read(geojson, geojsonFeatures, projection);
    }
    return features;
  }
}

export default GeoJSON;
