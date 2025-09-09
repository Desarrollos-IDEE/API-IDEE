/**
 * @module IDEE/GeoPackageConnector
 */
import sqljs from 'sql.js';
import { GeoPackageConnection, GeoPackage, setSqljsWasmLocateFile } from '@ngageoint/geopackage';
import GeoPackageTile from '../provider/TileProvider';
import GeoPackageVector from '../provider/VectorProvider';
import { getUint8ArrayFromData } from '../util/Utils';

/**
 * @classdesc
 * Esta clase permite leer y procesar un archivo GeoPackage (.gpkg).
 * Obtiene proveedores para caps vectoriales y ráster.
 *
 * @property {Object} tileOpts_ Opciones específicas para capas ráster.
 * @property {Object} vectorOpts_ Opciones específicas para capas vectoriales.
 * @property {Array<GeoPackageVector>} vectorProviders_  Proveedores de capas vectoriales.
 * @property {Array<GeoPackageTile>} tileProviders_ Proveedores de capas ráster.
 * @property {GeoPackage} gpkg_ GeoPackage.
 *
 * @api
 */
class GeoPackageConnector {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {ArrayBuffer} data Uint8Array que representa un archivo
   * de base de datos.
   * @param {Object} options Opciones por tipo de capa.
   * - tile: Opciones especificadas para capas ráster.
   * - vector: Opciones especificadas para capas vectoriales.
   *
   * @api
   */
  constructor(data, { tile, vector } = {}) {
    /**
     * Opciones para capas ráster.
     * @private
     * @type {Object}
     */
    this.tileOpts_ = tile || {};

    /**
     * Opciones para capas vectoriales.
     * @private
     * @type {Object}
     */
    this.vectorOpts_ = vector || {};

    /**
      * Proveedores de capas vectoriales.
      * @private
      * @type {Array<GeoPackageVector>}
      */
    this.vectorProviders_ = [];

    /**
      * Proveedores de capas ráster.
      * @private
      * @type {Array<GeoPackageTile>}
      */
    this.tileProviders_ = [];

    /**
    * GeoPackage
    * @private
    * @type {GeoPackage}
    */
    this.gpkg_ = null;

    setSqljsWasmLocateFile((file) => `${IDEE.config.SQL_WASM_URL}${file}`);

    this.init(data);
  }

  /**
   * Este método carga el archivo GeoPackage, crea la base de datos
   * y genera los proveedores de capas vectoriales y de teselas.
   *
   * @function
   * @public
   * @param {ArrayBuffer} data Uint8Array que representa un archivo
   * de base de datos.
   * @api
   */
  init(data) {
    this.initPromise_ = new Promise((resolve, reject) => {
      sqljs({
        locateFile: (file) => `${IDEE.config.SQL_WASM_URL}${file}`,
      }).then((SQL) => {
        getUint8ArrayFromData(data).then((uint8Array) => {
          const db = new SQL.Database(uint8Array);
          GeoPackageConnection.connectWithDatabase(db).then((conn) => {
            this.gpkg_ = new GeoPackage('', '', conn);
            const { features, tiles } = this.gpkg_.getTables();
            this.tileProviders_ = tiles
              .map((name) => new GeoPackageTile(this.gpkg_, name, this.tileOpts_[name]));
            this.vectorProviders_ = features
              .map((name) => new GeoPackageVector(this.gpkg_, name, this.vectorOpts_[name]));

            resolve({
              tileProviders: this.tileProviders_,
              vectorProviders: this.vectorProviders_,
            });
          });
        });
      }).catch((err) => {
        reject(err);
      });
    });
  }

  /**
   * Este método obtiene los proveedores de capas vectoriales.
   *
   * @function
   * @public
   * @returns {Array<GeoPackageVector>} Proveedores de capas vectoriales.
   * @api
   */
  getVectorProviders() {
    return this.initPromise_.then(({ vectorProviders }) => vectorProviders);
  }

  /**
   * Este método obtiene los proveedores de capas ráster.
   *
   * @function
   * @public
   * @returns {Array<GeoPackageTile>} Proveedores de capas ráster.
   * @api
   */
  getTileProviders() {
    return this.initPromise_.then(({ tileProviders }) => tileProviders);
  }
}

export default GeoPackageConnector;
