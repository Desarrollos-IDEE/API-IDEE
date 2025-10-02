/**
 * @module IDEE/layer/OSM
 */
import OSMImpl from 'impl/layer/OSM';
import LayerBase from './Layer';
import {
  isUndefined, isNullOrEmpty, isObject, isString,
} from '../util/Utils';
import Exception from '../exception/exception';
import * as LayerType from './Type';
import * as parameter from '../parameter/parameter';
import { getValue } from '../i18n/language';

/**
 * @classdesc
 * La API-IDEE permite visualizar la capa de Open Street Map.
 *
 * @property {String} idLayer Identificador de la capa.
 * @property {String} name Nombre de la capa, OSM.
 * @property {String} legend Indica el nombre que queremos que aparezca en
 * el árbol de contenidos, si lo hay.
 * @property {Boolean} transparent (deprecated) Falso si es una capa base,
 * verdadero en caso contrario.
 * @property {Object} options Opciones OSM.
 * @property {Boolean} isBase Define si la capa es base.
 * @api
 * @extends {IDEE.Layer}
 */
class OSM extends LayerBase {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {string|Mx.parameters.OSM} userParameters Parámetros para la construcción de la capa.
   * - attribution: Atribución de la capa.
   * - isBase: Indica si la capa es base.
   * - transparent (deprecated): Falso si es una capa base, verdadero en caso contrario.
   * - visibility: Indica si la capa estará por defecto visible o no.
   * - displayInLayerSwitcher: Indica si la capa se muestra en el selector de capas.
   * - name: Nombre de la capa en la leyenda.
   * - legend: Indica el nombre que queremos que aparezca en el árbol de contenidos, si lo hay.
   * - type: Tipo de la capa.
   * - url: Url genera la OSM.
   * - minZoom: Zoom mínimo aplicable a la capa.
   * - maxZoom: Zoom máximo aplicable a la capa.
   * - maxExtent: La medida en que restringe la visualización a una región específica.
   * - opacity: Opacidad de capa, por defecto 1.
   * @param {Mx.parameters.LayerOptions} options Estas opciones se mandarán
   * a la implementación de la capa.
   * - animated: Activa la animación para capas base o parámetros animados.
   * - minScale: Escala mínima.
   * - maxScale: Escala máxima.
   * @param {Object} vendorOptions Opciones para la biblioteca base. Ejemplo vendorOptions:
   * <pre><code>
   * import SourceOSM from 'ol/source/OSM';
   * {
   *  opacity: 0.1,
   *  source: new SourceOSM({
   *    attributions: 'osm',
   *    ...
   *  })
   * }
   * tileLoadFunction: <funcion>
   * </code></pre>
   * @api
   */
  constructor(userParametersVar, options = {}, vendorOptions = {}) {
    let userParameters = userParametersVar;

    // Checks if the implementation can create OSM.
    if (isUndefined(OSMImpl) || (isObject(OSMImpl) && isNullOrEmpty(Object.keys(OSMImpl)))) {
      Exception(getValue('exception').osm_method);
    }

    // Checks if the param is null or empty.
    if (isNullOrEmpty(userParameters)) {
      userParameters = 'OSM';
    }

    if (isString(userParameters) || !isUndefined(userParameters.transparent)) {
      // eslint-disable-next-line no-console
      console.warn(getValue('exception').transparent_deprecated);
    }

    // This layer is of parameters.
    const parameters = parameter.layer(userParameters, LayerType.OSM);
    const optionsVar = {
      ...parameters,
      ...options,
    };

    /**
     * Implementación.
     * @public
     * @implements {IDEE.layer.OSMImpl}
     * @type {IDEE.layer.OSMImpl}
     */
    const impl = new OSMImpl(parameters, optionsVar, vendorOptions);

    if (isNullOrEmpty(parameters.name)) {
      parameters.name = 'osm';
    }

    // Calls the super constructor.
    super(parameters, impl);
    this.constructorParameters = { userParametersVar, options, vendorOptions };

    /**
     * OSM name. Nombre de la capa, OSM.
     */
    this.name = parameters.name;

    /**
     * OSM legend. Indica el nombre que queremos que aparezca en el árbol de contenidos, si lo hay.
     */
    this.legend = parameters.legend;
    if (isNullOrEmpty(parameters.legend)) {
      this.legend = 'OpenStreetMap';
    }

    /**
     * OSM transparent.
     * Falso si es una capa base, verdadero en caso contrario.
     */
    this.transparent = parameters.transparent;

    /**
     * OSM options. Opciones OSM.
     */
    this.options = options;
  }

  /**
   * Sobrescribe la función de carga de teselas.
   *
   * @function
   * @public
   * @param {Function} func Función de carga de teselas.
   * @api
   */
  setTileLoadFunction(func) {
    this.getImpl().setTileLoadFunction(func);
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

    if (obj instanceof OSM) {
      equals = (this.url === obj.url);
      equals = equals && (this.name === obj.name);
      equals = equals && (this.idLayer === obj.idLayer);
    }
    return equals;
  }
}

export default OSM;
