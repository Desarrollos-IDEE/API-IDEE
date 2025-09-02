/**
 * @module IDEE/AbstractProvider
 */

/**
 * @classdesc
 * Clase base abstracta que define la interfaz común para los proveedores de capas geoespaciales.
 *
 * @property {GeoPackage} connector_ Conector GeoPackage.
 * @property {String} tableName_ Nombre de la tabla de capas.
 * @property {Object} options_ Opciones definidas por el usuario.
 *
 * @api
 */
class GeoPackageAbstractProvider {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {IDEE.GeoPackageConnector} connector Conector GeoPackage.
   * @param {String} tableName Nombre de la tabla de capas.
   * @param {Object} options Opciones definidas por el usuario.
   */
  constructor(connector, tableName, options = {}) {
    /**
     * Conector GeoPackage
     * @private
     * @type {IDEE.GeoPackageConnector}
     */
    this.connector_ = connector;

    /**
     * Nombre de la tabla de capas.
     * @private
     * @type {String}
     */
    this.tableName_ = tableName;

    /**
     * Opciones
     * @private
     * @type {Object}
     */
    this.options_ = options;
  }

  /**
   * Este método obtiene el nombre de la tabla de capas.
   *
   * @function
   * @public
   * @return {String} Nombre de la tabla de capas.
   * @api
   */
  getTableName() {
    return this.tableName_;
  }

  /**
   * Este método obtiene las opciones definidas por el usuario.
   *
   * @function
   * @public
   * @return {Object} Opciones definidas por el usuario.
   * @api
   */
  getOptions() {
    return this.options_;
  }
}

export default GeoPackageAbstractProvider;
