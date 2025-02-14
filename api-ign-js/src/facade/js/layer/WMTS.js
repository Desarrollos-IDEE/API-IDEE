/* eslint-disable no-console */
/**
 * @module M/layer/WMTS
 */
import WMTSImpl from 'impl/layer/WMTS';
import { isUndefined, isNullOrEmpty } from '../util/Utils';
import Exception from '../exception/exception';
import LayerBase from './Layer';
import * as parameter from '../parameter/parameter';
import * as LayerType from './Type';
import { getValue } from '../i18n/language';

/**
 * @classdesc
 * WMTS (Web Map Tile Service) es un estándar OGC para servir información geográfica en el
 * forma de mosaicos pregenerados en resoluciones específicas.
 * La API permite visualizar este tipo de capas.
 *
 * @property {Number} minZoom Limitar el zoom mínimo.
 * @property {Number} maxZoom Limitar el zoom máximo.
 * @property {String} matrixSet La matriz seleccionada de las definidas en las Capacidades
 * del servicio.
 * @property {String} legend El nombre que la capa mostrará en el árbol de contenido, si existe.
 * @property {Boolean} transparent Falso si es una capa base, verdadero en caso contrario.
 * @property {Object} options Opciones de capas de WMTS.
 * @property {Object} capabilitiesMetadata Capacidades de metadatos WMTS.
 * @property {Boolean} useCapabilities Define si se utilizará el capabilities para generar la capa.
 * @property {Boolean} isbase Define si la capa es base.
 *
 * @api
 * @extends {M.Layer}
 */
class WMTS extends LayerBase {
  /**
   * Constructor principal de la clase. Crea una capa WMTS
   * con parámetros especificados por el usuario.
   * @constructor
   * @param {string|Mx.parameters.WMTS} userParameters Parámetros para la construcción de la capa.
   * - url: Url del servicio WMTS.
   * - name: Identifier de la Layer en el Capabilities del servicio.
   * - matrixSet: La matriz seleccionada de las definidas en el Capabilities del servicio.
   * - legend: Nombre que mostrará la capa en el árbol de contenido, si existe.
   * - format: Opcionalmente, el formato en el que solicitar la imagen.
   * - transparent: Falso si es una capa base, verdadero en caso contrario.
   * - type: Tipo de la capa.
   * - isBase: Define si la capa es base o no.
   * - useCapabilities: Define si se utilizará el capabilities para generar la capa.
   * - maxExtent: La medida en que restringe la visualización a una región específica.
   * @param {Mx.parameters.LayerOptions} options Estas opciones se mandarán
   * a la implementación de la capa.
   * - maxZoom: Zoom máximo aplicable a la capa.
   * - minZoom: Zoom mínimo aplicable a la capa.
   * - minScale: Escala mínima.
   * - maxScale: Escala máxima.
   * - minResolution: Resolucción mínima.
   * - maxResolution: Resolucción máxima.
   * - format: Formato.
   * - visibility: Define si la capa es visible o no. Verdadero por defecto.
   * - displayInLayerSwitcher: Indica si la capa se muestra en el selector de capas.
   * - opacity: Opacidad de capa, por defecto 1.
   * - crossOrigin: Atributo crossOrigin para las imágenes cargadas
   * @param {Object} vendorOptions Opciones para la biblioteca base. Ejemplo vendorOptions:
   * <pre><code>
   * import { default as OLSourceWMTS } from 'ol/source/WMTS';
   * {
   *  opacity: 0.1,
   *  source: new OLSourceWMTS({
   *    attributions: 'wmts',
   *    ...
   *  })
   * }
   * </code></pre>
   * @api
   */
  constructor(userParameters, options = {}, vendorOptions = {}) {
    const parameters = parameter.layer(userParameters, LayerType.WMTS);

    const optionsVar = {
      ...options,
      useCapabilities: parameters.useCapabilities,
    };

    if (typeof userParameters !== 'string') {
      optionsVar.maxExtent = userParameters.maxExtent;
    }

    /**
     * WMTS minZoom: Límite del zoom mínimo.
     * @public
     * @type {Number}
     */
    if (userParameters.minZoom !== undefined) {
      optionsVar.minZoom = userParameters.minZoom;
    }

    /**
     * WMTS maxZoom: Límite del zoom máximo.
     * @public
     * @type {Number}
     */
    if (userParameters.maxZoom !== undefined) {
      optionsVar.maxZoom = userParameters.maxZoom;
    }

    /**
     * Implementación de esta capa.
     * @public
     * @implements {M.layer.WMTS}
     * @type {M.layer.WMTS}
     */
    const impl = new WMTSImpl(optionsVar, vendorOptions);

    // calls the super constructor.
    super(parameters, impl);

    // checks if the implementation can create WMTS layers.
    if (isUndefined(WMTSImpl)) {
      Exception(getValue('exception').wmts_method);
    }

    // checks if the param is null or empty.
    if (isNullOrEmpty(userParameters)) {
      Exception(getValue('exception').no_param);
    }

    /**
     * WMTS matrixSet: "MatrixSet" definido por los metadatos del servicio.
     */
    this.matrixSet = parameters.matrixSet;

    /**
     * WMTS legend: El nombre que la capa mostrará en el árbol de contenido, si existe.
     */
    this.legend = parameters.legend;

    /**
     * WMTS options: Opciones de capas de WMTS.
     */
    this.options = optionsVar;

    /**
     * WMTS options: Define si se realiza la petición GetCapabilities.
     */
    this.useCapabilities = parameters.useCapabilities !== false;

    /**
     * WMTS minZoom: Límite del zoom mínimo.
     */
    this.minZoom = optionsVar.minZoom || Number.NEGATIVE_INFINITY;

    /**
     * WMTS maxZoom: Límite del zoom máximo.
     */
    this.maxZoom = optionsVar.maxZoom || Number.POSITIVE_INFINITY;

    /**
     * WMTS capabilitiesMetadata: Capacidades de metadatos WMTS.
     */
    if (!isNullOrEmpty(vendorOptions.capabilitiesMetadata)) {
      this.capabilitiesMetadata = vendorOptions.capabilitiesMetadata;
    }
  }

  /**
   * Devuelve el valor de la propiedad "matrixSet".
   * @function
   * @getter
   * @return {M.layer.WMTS.impl.matrixSet} "matrixSet" de la capa.
   * @api
   */
  get matrixSet() {
    return this.getImpl().matrixSet;
  }

  /**
   * Sobrescribe el valor de la "propiedad matrixSet".
   *
   * @function
   * @setter
   * @param {M.layer.WMTS.impl.matrixSet} newMatrixSet Nuevo valor "matrixSet".
   * @api
   */
  set matrixSet(newMatrixSet) {
    this.getImpl().matrixSet = newMatrixSet;
  }

  /**
   * Devuelve las opciones de la capa.
   *
   * @function
   * @getter
   * @return {M.layer.WMTS.options} Devuelve las opciones.
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
   * Este método recupera una promesa que será
   * resuelto cuando se recupera la solicitud GetCapabilities
   * por el servicio y analizado. Las capacidades se almacenan en caché
   * para evitar solicitudes múltiples.
   *
   * @function
   * @return {M.layer.WMTS.getCapabilitiesPromise_} Devuelve el fichero de Capacidades o Metadatos.
   * @api
   */
  getCapabilities() {
    if (isNullOrEmpty(this.getCapabilitiesPromise_)) {
      this.getCapabilitiesPromise_ = this.getImpl().getCapabilities();
    }
    return this.getCapabilitiesPromise_;
  }

  /**
   * Devuelve la extensión de la capa.
   * @returns {Array} Devuelve la extensión de la capa.
   */
  getMaxExtent() {
    return this.getImpl().getMaxExtent();
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

    if (obj instanceof WMTS) {
      equals = (this.url === obj.url);
      equals = equals && (this.name === obj.name);
      equals = equals && (this.matrixSet === obj.matrixSet);
    }

    return equals;
  }

  /**
   * Devuelve la url de los objetos geográficos.
   *
   * @function
   * @public
   * @param {Array} coordinate Coordenadas.
   * @param {Number} zoom Nivel de zoom del mapa.
   * @param {String} formatInfo Formato.
   * @api
   */
  getFeatureInfoUrl(coordinate, zoom, formatInfo) {
    return this.getImpl().getFeatureInfoUrl(coordinate, zoom, formatInfo);
  }

  /**
   * Devuelve la columna de mosaicos y la fila de la tesela.
   *
   * @function
   * @public
   * @param {Array} coordinate Coordenadas.
   * @param {Number} zoom Nivel de zoom del mapa.
   * @return {M.impl.getTileColTileRow} Columna y fila de la tesela.
   * @api
   */
  getTileColTileRow(coordinate, zoom) {
    return this.getImpl().getTileColTileRow(coordinate, zoom);
  }

  /**
   * Sobrescribe el formato.
   *
   * @function
   * @public
   * @param {String} newFormat Nuevo formato.
   * @api
   */
  setFormat(newFormat) {
    this.options.format = newFormat;
  }
}

export default WMTS;
