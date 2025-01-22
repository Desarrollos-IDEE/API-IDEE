/**
 * @module IDEE/impl/control/ComparepanelControl
 */

export default class ComparepanelControl extends IDEE.impl.Control {
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
    this.map = map;
    this.olMap = map.getMapImpl();
    super.addTo(map, html);
  }
}
