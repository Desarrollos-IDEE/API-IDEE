/**
 * @module M/impl/provider/TileLoadFunctionImagineryProvider
 */
import sqljs from 'sql.js';
import {
  ImageryProvider,
  TileMapServiceImageryProvider,
} from 'cesium';
import { isNullOrEmpty, bytesToBase64, getUint8ArrayFromData } from '../../../../facade/js/util/Utils';

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
class MBTileImageryProvider extends TileMapServiceImageryProvider {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {Object} userParam Parámetros para la obtención de las teselas
   * - source: Fuente de la capa.
   * - tileLoadFunction: Función de carga de la tesela proporcionada por el usuario.
   * @param {Object} options Opciones para el constructor
   * de la clase padre TileMapServiceImageryProvider
   *
   * @api
   */
  constructor(userParam, options = {}) {
    // super call
    super(options);
    this.source = userParam.source;
    this.tileLoadFunction_ = userParam.tileLoadFunction;
    this.tiles_ = {};
    this.db = null;
    this.init();
  }

  /**
   * Este método crea la base de datos a partir de un fichero
   * Uint8Array.
   *
   * @function
   * @public
   * @api
   */
  init() {
    this.initPromise_ = new Promise((resolve, reject) => {
      sqljs({
        locateFile: (file) => `${M.config.SQL_WASM_URL}${file}`,
      }).then((SQL) => {
        getUint8ArrayFromData(this.source).then((uint8Array) => {
          this.db = new SQL.Database(uint8Array);
          resolve(this.db);
        });
      }).catch((err) => {
        reject(err);
      });
    });
  }

  /**
   * Este método crea una promesa para la petición de las teselas.
   * @param {number} x Coordenada X de la tesela.
   * @param {number} y Coordenada Y de la tesela.
   * @param {number} level Coordenada Z de la tesela.
   * @param {Request} [request] Objete Request. Para uso interno de Cesium
   * @returns {Promise<ImageryTypes>|undefined} Una promesa para la imagen que
   * se resolverá cuando la imagen esté disponible, o undefined si hay demasiadas
   * peticiones activas al servidor, y la petición se debería reintentar más tarde
   */
  requestImage(x, y, level, request) {
    let url = '';
    if (this.tileLoadFunction_) {
      url = this.tileLoadFunction_(level, x, y);
    } else {
      const allTags = this._tags;
      const reverseY = allTags.reverseY(this, x, y, level);
      url = this.getTile([level, x, reverseY]);
      // console.log(`x: ${x}, y: ${y}, z: ${level}, reverseY: ${reverseY}`);
    }
    return ImageryProvider.loadImage(this, url);
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
   * @returns {String} Imagen de la tesela en base64.
   * @api
   */
  getTile(tileCoord) {
    const this2 = this;
    const SELECT_SQL = 'select tile_data from tiles where zoom_level={z} and tile_column={x} and tile_row={y}';
    const PREPARED = SELECT_SQL.replace('{z}', tileCoord[0]).replace('{x}', tileCoord[1]).replace('{y}', tileCoord[2]);
    const byteTile = this.tiles_[tileCoord] || null;
    let tile = DEFAULT_WHITE_TILE;
    if (this2.db && isNullOrEmpty(byteTile)) {
      const select = this2.db.exec(PREPARED)[0];
      if (!isNullOrEmpty(select)) {
        const selectTile = select.values[0][0];
        tile = bytesToBase64(selectTile);
        this2.setTile(tileCoord, tile);
      }
    } else {
      tile = byteTile;
    }
    return tile;
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

export default MBTileImageryProvider;
