/**
 * @module M/facade/Base
 */
import { isNullOrEmpty, isFunction } from './util/Utils';
import MObject from './Object';

/**
 * @classdesc
 * Esta clase es la base de las clases de la fachada,
 * proporciona los métodos necesarios para acceder a
 * la implementación.
 *
 * @api
 * @extends {M.facade.Object}
 */
class Base extends MObject {
  /**
   * Constructor principial de la clase.
   *
   * @constructor
   * @param {Object} impl Implementación.
   * @extends {M.Object}
   * @api
   */
  constructor(impl) {
    // calls the super constructor.
    super();

    /**
     * Implementación.
     */
    this.impl_ = impl;

    if (!isNullOrEmpty(this.impl_) && isFunction(this.impl_.setFacadeObj)) {
      this.impl_.setFacadeObj(this);
    }
  }

  /**
   * Este método proporciona la implementación
   * del objeto.
   *
   * @public
   * @function
   * @returns {Object} Implementación.
   * @api
   */
  getImpl() {
    return this.impl_;
  }

  /**
   * Este método establece la implementación de este control.
   *
   * @public
   * @function
   * @param {M.Map} impl Implementación.
   * @api
   */
  setImpl(value) {
    this.impl_ = value;
  }

  /**
   * Este método destruye su implementación.
   *
   * @public
   * @function
   * @api
   */
  destroy() {
    if (!isNullOrEmpty(this.impl_) && isFunction(this.impl_.destroy)) {
      this.impl_.destroy();
    }
  }
}

export default Base;
