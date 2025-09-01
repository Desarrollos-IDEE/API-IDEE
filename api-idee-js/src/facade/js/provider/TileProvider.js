/**
 * @module IDEE/TileProvider
 */
import { GeoPackageTileRetriever } from '@ngageoint/geopackage';
import AbstractProvider from './AbstractProvider';

/**
 * @classdesc
 * Proveedor de teselas para una capa ráster en un archivo GeoPackage.
 *
 * @property {Number} tileWidth_ Ancho de las teselas.
 * @property {Number} tileHeight_ Alto de las teselas.
 *
 * @api
 * @extends {IDEE.AbstractProvider}
 */
class GeoPackageTile extends AbstractProvider {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {GeoPackage} connector Instancia de GeoPackage que contiene la capa.
   * @param {String} tableName Nombre de la tabla de teselas dentro del archivo GeoPackage.
   * @param {Object} options Opciones del proveedor.
   *
   * @api
   */
  constructor(connector, tableName, options) {
    super(connector, tableName, options);

    /**
     * Ancho de la tesela
     * @private
     * @type {Number}
     */
    this.tileWidth_ = typeof this.options_.width === 'number' ? this.options_.width : 256;

    /**
      * Alto de la tesela
      * @private
      * @type {Number}
      */
    this.tileHeight_ = typeof this.options_.height === 'number' ? this.options_.height : 256;
  }

  /**
   * Este método obtiene la tesela correspondiente a las coordenadas XYZ especificadas.
   *
   * @function
   * @public
   * @param {Number} x Coordenada X de la tesela.
   * @param {Number} y Coordenada Y de la tesela.
   * @param {Number} z Nivel de zoom.
   * @returns {Promise<Blob|Null>} Imagen de la tesela.
   * @api
   */
  getTile(x, y, z) {
    const dao = this.connector_.getTileDao(this.tableName_);
    const tileRetriever = new GeoPackageTileRetriever(dao, this.tileWidth_, this.tileHeight_);
    return tileRetriever.getTile(x, y, z);
  }

  /**
   * Este método obtiene la extensión de la capa de teselas.
   *
   * @function
   * @public
   * @returns {Array<Number>} Extensión de la capa.
   * @api
   */
  getExtent() {
    const dao = this.connector_.getTileDao(this.tableName_);
    return [
      dao.tileMatrixSet.min_x,
      dao.tileMatrixSet.min_y,
      dao.tileMatrixSet.max_x,
      dao.tileMatrixSet.max_y,
    ];
  }

  /**
   * Este método obtiene el nivel de zoom mínimo de la capa.
   *
   * @function
   * @public
   * @returns {Number} Nivel de zoom mínimo de la capa.
   * @api
   */
  getMinZoom() {
    const dao = this.connector_.getTileDao(this.tableName_);
    return dao.minWebMapZoom;
  }

  /**
   * Este método obtiene el nivel de zoom máximo de la capa.
   *
   * @function
   * @public
   * @returns {Number} Nivel de zoom máximo de la capa.
   * @api
   */
  getMaxZoom() {
    const dao = this.connector_.getTileDao(this.tableName_);
    return dao.maxWebMapZoom;
  }
}

export default GeoPackageTile;
