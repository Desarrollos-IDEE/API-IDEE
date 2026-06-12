/**
 * @module M/impl/control/MaxExtZoomControl
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
    // const olMap = map.getMapImpl();
    super.addTo(map, html);
  }
}
