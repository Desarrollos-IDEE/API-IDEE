/**
 * @module IDEE/impl/control/GeoprocessControl
 */
export default class GeoprocessControl extends IDEE.impl.Control {
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
    map.getMapImpl().addControl(this);
  }

  /**
   * @public
   * @function
   */
  destroy() {
    if (this.facadeMap_) {
      this.facadeMap_.getMapImpl().removeControl(this);
      this.facadeMap_ = null;
    }
  }
}
