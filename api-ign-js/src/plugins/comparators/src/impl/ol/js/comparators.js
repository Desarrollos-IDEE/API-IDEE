/**
 * @module M/impl/control/ComparatorsControl
 */
export default class ComparatorsControl extends M.impl.Control {
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
    super.addTo(map, html);

    this.facadeMap_ = map;
  }

  /**
   * This functions transform coordinates of center to the
   * predefined zoom
   *
   * @public
   * @function
   * @param {Array} coordinates Coordinates
   * @param {String} srs SRS
   * @returns Coordinates transformed
   * @api
   */
  transformCenter(coordinates, srs) {
    const mapsrs = this.facadeMap_.getProjection().code;
    return ol.proj.transform(coordinates, srs, mapsrs);
  }
}
