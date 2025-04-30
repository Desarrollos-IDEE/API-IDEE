/**
 * @module IDEE/layer/Tiles3D
 */
import Tiles3DImpl from 'impl/layer/Tiles3D';
import LayerBase from './Layer';
import {
  isNullOrEmpty,
  isUndefined,
  isString,
  normalize,
  isObject,
} from '../util/Utils';
import Exception from '../exception/exception';
import * as LayerType from './Type';
import * as parameter from '../parameter/parameter';
import { getValue } from '../i18n/language';

/**
 * @classdesc
 * Capa Tiles3D
 *
 * @property {String} url Url del servicio Tiles3D.
 * @property {String} name Identificador de capa.
 * @property {String} legend Indica el nombre que queremos que aparezca en
 * el árbol de contenidos, si lo hay.
 * @property {Object} options Opciones de la capa.
 *
 * @api
 * @extends {IDEE.Layer}
 */
class Tiles3D extends LayerBase {
  /**
   * Constructor principal de la clase. Crea una capa Tiles3D
   * con parámetros especificados por el usuario.
   *
   * Solo disponible para Cesium.
   *
   * @constructor
   * @param {String|Mx.parameters.Tiles3D} userParametersVar Parámetros para la construcción
   * de la capa, estos parámetros los proporciona el usuario.
   * - url: Url del servicio de la capa.
   * - name: Nombre de la capa en la leyenda.
   * - legend: Indica el nombre que queremos que aparezca en el árbol de contenidos, si lo hay.
   * - visibility: Indica si la capa estará por defecto visible o no.
   * - type: Tipo de la capa.
   * - displayInLayerSwitcher: Indica si la capa se muestra en el selector de capas.
   * - attribution: Atribución de la capa.
   * - isBase: Este tipo de capa no podrá ser capa base.
   * - transparent (deprecated): Falso si es una capa base, verdadero en caso contrario.
   * - extract: Opcional, activa la consulta por click en el objeto geográfico, por defecto falso.
   * - infoEventType: Parametriza el método de activación del popup para obtener la información
   *   de un feature ('click' / 'hover'), por defecto 'click'.
   * @param {Mx.parameters.LayerOptions} options Estas opciones se mandarán a la implementación.
   * - style: Define el estilo de la capa.
   * - maximumScreenSpaceError: Error máximo de espacio en pantalla.
   * - clippingPlanes: Planos de recorte.
   * - minScale: Escala mínima.
   * - maxScale: Escala máxima.
   * @param {Object} vendorOptions Opciones para la biblioteca base.
   * @api
   */
  constructor(userParameters, options = {}, vendorOptions = {}) {
    // Checks if the implementation can create Tiles3D.
    if (isUndefined(Tiles3DImpl) || (isObject(Tiles3DImpl)
      && isNullOrEmpty(Object.keys(Tiles3DImpl)))) {
      Exception(getValue('exception').tiles3d_method);
    }

    if (isString(userParameters) || !isUndefined(userParameters.transparent)) {
      // eslint-disable-next-line no-console
      console.warn(getValue('exception').transparent_deprecated);
    }

    const parameters = parameter.layer(userParameters, LayerType.Tiles3D);

    const optionsVar = options;

    /**
     * Implementación.
     * @public
     * @implements {IDEE.layer.Tiles3DImpl}
     * @type {IDEE.layer.Tiles3DImpl}
     */
    const impl = new Tiles3DImpl(userParameters, optionsVar, vendorOptions);
    // Calls the super constructor.
    super(parameters, impl);

    /**
     * Tiles3D maxextent: Extensión de visualización
    */
    this.userMaxExtent = null;

    /**
     * Tiles3D url. Url del servicio Tiles3D.
     */
    this.url = parameters.url;

    /**
     * Tiles3D name. Nombre de la capa, Tiles3D.
     */
    this.name = parameters.name;

    /**
     * Tiles3D extract.
     * Activa la consulta por click en el objeto geográfico.
     * Por defecto, falso.
     */
    this.extract = !isNullOrEmpty(userParameters.extract) ? userParameters.extract : false;

    /**
     * Tiles3D infoEventType.
     * Parametriza el método de activación del popup para obtener la información
     * de un feature ('click' / 'hover'), por defecto 'click'.
     */
    this.infoEventType = userParameters.infoEventType || 'click';

    /**
     * Tiles3D legend. Indica el nombre que queremos que aparezca
     * en el árbol de contenidos, si lo hay.
     */
    this.legend = parameters.legend;

    /**
     * Zoom mínimo aplicable a la capa.
    */
    this.minZoom = Number.NEGATIVE_INFINITY;

    /**
      * Zoom máximo aplicable a la capa.
    */
    this.maxZoom = Number.POSITIVE_INFINITY;

    /**
     * Tiles3D options. Opciones de capa.
     */
    this.options = options;
  }

  /**
   * Este método indica la extensión máxima de la capa.
   *
   * @function
   * @returns {Array} Devuelve la extensión de
   * los objeto geográfico.
   * @api
   */
  getMaxExtent() {
    return this.getImpl().getMaxExtent();
  }

  /**
   * Devuelve el valor de la propiedad "extract". La propiedad "extract" tiene la
   * siguiente función: Activa la consulta al hacer clic en la característica, por defecto falso.
   *
   * @function
   * @getter
   * @return {Boolean} Valor de la propiedad "extract".
   * @api
   */
  get extract() {
    return this.getImpl().extract;
  }

  /**
     * Sobrescribe el valor de la propiedad "extract". La propiedad "extract" tiene la
     * siguiente función: Activa la consulta al hacer clic en la característica, por defecto falso.
     *
     * @function
     * @setter
     * @param {Boolean|String} newExtract Nuevo valor para sobreescribir la propiedad "extract".
     * @api
  */
  set extract(newExtract) {
    if (!isNullOrEmpty(newExtract)) {
      if (isString(newExtract)) {
        this.getImpl().extract = (normalize(newExtract) === 'true');
      } else {
        this.getImpl().extract = newExtract;
      }
    } else {
      this.getImpl().extract = false;
    }
  }

  /**
   * Este método cambia la extensión máxima de la capa.
   *
   * @function
   * @param {String} maxExtent Nuevo valor para el "MaxExtent".
   * @api
   * @export
   */
  setMaxExtent(maxExtent) {}

  /**
   * Este método Sobrescribe el mínimo zoom aplicable a la capa.
   *
   * @function
   * @param {Number} zoom Nuevo zoom mínimo.
   * @api
   */
  setMinZoom(zoom) {}

  /**
   * Este método Sobrescribe el zoom máximo aplicable a la capa.
   *
   * @function
   * @param {Number} zoom Nuevo zoom.
   * @api
  */
  setMaxZoom(zoom) {}

  /**
   * Este método devuelve el estilo de la capa.
   *
   * @function
   * @public
   * @returns {Object} Estilo de la capa.
   * @api
   */
  getStyle() {
    return this.getImpl().getStyle();
  }

  /**
   * Este método establece el estilo en capa.
   *
   * @function
   * @public
   * @param {Object} style Estilo que se aplicará a la capa.
   * @api
   */
  setStyle(style) {
    if (!isNullOrEmpty(style)) {
      this.getImpl().setStyle(style);
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
    if (obj instanceof Tiles3D) {
      equals = (this.url === obj.url);
      equals = equals && (this.name === obj.name);
      equals = equals && (this.options === obj.options);
    }
    return equals;
  }
}

export default Tiles3D;
