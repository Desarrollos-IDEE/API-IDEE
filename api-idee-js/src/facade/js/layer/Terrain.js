/**
 * @module M/layer/Terrain
 */
import TerrainImpl from 'impl/layer/Terrain';
import LayerBase from './Layer';
import { isUndefined, isNullOrEmpty, isObject } from '../util/Utils';
import Exception from '../exception/exception';
import * as LayerType from './Type';
import * as parameter from '../parameter/parameter';
import { getValue } from '../i18n/language';

/**
 * @classdesc
 * Capa Terrain. Es un tipo de capa compuesta por datos que proporcionan información
 * sobre las elevaciones y características del terreno.
 *
 * @property {String} url Url del servicio Terrain.
 * @property {String} name Identificador de capa.
 * @property {String} legend Indica el nombre que queremos que aparezca en
 * el árbol de contenidos, si lo hay.
 * @property {Object} options Opciones de la capa.
 *
 * @api
 * @extends {M.Layer}
 */
class Terrain extends LayerBase {
  /**
   * Constructor principal de la clase. Crea una capa Terrain
   * con parámetros especificados por el usuario.
   *
   * Sólo disponible para implementación Cesium.
   *
   * @constructor
   * @param {String|Mx.parameters.Terrain} userParametersVar Parámetros para la construcción
   * de la capa, estos parámetros los proporciona el usuario.
   * - attribution: Atribución de la capa.
   * - url: Url del servicio de la capa.
   * - isBase: Indica si la capa es base.
   * - transparent (deprecated): Falso si es una capa base, verdadero en caso contrario.
   * - name: Nombre de la capa en la leyenda.
   * - legend: Indica el nombre que queremos que aparezca en el árbol de contenidos, si lo hay.
   * - visibility: Indica si la capa estará por defecto visible o no.
   * - type: Tipo de la capa.
   * - displayInLayerSwitcher: Indica si la capa se muestra en el selector de capas.
   * @param {Mx.parameters.LayerOptions} options Estas opciones se mandarán a la implementación.
   * - requestWaterMask: Indica si se cargan las texturas de las áreas del mapa cubiertas por agua,
   * como el sombreado o las animaciones de las olas.
   * @param  {Object} vendorOptions Opciones para la biblioteca base.
   * @api
   */
  constructor(userParameters, options = {}, vendorOptions = {}) {
    // Comprueba si la implementación puede crear capas Terrain
    if (isUndefined(TerrainImpl) || (isObject(TerrainImpl)
      && isNullOrEmpty(Object.keys(TerrainImpl)))) {
      Exception(getValue('exception').terrain_method);
    }

    const parameters = parameter.layer(userParameters, LayerType.Terrain);

    /**
     * Implementación
     * @public
     * @implements {M.impl.layer.Terrain}
     * @type {M.impl.layer.Terrain}
     */
    const impl = new TerrainImpl(userParameters, options, vendorOptions);
    // calls the super constructor
    super(parameters, impl);

    /**
     * Terrain url: Url del servicio Terrain.
     */
    this.url = parameters.url;

    /**
     * Terrain name: Identificador de la capa.
     */
    this.name = parameters.name;

    /**
     * Terrain legend: Indica el nombre que queremos que aparezca
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
     * Terrain maxextent: Extensión de visualización (No disponible para este tipo de capas)
     */
    this.userMaxExtent = undefined;

    /**
     * Terrain options. Opciones de capa.
     */
    this.options = options;
  }

  /**
   * Este método cambia la extensión máxima de la capa.
   *
   * @function
   * @api
   * @export
   */
  setMaxExtent() {}

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
   * Este método establece el índice z de esta capa.
   *
   * @function
   * @param {Number} zIndex Índice de la capa.
   * @api stable
   * @expose
   */
  setZIndex(zIndex) {
    // eslint-disable-next-line no-console
    console.error(getValue('exception').index_error);
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
    if (obj instanceof Terrain) {
      equals = (this.url === obj.url);
      equals = equals && (this.name === obj.name);
      equals = equals && (this.options === obj.options);
    }
    return equals;
  }
}

export default Terrain;
