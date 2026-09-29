/**
 * @module IDEE/impl/loader/JSONP
 */
import { addParameters as refreshParameters, isNullOrEmpty } from 'IDEE/util/Utils';
import MObject from 'IDEE/Object';
import { get as getRemote } from 'IDEE/util/Remote';
import Exception from 'IDEE/exception/exception';
import { getValue } from 'IDEE/i18n/language';

/**
  * @classdesc
  * JSONP es un JSON con relleno, que se utiliza en JavaScript
  * para solicitar los datos desde la etiqueta "script".
  *
  * @property {IDEE.Map} map_ Mapa.
  * @property {IDEE.impl.service.WFS} url_ URL del servicio WFS.
  * @property {IDEE.format.GeoJSON} format_ Formato.
  *
  * @api
  * @extends {IDEE.Object}
  */
class JSONP extends MObject {
  /**
    * Constructor principal de la clase JSONP.
    *
    * @constructor
    * @param {IDEE.Map} map Mapa
    * @param {IDEE.impl.service.WFS} url URL del servicio WFS.
    * @param {IDEE.format.GeoJSON} format Formato.
    * @api
    */
  constructor(map, url, format) {
    super();

    /**
      * Mapa.
      * @private
      * @type {IDEE.Map}
      */
    this.map_ = map;

    /**
      * URL del servicio WFS.
      * @private
      * @type {IDEE.impl.service.WFS}
      */
    this.url_ = url;

    /**
      * Formato.
      * @private
      * @type {IDEE.format.GeoJSON}
      */
    this.format_ = format;
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
    const url = refreshParameters(this.url_, { _ideeRefresh: Date.now() });
    return this.loadInternal_(projection, url, true).then(([features]) => ({ features }));
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
  loadInternal_(projection, requestUrl = this.url_, forRefresh = false) {
    return new Promise((success, fail) => {
      const request = getRemote(requestUrl).then((response) => {
        if (forRefresh && response.code >= 400) throw new Error(`HTTP ${response.code}`);
        if (!isNullOrEmpty(response.text)) {
          const newText = response.text.replace('urn:ogc:def:crs:OGC:1.3:CRS84', 'urn:ogc:def:crs:EPSG::4326');
          const features = this.format_.read(newText, {
            featureProjection: projection,
          });
          success.call(this, [features]);
        } else {
          Exception(getValue('exception').no_service_response);
        }
      });
      if (forRefresh) request.catch(fail);
    });
  }
}

export default JSONP;
