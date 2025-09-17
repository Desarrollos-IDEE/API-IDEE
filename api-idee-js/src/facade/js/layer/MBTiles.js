/**
 * @module IDEE/layer/MBTiles
 */
import MBTilesImpl from 'impl/layer/MBTiles';
import LayerBase from './Layer';
import * as LayerType from './Type';
import {
  isUndefined, isObject, isNullOrEmpty, isString,
} from '../util/Utils';
import Exception from '../exception/exception';
import { getValue } from '../i18n/language';
import * as parameter from '../parameter/parameter';

/**
 * @classdesc
 * MBtiles es un formato que permite agrupar múltiples capas, tanto
 * vectoriales como raster, en un contenedor SQLite.
 *
 * @property {String} idLayer Identificador de la capa.
 * @property {string} url Url del archivo o servicio que genera el MBTiles.
 * @property {ArrayBuffer|Uint8Array|Response|File} source Respuesta de la petición a
 * un servicio que genera el MBTiles.
 * @property {string} name Nombre de la capa, identificador.
 * @property {string} legend Leyenda de la capa.
 * @property {object} options Opciones MBTiles.
 * @property {Boolean} transparent (deprecated) Falso si es una capa base,
 * verdadero en caso contrario.
 * @property {Boolean} isBase Define si la capa es base.
 *
 * @api
 * @extends {IDEE.Layer}
 */
class MBTiles extends LayerBase {
  /**
   * Constructor principal de la clase. Crea una capa MBTiles
   * con parámetros especificados por el usuario.
   *
   * @constructor
   * @param {string|Mx.parameters.MBTiles} userParameters Parámetros para
   * la construcción de la capa,
   * estos parámetros los proporciona el usuario.
   * - name: Nombre de la capa en la leyenda.
   * - url: Url del fichero o servicio que genera el MBTiles.
   * - type: Tipo de la capa.
   * - maxZoomLevel: Zoom máximo aplicable a la capa.
   * - transparent (deprecated): Falso si es una capa base, verdadero en caso contrario.
   * - maxExtent: La medida en que restringe la visualización a una región específica.
   * - legend: Indica el nombre que aparece en el árbol de contenidos, si lo hay.
   * - tileLoadFunction: Función de carga de la tesela proporcionada por el usuario.
   * - source: Fuente de la capa.
   * - tileSize: Tamaño de la tesela, por defecto 256.
   * - visibility: Define si la capa es visible o no. Verdadero por defecto.
   * - opacity: Opacidad de capa, por defecto 1.
   * - isBase: Indica si la capa es base.
   * @param {Mx.parameters.LayerOptions} options Estas opciones se mandarán a la implementación.
   * Están proporcionados por el usuario.
   * - displayInLayerSwitcher: Indica si la capa se muestra en el selector de capas.
   * - minZoom. Zoom mínimo aplicable a la capa.
   * - maxZoom. Zoom máximo aplicable a la capa.
   * - minScale: Escala mínima.
   * - maxScale: Escala máxima.
   * - crossOrigin: Atributo crossOrigin para las imágenes cargadas.
   * @param {Object} vendorOptions Opciones para la biblioteca base. Ejemplo vendorOptions:
   * <pre><code>
   * import OLTileGrid from 'ol/tilegrid/TileGrid';
   * import MBTilesSource from 'IDEE/source/MBTiles';
   * {
   *  source: new MBTilesSource({
   *    tileGrid: new OLTileGrid({
   *      extent: ...,
   *      ...
   *    })
   *  })
   * }
   * </code></pre>
   * @api
   */
  constructor(userParameters, options = {}, vendorOptions = {}) {
    // checks if the implementation can create MBTiles
    if (isUndefined(MBTilesImpl) || (isObject(MBTilesImpl)
      && isNullOrEmpty(Object.keys(MBTilesImpl)))) {
      Exception(getValue('exception').mbtiles_method);
    }

    if (isString(userParameters) || !isUndefined(userParameters.transparent)) {
      // eslint-disable-next-line no-console
      console.warn(getValue('exception').transparent_deprecated);
    }

    const parameters = parameter.layer(userParameters, LayerType.MBTiles);
    const optionsVar = options;

    /**
     * Implementación
     * @public
     * @implements {IDEE.impl.layer.MBTiles}
     * @type {IDEE.impl.layer.MBTilesVector}
     */
    const impl = new MBTilesImpl(parameters, options, vendorOptions);

    // calls the super constructor
    super(parameters, impl);
    this.constructorParameters = { userParameters, options, vendorOptions };

    /**
     * MBTiles name: Nombre de la capa.
     */
    this.name = parameters.name;

    /**
     * MBTiles legend: Indica el nombre que aparece en el árbol
     * de contenidos, si lo hay.
     */
    this.legend = parameters.legend;

    /**
     * MBTiles source: Respuesta de la petición a un servicio que
     * genera el MBTiles.
     */
    this.source = parameters.source;

    /**
     * MBTiles url: Url del archivo o servicio que genera
     * el MBTiles.
     */
    this.url = parameters.url;

    /**
     * MBTiles minZoom: Límite del zoom mínimo.
     * @public
     * @type {Number}
     */
    this.minZoom = optionsVar.minZoom || Number.NEGATIVE_INFINITY;

    /**
     * MBTiles maxZoom: Límite del zoom máximo.
     * @public
     * @type {Number}
     */
    this.maxZoom = optionsVar.maxZoom || Number.POSITIVE_INFINITY;

    /**
     * MBTiles options: Opciones que se mandan a la implementación.
     */
    this.options = options;
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
    if (obj instanceof MBTiles) {
      equals = (this.url === obj.url);
      equals = equals && (this.legend === obj.legend);
      equals = equals && (this.name === obj.name);
      equals = equals && (this.idLayer === obj.idLayer);
    }
    return equals;
  }
}
export default MBTiles;
