/**
 * @module M/impl/loader/JSONP
 */
import MObject from 'M/Object';
import { get as getRemote } from 'M/util/Remote';
import Exception from 'M/exception/exception';
import { isNullOrEmpty } from 'M/util/Utils';
import { getValue } from 'M/i18n/language';

/**
  * @classdesc
  * JSONP es un JSON con relleno, que se utiliza en JavaScript
  * para solicitar los datos desde la etiqueta "script".
  *
  * @property {M.Map} map_ Mapa.
  * @property {M.impl.service.WFS} url_ URL del servicio WFS.
  * @property {M.format.GeoJSON} format_ Formato.
  *
  * @api
  * @extends {M.Object}
  */
class JSONP extends MObject {
  /**
    * Constructor principal de la clase JSONP.
    *
    * @constructor
    * @param {M.Map} map Mapa
    * @param {M.impl.service.WFS} url URL del servicio WFS.
    * @param {M.format.GeoJSON} format Formato.
    * @api
    */
  constructor(map, url, format) {
    super();

    /**
      * Mapa.
      * @private
      * @type {M.Map}
      */
    this.map_ = map;

    /**
      * URL del servicio WFS.
      * @private
      * @type {M.impl.service.WFS}
      */
    this.url_ = url;

    /**
      * Formato.
      * @private
      * @type {M.format.GeoJSON}
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
    * Este método obtiene los objetos geográficos a partir de los parámetros
    * especificados.
    * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
    * @function
    * @param {ol.proj.Projection} projection Proyección.
    * @returns {Promise} Promesa con la obtención de los objetos geográficos.
    * @public
    * @api
    */
  loadInternal_(projection) {
    return new Promise((success) => {
      getRemote(this.url_).then((response) => {
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
    });
  }
}

export default JSONP;
