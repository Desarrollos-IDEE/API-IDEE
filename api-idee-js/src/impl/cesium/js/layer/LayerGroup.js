/**
 * @module IDEE/impl/layer/LayerGroup
 */
import * as EventType from 'IDEE/event/eventtype';
import { isNullOrEmpty, escapeXSS } from 'IDEE/util/Utils';
import Section from 'IDEE/layer/Section';
import WMC from 'IDEE/layer/WMC';
import * as Dialog from 'IDEE/dialog';
import Layer from './Layer';

/**
 * @classdesc
 * Implementación del grupo de capas para Cesium. Cesium no tiene un contenedor
 * de capas, así que el grupo se emula: cada capa hija se añade a su colección
 * del visor (imágenes, fuentes de datos, primitivas) y el grupo propaga a sus
 * hijas la visibilidad, la opacidad y el orden (las hijas quedan justo por
 * debajo del z-index del grupo, como en OpenLayers).
 *
 * @property {Array<IDEE.Layer>} layers Capas del grupo.
 * @property {IDEE.impl.layer.LayerGroup} rootGroup Grupo padre, si lo hay.
 *
 * @api
 * @extends {IDEE.impl.layer.Layer}
 */
class LayerGroup extends Layer {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {Object} userParameters Parámetros de la capa (layers...).
   * @param {Object} options Opciones de la capa.
   * @param {Object} vendorOptions Opciones de la librería base.
   * @api stable
   */
  constructor(userParameters, options = {}, vendorOptions = {}) {
    super(options, vendorOptions);

    /**
     * Fachada del grupo.
     * @private
     * @type {IDEE.layer.LayerGroup}
     */
    this.facadeLayer_ = null;

    /**
     * Opciones del grupo.
     * @private
     * @type {Object}
     */
    this.options_ = options;

    /**
     * Capas con las que se construye el grupo.
     * @private
     * @type {Array<IDEE.Layer|String>}
     */
    this.layersParams_ = userParameters.layers || [];

    /**
     * Capas del grupo, ordenadas de abajo arriba.
     * @public
     * @type {Array<IDEE.Layer>}
     */
    this.layers = [];

    /**
     * Grupo padre.
     * @public
     * @type {IDEE.impl.layer.LayerGroup}
     */
    this.rootGroup = null;

    /**
     * Orden de alta de las capas del grupo.
     * @private
     * @type {Map}
     */
    this.layerOrder_ = new Map();
  }

  /**
   * Añade el grupo al mapa: añade sus capas hijas al visor.
   *
   * @public
   * @function
   * @param {IDEE.Map} map Mapa.
   * @param {Boolean} addLayer Verdadero si el grupo está en la raíz del mapa.
   * @api stable
   */
  addTo(map, addLayer = true) {
    this.map = map;
    this.addLayerToMap_ = addLayer;

    this.layersParams_.forEach((layerParam, index) => {
      const layer = typeof layerParam === 'string' ? this.map.getLayerByString(layerParam) : layerParam;
      this.layerOrder_.set(layer, index);
    });

    // Mientras se añaden las hijas el mapa no debe calcular el z-index del grupo
    // (lo haría con un número parcial de capas)
    this.isAddingLayers = true;
    const layerPromises = this.layersParams_.map((layer) => {
      if (typeof layer === 'string') {
        return this.addLayer(this.map.getLayerByString(layer));
      }
      return this.addLayer(layer);
    });
    this.isAddingLayers = false;
    Promise.all(layerPromises).catch((error) => Dialog.error(escapeXSS(String(error))));

    // Las hijas retenidas al retirar un grupo también necesitan un nuevo ciclo de alta.
    this.layers.forEach((layer) => this.startLayersAutoRefresh_(layer));

    this.fireAddedToMap_();
  }

  /**
   * El grupo no tiene objeto nativo en Cesium.
   *
   * @public
   * @function
   * @returns {null} Siempre nulo.
   * @api stable
   */
  getLayer() {
    return null;
  }

  /**
   * Coloca las capas hijas justo por debajo del z-index del grupo.
   *
   * @public
   * @function
   * @api stable
   */
  setZIndexChildren() {
    let nextZIndex = this.zIndex_ - 1;
    // Se clona el array de capas para que el reverse no modifique el original
    this.layers.concat().reverse().forEach((layer) => {
      layer.setZIndex(nextZIndex);
      nextZIndex -= layer.getImpl() instanceof LayerGroup
        ? layer.getImpl().getTotalLayers() : 1;
    });
    this.reorderLayers();
  }

  /**
   * Número de capas del grupo, contando el propio grupo y los subgrupos.
   *
   * @public
   * @function
   * @returns {Number} Número de capas.
   * @api stable
   */
  getTotalLayers() {
    let num = 1;
    this.layers.forEach((l) => {
      num += l.getImpl() instanceof LayerGroup ? l.getImpl().getTotalLayers() : 1;
    });
    return num;
  }

  /**
   * Ordena las capas del grupo por su z-index.
   *
   * @public
   * @function
   * @api stable
   */
  reorderLayers() {
    this.layers.sort((a, b) => a.getZIndex() - b.getZIndex());
  }

  /**
   * Grupo raíz del que cuelga este grupo.
   *
   * @public
   * @function
   * @returns {IDEE.impl.layer.LayerGroup|null} Grupo raíz.
   * @api stable
   */
  getTopRootGroup() {
    let topRootGroup = this.rootGroup;
    if (!isNullOrEmpty(topRootGroup) && !isNullOrEmpty(topRootGroup.rootGroup)) {
      topRootGroup = topRootGroup.getTopRootGroup();
    }
    return topRootGroup;
  }

  /**
   * Arranca el autorefresco de una capa hija si el grupo está en el mapa.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   *
   * @param {IDEE.Layer} layer Capa hija.
   */
  startLayersAutoRefresh_(layer) {
    const root = this.getTopRootGroup() || this;
    // eslint-disable-next-line no-underscore-dangle
    if (!root.addLayerToMap_) return;
    if (typeof layer.startAutoRefresh === 'function') {
      layer.setMap(this.map);
      layer.startAutoRefresh(this.map.getAutoRefreshInterval());
    }
    if (layer.getImpl() instanceof LayerGroup) {
      layer.getLayers().forEach((child) => this.startLayersAutoRefresh_(child));
    }
  }

  /**
   * Establece la visibilidad del grupo. La fachada propaga la visibilidad a
   * las capas hijas.
   *
   * @public
   * @function
   * @param {Boolean} visibility Visibilidad.
   * @api stable
   */
  setVisible(visibility) {
    this.visibility = visibility;
    // Un grupo base visible oculta el resto de capas base
    if (visibility === true && this.isBase !== false && !isNullOrEmpty(this.map)) {
      this.map.getBaseLayers().forEach((layer) => {
        if (!layer.equals(this.facadeLayer_) && layer.isVisible()) {
          layer.setVisible(false);
        }
      });
    }
  }

  /**
   * Visibilidad del grupo.
   *
   * @public
   * @function
   * @returns {Boolean} Visibilidad.
   * @api stable
   */
  isVisible() {
    return this.visibility;
  }

  /**
   * Opacidad del grupo.
   *
   * @public
   * @function
   * @returns {Number} Opacidad.
   * @api stable
   */
  getOpacity() {
    return this.opacity_;
  }

  /**
   * Establece la opacidad del grupo. Sin contenedor nativo, la opacidad se
   * aplica a las capas hijas.
   *
   * @public
   * @function
   * @param {Number} opacity Opacidad (0, 1).
   * @api stable
   */
  setOpacity(opacity) {
    this.opacity_ = Number(opacity);
    this.layers.forEach((layer) => layer.setOpacity(this.opacity_));
  }

  /**
   * Establece el z-index del grupo y coloca a sus hijas por debajo.
   *
   * @public
   * @function
   * @param {Number} zIndex Índice.
   * @api stable
   */
  setZIndex(zIndex) {
    this.zIndex_ = zIndex;
    if (!isNullOrEmpty(zIndex)) {
      this.setZIndexChildren();
    }
  }

  /**
   * Añade una capa al grupo.
   *
   * @public
   * @function
   * @param {IDEE.Layer|String} userLayer Capa.
   * @returns {Promise<IDEE.Layer>|null} Capa añadida.
   * @api stable
   */
  addLayer(userLayer) {
    let layer = userLayer;
    if (layer instanceof Section || layer instanceof WMC) {
      // eslint-disable-next-line no-console
      console.warn(`No es posible añadir una capa ${layer.type} dentro de un grupo.`);
      return null;
    }
    if (typeof layer === 'string') {
      layer = this.map.getLayerByString(layer);
    }

    if (layer.type === 'GeoPackage') {
      return layer.addTo(this.map, false).then(() => {
        const layerPromises = layer.getLayers().map((value) => {
          this.layerOrder_.set(value, this.layerOrder_.get(layer));
          const child = this.addLayer(value);
          this.setZIndexChildren();
          return child;
        });
        return Promise.all(layerPromises).then(() => layer);
      });
    }

    if (!this.layers.includes(layer)) {
      const impl = layer.getImpl();
      impl.rootGroup = this;
      layer.setMap(this.map);
      impl.addTo(this.map, false);
      this.startLayersAutoRefresh_(layer);

      if (!this.layerOrder_.has(layer)) {
        const maxOrder = Math.max(...Array.from(this.layerOrder_.values()), -1);
        this.layerOrder_.set(layer, maxOrder + 1);
      }
      const layerOrder = this.layerOrder_.get(layer);
      let insertIndex = this.layers.length;
      for (let i = 0; i < this.layers.length; i += 1) {
        const currentOrder = this.layerOrder_.get(this.layers[i]);
        if (currentOrder !== undefined && currentOrder > layerOrder) {
          insertIndex = i;
          break;
        }
      }
      this.layers.splice(insertIndex, 0, layer);

      if (!isNullOrEmpty(this.zIndex_)) {
        this.setZIndexChildren();
      }
      this.facadeLayer_?.fire(EventType.ADDED_TO_LAYERGROUP, [layer, this.facadeLayer_]);
    }
    return Promise.resolve(layer);
  }

  /**
   * Elimina una capa del grupo y del visor.
   *
   * @public
   * @function
   * @param {IDEE.Layer} layer Capa.
   * @api stable
   */
  removeLayer(layer) {
    if (this.layers.includes(layer)) {
      layer.stopAutoRefresh();
    }
    const layerImpl = layer.getImpl();
    this.removeLayers_(layer);
    layerImpl.rootGroup = null;
    layerImpl.destroy();
    if (!isNullOrEmpty(this.map)) {
      layerImpl.activateBaseLayer(layer, this.map);
    }
    layer.fire(EventType.REMOVED_FROM_MAP, [layer]);
    this.facadeLayer_?.fire(EventType.REMOVED_FROM_LAYERGROUP, [layer, this.facadeLayer_]);
    if (!isNullOrEmpty(this.map)) {
      this.map.fire(EventType.REMOVED_LAYER, [[layer]]);
    }
  }

  /**
   * Quita una capa de la lista del grupo.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   *
   * @param {IDEE.Layer} layer Capa.
   */
  removeLayers_(layer) {
    this.layers = this.layers.filter((l) => l !== layer);
    this.layersParams_ = this.layersParams_.filter((l) => l !== layer);
  }

  /**
   * Saca una capa del grupo: pasa al grupo padre o, si no hay o se indica, al mapa.
   * La capa sigue en el visor.
   *
   * @public
   * @function
   * @param {IDEE.Layer} layer Capa.
   * @param {Boolean} upToMap Verdadero para llevarla directamente al mapa.
   * @api stable
   */
  ungroup(layer, upToMap = false) {
    this.removeLayers_(layer);
    if (layer.getImpl().rootGroup === null) {
      return;
    }
    const layerImpl = layer.getImpl();
    if (upToMap === false && this.rootGroup !== null) {
      layerImpl.rootGroup = this.rootGroup;
      this.rootGroup.layers.push(layer);
    } else {
      layerImpl.rootGroup = null;
      // eslint-disable-next-line no-underscore-dangle
      this.map.getImpl().layers_.push(layer);
    }
    layer.stopAutoRefresh();
    this.startLayersAutoRefresh_(layer);
  }

  /**
   * Capas del grupo.
   *
   * @public
   * @function
   * @returns {Array<IDEE.Layer>} Capas.
   * @api stable
   */
  getLayers() {
    return this.layers;
  }

  /**
   * Destruye el grupo: retira sus capas hijas del visor.
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {
    this.facadeLayer_?.stopAutoRefresh();
    this.layers.forEach((layer) => {
      layer.stopAutoRefresh();
      layer.getImpl().destroy();
    });
    if (!isNullOrEmpty(this.map)) {
      // eslint-disable-next-line no-underscore-dangle
      this.map.getImpl().layers_ = this.map.getImpl().layers_
        .filter((l) => this.facadeLayer_.idLayer !== l.idLayer);
    }
    this.map = null;
  }

  /**
   * Comprueba si un objeto es igual a este grupo.
   *
   * @public
   * @function
   * @param {Object} obj Objeto.
   * @returns {Boolean} Verdadero si es el mismo grupo.
   * @api stable
   */
  equals(obj) {
    return obj instanceof LayerGroup && this.name === obj.name;
  }

  /**
   * El grupo agrupa el autorefresco de sus hijas.
   *
   * @public
   * @function
   * @returns {Boolean} Verdadero.
   * @api stable
   */
  isAutoRefreshContainer() {
    return true;
  }
}

export default LayerGroup;
