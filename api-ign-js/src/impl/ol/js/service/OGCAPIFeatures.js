/**
 * @module M/impl/service/OGCAPIFeatures
 */
import { get as getRemote } from 'M/util/Remote';
import { isNullOrEmpty, addParameters } from 'M/util/Utils';
import Featuretype from '../format/wfs/DescribeFeatureType';

/**
 * @classdesc
 * OGCAPIFeatures(OGC API - Features) es un estándar que ofrece la
 * capacidad de crear, modificar y consultar datos
 * espaciales en la Web y especifica requisitos y recomendaciones para las API que desean seguir una
 * forma estándar de compartir datos de entidades.
 */
class OGCAPIFeatures {
  /**
   * @classdesc
   * Constructor principal de la clase. Crea una capa OGCAPIFeatures
   * con parámetros especificados por el usuario.
   *
   * @constructor
   * @implements {M.impl.Layer}
   * @param {Object} layerParameters Parámetros para la construcción de la capa,
   * estos parámetros los proporciona el usuario.
   * - url: URL del servicio WFS.
   * - namespace: Espacio de nombres.
   * - name: Nombre de la capa.
   * - version: Versión del servicio WFS.
   * - ids: Identificadores de los objetos geográficos.
   * - projection: Proyección.
   * - getFeatureOutputFormat: Formato de salida de la petición "getFeature".
   * - describeFeatureTypeOutputFormat_: Formato de salida de la petición "describeFeatureType".
   * - limit: Límite de objetos geográficos a mostrar.
   * - bbox: Filtro para mostrar los resultados en un bbox específico.
   * - format: Formato de los objetos geográficos.
   * - offset: Determina desde que número comenzará a leer los objetos geográficos.Ejemplo:
   * El parámetro offset tiene valor 10 con límite de 5 objetos geográficos,
   * devolverá los 5 primeros objetos geográficos desde número 10 de los resultados.
   * @param {Object} vendorOpts Opciones para la biblioteca base.
   * - getFeature: Devuelve los objetos geográficos de la capa.
   * - describeFeatureType: Devuelve la descripción de la capa.
   * - cql: Consulta CQL.
   * Ejemplo vendorOptions:
   * <pre><code>
   * import OLSourceVector from 'ol/source/Vector';
   * {
   *   cql: 'id IN (3,5)',
   * }
   * </code></pre>
   * @api stable
   */
  constructor(layerParameters, vendorOpts) {
    /**
     * URL del servicio.
     * @private
     * @type {String}
     */
    this.url_ = layerParameters.url;

    /**
     * Nombre del servicio.
     * @private
     * @type {String}
     */
    this.name_ = layerParameters.name;

    /**
     * Formato de los objetos geográficos.
     * @private
     * @type {String}
     */
    this.format_ = layerParameters.format;

    /**
     * Límite de objetos geográficos a mostrar.
     * @private
     * @type {Number}
     */
    this.limit_ = layerParameters.limit;

    /**
     * Determina desde que número comenzará a leer los objetos geográficos.
     * @private
     * @type {Number}
     */
    this.offset_ = layerParameters.offset;

    /**
     * Filtro por ID para un objeto geográfico.
     * @private
     * @type {Number}
     */
    this.id_ = layerParameters.id;

    /**
     * Filtro para mostrar los resultados en un bbox específico.
     * @private
     * @type {Array}
     */
    this.bbox_ = layerParameters.bbox;

    /**
     * Declaración CQL para filtrar las características
     * (Sólo disponible para servicios en PostgreSQL).
     * @private
     * @type {String}
     */
    this.cql_ = vendorOpts.cql;

    /**
     * Declaración de filtros literales por atributos del objeto geográfico.
     * @private
     * @type {String}
     */
    this.conditional_ = layerParameters.conditional;

    /**
     * Proyección.
     * @private
     * @type {M.Projection}
     */
    this.projection_ = layerParameters.projection;

    /**
     * Formato de salida de la petición "getFeature".
     * @private
     * @type {String}
     */
    this.getFeatureOutputFormat_ = layerParameters.getFeatureOutputFormat;
    if (isNullOrEmpty(this.getFeatureOutputFormat_)) {
      this.getFeatureOutputFormat_ = 'application/json'; // by default
    }

    /**
     * Formato de salida de la petición "describeFeatureType".
     * @private
     * @type {String}
     */
    this.describeFeatureTypeOutputFormat_ = layerParameters.describeFeatureTypeOutputFormat;

    /**
     * Obtiene los objetos geográficos de la capa.
     * @private
     * @type {Object}
     */
    this.getFeatureVendor_ = {};
    if (!isNullOrEmpty(vendorOpts) && !isNullOrEmpty(vendorOpts.getFeature)) {
      this.getFeatureVendor_ = vendorOpts.getFeature;
    }

    /**
     * Formato de salida de la petición "describeFeatureType".
     * @private
     * @type {Object}
     */
    this.describeFeatureTypeVendor_ = {};
    if (!isNullOrEmpty(vendorOpts) && !isNullOrEmpty(vendorOpts.describeFeatureType)) {
      this.describeFeatureTypeVendor_ = vendorOpts.describeFeatureType;
    }
  }

  /**
   * Este método devuelve el tipo de objetos geográficos de la capa.
   *
   * @public
   * @function
   * @returns {Promise} Promesa con el tipo de objetos geográficos de la capa.
   * @api stable
   */
  getDescribeFeatureType() {
    // TODO
    const describeFeatureParams = {
      service: 'OGCAPIFeatures',
      request: 'DescribeFeatureType',
    };
    if (!isNullOrEmpty(this.describeFeatureTypeOutputFormat_)) {
      describeFeatureParams.outputFormat = this.describeFeatureTypeOutputFormat_;
    }

    const params = addParameters(this.url_, describeFeatureParams);
    const describeFeatureTypeUrl = addParameters(params, this.describeFeatureTypeVendor_);
    const descFTypeOForm = this.describeFeatureTypeOutputFormat_;
    const descrFTypeFormat = new Featuretype(this.name_, descFTypeOForm, this.projection_);
    return new Promise((success, fail) => {
      getRemote(describeFeatureTypeUrl).then((response) => {
        success(descrFTypeFormat.read(response));
      });
    });
  }

  /**
   * Este método obtiene la URL completa de un objeto geográfico
   * pedido.
   *
   * @public
   * @function
   * @returns {String} URL completa del objeto geográfico pedido.
   *
   * @api stable
   */

  getFeatureUrl() {
    const getFeatureParams = {
      // service: 'OGCAPIFeatures',
      // request: 'GetFeature',
      // outputFormat: this.getFeatureOutputFormat_,
      // describeOutputFormat: this.getDescribeFeatureType_,
      // srsname: projection.getCode(),
    };
    let fUrl;

    if (!isNullOrEmpty(this.name_)) {
      this.url_ = `${this.url_}${this.name_}/items`;
    }
    if (!isNullOrEmpty(this.format_)) {
      getFeatureParams.f = this.format_;
    }
    if (!isNullOrEmpty(this.id_)) {
      this.url_ = `${this.url_}/${this.id_}?`;
      fUrl = addParameters(addParameters(this.url_, getFeatureParams), this.getFeatureVendor_);
    } else {
      this.url_ = `${this.url_}?`;
      if (!isNullOrEmpty(this.limit_)) {
        getFeatureParams.limit = this.limit_;
      }
      if (!isNullOrEmpty(this.offset_)) {
        getFeatureParams.offset = this.offset_;
      }
      if (!isNullOrEmpty(this.bbox_)) {
        getFeatureParams.bbox = this.bbox_;
      }

      fUrl = addParameters(addParameters(this.url_, getFeatureParams), this.getFeatureVendor_);

      if (!isNullOrEmpty(this.cql_)) {
        getFeatureParams.filter = this.cql_;
        fUrl += `filter=${encodeURIComponent(this.cql_)}`;
      }
      if (!isNullOrEmpty(this.conditional_)) {
        let text = '';
        Object.keys(this.conditional_).forEach((key) => {
          const param = `&${key}=${this.conditional_[key]}&`;
          text += param;
        });
        getFeatureParams.conditional = text;
        fUrl += getFeatureParams.conditional;
      }
    }
    fUrl = fUrl.replaceAll(' ', '%20');
    return fUrl;
  }
}

export default OGCAPIFeatures;
