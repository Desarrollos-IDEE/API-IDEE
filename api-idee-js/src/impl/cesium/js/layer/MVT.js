/**
 * @module IDEE/impl/layer/MVT
 */
import { addParameters, extend, isNullOrEmpty } from 'IDEE/util/Utils';
import * as EventType from 'IDEE/event/eventtype';
import { ImageryLayer, Rectangle } from 'cesium';
import VectorTileImageryProvider from '../provider/VectorTileImageryProvider';
import Layer from './Layer';

/**
 * @classdesc
 * Implementación para Cesium de la capa de teselas vectoriales (MVT). Las teselas
 * se pintan en el navegador con {@link VectorTileImageryProvider} y el estilo
 * genérico de la capa; al cambiar el estilo se vuelven a pintar. Los objetos
 * geográficos no se exponen individualmente (getFeatures devuelve una lista vacía).
 *
 * @api
 * @extends {IDEE.impl.layer.Layer}
 */
class MVT extends Layer {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {Object} parameters Parámetros de la capa (url, layers, projection...).
   * @param {Object} options Opciones de la capa.
   * @param {Object} vendorOptions Opciones de la capa de imágenes de Cesium.
   * "tileLoadFunction" (url, [z, x, y]) => Promise con los bytes de la tesela.
   * @api
   */
  constructor(parameters = {}, options = {}, vendorOptions = {}) {
    super(options, vendorOptions);

    this.projection_ = parameters.projection || 'EPSG:3857';

    this.mode_ = parameters.mode;

    this.opacity_ = typeof parameters.opacity === 'number' ? parameters.opacity : 1;

    this.visibility = parameters.visibility === undefined
      ? parameters.isBase !== true : parameters.visibility !== false;

    /**
     * Capas de la tesela que se pintan.
     * @private
     * @type {Array<String>|undefined}
     */
    this.layers_ = parameters.layers;

    this.extract = parameters.extract;

    /**
     * Función de carga de teselas: (url, [z, x, y]) => Promise con sus bytes.
     * @public
     * @type {Function|null}
     */
    this.tileLoadFunction = vendorOptions.tileLoadFunction || null;

    this.loaded_ = false;

    /**
     * Teselas pintadas con el proveedor actual.
     * @private
     * @type {Number}
     */
    this.drawnTiles_ = 0;

    /**
     * Marca de recarga (autorefresco) que se añade a las peticiones.
     * @private
     * @type {Number|null}
     */
    this.refreshToken_ = null;

    this.onStyleChange_ = () => this.scheduleRedraw_();

    this.removeTilesLoadedListener_ = null;
  }

  /**
   * Establece la fachada de la capa.
   *
   * @public
   * @function
   * @param {IDEE.layer.MVT} obj Fachada.
   * @api
   */
  setFacadeObj(obj) {
    this.facadeLayer_ = obj;
    this.facadeVector_ = obj;
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
    this.addImageryLayer_({ extent: this.userMaxExtent });
  }

  /**
   * Crea la capa de imágenes, la añade al visor y emite ADDED_TO_MAP y LOAD.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   *
   * @param {Object} options Opciones.
   * @param {Array<Number>} [options.extent] Extensión en grados.
   * @param {Number} [options.maximumLevel] Nivel máximo de las teselas.
   */
  addImageryLayer_({ extent, maximumLevel } = {}) {
    this.providerOptions_ = isNullOrEmpty(maximumLevel) ? {} : { maximumLevel };
    // La función de carga de teselas es del proveedor, no de la capa de imágenes
    const vendorOptions = { ...this.vendorOptions_ };
    delete vendorOptions.tileLoadFunction;
    this.cesiumLayer = new ImageryLayer(this.createProvider_(), extend({
      minimumTerrainLevel: this.minZoom,
      maximumTerrainLevel: this.maxZoom - 1,
      alpha: this.opacity_,
      show: this.visibility,
      ...(isNullOrEmpty(extent) ? {} : { rectangle: Rectangle.fromDegrees(...extent) }),
    }, vendorOptions, true));
    const zIndex = this.facadeLayer_?.isBase ? 0 : null;
    const viewer = this.map.getMapImpl();
    viewer.imageryLayers.add(this.cesiumLayer, zIndex);
    this.facadeLayer_?.on(EventType.CHANGE_STYLE, this.onStyleChange_);
    this.removeTilesLoadedListener_ = viewer.scene.globe.tileLoadProgressEvent
      .addEventListener((queued) => {
        if (queued === 0 && this.drawnTiles_ > 0) {
          this.removeTilesLoadedListener_();
          this.removeTilesLoadedListener_ = null;
          this.facadeLayer_?.fire(EventType.LOAD_ALL_TILES);
        }
      });
    this.fireAddedToMap_();
    this.loaded_ = true;
    this.facadeLayer_?.fire(EventType.LOAD);
  }

  /**
   * Crea el proveedor de teselas vectoriales.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   *
   * @returns {VectorTileImageryProvider} Proveedor.
   */
  createProvider_() {
    this.drawnTiles_ = 0;
    return new VectorTileImageryProvider({
      getTileData: (x, y, z) => this.getTileData(x, y, z),
      getStyle: () => this.getStyleOptions_(),
      layers: this.layers_,
      onTile: () => { this.drawnTiles_ += 1; },
      ...this.providerOptions_,
    });
  }

  /**
   * Bytes de una tesela XYZ del servicio.
   *
   * @public
   * @function
   * @param {Number} x Columna.
   * @param {Number} y Fila (desde arriba).
   * @param {Number} z Nivel.
   * @returns {Promise<ArrayBuffer|null>} Tesela, o null si está vacía.
   * @api
   */
  getTileData(x, y, z) {
    let url = this.url
      .replace('{z}', z)
      .replace('{x}', x)
      .replace('{-y}', 2 ** z - 1 - y)
      .replace('{y}', y);
    const ticket = IDEE.config.TICKET;
    if (!isNullOrEmpty(ticket)) url = addParameters(url, { ticket });
    if (!isNullOrEmpty(this.refreshToken_)) {
      url = addParameters(url, { _ideeRefresh: this.refreshToken_ });
    }
    if (typeof this.tileLoadFunction === 'function') {
      return Promise.resolve(this.tileLoadFunction(url, [z, x, y]));
    }
    return window.fetch(url).then((response) => {
      if (response.status === 204) return null;
      if (!response.ok) throw new Error(`MVT ${response.status}: ${url}`);
      return response.arrayBuffer();
    });
  }

  /**
   * Opciones del estilo actual de la capa (o del estilo por defecto).
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   *
   * @returns {Object|null} Opciones del estilo.
   */
  getStyleOptions_() {
    const style = this.facadeLayer_?.getStyle();
    if (!isNullOrEmpty(style) && typeof style.getOptions === 'function') {
      return style.getOptions();
    }
    return this.facadeLayer_?.constructor.DEFAULT_OPTIONS_STYLE || null;
  }

  /**
   * Vuelve a pintar las teselas (una sola vez aunque el estilo cambie varias
   * veces seguidas). Si aún no se ha pintado ninguna, no hace falta.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   */
  scheduleRedraw_() {
    if (this.redrawScheduled_) return;
    this.redrawScheduled_ = true;
    setTimeout(() => {
      this.redrawScheduled_ = false;
      if (!isNullOrEmpty(this.cesiumLayer) && !isNullOrEmpty(this.map) && this.drawnTiles_ > 0) {
        this.replaceAutoRefreshProvider(this.createProvider_());
      }
    });
  }

  /**
   * Vuelve a pintar las teselas.
   *
   * @public
   * @function
   * @api
   */
  redraw() {
    this.scheduleRedraw_();
  }

  /**
   * Vuelve a pintar las teselas.
   *
   * @public
   * @function
   * @api
   */
  refresh() {
    this.scheduleRedraw_();
  }

  /**
   * Recarga las teselas del servicio (autorefresco).
   *
   * @public
   * @function
   * @api
   */
  refreshSource() {
    if (isNullOrEmpty(this.cesiumLayer) || !this.isAutoRefreshRemoteURL(this.url)) return;
    this.refreshToken_ = Date.now();
    this.replaceAutoRefreshProvider(this.createProvider_());
  }

  /**
   * Cambia la función de carga de teselas y las vuelve a pintar.
   *
   * @public
   * @function
   * @param {Function} func (url, [z, x, y]) => Promise con los bytes de la tesela.
   * @api
   */
  setTileLoadFunction(func) {
    this.tileLoadFunction = func;
    if (!isNullOrEmpty(this.cesiumLayer)) this.replaceAutoRefreshProvider(this.createProvider_());
  }

  /**
   * Indica si la capa se ha cargado.
   *
   * @public
   * @function
   * @returns {Boolean} Verdadero si está cargada.
   * @api
   */
  isLoaded() {
    return this.loaded_;
  }

  /**
   * La fuente siempre es válida (las teselas se piden al pintar).
   *
   * @public
   * @function
   * @returns {Boolean} Verdadero.
   * @api
   */
  isValidSource() {
    return true;
  }

  /**
   * Los objetos geográficos de las teselas no se exponen en Cesium.
   *
   * @public
   * @function
   * @returns {Array} Lista vacía.
   * @api
   */
  getFeatures() {
    return [];
  }

  /**
   * Los objetos geográficos de las teselas no se exponen en Cesium.
   *
   * @public
   * @function
   * @returns {Array} Lista vacía.
   * @api
   */
  getFeatureById() {
    return [];
  }

  /**
   * Extensión de la capa en grados, si se conoce.
   *
   * @public
   * @function
   * @returns {Array<Number>|null} Extensión.
   * @api
   */
  getFeaturesExtent() {
    return this.userMaxExtent || null;
  }

  /**
   * Versión asíncrona de getFeaturesExtent.
   *
   * @public
   * @function
   * @returns {Promise<Array<Number>|null>} Extensión.
   * @api
   */
  getFeaturesExtentPromise() {
    return Promise.resolve(this.getFeaturesExtent());
  }

  /**
   * Proyección de las teselas.
   *
   * @public
   * @function
   * @returns {String} Código de la proyección.
   * @api
   */
  getProjection() {
    return this.projection_;
  }

  /**
   * Tamaño de tesela.
   *
   * @public
   * @function
   * @returns {Number} Tamaño en píxeles.
   * @api
   */
  getTileSize() {
    return 256;
  }

  /**
   * Quita la capa del visor.
   *
   * @public
   * @function
   * @api
   */
  destroy() {
    this.facadeLayer_?.stopAutoRefresh();
    this.facadeLayer_?.un(EventType.CHANGE_STYLE, this.onStyleChange_);
    if (this.removeTilesLoadedListener_) this.removeTilesLoadedListener_();
    this.removeTilesLoadedListener_ = null;
    if (!isNullOrEmpty(this.cesiumLayer) && !isNullOrEmpty(this.map)) {
      this.map.getMapImpl().imageryLayers.remove(this.cesiumLayer, true);
    }
    this.cesiumLayer = null;
    this.loaded_ = false;
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
    return obj instanceof MVT && this.url === obj.url && this.name === obj.name
      && this.extract === obj.extract && this.template === obj.template;
  }
}

export default MVT;
