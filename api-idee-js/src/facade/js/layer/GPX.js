/**
 * @module IDEE/layer/GPX
 */
import GPXImpl from 'impl/layer/GPX';
import Vector from './Vector';
import { gpx } from '../parameter/parameter';
import { isString } from '../util/Utils';
import Exception from '../exception/exception';
import { getValue } from '../i18n/language';

/**
 * Fuente vectorial GPX: puntos, rutas y tracks en WGS84.
 * @api
 * @extends {IDEE.layer.Vector}
 */
class GPX extends Vector {
  /**
   * @param {Object|String} parameters Parámetros de la capa.
   * - url: URL del fichero GPX. No se combina con source.
   * - source: Contenido XML o File seleccionado por el usuario.
   * - name, legend, extract, template: Opciones comunes de las capas vectoriales.
   * - refreshInterval: Intervalo de actualización de una fuente remota en milisegundos.
   * @param {Object} options Opciones vectoriales: style, visibility, opacity, hide, show,
   * minZoom, maxZoom, minScale, maxScale, displayInLayerSwitcher y clampToGround (Cesium).
   * También se admiten opciones en parameters.options o en la configuración JSON plana.
   * @param {Object} vendorOptions Opciones de la biblioteca cartográfica.
   * @api
   */
  constructor(parameters = {}, options = {}, vendorOptions = {}) {
    const params = gpx(parameters);
    // La normalización también sirve para consultar capas mediante filtros parciales.
    // La creación sí requiere exactamente un origen y asigna el nombre por defecto.
    const hasURL = params.url !== undefined && params.url !== null;
    const hasSource = params.source !== undefined && params.source !== null;
    if (hasURL === hasSource
      || (hasURL && (!isString(params.url) || params.url.trim() === ''))
      || (hasSource && !isString(params.source) && !(params.source instanceof File))) {
      Exception(getValue('exception').invalid_gpx_source);
    }
    params.name = params.name || (params.source instanceof File ? params.source.name : 'GPX');
    const opts = { ...params, ...params.options, ...options };
    const impl = new GPXImpl(params, opts, vendorOptions);
    super(params, opts, vendorOptions, impl);
    this.constructorParameters = { parameters, options, vendorOptions };
    this.options = opts;
    this.source = params.source;
    if (opts.minZoom !== undefined) this.minZoom = opts.minZoom;
    if (opts.maxZoom !== undefined) this.maxZoom = opts.maxZoom;
  }

  /**
   * @returns {String|File} Fuente local.
   * @api
   */
  get source() {
    return this.getImpl().source;
  }

  /**
   * @param {String|File} source Fuente local.
   * @api
   */
  set source(source) {
    this.getImpl().source = source;
  }

  /**
   * Cambia a una fuente remota y recarga si la capa está en el mapa.
   * @api
   */
  setURL(url) {
    this.source = undefined;
    this.url = url;
    return this.refresh();
  }

  /**
   * Cambia a contenido XML o File y recarga si la capa está en el mapa.
   * @api
   */
  setSource(source) {
    this.url = undefined;
    this.source = source;
    return this.refresh();
  }

  /**
   * Recarga el origen conservando estilo y filtro.
   * @returns {Promise} Carga.
   * @api
   */
  refresh() {
    return this.getImpl().refresh();
  }

  /**
   * Aplica el estilo vectorial y permite el encadenamiento utilizado por API REST.
   * @param {IDEE.Style|String|Object} style Estilo o configuración serializada.
   * @param {Boolean} applyToFeature Aplica el estilo a las entidades.
   * @returns {IDEE.layer.GPX} Esta capa.
   * @api
   */
  setStyle(style, applyToFeature = false, defaultStyle = Vector.DEFAULT_OPTIONS_STYLE) {
    super.setStyle(style, applyToFeature, defaultStyle);
    return this;
  }

  /**
   * @param {Object} other Capa a comparar.
   * @returns {Boolean} Igualdad.
   * @api
   */
  equals(other) {
    return other instanceof GPX && this.idLayer === other.idLayer;
  }
}

export default GPX;
