/**
 * @module IDEE/impl/control/StylesControl
 */

/**
 * Implementación Cesium del control de estilos (sin muestreo de viewport).
 */
export default class StylesControl extends IDEE.impl.Control {
  /**
   * @param {IDEE.Map} map Mapa asociado
   */
  constructor(map) {
    super();
    /**
     * @private
     * @type {IDEE.Map}
     */
    this.facadeMap_ = map;
  }

  /**
   * @public
   * @function
   * @param {IDEE.Map} map Mapa
   * @param {HTMLElement} element Elemento del control
   */
  addTo(map, element) {
    this.facadeMap_ = map;
    this.element = element;
  }

  /**
   * @public
   * @function
   */
  destroy() {
    this.facadeMap_ = null;
  }

  /**
   * @public
   * @function
   * @returns {null}
   * @api
   */
  getViewportSize() {
    return null;
  }

  /**
   * @public
   * @function
   * @returns {boolean}
   * @api
   */
  hasLayerDataAtCenter() {
    return false;
  }

  /**
   * @public
   * @function
   * @returns {Promise<void>}
   * @api
   */
  waitForViewportRasterReady() {
    return Promise.resolve();
  }
}
