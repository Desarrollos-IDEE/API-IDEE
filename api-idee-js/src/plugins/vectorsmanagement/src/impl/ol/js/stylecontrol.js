/**
 * @module IDEE/impl/control/Stylecontrol
 */

export default class Stylecontrol extends IDEE.impl.Control {
  /**
  * @classdesc
  * Main constructor of the measure conrol.
  *
  * @constructor
  * @extends {ol.control.Control}
  * @api stable
  */
  constructor(map) {
    super();
    /**
      * Facade of the map
      * @private
      * @type {IDEE.Map}
      */
    this.facadeMap_ = map;
  }

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
    super.addTo(map, html);

    /**
     * Facade map
     * @private
     * @type {IDEE.map}
     */
    this.facadeMap_ = map;
  }
}
