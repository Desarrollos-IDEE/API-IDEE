/**
 * @module M/impl/service/WFS
 */
import { get as getRemote } from 'M/util/Remote';
import { isNullOrEmpty, addParameters } from 'M/util/Utils';
import Featuretype from '../format/wfs/DescribeFeatureType';

/**
 * @classdesc
 * WFS (Web Feature Service) es un estándar OGC para la transferencia de información geográfica,
 * donde los elementos geográficos o features se transmiten en su totalidad al cliente.
 * @api
 */
class WFS {
  /**
   * @classdesc
   * Constructor principal de la clase. Crea una capa WFS
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
   * - cql: Consulta CQL.
   * - projection: Proyección.
   * - getFeatureOutputFormat: Formato de salida de la petición "getFeature".
   * - describeFeatureTypeOutputFormat_: Formato de salida de la petición "describeFeatureType".
   * @param {Object} vendorOpts Opciones para la biblioteca base.
   * - getFeature: Devuelve los objetos geográficos de la capa.
   * - describeFeatureType: Devuelve la descripción de la capa.
   * @api stable
   */
  constructor(layerParameters, vendorOpts) {
    /**
     * URL del servicio WFS.
     * @private
     * @type {String}
     */
    this.url_ = layerParameters.url;

    /**
     * Espacio de nombres.
     * @private
     * @type {String}
     */
    this.namespace_ = layerParameters.namespace;

    /**
     * Nombre de la capa.
     * @private
     * @type {String}
     */
    this.name_ = layerParameters.name;

    /**
     * Nombre completo de la capa.
     * @private
     * @type {String}
     */
    this.typeName_ = this.name_;
    if (!isNullOrEmpty(this.namespace_)) {
      this.typeName_ = this.namespace_.concat(':').concat(this.name_);
    }

    /**
     * Versión del servicio WFS.
     * @private
     * @type {String}
     */
    this.version_ = layerParameters.version;

    /**
     * Identificadores de los objetos geográficos.
     * @private
     * @type {String}
     */
    this.ids_ = layerParameters.ids;

    /**
     * Consulta CQL.
     * @private
     * @type {String}
     */
    this.cql_ = layerParameters.cql;

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
    const describeFeatureParams = {
      service: 'WFS',
      version: this.version_,
      request: 'DescribeFeatureType',
      typename: this.typeName_,
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
   * @param {ol.Extent} extent Extensión de la capa.
   * @param {ol.proj.Projection} projection Proyección de la capa.
   * @returns {String} URL completa del objeto geográfico pedido.
   *
   * @api stable
   */
  getFeatureUrl(extent, projection) {
    const getFeatureParams = {
      service: 'WFS',
      version: this.version_,
      request: 'GetFeature',
      typename: this.typeName_,
      outputFormat: this.getFeatureOutputFormat_,
      srsname: projection.getCode(),
    };
    if (!isNullOrEmpty(this.ids_)) {
      getFeatureParams.featureId = this.ids_.map((id) => {
        return this.name_.concat('.').concat(id);
      });
    }
    if (!isNullOrEmpty(this.cql_)) {
      getFeatureParams.CQL_FILTER = this.cql_;
    } else if (!isNullOrEmpty(extent)) {
      getFeatureParams.bbox = `${extent.join(',')},${projection.getCode()}`;
    }

    return addParameters(addParameters(this.url_, getFeatureParams), this.getFeatureVendor_);
  }
}

export default WFS;
