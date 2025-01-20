/**
 * @module M/impl/layer/Terrain
 */
import { isNullOrEmpty, extend } from 'M/util/Utils';
import { CesiumTerrainProvider, EllipsoidTerrainProvider } from 'cesium';
import { getValue } from 'M/i18n/language';
import * as EventType from 'M/event/eventtype';
import Layer from './Layer';

/**
 * @classdesc
 * Capa Terrain. Es un tipo de capa compuesta por datos que proporcionan información
 * sobre las elevaciones y características del terreno.
 *
 *
 * @property {String} url Url del servicio Terrain.
 * @property {Boolean} visibility Define si la capa es visible o no.
 * @property {Boolean} displayInLayerSwitcher Mostrar en el selector de capas.
 *
 * @api
 * @extends {M.impl.Layer}
 */
class Terrain extends Layer {
  /**
   * Constructor principal de la clase. Crea una capa Terrain
   * con parámetros especificados por el usuario.
   *
   * @constructor
   * @param {Mx.parameters.Terrain} userParameters Parámetros para la construcción de la capa.
   * - attribution: Atribución de la capa.
   * - name: Nombre de la capa.
   * - isBase: Este tipo de capa no podrá ser capa base.
   * - transparent (deprecated): Falso si es una capa base, verdadero en caso contrario.
   * - legend: Nombre asociado en el árbol de contenidos, si usamos uno.
   * - visibility: Indica si la capa estará por defecto visible o no.
   * - displayInLayerSwitcher: Indica si la capa se muestra en el selector de capas.
   * - url: URL del servicio XYZ.
   * - type: Tipo de la capa.
   * @param {Mx.parameters.LayerOptions} options Parámetros opcionales para la capa.
   * - requestWaterMask: Indica si se cargan las texturas de las áreas del mapa cubiertas por agua,
   * como el sombreado o las animaciones de las olas.
   * @param {Object} vendorOptions Opciones para la biblioteca base. Ejemplo vendorOptions:
   * @api stable
   */
  constructor(userParameters, options = {}, vendorOptions = {}) {
    super(options, vendorOptions);

    /**
      * Terrain url.
      * La URL de origen de la capa Terrain.
      */
    this.url = userParameters.url;

    /**
     * Terrain zIndex_.
     * zIndex de la capa.
     */
    this.zIndex_ = 0;

    /**
     * Terrain visibility.
     * Define si la capa es visible o no.
     */
    this.visibility = userParameters.visibility === false ? userParameters.visibility : true;

    /**
     * Terrain displayInLayerSwitcher:
     * Mostrar en el selector de capas.
     */
    this.displayInLayerSwitcher = userParameters.displayInLayerSwitcher !== false;

    /**
     * Terrain requestWaterMask.
     * Indica si se muestra las animaciones de las olas.
     */
    this.requestWaterMask = options.requestWaterMask === true ? options.requestWaterMask : false;

    /**
     * Terrain options. Opciones personalizadas para esta capa.
     */
    this.options = options;

    this.isLoaded_ = false;
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

    if (!isNullOrEmpty(this.cesiumLayer)) {
      if (this.visibility === false) {
        this.map.getMapImpl().terrainProvider = new EllipsoidTerrainProvider();
      } else {
        this.map.getMapImpl().terrainProvider = this.cesiumLayer;
      }
    }
  }

  /**
   * Este método indica si la capa es visible.
   *
   * @function
   * @returns {Boolean} Verdadero es visible, falso si no.
   * @api stable
   * @expose
   */
  isVisible() {
    let visible = false;
    if (!isNullOrEmpty(this.cesiumLayer)) {
      if (this.map.getMapImpl().terrainProvider instanceof EllipsoidTerrainProvider) {
        visible = false;
      } else {
        visible = true;
      }
    } else {
      visible = this.visibility;
    }
    return visible;
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

    const optCesiumLayer = extend({
      requestWaterMask: this.requestWaterMask,
    }, this.vendorOptions_, true);

    const promise = CesiumTerrainProvider.fromUrl(
      this.url,
      optCesiumLayer,
    );
    promise.then((terrain) => {
      this.cesiumLayer = terrain;
      this.map.getMapImpl().terrainProvider = terrain;

      this.setVisible(this.visibility);

      // zIndex
      const facadeLayer = this.map.getLayers()
        .find((layer) => layer.getImpl().getLayer() === this.cesiumLayer);
      // eslint-disable-next-line no-underscore-dangle
      facadeLayer.zindex_ = this.getZIndex();
      facadeLayer.isBase = false;

      this.fire(EventType.LOAD_TERRAIN);
      this.isLoaded_ = true;
    });
  }

  /**
   * Este método devuelve el zoom mínimo de esta capa.
   *
   * @function
   * @returns {Number} Devuelve el zoom mínimo aplicable a la capa.
   * @api stable
   * @expose
   */
  getMinZoom() {}

  /**
   * Este método establece el zoom mínimo de esta capa.
   *
   * @function
   * @param {Number} zoom Zoom mínimo aplicable a la capa.
   * @api stable
   * @expose
   */
  setMinZoom(zoom) {}

  /**
   * Este método devuelve el zoom máximo de esta capa.
   *
   * @function
   * @returns {Number} Zoom máximo aplicable a la capa.
   * @api stable
   * @expose
   */
  getMaxZoom() {}

  /**
   * Este método establece el zoom máximo de esta capa.
   *
   *
   * @function
   * @param {Number} zoom Zoom máximo aplicable a la capa.
   * @api stable
   * @expose
   */
  setMaxZoom(zoom) {}

  /**
   * Este método devuelve el índice z de esta capa.
   *
   * @function
   * @return {Number} Índice de la capa.
   * @api stable
   * @expose
   */
  getZIndex() {
    return this.zIndex_;
  }

  /**
   * Este método establece el índice z de esta capa.
   *
   * @function
   * @param {Number} zIndex Índice de la capa.
   * @api stable
   * @expose
   */
  setZIndex(zIndex) {
    if (!isNullOrEmpty(this.getLayer())) {
      this.zIndex_ = 0;
      this.map.getLayers().forEach((layer) => {
        const layerImpl = layer.getImpl().getLayer();
        if (layerImpl instanceof CesiumTerrainProvider
          || layerImpl instanceof EllipsoidTerrainProvider) {
          /* eslint-disable no-param-reassign */
          // eslint-disable-next-line no-underscore-dangle
          layer.zindex_ = 0;
          layer.isBase = false;
        }
      });
    }
  }

  /**
    * Este método devuelve la opacidad de esta capa.
    *
    * @function
    * @returns {Number} Opacidad (0, 1). Predeterminado 1.
    * @api stable
    * @expose
    */
  getOpacity() {
    return 1;
  }

  /**
   * Este método establece la opacidad de esta capa.
   * No disponible para Cesium.
   *
   * @function
   * @api stable
   * @expose
   */
  setOpacity() {
    console.warn(getValue('exception').no_opacity); // eslint-disable-line
  }

  /**
   * Este método establece la máxima extensión de la capa.
   *
   * @function
   * @param {Mx.Extent} maxExtent Máxima extensión.
   * @public
   * @api
   */
  setMaxExtent(maxExtent) {}

  /**
   * Este método establece la capa Cesium.
   *
   * @function
   * @param {Cesium3DTileset} layer Capa de Cesium.
   * @api stable
   * @expose
   */
  setLayer(layer) {
    const cesiumMap = this.map.getMapImpl();
    if (this.cesiumLayer !== layer) {
      this.cesiumLayer = layer;
      cesiumMap.terrainProvider = layer;
    }
    return this;
  }

  /**
   * Este método destruye esta capa, limpiando el HTML
   * y anulando el registro de los eventos.
   *
   * @public
   * @function
   * @api
   */
  destroy() {
    const cesiumMap = this.map.getMapImpl();
    if (!isNullOrEmpty(this.cesiumLayer)) {
      cesiumMap.terrainProvider = new EllipsoidTerrainProvider();
      this.cesiumLayer = null;
    }
    this.map = null;
  }

  /**
   * Este método comrpueba si un objeto es igual
   * a esta capa.
   *
   * @function
   * @param {Object} obj Objeto a comparar.
   * @returns {Boolean} Verdadero es igual, falso si no.
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
