/**
 * @module IDEE/impl/provider/GeoPackageTileImageryProvider
 */
import {
  ImageryProvider,
  UrlTemplateImageryProvider,
  WebMercatorTilingScheme,
} from 'cesium';
import { DEFAULT_WHITE_TILE } from 'IDEE/provider/Tile';

/**
 * @classdesc
 * Proveedor de imágenes de Cesium que obtiene cada tesela de una función
 * (x, y, z) en el esquema XYZ de Web Mercator, como hace la implementación de
 * OpenLayers con las teselas de GeoPackage.
 *
 * @api
 * @extends {Cesium.UrlTemplateImageryProvider}
 */
class GeoPackageTileImageryProvider extends UrlTemplateImageryProvider {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {Object} options Opciones.
   * - getTile: Función (x, y, z) que devuelve una promesa con la imagen (URL o null).
   * - minimumLevel, maximumLevel, rectangle: Opciones del proveedor de Cesium.
   * @api
   */
  constructor({ getTile, ...options }) {
    super({
      url: 'geopackage://{z}/{x}/{y}',
      tilingScheme: new WebMercatorTilingScheme(),
      ...options,
    });

    /**
     * Función que obtiene la imagen de una tesela.
     * @private
     * @type {Function}
     */
    this.getTile_ = getTile;
  }

  /**
   * Solicita la imagen de una tesela.
   *
   * @public
   * @function
   * @param {Number} x Columna.
   * @param {Number} y Fila (desde arriba, como XYZ).
   * @param {Number} level Nivel de zoom.
   * @returns {Promise<HTMLImageElement>} Imagen de la tesela.
   * @api
   */
  requestImage(x, y, level) {
    return Promise.resolve(this.getTile_(x, y, level))
      .then((src) => ImageryProvider.loadImage(this, src || DEFAULT_WHITE_TILE));
  }
}

export default GeoPackageTileImageryProvider;
