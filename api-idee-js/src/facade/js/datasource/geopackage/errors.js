/**
 * Errores de la lectura de GeoPackage.
 *
 * @module IDEE/datasource/geopackage/errors
 */

/**
 * El paquete no se puede leer por rangos y debe descargarse completo.
 */
export class RangeUnsupportedError extends Error {
  /**
   * @param {String} reason Motivo.
   */
  constructor(reason) {
    super(`GeoPackage por rangos: ${reason}`);
    this.name = 'RangeUnsupportedError';
  }
}

export default RangeUnsupportedError;
