/**
 * @module IDEE/impl/control/StylesControl
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
}
