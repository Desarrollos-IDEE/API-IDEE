/**
 * @module M/layer/GenericRaster
 */
import GenericRasterImpl from 'impl/layer/GenericRaster';
import Utils from 'impl/util/Utils';
import {
  isUndefined, isArray, isNullOrEmpty, isFunction, isObject,
} from '../util/Utils';
import Exception from '../exception/exception';
import LayerBase from './Layer';
import { getValue } from '../i18n/language';
import * as parameter from '../parameter/parameter';
import * as LayerType from './Type';

/**
 * @classdesc
 *  GenericRaster permite añadir cualquier tipo de capa raster.
 *
 * @property {String} name Nombre de la capa.
 * @property {String} legend Nombre asociado en el árbol de contenido, si usamos uno.
 * @property {String} version Versión.
 * @property {Boolean} transparent 'Falso' si es una capa base, 'verdadero' en caso contrario.
 * @property {Object} options Capa de opciones.
 * @property {Boolean} isbase Define si la capa es base.
 *
 * @api
 * @extends {M.Layer}
 */
class GenericRaster extends LayerBase {
  /**
   * Constructor principal de la clase.
   * @constructor
   * @param {string|Mx.parameters.GenericRaster} userParameters Parámetros para la
   * construcción de la capa.
   * - attribution: Atribución de la capa.
   * - name: nombre de la capa.
   * - legend: Nombre asociado en el árbol de contenidos, si usamos uno.
   * - transparent: Falso si es una capa base, verdadero en caso contrario.
   * - isBase: Indica si la capa es base.
   * - maxExtent: La medida en que restringe la visualización a una región específica.
   * @param {Mx.parameters.LayerOptions} options Estas opciones se mandarán a
   * la implementación de la capa.
   * - version: Versión GenericRaster.
   * - displayInLayerSwitcher: Indica si la capa se muestra en el selector de capas.
   * - visibility: Indica la visibilidad de la capa.
   * - opacity: Opacidad de capa, por defecto 1.
   * - format: Formato de la capa, por defecto image/png.
   * - styles: Estilos de la capa.
   * - sldBody: Parámetros "ol.source.ImageWMS"
   * - minZoom: Zoom mínimo aplicable a la capa.
   * - maxZoom: Zoom máximo aplicable a la capa.
   * - queryable: Indica si la capa es consultable.
   * - minScale: Escala mínima.
   * - maxScale: Escala máxima.
   * - minResolution: Resolución mínima.
   * - maxResolution: Resolución máxima.
   * - crossOrigin: Atributo crossOrigin para las imágenes cargadas.
   * @param {Object} vendorOptions Opciones para la biblioteca base. Ejemplo vendorOptions:
   * <pre><code>
   * import OLSourceTileWMS from 'ol/source/TileWMS';
   * {
   *  source: new OLSourceTileWMS({
   *    ...
   *  })
   * }
   * </code></pre>
   * @api
   */
  constructor(userParameters = {}, options = {}, vendorOptions = {}) {
    let params = { ...userParameters, ...options };
    delete params.minZoom;
    delete params.maxZoom;
    const opts = options;
    let vOptions = vendorOptions;

    if (typeof userParameters === 'string') {
      params = parameter.layer(userParameters, LayerType.GenericRaster);
      vOptions = params.vendorOptions;
    } else if (!isNullOrEmpty(userParameters)) {
      params.type = LayerType.GenericRaster;
    }

    if (params.name) {
      opts.name = params.name;
    } else if (vOptions) {
      opts.name = Utils.addFacadeName(params.name, vOptions);
      params.name = params.name || opts.name;
    }

    if (params.legend) {
      opts.legend = params.legend;
    } else if (vOptions) {
      opts.legend = Utils.addFacadeLegend(vOptions) || params.name;
      params.legend = params.legend || opts.legend;
    }

    // checks if the implementation can create Generic layers
    if (isUndefined(GenericRasterImpl)) {
      Exception(getValue('exception').generic_method);
    }

    opts.userMaxExtent = params.maxExtent || opts.userMaxExtent;

    const impl = new GenericRasterImpl(opts, vOptions, 'raster');

    // calls the super constructor
    super(params, impl);

    // Los minZoom y minZoom anteriormente se configuraban en "super", por "params".
    /**
     * GenericRaster minZoom: Límite del zoom mínimo.
     * @public
     * @type {Number}
     */
    this.minZoom = opts.minZoom || Number.NEGATIVE_INFINITY;

    /**
     * GenericRaster maxZoom: Límite del zoom máximo.
     * @public
     * @type {Number}
     */
    this.maxZoom = opts.maxZoom || Number.POSITIVE_INFINITY;

    this.version = params.version || '1.3.0';

    if (!isNullOrEmpty(impl) && isFunction(impl.setFacadeObj)) {
      impl.setFacadeObj(this);
    }
  }

  /**
   * Este método devuelve extensión máxima de esta capa.
   *
   * @function
   * @param {Boolean} isSource Extent de la biblioteca base o no, por defecto verdadero.
   * @returns {Array} Devuelve la extensión máxima de esta capa.
   * @api
   */
  getMaxExtent(isSource = true) {
    let extent = !isSource ? this.maxExtent_ : this.getImpl().getMaxExtent();
    if (isUndefined(extent) || isNullOrEmpty(extent)) {
      extent = this.map_.getProjection().getExtent();
    }
    return extent;
  }

  /**
   * Este método calcula la extensión máxima de esta capa.
   *
   * @function
   * @returns {M.layer.maxExtent} Devuelve una promesa, con la extensión máxima de esta capa.
   * @api
   */
  calculateMaxExtent() {
    return new Promise((resolve) => { resolve(this.getMaxExtent(false)); });
  }

  /**
   * Este método cambia la extensión máxima de la capa.
   *
   * @function
   * @param {Array|Object} maxExtent Nuevo valor para el "MaxExtent".
   * @api
   * @export
   */
  setMaxExtent(maxExtent) {
    let extent = maxExtent;
    if (!isArray(maxExtent) && isObject(maxExtent)) {
      extent = [
        maxExtent.x.min,
        maxExtent.y.min,
        maxExtent.x.max,
        maxExtent.y.max,
      ];
    }
    this.getImpl().setMaxExtent(extent);
  }

  /**
   * Devuelve la url del servicio.
   *
   * @function
   * @getter
   * @public
   * @returns {String} URL del servicio.
   * @api
   */
  get url() {
    return this.getImpl().getURLService();
  }

  /**
   * Modifica la url del servicio.
   * @function
   * @setter
   * @public
   * @param {String} newUrl Nueva URL.
   * @api
   */
  set url(newUrl) {
    this.getImpl().setURLService(newUrl);
  }

  /**
   * Devuelve la versión del servicio, por defecto es 1.3.0.
   *
   * @function
   * @getter
   * @return {M.layer.GenericRaster.impl.version} Versión del servicio.
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
      this.getImpl().setVersion(newVersion);
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
    if (obj instanceof GenericRaster) {
      equals = (this.legend === obj.legend);
      equals = equals && (this.url === obj.url);
      equals = equals && (this.name === obj.name);
    }

    return equals;
  }
}

export default GenericRaster;
