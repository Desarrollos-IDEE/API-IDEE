/**
 * @module IDEE/impl/layer/GeoPackageTile
 */
import { isNullOrEmpty } from 'IDEE/util/Utils';
import { DEFAULT_WHITE_TILE } from 'IDEE/provider/Tile';
import { ImageryLayer, Rectangle } from 'cesium';
import GeoPackageTileImageryProvider from '../provider/GeoPackageTileImageryProvider';
import ImplUtils from '../util/Utils';
import Layer from './Layer';

/**
 * @classdesc
 * Implementación para Cesium de la capa de teselas de un GeoPackage. Las teselas
 * se piden al proveedor del GeoPackage en el esquema XYZ de Web Mercator, como
 * en la implementación de OpenLayers.
 *
 * @api
 * @extends {IDEE.impl.layer.Layer}
 */
class GeoPackageTile extends Layer {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {Object} userParameters Parámetros de la capa.
   * @param {IDEE.provider.GeoPackageTile} provider Proveedor de teselas del GeoPackage.
   * @api
   */
  constructor(userParameters, provider) {
    super(userParameters, {});

    /**
     * Función de carga de teselas del usuario (x, y, z).
     * @private
     * @type {Function|null}
     */
    this.tileLoadFunction = userParameters.tileLoadFunction || null;

    this.opacity_ = typeof userParameters.opacity === 'number' ? userParameters.opacity : 1;

    this.zIndex_ = typeof userParameters.zIndex === 'number' ? userParameters.zIndex : null;

    this.visibility = userParameters.visibility !== false;

    /**
     * Extensión del usuario, en la proyección del proveedor.
     * @private
     * @type {Array<Number>|null}
     */
    this.extent_ = userParameters.extent || null;

    this.minZoom_ = userParameters.minZoom || null;

    this.maxZoom_ = userParameters.maxZoom || null;

    /**
     * Proveedor de teselas del GeoPackage.
     * @public
     * @type {IDEE.provider.GeoPackageTile}
     */
    this.provider = provider;

    this.refreshLoader_ = userParameters.refreshLoader;
  }

  /**
   * Añade la capa al visor.
   *
   * @public
   * @function
   * @param {IDEE.Map} map Mapa.
   * @api
   */
  addTo(map) {
    this.map = map;
    const extent = this.getExtentInDegrees_();
    this.cesiumLayer = new ImageryLayer(this.createProvider_(extent), {
      show: this.visibility,
      alpha: this.opacity_,
    });
    const zIndex = this.facadeLayer_?.isBase ? 0 : null;
    this.map.getMapImpl().imageryLayers.add(this.cesiumLayer, zIndex);
    this.fireAddedToMap_();
  }

  /**
   * Crea el proveedor de imágenes de Cesium.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   *
   * @param {Array<Number>|null} extent Extensión en grados.
   * @returns {GeoPackageTileImageryProvider} Proveedor.
   */
  createProvider_(extent) {
    const getTile = this.tileLoadFunction
      ? (x, y, z) => this.tileLoadFunction(x, y, z)
      : (x, y, z) => this.provider.getTile(x, y, z);
    const minimumLevel = this.minZoom_ || this.provider?.getMinZoom?.() || 0;
    const maximumLevel = this.maxZoom_ || this.provider?.getMaxZoom?.();
    return new GeoPackageTileImageryProvider({
      getTile: (x, y, z) => Promise.resolve(getTile(x, y, z)).catch(() => DEFAULT_WHITE_TILE),
      minimumLevel,
      ...(isNullOrEmpty(maximumLevel) ? {} : { maximumLevel }),
      ...(isNullOrEmpty(extent) ? {} : { rectangle: Rectangle.fromDegrees(...extent) }),
    });
  }

  /**
   * Extensión de las teselas en grados (Cesium trabaja en EPSG:4979).
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   *
   * @returns {Array<Number>|null} [minLon, minLat, maxLon, maxLat].
   */
  getExtentInDegrees_() {
    const extent = this.extent_ || this.provider?.getExtent?.();
    if (isNullOrEmpty(extent)) return null;
    const projection = this.provider?.getProjection?.() || 'EPSG:3857';
    if (projection === 'EPSG:4326' || projection === 'EPSG:4979') return extent;
    return ImplUtils.transformExtent(extent, projection, 'EPSG:4326') || null;
  }

  /**
   * Recarga la fuente (autorefresco) manteniendo la capa y sus opciones.
   *
   * @public
   * @function
   * @param {Function} isCurrent Indica si la recarga sigue vigente.
   * @api
   */
  async refreshSource(isCurrent = () => true) {
    const layer = this.cesiumLayer;
    if (!layer || !this.refreshLoader_ || this.tileLoadFunction) return;
    await this.refreshLoader_(isCurrent, (provider) => {
      if (!isCurrent() || this.cesiumLayer !== layer) return false;
      this.provider = provider;
      this.replaceAutoRefreshProvider(this.createProvider_(this.getExtentInDegrees_()));
      return true;
    });
  }

  /**
   * Extensión de la capa en grados, a partir del proveedor.
   *
   * @public
   * @function
   * @returns {Promise<Array<Number>|null>} Extensión.
   * @api
   */
  getExtentFromProvider() {
    return Promise.resolve(this.getExtentInDegrees_());
  }

  /**
   * Elimina la capa del visor.
   *
   * @public
   * @function
   * @api
   */
  destroy() {
    this.facadeLayer_?.stopAutoRefresh();
    if (!isNullOrEmpty(this.cesiumLayer) && !isNullOrEmpty(this.map)) {
      this.map.getMapImpl().imageryLayers.remove(this.cesiumLayer, true);
    }
    this.cesiumLayer = null;
    this.map = null;
  }

  /**
   * Comprueba si un objeto es igual a esta capa.
   *
   * @public
   * @function
   * @param {Object} obj Objeto.
   * @returns {Boolean} Verdadero si es la misma capa.
   * @api
   */
  equals(obj) {
    // eslint-disable-next-line no-underscore-dangle
    return obj instanceof GeoPackageTile && this.facadeLayer_?.name === obj.facadeLayer_?.name;
  }
}

export default GeoPackageTile;
