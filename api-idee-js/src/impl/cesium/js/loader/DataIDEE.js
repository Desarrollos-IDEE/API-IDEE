/**
 * @module IDEE/impl/loader/DataIDEE
 */
import MObject from 'IDEE/Object';
import RequestManager from '../../../common/RequestManager';
import createDataIDEERequest from '../../../common/DataIDEERequest';

/**
  * @classdesc
  * Cargador de entidades GeoJSON obtenidas mediante una petición HTTP GET.
  *
  * @property {IDEE.Map} map_ Mapa.
  * @property {String} url_ URL de los elementos de la colección.
  * @property {IDEE.format.GeoJSON} format_ Formato.
  *
  * @api
  * @extends {IDEE.Object}
  */
class DataIDEE extends MObject {
  /**
    * Constructor principal del cargador OGC API Features JSON.
    *
    * @constructor
    * @param {IDEE.Map} map Mapa
    * @param {String} url URL de la colección o entidad.
    * @param {IDEE.format.GeoJSON} format Formato.
    * @api
    */
  constructor(
    map,
    url,
    format,
    requestManager = new RequestManager({ pendingPolicy: 'latest' }),
    shouldExecute = () => true,
  ) {
    super();

    /**
      * Mapa.
      * @private
      * @type {IDEE.Map}
      */
    this.map_ = map;

    /**
      * URL de los elementos de la colección.
      * @private
      * @type {String}
      */
    this.url_ = url;

    /**
      * Formato.
      * @private
      * @type {IDEE.format.GeoJSON}
      */
    this.format_ = format;

    /**
     * Optional settings forwarded to Remote.get.
     * @private
     */
    this.requestOptions_ = { jsonp: false };
    this.requestManager_ = requestManager;
    this.shouldExecute_ = shouldExecute;
  }

  /**
    * Este método ejecutará la función "callback" a los objetos geográficos.
    *
    * @function
    * @param {function} callback Función 'callback' de llamada para ejecutar.
    * @returns {function} Método que ejecutará la función "callback" a los objetos geográficos.
    * @public
    * @api
    */
  getLoaderFn(callback) {
    return ((extent, resolution, projection) => {
      this.loadInternal_(projection).then((response) => {
        callback.apply(this, response);
      });
    });
  }

  /**
   * Recarga sin modificar la URL original del cargador.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   */
  loadForRefresh(projection) {
    return this.loadFeatures(projection, true).then((features) => ({ features }));
  }

  loadFeatures(projection, force = false) {
    return this.loadInternal_(projection, this.url_, force).then((features) => features[0]);
  }

  /**
    * Este método obtiene los objetos geográficos a partir de los parámetros
    * especificados.
    * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
    * @function
    * @param {Object} projection Proyección.
    * @returns {Promise} Promesa con la obtención de los objetos geográficos.
    * @public
    * @api
    */
  loadInternal_(projection, requestUrl = this.url_, force = false) {
    const context = JSON.stringify({
      proxyUrl: IDEE.config.PROXY_URL || '',
      useProxy: IDEE.useproxy === true,
      jsonp: false,
    });
    const readFeatures = (text) => this.format_.read(
      text.replace('urn:ogc:def:crs:OGC:1.3:CRS84', 'urn:ogc:def:crs:EPSG::4326'),
      { featureProjection: projection },
    );
    return this.requestManager_.request(createDataIDEERequest({
      url: requestUrl,
      context,
      requestOptions: this.requestOptions_,
      force,
      shouldExecute: this.shouldExecute_,
      validateResponse: (text) => Promise.all(readFeatures(text).map((feature) => (
        // eslint-disable-next-line no-underscore-dangle
        feature.getImpl().isLoadCesiumFeature_
      ))),
    })).then(async (text) => {
      const features = readFeatures(text);
      // eslint-disable-next-line no-underscore-dangle
      await Promise.all(features.map((feature) => feature.getImpl().isLoadCesiumFeature_));
      return [features];
    });
  }
}

export default DataIDEE;
