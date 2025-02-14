/**
 * @module M/impl/layer/TMS
 */
import MXYZ from './XYZ';
import * as LayerType from '../../../../facade/js/layer/Type';
import ImplMap from '../Map';

/**
 * @classdesc
 * Las capas TMS (Tile Map Service) son servicios de información geográfica en
 * forma de mosaicos muy similar a las capas XYZ. El protocolo TMS de OSGeo permite mosaicos
 * para usar índices numéricos y proporcionar metadatos para la configuración
 * e investigación. Las capas TMS tienen la siguiente estructura:
 *
 * https://tms-ign-base.idee.es/1.0.0/IGNBaseTodo/{z}/{x}/{-y}.jpeg
 *
 * {z} especifica el nivel de zoom; {x} el número de columna; {y} el número de fila.
 *
 * @api
 * @extends {M.impl.layer.XYZ}
 */
class TMS extends MXYZ {
  /**
   * Constructor principal de la clase. Crea una capa TMS
   * con parámetros especificados por el usuario.
   *
   * @constructor
   * @implements {M.impl.layer.Vector}
   * @param {Mx.parameters.TMS} userParameters Parámetros para la construcción de la capa.
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
   * - displayInLayerSwitcher: Indica si la capa se muestra en el selector de capas.
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
   *    attributions: 'tms',
   *    ...
   *  })
   * }
   * </code></pre>
   * @api stable
   */
  constructor(userParameters, options = {}, vendorOptions = {}) {
    super(userParameters, options, vendorOptions);

    /**
     * TMS zIndex_. Indice de la capa, (+40).
     */
    this.zIndex_ = ImplMap.Z_INDEX[LayerType.TMS];

    /**
     * TMS displayInLayerSwitcher. Indica si la capa se muestra en el selector de capas.
     */
    this.displayInLayerSwitcher = userParameters.displayInLayerSwitcher !== false;
  }

  /**
   * Este método comprueba si un objeto es igual
   * a esta capa.
   *
   * @function
   * @param {Object} obj Objeto a comparar.
   * @returns {Boolean} Verdadero es igual, falso si no.
   * @api stable
   */
  equals(obj) {
    let equals = false;
    if (obj instanceof TMS) {
      equals = (this.name === obj.name);
    }
    return equals;
  }
}
export default TMS;
