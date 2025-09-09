/**
 * @module IDEE/impl/loader/WFS
 */
import MObject from 'IDEE/Object';
import { get as getRemote } from 'IDEE/util/Remote';
import { isNullOrEmpty } from 'IDEE/util/Utils';
import Exception from 'IDEE/exception/exception';
import * as Dialog from 'IDEE/dialog';
import { getValue } from 'IDEE/i18n/language';
import GML from '../format/GML';

/**
  * @classdesc
  * Implementación de la clase del "loader" para objetos geográficos WFS.
  *
  * @property {IDEE.Map} map_ Mapa.
  * @property {IDEE.impl.service.WFS} service_ Servicio WFS.
  * @property {IDEE.impl.format.GeoJSON | IDEE.impl.format.GML} format_ Formato.
  *
  * @api
  * @extends {IDEE.Object}
  */
class WFS extends MObject {
  /**
    * Constructor principal de la clase WFS.
    *
    * @constructor
    * @param {IDEE.Map} map Mapa
    * @param {IDEE.impl.service.WFS} service Servicio WFS.
    * @param {IDEE.impl.format.GeoJSON | IDEE.impl.format.GML} format Formato.
    * @api
    */
  constructor(map, service, format) {
    super();

    /**
      * Mapa.
      * @private
      * @type {IDEE.Map}
      */
    this.map_ = map;

    /**
      * Servicio WFS.
      * @private
      * @type {IDEE.impl.service.WFS}
      */
    this.service_ = service;

    /**
      * Formato.
      * @private
      * @type {IDEE.impl.format.GeoJSON | IDEE.impl.format.GML}
      */
    this.format_ = format;
  }

  /**
    * Este método ejecutará la función "callback" a los objetos geográficos.
    *
    * @function
    * @param {function} callback Función "callback" de llamada para ejecutar.
    * @returns {function} Método que ejecutará la función 'callback' a los objetos geográficos.
    * @public
    * @api
    */
  getLoaderFn(callback) {
    return ((extent, resolution, projection) => {
      const requestUrl = this.getRequestUrl_(extent, projection);
      this.loadInternal_(requestUrl, projection).then(callback.bind(this));
    });
  }

  /**
    * Este método obtiene los objetos geográficos a partir de los parámetros
    * especificados.
    * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
    * @function
    * @param {String} url URL para "GetFeature".
    * @param {ol.proj.Projection} projection Proyección.
    * @returns {Promise} Promesa con la obtención de los objetos geográficos.
    * @public
    * @api
    */
  loadInternal_(url, projection) {
    return new Promise((success, fail) => {
      getRemote(url).then((response) => {
        if (!isNullOrEmpty(response.text) && response.text.indexOf('ServiceExceptionReport') < 0) {
          let text = response.text;
          // Arreglo para WFS 2.0.0 #7434
          if (this.format_ instanceof GML && text.includes('<wfs:')) {
            text = text.replaceAll('<wfs:', '<gml:').replaceAll('</wfs:', '</gml:')
              .replaceAll('</gml:member', '</gml:featureMember')
              .replaceAll('<gml:member', '<gml:featureMember');
          }
          const features = this.format_.read(text, projection);
          success(features);
        } else if (response.code === 401) {
          Dialog.error(getValue('dialog').unauthorized_user);
        } else if (!isNullOrEmpty(response.text) && response.text.indexOf('featureId and cql_filter') >= 0) {
          Dialog.error(getValue('dialog').only_one_filter);
        } else {
          Exception(getValue('exception').no_getfeature_response);
        }
      });
    });
  }

  /**
    * Este método obtiene la URL para la solicitud "GetFeature".
    * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
    * @function
    * @param {ol.Extent} extent Extensión.
    * @param {ol.proj.Projection} projection Proyección.
    * @returns {String} URL para "GetFeature".
    * @public
    * @api
    */
  getRequestUrl_(extent, projection) {
    // var mapBbox = this.map_.getBbox();
    // var minExtent = [
    //    Math.min(Math.abs(extent[0]), mapBbox.x.min),
    //    Math.min(Math.abs(extent[1]), mapBbox.y.min),
    //    Math.min(Math.abs(extent[2]), mapBbox.x.max),
    //    Math.min(Math.abs(extent[3]), mapBbox.y.max)
    // ];

    // return this.service_.getFeatureUrl(minExtent, projection);
    return this.service_.getFeatureUrl(null, projection);
  }
}

export default WFS;
