/* eslint-disable no-underscore-dangle */
/* eslint-disable new-cap */
/**
 * @module IDEE/impl/Layer
 */
import MObject from 'IDEE/Object';
import { isNullOrEmpty, isString } from 'IDEE/util/Utils';
import FacadeLayer from 'IDEE/layer/Layer';
import { getValue } from 'IDEE/i18n/language';
import { ImageryLayer } from 'cesium';
import ImplUtils from '../util/Utils';

/**
 * @classdesc
 * De esta clase heredarán todas las capas base.
 *
 * @api
 * @extends {IDEE.Object}
 */
class LayerBase extends MObject {
  /**
   * @classdesc
   * Constructor principal de la clase. Crea una capa
   * con parámetros especificados por el usuario.
   *
   *
   * @param {Object} options Parámetros opcionales para la capa.
   * - visibility: Define si la capa es visible o no. Verdadero por defecto.
   * - displayInLayerSwitcher: Indica si la capa se muestra en el selector de capas.
   * - opacity: Opacidad de capa, por defecto 1.
   * - minZoom: Zoom mínimo aplicable a la capa.
   * - maxZoom: Zoom máximo aplicable a la capa.
   * - maxExtent: La medida en que restringe la visualización a una región específica.
   * @param {Object} vendorOptions Pasa los "vendorOptions" heredados a la clase
   * MObject (IDEE/Object).
   *
   * @api stable
   */
  constructor(options = {}, vendorOptions = {}) {
    // calls the super constructor
    super(options);

    /**
     * Layer vendorOptions_. Opciones de proveedor para la biblioteca base.
     */
    this.vendorOptions_ = vendorOptions;

    /**
     * Layer map. La instancia del mapa.
     */
    this.map = null;

    /**
     * Layer cesiumlayer. La instancia de la capa cesium.
     */
    this.cesiumLayer = null;

    /**
     * Layer options. Opciones personalizadas para esta capa.
     */
    this.options = options;

    /**
     * Layer visibility. Indica la visibilidad de la capa.
     */
    this.visibility = this.options.visibility !== false;

    /**
     * Layer displayInLayerSwitcher. Indica si la capa se muestra en el selector de capas.
     */
    this.displayInLayerSwitcher = this.options.displayInLayerSwitcher !== false;

    /**
     * Layer zIndex. Índice z de la capa.
     */
    this.zIndex_ = null;

    /**
     * Layer opacity_. Opacidad de capa, por defecto 1.
     */
    this.opacity_ = this.options.opacity || 1;

    /**
      * Layer legendUrl_. Leyenda URL de esta capa.
      */
    this.legendUrl_ = FacadeLayer.LEGEND_DEFAULT;

    /**
      * Layer minZoom. Zoom mínimo aplicable a la capa.
      */
    this.minZoom = this.options.minZoom || Number.NEGATIVE_INFINITY;

    /**
     * Layer maxZoom. Zoom máximo aplicable a la capa.
     */
    this.maxZoom = this.options.maxZoom || Number.POSITIVE_INFINITY;

    this.userMaxExtent = options.maxExtent;
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
      visible = this.cesiumLayer.show;
    } else {
      visible = this.visibility;
    }
    return visible;
  }

  /**
   * Este método indica si la capa es consultable.
   *
   * @function
   * @returns {Boolean} Devuelve falso.
   * @api stable
   * @expose
   *
   */
  isQueryable() {
    return false;
  }

  /**
   * Este método indica si la capa está dentro del rango.
   *
   * @function
   * @returns {Boolean} Verdadero está dentro del rango, falso si no.
   * @api stable
   * @expose
   */
  inRange() {
    return true;
  }

  /**
   * Este método establece la visibilidad de esta capa.
   *
   * @function
   * @param {Boolean} visibility Verdadero es visibilidad, falso si no.
   * @api stable
   * @expose
   */
  setVisible(visibility) {
    this.visibility = visibility;

    if (!isNullOrEmpty(this.cesiumLayer)) {
      this.cesiumLayer.show = visibility;
    }
  }

  /**
   * Este método devuelve el zoom mínimo de esta capa.
   *
   * @function
   * @returns {Number} Devuelve el zoom mínimo aplicable a la capa.
   * @api stable
   * @expose
   */
  getMinZoom() {
    if (!isNullOrEmpty(this.getLayer())) {
      this.minZoom = this.getLayer()._minimumTerrainLevel;
    }
    return this.minZoom;
  }

  /**
   * Este método establece el zoom mínimo de esta capa.
   *
   * @function
   * @param {Number} zoom Zoom mínimo aplicable a la capa.
   * @api stable
   * @expose
   */
  setMinZoom(zoom) {
    this.minZoom = zoom;
    if (!isNullOrEmpty(this.getLayer())) {
      this.getLayer()._minimumTerrainLevel = zoom;
      const index = this.map.getMapImpl().imageryLayers.indexOf(this.getLayer());
      this.map.getMapImpl().imageryLayers.remove(this.getLayer(), false);
      this.map.getMapImpl().imageryLayers.add(this.getLayer(), index);
    }
  }

  /**
   * Este método devuelve el zoom máximo de esta capa.
   *
   * @function
   * @returns {Number} Zoom máximo aplicable a la capa.
   * @api stable
   * @expose
   */
  getMaxZoom() {
    if (!isNullOrEmpty(this.getLayer())) {
      this.maxZoom = this.getLayer()._maximumTerrainLevel;
    }
    return this.maxZoom;
  }

  /**
   * Este método establece el zoom máximo de esta capa.
   *
   *
   * @function
   * @param {Number} zoom Zoom máximo aplicable a la capa.
   * @api stable
   * @expose
   */
  setMaxZoom(zoom) {
    this.maxZoom = zoom;
    if (!isNullOrEmpty(this.getLayer())) {
      this.getLayer()._maximumTerrainLevel = zoom - 1;
      const index = this.map.getMapImpl().imageryLayers.indexOf(this.getLayer());
      this.map.getMapImpl().imageryLayers.remove(this.getLayer(), false);
      this.map.getMapImpl().imageryLayers.add(this.getLayer(), index);
    }
  }

  /**
   * Este método devuelve el índice z de esta capa.
   *
   * @function
   * @return {Number} Índice de la capa.
   * @api stable
   * @expose
   */
  getZIndex() {
    if (!isNullOrEmpty(this.getLayer())) {
      this.zIndex_ = this.getLayer()._layerIndex;
    }
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
    this.zIndex_ = zIndex;
    if (!isNullOrEmpty(this.getLayer())) {
      const cesiumMap = this.map.getMapImpl();
      if ((cesiumMap.imageryLayers._layers.length - 1) >= zIndex) {
        cesiumMap.imageryLayers.remove(this.cesiumLayer, false);
        cesiumMap.imageryLayers.add(this.cesiumLayer, zIndex);
      } else {
        // eslint-disable-next-line no-console
        console.error(getValue('exception').index_error);
      }
      this.map.getLayers().forEach((layer) => {
        const layerImpl = layer.getImpl().getLayer();
        if (layerImpl instanceof ImageryLayer) {
          /* eslint-disable no-param-reassign */
          layer.zindex_ = layerImpl._layerIndex;
          layer.isBase = layerImpl.isBaseLayer();
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
    if (!isNullOrEmpty(this.getLayer())) {
      this.opacity_ = this.getLayer().alpha;
    }
    return this.opacity_;
  }

  /**
   * Este método establece la opacidad de esta capa.
   *
   * @function
   * @param {Number} opacity Opacidad (0, 1). Predeterminado 1.
   * @api stable
   * @expose
   */
  setOpacity(opacity) {
    let opacityParsed = opacity;
    if (!isNullOrEmpty(opacity) && isString(opacity)) {
      opacityParsed = Number(opacity);
    }
    this.opacity_ = opacityParsed;
    if (!isNullOrEmpty(this.getLayer())) {
      this.getLayer().alpha = opacityParsed;
    }
  }

  /**
   * Este método obtiene la capa Cesium creada.
   *
   * @function
   * @return {ImageryLayer} Devuelve la capa Cesium.
   * @api stable
   * @expose
   */
  getLayer() {
    return this.cesiumLayer;
  }

  /**
   * Este método establece la capa Cesium.
   *
   * @function
   * @param {ImageryLayer} layer Capa de Cesium.
   * @api stable
   * @expose
   */
  setLayer(layer) {
    const cesiumMap = this.map.getMapImpl();
    if (this.cesiumLayer !== layer) {
      const zIndex = this.cesiumLayer?._layerIndex;
      cesiumMap.imageryLayers.remove(this.cesiumLayer);
      this.cesiumLayer = layer;
      cesiumMap.imageryLayers.add(layer, zIndex);
    }
    return this;
  }

  /**
   * Este método obtiene la implementación del mapa.
   *
   * @function
   * @returns {IDEE.impl.Map} Es la implementación del mapa.
   * @api stable
   * @expose
   */
  getMap() {
    return this.map;
  }

  /**
   * Este método obtiene la URL de la leyenda.
   *
   * @function
   * @returns {String} URL de la leyenda.
   * @api stable
   * @expose
   */
  getLegendURL() {
    return this.legendUrl_;
  }

  /**
   * Este método establece la máxima extensión de la capa.
   *
   * @function
   * @param {Mx.Extent} maxExtent Máxima extensión.
   * @public
   * @api
   */
  setMaxExtent(maxExtent) {
    const rectangle = ImplUtils.convertExtentToRectangle(maxExtent);
    if (!isNullOrEmpty(this.cesiumLayer) && this.cesiumLayer.rectangle) {
      this.cesiumLayer._rectangle = rectangle;

      const index = this.map.getMapImpl().imageryLayers.indexOf(this.getLayer());
      this.map.getMapImpl().imageryLayers.remove(this.getLayer(), false);
      this.map.getMapImpl().imageryLayers.add(this.getLayer(), index);
    }
  }

  /**
   * Este método devuelve la máxima extensión de la capa.
   *
   * @function
   * @param {Mx.Extent} maxExtent Máxima extensión.
   * @public
   * @api
   */
  getMaxExtent() {
    return this.cesiumLayer.getImageryRectangle();
  }

  /**
   * Este método establece la url de la leyenda.
   *
   * @function
   * @param {String} legendUrl URL de la leyenda.
   * @api stable
   * @expose
   */
  setLegendURL(legendUrl) {
    this.legendUrl_ = legendUrl;
  }

  /**
   * Este método obtiene los niveles de zoom numéricos.
   *
   * @public
   * @returns {Number} Devuelve la resolución máxima (20).
   * @function
   * @api stable
   */
  getNumZoomLevels() {}

  /**
   * Este método ejecuta una deselección del objetos geográficos.
   *
   * @param {EntityCollection} features Cesium objetos geográficos.
   * @param {Array} coord Coordenadas.
   * @param {Object} evt Eventos.
   * @public
   * @function
   * @api stable
   * @expose
   */
  unselectFeatures(features, coord, evt) {}

  /**
   * Este método ejecuta la selección de un objetos geográficos.
   *
   * @function
   * @param {EntityCollection} features Cesium objetos geográficos.
   * @param {Array} coord Coordenadas.
   * @param {Object} evt Eventos.
   * @api stable
   * @expose
   */
  selectFeatures(features, coord, evt) {}
}

export default LayerBase;
