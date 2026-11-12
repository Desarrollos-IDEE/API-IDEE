/**
 * Apertura de un GeoPackage completo en memoria con sql.js y @ngageoint/geopackage.
 *
 * @module IDEE/datasource/geopackage/Database
 */
import sqljs from 'sql.js';
import {
  GeoPackageConnection, GeoPackage, setSqljsWasmLocateFile,
} from '@ngageoint/geopackage';
import { PackageDatabase } from '../contracts';

/**
 * Base de datos SQLite de un GeoPackage descargado por completo.
 */
class GeoPackageDatabase extends PackageDatabase {
  /**
   * @param {Object} [dependencies] Dependencias.
   * @param {function(): String} [dependencies.getWasmURL] Carpeta de sql-wasm.wasm.
   */
  constructor({ getWasmURL = () => IDEE.config.SQL_WASM_URL } = {}) {
    super();
    this.locateFile_ = (file) => `${getWasmURL()}${file}`;
    setSqljsWasmLocateFile(this.locateFile_);
  }

  /**
   * Abre el paquete. Si la conexión falla, la base de datos se cierra.
   * @param {Uint8Array} bytes Contenido completo del paquete.
   * @returns {Promise<GeoPackage>} Paquete abierto.
   */
  async open(bytes) {
    const SQL = await sqljs({ locateFile: this.locateFile_ });
    const db = new SQL.Database(bytes);
    try {
      const connection = await GeoPackageConnection.connectWithDatabase(db);
      return new GeoPackage('', '', connection);
    } catch (error) {
      db.close();
      throw error;
    }
  }

  /**
   * Cierra el paquete abierto.
   * @param {GeoPackage} pack Paquete abierto.
   */
  close(pack) {
    pack?.close();
  }
}

export default GeoPackageDatabase;
