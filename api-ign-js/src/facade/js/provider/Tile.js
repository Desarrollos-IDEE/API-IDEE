/**
 * @module M/Tile
 */
import sqljs from 'sql.js';
import { inflate } from 'pako';
import { isNullOrEmpty, bytesToBase64, getUint8ArrayFromData } from '../util/Utils';

export const DEFAULT_WHITE_TILE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAQAAAD2e2DtAAABu0lEQVR42u3SQREAAAzCsOHf9F6oIJXQS07TxQIABIAAEAACQAAIAAEgAASAABAAAkAACAABIAAEgAAQAAJAAAgAASAABIAAEAACQAAIAAEgAASAABAAAkAACAABIAAEgAAQAAJAAAgAASAABIAAEAACQAAIAAEgAASAABAAAkAACAABIAAEgAAQAAJAAAgAASAABIAAEAACQAAIAAEgAASAABAAAgAACwAQAAJAAAgAASAABIAAEAACQAAIAAEgAASAABAAAkAACAABIAAEgAAQAAJAAAgAASAABIAAEAACQAAIAAEgAASAABAAAkAACAABIAAEgAAQAAJAAAgAASAABIAAEAACQAAIAAEgAASAABAAAkAACAABIAAEgAAQAAJAAAgAASAABIAAEAACQAAIAAAsAEAACAABIAAEgAAQAAJAAAgAASAABIAAEAACQAAIAAEgAASAABAAAkAACAABIAAEgAAQAAJAAAgAASAABIAAEAACQAAIAAEgAASAABAAAkAACAABIAAEgAAQAAJAAAgAASAABIAAEAACQAAIAAEgAASAABAAAkAACAABIAAEgAAQAAJAAKg9kK0BATSHu+YAAAAASUVORK5CYII=';

/**
 * @classdesc
 * Esta clase genera una Tesela. Es un paquete de datos geográficos,
 * empaquetados en mosaicos.
 *
 * @property {Object} tiles_ Tesela.
 * @property {Object} db_ Base de datos.
 *
 * @api
 */
class Tile {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {ArrayBuffer} data Uint8Array que representa un archivo
   * de base de datos.
   *
   * @api
   */
  constructor(data) {
    /**
     * Tesela
     */
    this.tiles_ = {};
    /**
     * Base de datos
     */
    this.db_ = null;
    this.init(data);
  }

  /**
   * Este método crea la base de datos a partir de un fichero
   * Uint8Array.
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
        locateFile: (file) => `${M.config.SQL_WASM_URL}${file}`,
      }).then((SQL) => {
        getUint8ArrayFromData(data).then((uint8Array) => {
          this.db_ = new SQL.Database(uint8Array);
          resolve(this.db_);
        });
      }).catch((err) => {
        reject(err);
      });
    });
  }

  /**
   * Este método ejecuta una consulta SQL.
   *
   * @function
   * @public
   * @param {String} query Consulta SQL.
   * @returns {Object} Resultado de ejecutar la
   * consulta SQL.
   * @api
   */
  executeQuery(query) {
    return this.initPromise_.then((db) => {
      return db.exec(query)[0];
    });
  }

  /**
   * Este método obtiene la tesela correspondiente a las
   * coordenadas proporcionadas.
   *
   * @function
   * @public
   * @param {Array} tileCoord Coordenadas de la tesela.
   * @returns {Object} Tesela.
   * @api
   */
  getTile(tileCoord) {
    const SELECT_SQL = 'select tile_data from tiles where zoom_level={z} and tile_column={x} and tile_row={y}';
    const PREPARED = SELECT_SQL.replace('{z}', tileCoord[0]).replace('{x}', tileCoord[1]).replace('{y}', tileCoord[2]);
    const byteTile = this.tiles_[tileCoord] || null;
    let tile = DEFAULT_WHITE_TILE;
    if (this.db_ && isNullOrEmpty(byteTile)) {
      const select = this.db_.exec(PREPARED)[0];
      if (!isNullOrEmpty(select)) {
        const selectTile = select.values[0][0];
        tile = bytesToBase64(selectTile);
        this.setTile(tileCoord, tile);
      }
    } else {
      tile = byteTile;
    }
    return tile;
  }

  /**
   * Este método obtiene la tesela vectorial correspondiente
   * a las coordenadas proporcionadas.
   *
   * @function
   * @public
   * @param {Array} tileCoord Coordenadas de la tesela vectorial.
   * @returns {Object} Tesela vectorial.
   * @api
   */
  getVectorTile(tileCoord) {
    const SELECT_SQL = 'select tile_data from tiles where zoom_level={z} and tile_column={x} and tile_row={y}';
    const PREPARED = SELECT_SQL.replace('{z}', tileCoord[0]).replace('{x}', tileCoord[1]).replace('{y}', tileCoord[2]);
    let vectorTile;
    let cacheVectorTile = this.tiles_[tileCoord] || null;
    if (!cacheVectorTile) {
      cacheVectorTile = this.executeQuery(PREPARED).then((result) => {
        if (!isNullOrEmpty(result)) {
          vectorTile = result.values[0][0];
          vectorTile = inflate(vectorTile);
        }
        this.setTile(tileCoord, vectorTile);
        return vectorTile;
      });
    } else {
      cacheVectorTile = new Promise((resolve) => { resolve(cacheVectorTile); });
    }
    return cacheVectorTile;
  }

  /**
   * Este método sobreescribe la tesela.
   *
   * @function
   * @public
   * @param {Array} tileCoord Coordenadas de la tesela.
   * @param {Object} tile Tesela.
   * @api
   */
  setTile(tileCoord, tile) {
    this.tiles_[tileCoord] = tile;
  }

  /**
   * Este método obtiene la extensión de la tesela.
   *
   * @function
   * @public
   * @returns {Mx.Extent} Extensión de la tesela.
   * @api
   */
  getExtent() {
    let extent = null;
    const SELECT_SQL = 'select value from metadata where name="bounds"';
    return this.executeQuery(SELECT_SQL).then((result) => {
      if (result) {
        const value = result.values[0][0];
        extent = value.split(',').map(Number.parseFloat);
      }
      return extent;
    });
  }

  /**
   * Este método obtiene el formato de la tesela.
   *
   * @function
   * @public
   * @returns {string} Formato de la tesela. Por defecto
   * devuelve "png".
   * @api
   */
  getFormat() {
    let format = 'png';
    const SELECT_SQL = 'select value from metadata where name="format"';
    return this.executeQuery(SELECT_SQL).then((result) => {
      if (result) {
        format = result.values[0][0];
      }
      return format;
    });
  }

  /**
   * Este método obtiene el zoom máximo aplicable a la tesela.
   *
   * @function
   * @public
   * @returns {number} Zoom máximo aplicable a la tesela.
   * @api
   */
  getMaxZoomLevel() {
    let zoomLevel = 16;
    const SELECT_SQL = 'select * from (select zoom_level from tiles group by zoom_level order by zoom_level DESC LIMIT 1)';
    return this.executeQuery(SELECT_SQL).then((result) => {
      if (result) {
        zoomLevel = result.values[0][0];
      }
      return zoomLevel;
    });
  }
}

export default Tile;
