/**
 * Coordinación de las recargas de las tablas de un paquete remoto.
 *
 * @module IDEE/datasource/geopackage/RefreshCoordinator
 */

/**
 * Comparte una única lectura del paquete entre las tablas que se recargan a la vez,
 * recuerda qué lector usa cada tabla y libera los lectores que ya no usa ninguna.
 */
class GeoPackageRefreshCoordinator {
  /**
   * @param {Object} dependencies Dependencias.
   * @param {function(): PackageReader} dependencies.createReader Crea un lector nuevo
   * del paquete remoto.
   */
  constructor({ createReader }) {
    this.createReader_ = createReader;
    this.tableReaders_ = new Map();
    this.batch_ = null;
    this.latest_ = null;
    this.readers_ = null;
    this.initialReader_ = null;
  }

  /**
   * Registra el lector inicial de las tablas.
   * @param {Array<String>} tableNames Tablas con capa.
   * @param {PackageReader} reader Lector inicial.
   */
  register(tableNames, reader) {
    this.initialReader_ = reader;
    tableNames.forEach((tableName) => this.tableReaders_.set(tableName, reader));
  }

  /**
   * Devuelve el lector que usa la primera tabla, o el inicial si no hay tablas.
   * @returns {PackageReader} Lector vigente.
   */
  getCurrentReader() {
    return this.tableReaders_.values().next().value || this.initialReader_;
  }

  /**
   * Recarga una tabla con la lectura en curso o con una nueva.
   * @param {String} tableName Tabla.
   * @param {function(): Boolean} isCurrent Indica si la recarga sigue vigente.
   * @param {function(Object): Promise<Boolean>} update Aplica los datos
   * ({ vectors, tiles, metadata }) y devuelve si se aplicaron.
   * @returns {Promise<void>} Finalización de la recarga.
   */
  async refresh(tableName, isCurrent, update) {
    let batch = this.batch_;
    if (!batch && this.latest_ && this.tableReaders_.get(tableName) !== this.latest_.reader) {
      batch = this.latest_;
      this.batch_ = batch;
    }
    if (!batch) {
      const reader = this.createReader_();
      batch = {
        reader,
        users: 0,
        promise: Promise.all([
          reader.getVectorProviders(), reader.getTileProviders(), reader.getMetadata(),
        ]),
      };
      this.batch_ = batch;
    }
    batch.users += 1;
    try {
      const [vectors, tiles, metadata] = await batch.promise;
      if (!isCurrent() || !await update({ vectors, tiles, metadata })) return;
      this.latest_ = batch;
      this.tableReaders_.set(tableName, batch.reader);
    } finally {
      batch.users -= 1;
      if (batch.users === 0) {
        this.release_(batch);
      }
    }
  }

  /**
   * Libera los lectores que ya no usa ninguna tabla.
   * @private
   * @param {Object} batch Lectura terminada.
   */
  release_(batch) {
    this.batch_ = null;
    const used = new Set(this.tableReaders_.values());
    const previous = this.readers_ || new Set([this.initialReader_]);
    previous.add(batch.reader);
    previous.forEach((reader) => {
      if (reader && !used.has(reader)) reader.dispose();
    });
    this.readers_ = used;
  }
}

export default GeoPackageRefreshCoordinator;
