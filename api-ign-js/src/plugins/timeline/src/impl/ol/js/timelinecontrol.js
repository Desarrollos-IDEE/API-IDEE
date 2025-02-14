/**
 * @module M/impl/control/TimelineControl
 */

export default class TimelineControl extends M.impl.Control {
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
    this.map = map;
    this.olMap = map.getMapImpl();

    super.addTo(map, html);
  }
}
