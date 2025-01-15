/**
 * @module M/impl/layer/XYZ
 */
import { isNullOrEmpty, extend } from 'M/util/Utils';
import {
  getValue,
} from 'M/i18n/language';
import {
  ImageryLayer,
  UrlTemplateImageryProvider,
  Rectangle,
} from 'cesium';
import Layer from './Layer';

/**
 * @classdesc
 * Las capas XYZ son servicios de información geográfica en forma de mosaicos.
 * Cada mosaico representa una combinación de tres parámetros.
 * Las capas XYZ tienen la siguiente estructura.
 *
 * https://www.ign.es/web/catalogo-cartoteca/resources/webmaps/data/cresques/{z}/{x}/{y}.jpg
 *
 * Donde {z} especifica el nivel de zoom, {x} el número de columna y {y} el número de fila.
 *
 * @property {String} url Url del servicio XYZ.
 * @property {Boolean} visibility Define si la capa es visible o no.
 * @property {Number} minZoom Limitar el zoom mínimo.
 * @property {Number} maxZoom Limitar el zoom máximo.
 * @property {Number} tileGridMaxZoom Zoom máximo de la tesela en forma de rejilla.
 * @property {Boolean} displayInLayerSwitcher Mostrar en el selector de capas.
 *
 * @api
 * @extends {M.impl.layer.Vector}
 */
class XYZ extends Layer {
  /**
   * Constructor principal de la clase. Crea una capa XYZ
   * con parámetros especificados por el usuario.
   *
   * @constructor
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
   * @param {Object} vendorOptions Opciones para la biblioteca base. Ejemplo vendorOptions:
   * <pre><code>
   * import { Rectangle } from 'cesium';
   * {
   *  alpha: 0.5,
   *  show: true,
   *  rectangle: Rectangle.fromDegrees(-8.31, -5.69, 5.35, 8.07),
   *  ...
   * }
   * </code></pre>
   * @api stable
   */
  constructor(userParameters, options = {}, vendorOptions = {}) {
    super(options, vendorOptions);

    /**
     * XYZ url.
     * La URL de origen de la capa xyz.
     */
    this.url = userParameters.url;

    /**
     * XYZ tileSize_.
     * Tamaño de la tesela, por defecto 256.
     */
    this.tileSize_ = typeof userParameters.tileSize === 'number' ? userParameters.tileSize : 256;

    /**
     * XYZ opacity_.
     * Opacidad de la capa.
     */
    this.opacity_ = typeof options.opacity === 'number' ? options.opacity : 1;

    /**
     * XYZ visibility.
     * Define si la capa es visible o no.
     */
    this.visibility = userParameters.visibility === false ? userParameters.visibility : true;

    /**
     * XYZ minZoom.
     * Zoom mínimo aplicable a la capa.
     */
    this.minZoom = options.minZoom || Number.NEGATIVE_INFINITY;

    /**
     * XYZ maxZoom.
     * Zoom máximo aplicable a la capa.
     */
    this.maxZoom = options.maxZoom || Number.POSITIVE_INFINITY;

    /**
     * XYZ tileGridMaxZoom.
     * Zoom máximo de la tesela en forma de rejilla.
     */
    this.tileGridMaxZoom = userParameters.tileGridMaxZoom;

    /**
     * XYZ displayInLayerSwitcher:
     * Mostrar en el selector de capas.
     */
    this.displayInLayerSwitcher = userParameters.displayInLayerSwitcher !== false;
  }

  /**
   * Este método establece la visibilidad de esta capa.
   *
   * @public
   * @function
   * @param {Boolean} visibility Verdadero es visible, falso si no.
   * @api
   */
  setVisible(visibility) {
    this.visibility = visibility;
    // if this layer is base then it hides all base layers
    if ((visibility === true) && (this.transparent !== true)) {
      // set this layer visible
      if (!isNullOrEmpty(this.cesiumLayer)) {
        this.cesiumLayer.show = visibility;
      }
    } else if (!isNullOrEmpty(this.cesiumLayer)) {
      this.cesiumLayer.show = visibility;
    }
  }

  /**
   * Este método añade la capa al mapa de la implementación.
   *
   * @public
   * @function
   * @param {M.impl.Map} map Mapa de la implementación.
   * @api
   */
  addTo(map) {
    this.map = map;
    const extent = this.userMaxExtent || [-180, -90, 180, 90];

    this.url = this.url.replace('{-z}', '{reverseZ}');
    this.url = this.url.replace('{-x}', '{reverseX}');
    this.url = this.url.replace('{-y}', '{reverseY}');

    const optCesiumLayer = extend({
      minimumTerrainLevel: this.minZoom,
      maximumTerrainLevel: this.maxZoom - 1,
      rectangle: Rectangle.fromDegrees(extent[0], extent[1], extent[2], extent[3]),
      alpha: this.opacity_,
      show: this.visibility,
    }, this.vendorOptions_, true);

    this.cesiumLayer = new ImageryLayer(
      this.addProvider_(),
      optCesiumLayer,
    );

    const zIndex = this.facadeLayer_.isBase ? 0 : null;
    this.map.getMapImpl().imageryLayers.add(this.cesiumLayer, zIndex);
  }

  /**
   * Este método obtiene el proveedor de Cesium para añadir la capa.
   *- ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @returns {cesium.UrlTemplateImageryProvider} Proveedor de la capa.
   * @api
   */
  addProvider_() {
    const url = this.url;
    return new UrlTemplateImageryProvider({
      url,
      tileWidth: this.getTileSize(),
      tileHeight: this.getTileSize(),
      maximumLevel: this.tileGridMaxZoom,
    });
  }

  /**
   * Este método modifica la url de la tesela.
   * No disponible para Cesium.
   *
   * @public
   * @function
   * @param {String} tileUrlFunction Nueva URL tesela.
   * @api
   */
  setTileUrlFunction(tileUrlFunction) {
    // eslint-disable-next-line no-console
    console.warn(getValue('exception').no_settileurlfunction);
  }

  /**
   * Este método devuelve la url de la tesela actual.
   *
   * @public
   * @function
   * @returns {undefined} URL tesela.
   * @api
   */
  getTileUrlFunction() {
    return undefined;
  }

  /**
   * Este método devuelve el tamaño de la tesela de la capa.
   *
   * @public
   * @function
   * @return {M.layer.XYZ.impl.tileSize_}  Tamaño de la tesela.
   * @api
   */
  getTileSize() {
    return this.tileSize_;
  }

  /**
   * Este método destruye esta capa, limpiando el HTML
   * y anulando el registro de todos los eventos.
   *
   * @public
   * @function
   * @api
   */
  destroy() {
    const cesiumMap = this.map.getMapImpl();
    if (!isNullOrEmpty(this.cesiumLayer)) {
      cesiumMap.imageryLayers.remove(this.cesiumLayer);
      this.cesiumLayer = null;
    }
    this.map = null;
  }

  /**
   * Este método establece la clase de fachada XYZ.
   * La fachada se refiere a
   * un patrón estructural como una capa de abstracción con un patrón de diseño.
   *
   * @function
   * @param {object} obj XYZ de la fachada.
   * @api stable
   */
  setFacadeObj(obj) {
    this.facadeLayer_ = obj;
  }

  /**
   * Este método comprueba si un objeto es igual
   * a esta capa.
   *
   * @function
   * @param {Object} obj Objeto a comparar.
   * @returns {Boolean} Verdadero es igual, falso si no.
   * @api
   */
  equals(obj) {
    let equals = false;
    if (obj instanceof XYZ) {
      equals = (this.name === obj.name);
    }
    return equals;
  }
}
export default XYZ;
