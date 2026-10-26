/**
 * @module IDEE/impl/layer/GeoTIFF
 */
import {
  addParameters, extend, isNullOrEmpty, isString, isUndefined,
} from 'IDEE/util/Utils';
import * as EventType from 'IDEE/event/eventtype';
import { getValue } from 'IDEE/i18n/language';
import { ImageryLayer, Rectangle } from 'cesium';
import GeoTIFFImageryProvider from '../provider/GeoTIFFImageryProvider';
import LayerBase from './Layer';

/**
 * Nombres comunes de banda (metadato GDAL COMMON_NAME) y su papel, como en OL.
 * @const
 * @type {Object}
 */
const COMMON_NAME_ROLES = {
  red: 'red',
  green: 'green',
  blue: 'blue',
  nir: 'nir',
  nir08: 'nir',
  nir09: 'nir',
  swir: 'swir',
  swir16: 'swir',
  swir22: 'swir',
};

/**
 * Papel de una banda según su metadato COMMON_NAME.
 *
 * @param {Object} metadata Metadatos GDAL de la banda.
 * @returns {String|null} Papel de la banda.
 */
const roleFromCommonName = (metadata) => {
  if (!metadata || !metadata.COMMON_NAME) return null;
  return COMMON_NAME_ROLES[String(metadata.COMMON_NAME).trim().toLowerCase()] || null;
};

/**
 * Obtiene el fichero del parámetro "blob" (Blob o URL, también de objeto).
 *
 * @param {Blob|String} blobParam Blob o URL.
 * @returns {Promise<Blob>} Fichero.
 */
const resolveBlob = (blobParam) => {
  if (typeof Blob !== 'undefined' && blobParam instanceof Blob) {
    return Promise.resolve(blobParam);
  }
  if (isString(blobParam) && blobParam.length > 0) {
    return window.fetch(blobParam).then((response) => {
      if (!response.ok) {
        throw new Error(getValue('exception').geotiff_blob_fetch_error
          .replace('[replace1]', String(response.status))
          .replace('[replace2]', blobParam));
      }
      return response.blob();
    });
  }
  return Promise.reject(new Error(getValue('exception').geotiff_blob_invalid));
};

/**
 * @classdesc
 * Implementación para Cesium de la capa GeoTIFF (también COG). Las teselas se
 * generan en el navegador a partir del GeoTIFF con
 * {@link GeoTIFFImageryProvider}. El estilo ráster de IDEE no está disponible
 * en Cesium: el GeoTIFF se pinta en RGB o con sus bandas normalizadas.
 *
 * @api
 * @extends {IDEE.impl.layer.Layer}
 */
class GeoTIFF extends LayerBase {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {Object} options Opciones de la capa (las de la fachada y las de OL:
   * bands, min, max, nodata, normalize, convertToRGB, cacheSize, blockSize).
   * @param {Object} vendorOptions Opciones de la capa de imágenes de Cesium.
   * @api
   */
  constructor(options = {}, vendorOptions = {}) {
    super(options, vendorOptions);

    this.options = options;

    this.opacity_ = typeof options.opacity === 'number' ? options.opacity : 1;

    /**
     * Extensión del usuario, en grados.
     * @private
     * @type {Array<Number>|null}
     */
    this.maxExtent_ = options.maxExtent || null;

    this.normalize = isUndefined(options.normalize) ? true : options.normalize;

    this.convertToRGB_ = isNullOrEmpty(options.convertToRGB) ? 'auto' : options.convertToRGB;

    this.bands_ = options.bands || [];

    this.min_ = options.min;

    this.max_ = options.max;

    this.nodata_ = options.nodata;

    this.cacheSize_ = options.cacheSize || 100;

    this.blockSize_ = options.blockSize || 65536;

    this.blob = options.blob;

    /**
     * Proveedor de imágenes del GeoTIFF.
     * @private
     * @type {GeoTIFFImageryProvider|null}
     */
    this.provider_ = null;

    /**
     * Promesa de carga del GeoTIFF.
     * @private
     * @type {Promise|null}
     */
    this.loadPromise_ = null;

    this.loaded_ = false;
  }

  /**
   * Añade la capa al mapa: abre el GeoTIFF y, cuando se conoce su extensión,
   * añade la capa de imágenes al visor.
   *
   * @public
   * @function
   * @param {IDEE.Map} map Mapa.
   * @api
   */
  addTo(map) {
    this.map = map;
    this.loadPromise_ = this.createProvider_()
      .then((provider) => {
        // Se quitó del mapa mientras se cargaba
        if (this.map !== map) {
          provider.dispose();
          return;
        }
        this.addImageryLayer_(provider);
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error(error);
        this.facadeLayer_?.fire('error', [error]);
      });
  }

  /**
   * Abre el GeoTIFF y crea su proveedor.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   *
   * @param {String} url URL del GeoTIFF.
   * @returns {Promise<GeoTIFFImageryProvider>} Proveedor.
   */
  async createProvider_(url = this.url) {
    const blob = this.blob ? await resolveBlob(this.blob) : null;
    return GeoTIFFImageryProvider.fromSource({
      url,
      blob,
      projection: this.options.projection,
      bands: this.bands_,
      min: this.min_,
      max: this.max_,
      nodata: this.nodata_,
      normalize: this.normalize,
      convertToRGB: this.convertToRGB_,
      cacheSize: this.cacheSize_,
      blockSize: this.blockSize_,
    });
  }

  /**
   * Añade al visor la capa de imágenes del proveedor.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   *
   * @param {GeoTIFFImageryProvider} provider Proveedor.
   */
  addImageryLayer_(provider) {
    this.provider_ = provider;
    const extent = this.maxExtent_ || provider.extent;
    const options = extend({
      minimumTerrainLevel: this.minZoom,
      maximumTerrainLevel: this.maxZoom - 1,
      rectangle: Rectangle.fromDegrees(...extent),
      alpha: this.opacity_,
      show: this.visibility,
    }, this.vendorOptions_, true);
    this.cesiumLayer = new ImageryLayer(provider, options);
    const zIndex = this.facadeLayer_?.isBase ? 0 : null;
    this.map.getMapImpl().imageryLayers.add(this.cesiumLayer, zIndex);
    this.loaded_ = true;
    this.fireAddedToMap_();
    this.facadeLayer_?.fire(EventType.LOAD);
  }

  /**
   * Espera a que el GeoTIFF esté abierto.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   *
   * @returns {Promise} Promesa de carga.
   */
  whenLoaded_() {
    return this.loadPromise_ || Promise.resolve();
  }

  /**
   * Número de bandas del GeoTIFF.
   *
   * @public
   * @function
   * @returns {Promise<Number|null>} Bandas.
   * @api
   */
  getBandCount() {
    return this.whenLoaded_().then(() => this.provider_?.getBandCount() || null);
  }

  /**
   * Papel de las bandas según sus metadatos (red, green, blue, nir, swir).
   *
   * @public
   * @function
   * @returns {Promise<Object|null>} Papel de cada banda (número desde 1).
   * @api
   */
  getBandRoles() {
    return this.whenLoaded_().then(() => {
      if (isNullOrEmpty(this.provider_)) return null;
      const roles = {};
      for (let sample = 0; sample < this.provider_.getBandCount(); sample += 1) {
        const role = roleFromCommonName(this.provider_.getGDALMetadata(sample));
        if (role && roles[role] === undefined) roles[role] = sample + 1;
      }
      return Object.keys(roles).length === 0 ? null : roles;
    });
  }

  /**
   * Extensión de la capa en grados.
   *
   * @public
   * @function
   * @returns {Array<Number>|null} [minLon, minLat, maxLon, maxLat].
   * @api
   */
  getMaxExtent() {
    return this.maxExtent_ || this.provider_?.extent || null;
  }

  /**
   * Cambia la extensión de la capa (en grados).
   *
   * @public
   * @function
   * @param {Array<Number>} maxExtent Extensión.
   * @api
   */
  setMaxExtent(maxExtent) {
    this.maxExtent_ = maxExtent;
    if (!isNullOrEmpty(maxExtent)) super.setMaxExtent(maxExtent);
  }

  /**
   * Indica si el GeoTIFF se ha cargado.
   *
   * @public
   * @function
   * @returns {Boolean} Verdadero si está cargado.
   * @api
   */
  isLoaded() {
    return this.loaded_;
  }

  /**
   * Establece la fachada de la capa.
   *
   * @public
   * @function
   * @param {IDEE.layer.GeoTIFF} obj Fachada.
   * @api
   */
  setFacadeObj(obj) {
    this.facadeLayer_ = obj;
  }

  /**
   * Recarga el GeoTIFF remoto (autorefresco) conservando la capa y sus opciones.
   *
   * @public
   * @function
   * @param {Function} isCurrent Indica si la recarga sigue vigente.
   * @api
   */
  async refreshSource(isCurrent = () => true) {
    const layer = this.cesiumLayer;
    if (!layer || this.blob || !this.isAutoRefreshRemoteURL(this.url)) return;
    const provider = await this.createProvider_(addParameters(this.url, {
      _ideeRefresh: Date.now(),
    }));
    if (!isCurrent() || this.cesiumLayer !== layer) {
      provider.dispose();
      return;
    }
    this.provider_ = provider;
    this.replaceAutoRefreshProvider(provider);
  }

  /**
   * Quita la capa del visor y libera el GeoTIFF.
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
    this.provider_?.dispose();
    this.provider_ = null;
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
    return obj instanceof GeoTIFF && this.url === obj.url && this.name === obj.name
      && this.version === obj.version;
  }
}

export default GeoTIFF;
