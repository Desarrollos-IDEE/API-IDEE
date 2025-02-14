/* eslint-disable no-console */
/**
 * @module M/layer/WMS
 */
import WMSImpl from 'impl/layer/WMS';
import {
  isUndefined, isNullOrEmpty, isFunction, isString, normalize, sameUrl,
} from '../util/Utils';
import Exception from '../exception/exception';
import LayerBase from './Layer';
import * as parameter from '../parameter/parameter';
import * as LayerType from './Type';
import { getValue } from '../i18n/language';

/**
 * @classdesc
 * WMS devuelve un mapa en formato imagen de un conjunto capas ráster o vectoriales.
 * Permitiendo las personalización de las capas mediante estilos. Se trata de un mapa dínamico.
 *
 * @property {String} legend Nombre asociado en el árbol de contenido, si usamos uno.
 * @property {String} version Versión WMS.
 * @property {Boolean} tiled Verdadero si queremos dividir la capa en mosaicos,
 * falso en caso contrario.
 * @property {Boolean} transparent 'Falso' si es una capa base, 'verdadero' en caso contrario.
 * @property {Object} capabilitiesMetadata Capacidades de metadatos WMS.
 * @property {Number} minZoom Limitar el zoom mínimo.
 * @property {Number} maxZoom Limitar el zoom máximo.
 * @property {Object} options Capa de opciones WMS.
 * @property {Boolean} useCapabilities Define si se utilizará el capabilities para generar la capa.
 * @property {Boolean} isbase Define si la capa es base.
 * @api
 * @extends {M.Layer}
 */
class WMS extends LayerBase {
  /**
   * Constructor principal de la clase. Crea una capa WMS
   * con parámetros especificados por el usuario.
   * @constructor
   * @param {string|Mx.parameters.WMS} userParameters Parámetros para la construcción de la capa.
   * - attribution: Atribución de la capa.
   * - name: nombre de la capa en el servidor.
   * - isBase: Indica si la capa es base.
   * - transparent (deprecated): Falso si es una capa base, verdadero en caso contrario.
   * - maxExtent: La medida en que restringe la visualización a una región específica.
   * - legend: Nombre asociado en el árbol de contenidos, si usamos uno.
   * - visibility: Verdadero si la capa es visible, falso si queremos que no lo sea.
   * En este caso la capa sería detectado por los plugins de tablas de contenidos
   * y aparecería como no visible.
   * - displayInLayerSwitcher: Indica si la capa se muestra en el selector de capas.
   * - url: url del servicio WFS.
   * - queryable: Indica si la capa es consultable.
   * - version: Versión WMS.
   * - tiled: Verdadero si queremos dividir la capa en tiles, falso en caso contrario.
   * - type: Tipo de la capa.
   * - useCapabilities: Define si se utilizará el capabilities para generar la capa.
   * @param {Mx.parameters.LayerOptions} options Estas opciones se mandarán a
   * la implementación de la capa.
   * - opacity: Opacidad de capa, por defecto 1.
   * - singleTile: Indica si la tesela es única o no.
   * - animated: Define si la capa está animada,
   * el valor predeterminado es falso.
   * - format: Formato de la capa, por defecto image/png.
   * - styles: Estilos de la capa.
   * - sldBody: Parámetros "ol.source.ImageWMS"
   * - minZoom: Zoom mínimo aplicable a la capa.
   * - maxZoom: Zoom máximo aplicable a la capa.
   * - minScale: Escala mínima.
   * - maxScale: Escala máxima.
   * - minResolution: Resolución mínima.
   * - maxResolution: Resolución máxima.
   * - ratio: determina el tamaño de las solicitudes de las imágenes. 1 significa que tienen el
   * tamaño de la ventana, 2 significa que tienen el doble del tamaño de la ventana,
   * y así sucesivamente. Debe ser 1 o superior. Por defecto es 1.
   * crossOrigin: Atributo crossOrigin para las imágenes cargadas.
   * @param {Object} vendorOptions Opciones para la biblioteca base. Ejemplo vendorOptions:
   * <pre><code>
   * import OLSourceTileWMS from 'ol/source/TileWMS';
   * {
   *  opacity: 0.1,
   *  source: new OLSourceTileWMS({
   *    attributions: 'wms',
   *    ...
   *  })
   * }
   * </code></pre>
   * @api
   */
  constructor(userParameters, options = {}, vendorOptions = {}) {
    // checks if the implementation can create WMC layers
    if (isUndefined(WMSImpl)) {
      Exception(getValue('exception').wms_method);
    }
    // checks if the param is null or empty
    if (isNullOrEmpty(userParameters)) {
      Exception(getValue('exception').no_param);
    }
    // This Layer is of parameters.
    const parameters = parameter.layer(userParameters, LayerType.WMS);
    const optionsVar = {
      ...options,
      visibility: parameters.visibility,
      queryable: parameters.queryable,
      displayInLayerSwitcher: parameters.displayInLayerSwitcher,
      useCapabilities: parameters.useCapabilities,
      transparent: parameters.transparent,
      isWMSfull: parameters.name === undefined,
    };

    const impl = new WMSImpl(optionsVar, vendorOptions);
    // calls the super constructor
    super(parameters, impl);

    /**
     * WMS legend: Nombre asociado en el árbol de contenido, si usamos uno.
     */
    this.legend = parameters.legend;

    /**
     * WMS version: Versión WMS.
     */
    this.version = parameters.version;

    /**
     * WMS tiled: Verdadero si queremos dividir la capa en mosaicos, falso en caso contrario.
     */
    if (!isNullOrEmpty(parameters.tiled)) {
      this.tiled = parameters.tiled;
    }

    /**
     * WMS capabilitiesMetadata: Capacidades de metadatos WMS.
     */
    if (!isNullOrEmpty(vendorOptions.capabilitiesMetadata)) {
      this.capabilitiesMetadata = vendorOptions.capabilitiesMetadata;
    }

    /**
     * WMS minZoom: Limitar el zoom mínimo.
     */
    this.minZoom = options.minZoom || Number.NEGATIVE_INFINITY;

    /**
     * WMS maxZoom: Limitar el zoom máximo.
     */
    this.maxZoom = options.maxZoom || Number.POSITIVE_INFINITY;

    /**
     * WMS options: Opciones WMS.
     */
    this.options = optionsVar;

    /**
     * Obtener metadatos en forma de promesa.
     */
    this.getCapabilitiesPromise_ = null;

    /**
     * Define se se utilizará el capabilities para generar la capa.
     * Si es falso no se generará el OLTileGrid, por lo que
     * podrías experimentar problemas de alineación y visualización incorrecta.
     */
    this.useCapabilities = userParameters.useCapabilities !== false;

    this._updateNoCache();
  }

  /**
   * Devuelve el valor de la propiedad "tiled".
   *
   * @function
   * @getter
   * @return {M.layer.WMS.impl.tiled} Valor de la tesela.
   * @api
   */
  get tiled() {
    return this.getImpl().tiled;
  }

  /**
   * Sobrescribe el valor de la propiedad "tiled".
   *
   * @function
   * @setter
   * @param {M.WMS.tiled} newTiled Nueva tesela.
   * @api
   */
  set tiled(newTiled) {
    if (!isNullOrEmpty(newTiled)) {
      if (isString(newTiled)) {
        this.getImpl().tiled = (normalize(newTiled) === 'true');
      } else {
        this.getImpl().tiled = newTiled;
      }
    } else {
      this.getImpl().tiled = true;
    }
  }

  /**
   * Devuelve la versión del servicio, por defecto es 1.3.0.
   *
   * @function
   * @getter
   * @return {M.layer.WMS.impl.version} Versión del servicio.
   * @api
   */
  get version() {
    return this.getImpl().version;
  }

  /**
   * Sobrescribe la versión del servicio, por defecto es 1.3.0.
   *
   * @function
   * @setter
   * @param {String} newVersion Nueva versión del servicio.
   * @api
   */
  set version(newVersion) {
    if (!isNullOrEmpty(newVersion)) {
      this.getImpl().version = newVersion;
    } else {
      this.getImpl().version = '1.3.0'; // default value
    }
  }

  /**
   * Devuelve las opciones de la capa.
   *
   * @function
   * @getter
   * @return {M.layer.WMTS.options} Devuelve las opciones de la
   * implementación.
   * @api
   */
  get options() {
    return this.getImpl().options;
  }

  /**
   * Sobrescribe las opciones de la capa.
   *
   * @function
   * @setter
   * @param {Object} newOptions Nuevas opciones.
   * @api
   */
  set options(newOptions) {
    this.getImpl().options = newOptions;
  }

  /**
   * Este método calcula la extensión máxima de esta capa.
   *
   * @function
   * @param {Function} callbackFn
   * @returns {M.WMS.maxExtent} Devuelve la extensión máxima.
   * @api
   */
  getMaxExtent(callbackFn) {
    let maxExtent;
    if (isNullOrEmpty(this.userMaxExtent)) {
      if (isNullOrEmpty(this.options.wmcMaxExtent)) {
        if (isNullOrEmpty(this.map_.userMaxExtent)) {
          // maxExtent provided by the service
          this.getCapabilities().then((capabilities) => {
            const capabilitiesMaxExtent = this.getImpl()
              .getExtentFromCapabilities(capabilities);
            if (isNullOrEmpty(capabilitiesMaxExtent)) {
              const projMaxExtent = this.map_.getProjection().getExtent();
              this.maxExtent_ = projMaxExtent;
            } else {
              this.maxExtent_ = capabilitiesMaxExtent;
            }
            // this allows get the async extent by the capabilites
            if (isFunction(callbackFn)) {
              callbackFn(this.maxExtent_);
            }
          });
        } else {
          this.maxExtent_ = this.map_.userMaxExtent;
        }
      } else {
        this.maxExtent_ = this.options.wmcMaxExtent;
      }
      maxExtent = this.maxExtent_;
    } else {
      maxExtent = this.userMaxExtent;
    }
    if (!isNullOrEmpty(maxExtent) && isFunction(callbackFn)) {
      callbackFn(maxExtent);
    }
    return maxExtent;
  }

  /**
   * Este método calcula la extensión máxima de esta capa.
   *
   * Versión asíncrona de getMaxExtent.
   * @function
   * @returns {M.WMS.maxExtent} Devuelve el maxExtent.
   * @api
   */
  calculateMaxExtent() {
    return new Promise((resolve) => { this.getMaxExtent(resolve); });
  }

  /**
   * Este método calcula la extensión máxima de esta capa.
   *
   * Versión asíncrona de getMaxExtent.
   * @function
   * @returns {M.WMS.maxExtent} Devuelve el maxExtent.
   * @api
   */
  calculateMaxExtentWithCapabilities(capabilities) {
    // -- Prevent to calculate maxExtent if it is already calculated
    if (isNullOrEmpty(this.userMaxExtent) && this.userMaxExtent) return this.userMaxExtent;
    if (isNullOrEmpty(this.options.wmcMaxExtent) && this.options.wmcMaxExtent) {
      this.maxExtent_ = this.options.wmcMaxExtent;
      return this.maxExtent_;
    }
    if (isNullOrEmpty(this.map_.userMaxExtent) && this.map_.userMaxExtent) {
      this.maxExtent_ = this.map_.userMaxExtent;
      return this.maxExtent_;
    }

    // -- Use capabilities
    const capabilitiesMaxExtent = this.getImpl()
      .getExtentFromCapabilities(capabilities);
    if (isNullOrEmpty(capabilitiesMaxExtent)) {
      const projMaxExtent = this.map_.getProjection().getExtent();
      this.maxExtent_ = projMaxExtent;
      return this.maxExtent_;
    }
    return capabilitiesMaxExtent;
  }

  /**
   * Este método recupera una Promesa que será
   * resuelto cuando se recupera la solicitud GetCapabilities
   * por el servicio y analizado. Las capacidades se almacenan en caché
   * para evitar solicitudes múltiples.
   *
   * @function
   * @returns {M.WMS.capabilities} Devuelve el capabilities.
   * @api
   */
  getCapabilities() {
    if (isNullOrEmpty(this.getCapabilitiesPromise_)) {
      this.getCapabilitiesPromise_ = this.getImpl().getCapabilities();
    }
    return this.getCapabilitiesPromise_;
  }

  /**
   * Devuelve las URL de "tileMappins" (url del contexto, de la configuración).
   *
   * @function
   * @returns {M.config.tileMappgins.urls} Devuelve "noCacheURL".
   * @api
   */
  getNoCacheUrl() {
    return this._noCacheUrl;
  }

  /**
   * Devuelve el nombre del "tileMappins" (nombres del contexto, de la configuración).
   *
   * @function
   * @returns {M.config.tileMappgins.names} Devuelve "noCacheName".
   * @api
   */
  getNoCacheName() {
    return this._noCacheName;
  }

  /**
   * Actualización de capas WMS de resolución mínima y máxima.
   *
   * @public
   * @function
   * @param {String|Mx.Projection} projection Proyección del mapa.
   * @returns {M.WMS.impl.updateMinMaxResolution} Devuelve la resolucción
   * máxima y mínima.
   * @api
   */
  updateMinMaxResolution(projection) {
    return this.getImpl().updateMinMaxResolution(projection);
  }

  /**
   * Actualica los parámetros de NoCahe, "M.config.tileMappins".
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @api
   */
  _updateNoCache() {
    const tiledIdx = M.config.tileMappgins.tiledNames.indexOf(this.name);
    if ((tiledIdx !== -1) && sameUrl(M.config.tileMappgins.tiledUrls[tiledIdx], this.url)) {
      this._noCacheUrl = M.config.tileMappgins.urls[tiledIdx];
      this._noCacheName = M.config.tileMappgins.names[tiledIdx];
    }
  }

  /**
   * Este método comprueba si un objeto es igual
   * a esta capa.
   *
   * @function
   * @param {Object} obj Objeto a comparar.
   * @returns {Boolean} Valor verdadero es igual, falso no lo es.
   * @api
   */
  equals(obj) {
    let equals = false;
    if (obj instanceof WMS) {
      equals = (this.url === obj.url);
      equals = equals && (this.name === obj.name);
      equals = equals && (this.version === obj.version);
    }

    return equals;
  }
}

export default WMS;
