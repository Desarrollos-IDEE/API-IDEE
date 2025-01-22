/**
 * @module IDEE/impl/control/LocatorscnControl
 */
export default class LocatorscnControl extends IDEE.impl.Control {
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
    // super addTo - don't delete
    super.addTo(map, html);

    this.facadeMap_ = map;
  }
}
