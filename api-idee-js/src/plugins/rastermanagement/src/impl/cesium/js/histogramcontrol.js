/**
 * @module IDEE/impl/control/HistogramControl
 */

/**
 * Implementación Cesium del muestreo y dibujo de histogramas.
 */
export default class HistogramControl {
  /**
   * @public
   * @function
   * @returns {boolean}
   * @api
   */
  isDrawAvailable() {
    return false;
  }

  /**
   * @public
   * @function
   * @api
   */
  startDraw() {
    // No disponible en Cesium.
  }

  /**
   * @public
   * @function
   * @api
   */
  stopDraw() {
    // No disponible en Cesium.
  }

  /**
   * @public
   * @function
   * @returns {null}
   * @api
   */
  getRasterDataAtCoordinate() {
    return null;
  }
}
