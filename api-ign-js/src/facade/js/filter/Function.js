/**
 * @module M/filter/Function
 */
import BaseFilter from './Base';
import { isNullOrEmpty } from '../util/Utils';

/**
  * @classdesc
  * Esta clase crea los métodos para los filtros.
  * @extends {M.Base}
  * @api
  */
class Function extends BaseFilter {
  /**
    * Constructor principal de la clase.
    * @constructor
    * @param {function} filterFunction Función a ejecutar.
    * @param {Object} options Opciones:
    * - cqlFilter
    * @api
    */
  constructor(filterFunction, options = {}) {
    super();
    /**
      * Función a ejecutar.
      * @private
      * @type {function}
      */
    this.filterFunction_ = filterFunction;

    /**
      * Filtro CQL.
      * @private
      * @type {String}
      */
    this.cqlFilter_ = '';
    if (!isNullOrEmpty(options.cqlFilter)) {
      this.cqlFilter_ = options.cqlFilter;
    }
  }

  /**
    * Este método establece un filtro.
    *
    * @public
    * @function
    * @param {Function} filterFunction Filtro.
    * @api
    */
  setFunction(filterFunction) {
    this.filterFunction_ = filterFunction;
  }

  /**
    * Este método obtiene un filtro ya creado.
    *
    * @public
    * @function
    * @return {M.filter.Function} Filtro.
    * @api
    */
  getFunctionFilter() {
    return this.filterFunction_;
  }

  /**
    * Este método ejecuta un filtro sobre los objetos geográficos.
    *
    * @public
    * @function
    * @param {Array<M.Feature>} features Objetos geográficos.
    * @return {Array<M.Feature>} Objetos geográficos filtrados.
    * @api
    */
  execute(features) {
    return features.filter(this.filterFunction_);
  }

  /**
    * Este método devuelve la sentencia CQL.
    *
    * @public
    * @function
    * @api
    * @return {string} Sentencia CQL.
    */
  toCQL() {
    return this.cqlFilter_;
  }
}

export default Function;
