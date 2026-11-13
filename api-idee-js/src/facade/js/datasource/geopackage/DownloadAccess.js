/**
 * Acceso a un GeoPackage descargando el fichero completo.
 *
 * @module IDEE/datasource/geopackage/DownloadAccess
 */
import { PackageAccess } from '../contracts';
import GeoPackageConnector from '../../connector/GeoPackageConnector';

/**
 * Crea lectores que descargan o leen el fichero completo y lo abren en memoria.
 */
class DownloadAccess extends PackageAccess {
  /**
   * @param {Object} [dependencies] Dependencias.
   * @param {Function} [dependencies.Reader] Clase del lector (GeoPackageConnector).
   */
  constructor({ Reader = GeoPackageConnector } = {}) {
    super();
    this.Reader_ = Reader;
  }

  createReader(source, options) {
    return new this.Reader_(source, options);
  }
}

export default DownloadAccess;
