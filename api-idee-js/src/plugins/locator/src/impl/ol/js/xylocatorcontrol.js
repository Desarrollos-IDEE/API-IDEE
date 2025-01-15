/**
 * @module M/impl/control/XYLocatorControl
 */

export default class XYLocatorControl extends M.impl.Control {
  constructor(map) {
    super();

    this.facadeMap_ = map;
  }

  /**
   * This function reprojects map on selected SRS.
   *
   * @function
   * @param {string} origin - EPSG:25830, EPSG:4326, ..., etc
   * @param {array<number>} coordinates
   * @api
   */
  reproject(origin, coordinates) {
    const originProj = ol.proj.get(origin);
    const destProj = ol.proj.get(this.facadeMap_.getProjection().code);
    let coordinatesTransform = ol.proj.transform(coordinates, originProj, destProj);
    coordinatesTransform = [this.normalizeNumber(coordinates[0], coordinatesTransform[0]),
      this.normalizeNumber(coordinates[1], coordinatesTransform[1])];
    return coordinatesTransform;
  }

  /**
   * This functions normalize a number.
   *
   * @param {Number} origin
   * @param {Number} calculated
   * @returns {Number} Number normalized.
   */
  normalizeNumber(origin, calculated) {
    let res = origin;
    if (origin !== 0) {
      res = parseFloat(calculated.toFixed(9));
    }

    return res;
  }
}
