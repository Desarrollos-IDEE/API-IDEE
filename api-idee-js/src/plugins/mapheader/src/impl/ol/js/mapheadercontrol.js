/**
 * @module IDEE/impl/control/MapheaderControl
 */
export default class MapheaderControl extends IDEE.impl.Control {
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
    this.element = html;
    this.map = map;
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
