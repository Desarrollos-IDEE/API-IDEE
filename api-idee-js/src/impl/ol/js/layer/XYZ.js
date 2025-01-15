/**
 * @module M/impl/layer/XYZ
 */
import { isNullOrEmpty, extend } from 'M/util/Utils';
import OLTileLayer from 'ol/layer/Tile';
import { get as getProj } from 'ol/proj';
import XYZSource from 'ol/source/XYZ';
import * as LayerType from '../../../../facade/js/layer/Type';
import Layer from './Layer';
import ImplMap from '../Map';

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
   * @param {Mx.parameters.XYZ} userParameters Parámetros para la construcción de la capa.
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
   *    attributions: 'xyz',
   *    ...
   *  })
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
     * XYZ zIndex_.
     * zIndex de la capa.
     */
    this.zIndex_ = ImplMap.Z_INDEX[LayerType.XYZ];

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

    /**
     * CrossOrigin: Atributo crossOrigin para las imágenes cargadas.
     */
    this.crossOrigin = (options.crossOrigin === null || options.crossOrigin === false) ? undefined : 'anonymous';
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
      if (!isNullOrEmpty(this.ol3Layer)) {
        this.ol3Layer.setVisible(visibility);
      }

      // updates resolutions and keep the zoom
      const oldZoom = this.map.getZoom();
      this.map.getImpl().updateResolutionsFromBaseLayer();
      if (!isNullOrEmpty(oldZoom)) {
        this.map.setZoom(oldZoom);
      }
    } else if (!isNullOrEmpty(this.ol3Layer)) {
      this.ol3Layer.setVisible(visibility);
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
  addTo(map, addLayer = true) {
    this.map = map;
    const projection = getProj('EPSG:3857');
    const extent = projection.getExtent();
    this.ol3Layer = new OLTileLayer(extend({
      visible: this.visibility,
      opacity: this.opacity_,
      zIndex: this.zIndex_,
      extent: this.userMaxExtent || extent,
    }, this.vendorOptions_, true));

    if (addLayer) {
      this.map.getMapImpl().addLayer(this.ol3Layer);
    }
    let source = this.vendorOptions_.source;
    if (isNullOrEmpty(source)) {
      source = new XYZSource({
        projection: this.map.getProjection().code,
        url: this.url,
        tileSize: this.getTileSize(),
        crossOrigin: this.crossOrigin,
      });
    }
    this.ol3Layer.setSource(source);
    if (this.tileGridMaxZoom !== undefined && this.tileGridMaxZoom > 0) {
      this.ol3Layer.getSource().tileGrid.maxZoom = this.tileGridMaxZoom;
    } else {
      this.ol3Layer.setMaxZoom(this.maxZoom);
      this.ol3Layer.setMinZoom(this.minZoom);
    }
  }

  /**
   * Este método modifica la url de la tesela.
   *
   * @public
   * @function
   * @param {String} tileUrlFunction Nueva URL tesela.
   * @api
   */
  setTileUrlFunction(tileUrlFunction) {
    this.ol3Layer.getSource().setTileUrlFunction(tileUrlFunction);
  }

  /**
   * Este método devuelve la url de la tesela actual.
   *
   * @public
   * @function
   * @returns {M.layer.XYZ.impl.ol3Layer.getSource.getTileUrlFunction} URL tesela.
   * @api
   */
  getTileUrlFunction() {
    this.ol3Layer.getSource().getTileUrlFunction();
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
    const olMap = this.map.getMapImpl();
    if (!isNullOrEmpty(this.ol3Layer)) {
      olMap.removeLayer(this.ol3Layer);
      this.ol3Layer = null;
    }
    this.map = null;
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
