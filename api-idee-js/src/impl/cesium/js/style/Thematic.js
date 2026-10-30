/**
 * @module IDEE/impl/style/Thematic
 */

/**
 * @classdesc
 * Base de las implementaciones de estilos temáticos en Cesium. No aplica
 * estilos a nivel de capa: la fachada asigna el estilo a cada objeto geográfico.
 * @api
 */
class Thematic {
  /**
   * Constructor principal de la clase.
   * @constructor
   * @param {Object} options Opciones del estilo.
   * @api
   */
  constructor(options = {}) {
    this.options_ = options;
  }

  /**
   * Las opciones del estilo temático no generan estilos propios.
   * @public
   * @function
   * @api
   */
  updateFacadeOptions() {}

  /**
   * En Cesium el estilo temático siempre se asigna por objeto geográfico.
   * @public
   * @function
   * @returns {boolean} Falso.
   * @api
   */
  applyToLayer() {
    return false;
  }
}

export default Thematic;
