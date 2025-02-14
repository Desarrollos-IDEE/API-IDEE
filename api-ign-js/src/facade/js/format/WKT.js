/**
 * @module M/format/WKT
 */
import WKTImpl from 'impl/format/WKT';
import Base from '../Base';
import { isUndefined } from '../util/Utils';
import Exception from '../exception/exception';
import { getValue } from '../i18n/language';

/**
 * @classdesc
 * Crea objetos geográficos a partir de geometrías en formato WKT (Well Known Text).
 * @api
 */
class WKT extends Base {
  /**
   * Constructor principal de la clase. Crea una capa
   * con parámetros especificados por el usuario.
   * @constructor
   * @extends {M.facade.Base}
   * @param {string|Object} options Parámetros opcionales.
   * - type: Tipo.
   * - value: Valor, opcional.
   * - position: Posición.
   * @api
   */
  constructor(options = {}) {
    const impl = new WKTImpl(options);
    super(impl);
    if (isUndefined(WKTImpl)) {
      Exception(getValue('exception').wkt_method);
    }
  }

  /**
   * Crea objetos geográfico de WKT.
   * @public
   * @function
   * @param {ol.layer.WKT} wkt WKT de Openlayer.
   * @param {Object} options Por defecto objeto vacío.
   * @return {Array<Object>} Matriz con objetos WKT.
   * @api
   */
  read(wkt, options = {}) {
    const mFeature = this.getImpl().read(wkt, options);
    return mFeature;
  }

  /**
   * Crea la colección de objetos geográficos de WKT.
   * @public
   * @param {ol.layer.WKT} wktCollection Colección de objetos geográficos de WKT de Openlayer.
   * @param {Object} options Por defecto objeto vacío.
   * @return {Array<Object>} Matriz con objetos WKT.
   * @function
   * @api
   */
  readCollection(wktCollection, options = {}) {
    const mFeature = this.getImpl().readCollection(wktCollection, options);
    return mFeature;
  }

  /**
   * Crea objetos geográficos WKT.
   * @public
   * @param {Feature} feature Objetos geográficos WKT.
   * @param {Object} options Por defecto objeto vacío.
   * @return {Array<Object>} Matriz con objetos WKT.
   * @function
   * @api
   */
  write(feature, options = {}) {
    const wkt = this.getImpl().write(feature, options);
    return wkt;
  }

  /**
   * Crea un objeto geográfico WKT.
   *
   * @public
   * @function
   * @param {ol.geometry} geometry Geometría WKT.
   * @return {Object} Retorna un objeto geográfico WKT.
   * @api
   */
  writeFeature(geometry) {
    const wkt = this.getImpl().writeFeature(geometry);
    return wkt;
  }

  /**
   * Crea una colección de objetos geográficos.
   * @public
   * @function
   * @param {Feature} feature Objeto geográfico WKT.
   * @param {Object} options Valor por defecto objeto vacío.
   * @return {Array<Object>} Matriz con objetos WKT.
   * @api
   */
  writeCollection(features, options = {}) {
    const wkt = this.getImpl().writeCollection(features, options);
    return wkt;
  }
}

export default WKT;
