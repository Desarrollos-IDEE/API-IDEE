/**
 * @module IDEE/impl/Layer
 */
import { isNullOrEmpty, isString, addParameters } from 'IDEE/util/Utils';
import MObject from 'IDEE/Object';
import { unByKey } from 'ol/Observable';

import FacadeLayer from 'IDEE/layer/Layer';
import {
  getValue,
} from 'IDEE/i18n/language';
import { getResolutionFromScale, getScaleFromResolution } from 'M/util/Utils';

const autoRefreshSources = new WeakMap();

/**
 * @classdesc
 * De esta clase heredadan todas las capas base.
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
   * - minScale: Escala mínima.
   * - maxScale: Escala máxima.
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
     * Layer olLayer. La instancia de la capa ol3.
     */
    this.olLayer = null;

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
    this.opacity_ = this.options.opacity === 0 ? 0 : this.options.opacity || 1;

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
   * Comprueba el origen remoto sin depender de la referencia a una fachada concreta.
   * @param {String} url URL del origen.
   * @returns {Boolean} Verdadero para HTTP o HTTPS.
   * @public
   * @function
   */
  isAutoRefreshRemoteURL(url) {
    return FacadeLayer.isAutoRefreshRemoteURL(url);
  }

  /**
   * Invalida únicamente la fuente ráster de esta capa.
   * Solo lo invoca la fachada con autorefresco habilitado.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   */
  refreshSource() {
    const source = this.olLayer && this.olLayer.getSource();
    if (!source || typeof source.refresh !== 'function') return;
    const urls = source.getUrls?.() || [source.getUrl?.()];
    if (!urls.length || !urls.every((url) => this.isAutoRefreshRemoteURL(url))) return;

    let state = autoRefreshSources.get(this);
    if (!state || state.source !== source) {
      this.disposeAutoRefresh();
      state = { source, pending: new Set(), keys: [] };
      const loading = (event) => state.pending.add(event.tile || event.image);
      const loaded = (event) => state.pending.delete(event.tile || event.image);
      state.keys = [
        source.on(['tileloadstart', 'imageloadstart'], loading),
        source.on(['tileloadend', 'tileloaderror', 'imageloadend', 'imageloaderror'], loaded),
      ].flat();
      autoRefreshSources.set(this, state);
    }
    if (state.pending.size > 0) return;

    const revision = Date.now();
    if (typeof source.getTileUrlFunction === 'function') {
      const current = source.getTileUrlFunction();
      if (current !== state.wrapper) state.original = current;
      // Se envuelve la función actual, sin acumular envoltorios ni alterar this.url.
      state.wrapper = (...args) => {
        const url = state.original.apply(source, args);
        return url ? addParameters(url, { _ideeRefresh: revision }) : url;
      };
      source.setTileUrlFunction(state.wrapper);
    } else if (typeof source.updateParams === 'function') {
      // ImageWMS: updateParams invalida la imagen manteniendo el resto de parámetros.
      source.updateParams({ _ideeRefresh: revision });
    }
    source.refresh();
    return true;
  }

  /**
   * Libera los observadores de carga utilizados por el autorefresco.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   */
  disposeAutoRefresh() {
    const state = autoRefreshSources.get(this);
    if (state) {
      unByKey(state.keys);
      if (state.wrapper && state.source.getTileUrlFunction() === state.wrapper) {
        state.source.setTileUrlFunction(state.original);
      }
      autoRefreshSources.delete(this);
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
    if (!isNullOrEmpty(this.olLayer)) {
      visible = this.olLayer.getVisible();
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
    let inRange = false;
    if (!isNullOrEmpty(this.olLayer)) {
      const resolution = this.map.getMapImpl().getView().getResolution();
      const maxResolution = this.olLayer.getMaxResolution();
      const minResolution = this.olLayer.getMinResolution();

      inRange = ((resolution >= minResolution) && (resolution <= maxResolution));
    }
    return inRange;
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

    if (!isNullOrEmpty(this.olLayer)) {
      this.olLayer.setVisible(visibility);
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
      this.minZoom = this.getLayer().getMinZoom();
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
      this.getLayer().setMinZoom(zoom);
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
      this.maxZoom = this.getLayer().getMaxZoom();
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
      this.getLayer().setMaxZoom(zoom);
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
      this.zIndex_ = this.getLayer().getZIndex();
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
      this.getLayer().setZIndex(zIndex);
    }
    if (this.rootGroup) {
      this.rootGroup.reorderLayers();
    }
  }

  /**
   * Esta función devuelve el valor de la escala mínima para esta capa.
   *
   * @function
   * @returns {Number} Devuelve el valor de la escala mínima.
   * @api
   */
  getMinScale() {
    let minScale;
    const units = this.map.getProjection().units;
    if (!isNullOrEmpty(this.getLayer()) && !isNullOrEmpty(units)) {
      minScale = getScaleFromResolution(this.getLayer().getMinResolution(), units, 0);
    }
    return minScale;
  }

  /**
   * Esta función establece el valor de la escala mínima para esta capa.
   *
   * @function
   * @param {Number} minScale Nueva escala mínima.
   * @api
   */
  setMinScale(minScale) {
    const units = this.map.getProjection().units;
    const minResolution = getResolutionFromScale(minScale, units);
    if (!isNullOrEmpty(this.getLayer()) && !isNullOrEmpty(minResolution)
      && !isNullOrEmpty(units)) {
      this.getLayer().setMinResolution(minResolution);
    }
  }

  /**
   * Esta función devuelve el valor de la escala máxima para esta capa.
   *
   * @function
   * @returns {Number} Devuelve el valor de la escala máxima.
   * @api
   */
  getMaxScale() {
    let maxScale;
    const units = this.map.getProjection().units;
    if (!isNullOrEmpty(this.getLayer()) && !isNullOrEmpty(units)) {
      maxScale = getScaleFromResolution(this.getLayer().getMaxResolution(), units, 0);
    }
    return maxScale;
  }

  /**
   * Esta función establece el valor de la escala máxima para esta capa.
   *
   * @function
   * @param {Number} maxScale Nueva escala máxima.
   * @api
   */
  setMaxScale(maxScale) {
    const units = this.map.getProjection().units;
    const maxResolution = getResolutionFromScale(maxScale, units);
    if (!isNullOrEmpty(this.getLayer()) && !isNullOrEmpty(maxResolution)
      && !isNullOrEmpty(units)) {
      this.getLayer().setMaxResolution(maxResolution);
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
      this.opacity_ = this.getLayer().getOpacity();
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
      this.getLayer().setOpacity(opacityParsed);
    }
  }

  /**
   * Este método obtiene la capa Openlayers creada.
   *
   * @function
   * @return {ol3Layer} Devuelve la capa Openlayers.
   * @api stable
   * @expose
   * @deprecated
   */
  getOL3Layer() {
    // eslint-disable-next-line no-console
    console.warn(getValue('exception').getOL3Layer_deprecated);
    return this.getLayer();
  }

  /**
   * Este método obtiene la capa Openlayers creada.
   *
   * @function
   * @return {ol3Layer} Devuelve la capa Openlayers.
   * @api stable
   * @expose
   */
  getLayer() {
    return this.olLayer;
  }

  /**
   * Este método establece la capa Openlayers.
   *
   * @function
   * @param {ol.layer} layer Capa de Openlayers.
   * @api stable
   * @expose
   * @deprecated
   */
  setOL3Layer(layer) {
    // eslint-disable-next-line no-console
    console.warn(getValue('exception').setOL3Layer_deprecated);
    this.setLayer(layer);
    return this;
  }

  /**
   * Este método establece la capa Openlayers.
   *
   * @function
   * @param {ol.layer} layer Capa de Openlayers.
   * @api stable
   * @expose
   */
  setLayer(layer) {
    const olMap = this.map.getMapImpl();
    olMap.removeLayer(this.olLayer);
    this.olLayer = layer;
    olMap.addLayer(layer);
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
   * Guarda la fachada para limpiar el autorefresco al destruir la implementación.
   * @param {IDEE.layer.Layer} obj Fachada de la capa.
   * @public
   */
  setFacadeObj(obj) {
    this.facadeLayer_ = obj;
  }

  /**
   * Este método busca si hay capas base y activa la primera de la lista.
   *
   * @function
   * @param {IDEE.Layer} layer capa eliminada
   * @param {IDEE.Map} facadeMap Fachada del mapa.
   * @api stable
   * @expose
   */
  activateBaseLayer(layer, facadeMap) {
    if (layer.isBase === true) {
      // it was base layer so sets the visibility of the first one
      const baseLayers = facadeMap.getBaseLayers();
      if (baseLayers.length > 0) {
        baseLayers[0].setVisible(true);
      }
    }
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
    this.olLayer.setExtent(maxExtent);
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
   * @returns {Number} Devuelve la resolución máxima.
   * @function
   * @api stable
   */
  getNumZoomLevels() {
    return this.numZoomLevels || Number(IDEE.config.MAX_ZOOM);
  }

  /**
   * Este método ejecuta una deselección del objetos geográficos.
   *
   * @param {ol.features} features Openlayers objetos geográficos.
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
   * @param {ol.features} features Openlayers objetos geográficos.
   * @param {Array} coord Coordenadas.
   * @param {Object} evt Eventos.
   * @api stable
   * @expose
   */
  selectFeatures(features, coord, evt) {}
}

export default LayerBase;
