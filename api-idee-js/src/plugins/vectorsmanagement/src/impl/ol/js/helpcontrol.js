/**
 * @module M/impl/control/Helpcontrol
 */

export default class Helpcontrol extends M.impl.Control {
  /**
   * This function adds the control to the specified map
   *
   * @public
   * @function
   * @param {M.Map} map to add the plugin
   * @param {HTMLElement} html of the plugin
   * @api stable
   */
  addTo(map, html) {
    // super addTo - don't delete
    this.map = map;
    this.olMap = map.getMapImpl();
    // super.addTo(map, html);
  }
}
