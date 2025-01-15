/**
 * @module M/filter/Base
 */
/**
 * @classdesc
 * Clase abstracta.
 * @api
 */
class Base {
  /**
   * Este método obtiene un filtro.
   *
   * @public
   * @protected
   * @function
   */
  getFunctionFilter() {}

  /**
   * Este método ejecuta un filtro.
   *
   * @protected
   * @param {Array<M.Feature>} features Objetos geográficos.
   * @function
   */
  execute(features) {}

  /**
   * Este método devuelve un filtro CQL ya ejecutado.
   *
   * @protected
   * @function
   */
  toCQL() {}
}

export default Base;
