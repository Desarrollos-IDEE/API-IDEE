/**
 * @module IDEE/impl/control/MaxExtZoomControl
 */
export default class MaxExtZoomControl extends IDEE.impl.Control {
  /**
   * This function adds the control to the specified map
   *
   * @public
   * @function
   * @param {IDEE.Map} map to add the plugin
   * @param {HTMLElement} html of the plugin
   * @api stable
   */
  addTo(map, html) {
    this.facadeMap_ = map;
    this.map = map;
    this.element = html;
    super.addTo(map, html);
  }

  /**
   * This function destroys this control
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {
    this.facadeMap_ = null;
    this.map = null;
    this.element = null;
  }
}
