/**
 * @module M/layer/XYZ
 */
import XYZImpl from 'impl/layer/XYZ';
import LayerBase from './Layer';
import { isUndefined } from '../util/Utils';
import Exception from '../exception/exception';
import * as parameter from '../parameter/parameter';
import * as LayerType from './Type';
import { getValue } from '../i18n/language';
/**
 * @classdesc
 * Las capas XYZ son servicios de información geográfica en forma de mosaicos.
 * Cada mosaico representa una combinación de tres parámetros.
 * Las capas XYZ tienen la siguiente estructura.
 *
 * https://URL/{z}/{x}/{y}.jpg
 *
 * Donde {z} especifica el nivel de zoom, {x} el número de columna y {y} el número de fila.
 *
 * @property {String} url Url del servicio XYZ.
 * @property {String} name Identificador de capa.
 * @property {String} legend Nombre asociado en el árbol de contenido, si usamos uno.
 * @property {Number} minZoom Limitar el zoom mínimo.
 * @property {Number} maxZoom Limitar el zoom máximo.
 * @property {Number} tileGridMaxZoom Zoom máximo de la tesela en forma de rejilla.
 * @property {Object} options Opciones de capa XYZ.
 * @property {Boolean} isbase Define si la capa es base.
 * @property {Array} maxExtent La medida en que restringe la visualización a una región específica.
 *
 * @api
 * @extends {M.layer}
 */
class XYZ extends LayerBase {
  /**
   * Constructor principal de la clase. Crea una capa XYZ
   * con parámetros especificados por el usuario.
   *
   * @constructor
   * @param {string|Mx.parameters.XYZ} userParameters Parámetros para la construcción de la capa.
   * - attribution: Atribución de la capa.
   * - name: Nombre de la capa.
   * - isBase: Indica si la capa es base.
   * - transparent (deprecated): Falso si es una capa base, verdadero en caso contrario.
   * - maxExtent: La medida en que restringe la visualización a una región específica.
   * - legend: Nombre asociado en el árbol de contenidos, si usamos uno.
   * - visibility: Indica si la capa estará por defecto visible o no.
   * - displayInLayerSwitcher: Indica si la capa se muestra en el selector de capas.
   * - url: URL del servicio XYZ.
   * - type: Tipo de la capa.
   * - tileGridMaxZoom: Zoom máximo de cuadrícula de mosaico.
   * - tileSize: Tamaño de la tesela
   * @param {Mx.parameters.LayerOptions} options Parámetros opcionales para la capa.
   * - opacity: Opacidad de capa, por defecto 1.
   * - minZoom: Zoom mínimo aplicable a la capa.
   * - maxZoom: Zoom máximo aplicable a la capa.
   * - crossOrigin: Atributo crossOrigin para las imágenes cargadas.
   * @param {Object} vendorOptions Opciones para la biblioteca base. Ejemplo vendorOptions:
   * <pre><code>
   * import XYZSource from 'ol/source/XYZ';
   * {
   *  opacity: 0.1,
   *  source: new XYZSource({
   *    attributions: 'xyz',
   *    ...
   *  })
   * }
   * </code></pre>
   * @api
   */
  constructor(userParameters, options = {}, vendorOptions = {}) {
    // checks if the implementation can create XYZ
    if (isUndefined(XYZImpl)) {
      Exception(getValue('exception').xyz_method);
    }

    const parameters = parameter.layer(userParameters, LayerType.XYZ);
    /**
     * Implementación de esta capa.
     * @public
     * @implements {M.impl.layer.XYZ}
     * @type {M.impl.layer.XYZ}
     */

    const optionsVar = options;

    if (typeof userParameters !== 'string') {
      optionsVar.maxExtent = userParameters.maxExtent;
    }

    const impl = new XYZImpl(userParameters, optionsVar, vendorOptions);
    // calls the super constructor
    super(parameters, impl);
    /**
     * XYZ url: Url del servicio XYZ.
     */
    this.url = parameters.url;

    /**
     * XYZ maxextent: Extensión de visualización
     */
    this.userMaxExtent = userParameters.maxExtent;

    /**
     * XYZ name: Identificador de capa.
     */
    this.name = parameters.name;
    /**
     * XYZ legend: Nombre asociado en el árbol de contenido, si usamos uno.
     */
    this.legend = parameters.legend;

    /**
     * XYZ tileGridMaxZoom. Zoom máximo de cuadrícula de mosaico.
     */
    this.tileGridMaxZoom = parameters.tileGridMaxZoom || userParameters.tileGridMaxZoom;

    if (isUndefined(this.tileGridMaxZoom)) {
      /**
       * XYZ minZoom: Límite del zoom mínimo.
       */
      this.minZoom = options.minZoom || Number.NEGATIVE_INFINITY;

      /**
       * XYZ maxZoom: Límite del zoom máximo.
       */
      this.maxZoom = options.maxZoom || Number.POSITIVE_INFINITY;
    }

    /**
     * XYZ options: Opciones de la capa.
     */
    this.options = options;
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
    if (obj instanceof XYZ) {
      equals = (this.url === obj.url);
      equals = equals && (this.name === obj.name);
      equals = equals && (this.options === obj.options);
    }
    return equals;
  }
}

export default XYZ;
