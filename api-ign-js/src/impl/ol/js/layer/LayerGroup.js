/**
 * @module M/impl/layer/LayerGroup
 */
import * as EventType from 'M/event/eventtype';
import { isNullOrEmpty } from 'M/util/Utils';
import { Group } from 'ol/layer';
import { Collection } from 'ol';

import Layer from './Layer';

/**
* @classdesc
* LayerGroup es una clase que representa un grupo de capas.
*
* @api
* @extends {M.impl.layer.Vector}
*/
class LayerGroup extends Layer {
  /**
   * @classdesc
   * Constructor principal de la clase. Crea una capa LayerGroup
   * con parámetros especificados por el usuario.
   *
   * @constructor
   * @implements {M.impl.layer.Vector}
   * @param {Object} parameters Parámetros de la fachada, la fachada se refiere a un patrón
   * estructural como una capa de abstracción con un patrón de diseño.
   * @param {Mx.parameters.LayerOptions} options Opciones personalizadas para esta capa.
   * - visibility: Define si la capa es visible o no.
   * - minZoom: Zoom mínimo aplicable a la capa.
   * - maxZoom: Zoom máximo aplicable a la capa.
   * - minScale: Escala mínima.
   * - maxScale: Escala máxima.
   * - minResolution: Resolución mínima.
   * - maxResolution: Resolución máxima.
   * - displayInLayerSwitcher. Indica si la capa se muestra en el selector de capas.
   * - opacity. Opacidad de capa, por defecto 1.
   * - maxExtent: La medida en que restringe la visualización a una región específica.
   * @param {Object} vendorOptions Opciones para la biblioteca base.
   * @api stable
   */
  constructor(userParameters, options = {}, vendorOptions = {}) {
    super(options, vendorOptions);

    this.options_ = options;
    this.layersParams_ = userParameters.layers || [];

    this.layersCollection = new Collection();
    this.layers = [];
    this.rootGroup = null;
  }

  /**
   * Este método agrega la capa al mapa.
   *
   * @public
   * @function
   * @param {M.impl.Map} map Mapa de la implementación.
   * @api stable
   */
  addTo(map, addLayer = true) {
    this.map = map;

    this.ol3Layer = new Group(this.getParamsGroup_());
    this.ol3Layer.setLayers(this.layersCollection);

    this.fire(EventType.ADDED_TO_MAP);

    if (addLayer) {
      this.map.getMapImpl().addLayer(this.ol3Layer);
    }

    this.setOpacity(this.opacity_);

    this.layersParams_.forEach((layer) => {
      if (typeof layer === 'string') {
        const layerAPI = this.map.getLayerByString(layer);
        this.addLayer(layerAPI);
      } else {
        this.addLayer(layer);
      }
    });

    this.ol3Layer.on('change:zIndex', () => {
      this.setZIndexChildren();
    });
  }

  /**
   * Este método establece los zIndex de las capas del grupo.
   *
   * @public
   * @function
   * @api stable
   */
  setZIndexChildren() {
    const olZIndex = this.ol3Layer.getZIndex();
    let nexZIndex = olZIndex - 1;
    // Se clona el array de layers para que el reverse no modifique el array original
    const layers = this.layers.concat().reverse();
    layers.forEach((layer) => {
      layer.setZIndex(nexZIndex);
      nexZIndex -= layer.getImpl() instanceof LayerGroup
        ? layer.getImpl().getTotalLayers() : 1;
    });
    this.reorderLayers();
  }

  /**
   * Este método obtiene el número total de capas
   * que componen el grupo.
   *
   * @public
   * @function
   * @returns {Number} Número de capas
   * @api stable
   */
  getTotalLayers() {
    let num = 1;
    this.layers.forEach((l) => {
      if (l.getImpl() instanceof LayerGroup) {
        num += l.getImpl().getTotalLayers();
      } else {
        num += 1;
      }
    });
    return num;
  }

  /**
   * Este método ordena la lista de capas del grupo
   * de menor a mayor zindex.
   *
   * @public
   * @function
   * @api stable
   */
  reorderLayers() {
    this.layers.sort((a, b) => a.getZIndex() - b.getZIndex());
  }

  /**
   * Este método devuelve el grupo raiz.
   *
   * @public
   * @function
   * @returns {LayerGroup} Grupo raiz.
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
   * Este método devuelve los parámetros de la capa.
   *
   * Método privado.
   *
   * @public
   * @function
   * @returns {Object} Parámetros de la capa.
   * @api stable
   */
  getParamsGroup_() {
    return {
      opacity: this.opacity,
      visible: this.visibility,
      extent: this.userMaxExtent,
      // ! Valores de Options (Segundo Objeto)
      minResolution: this.options_.minResolution,
      maxResolution: this.options_.maxResolution,
      minZoom: this.options_.minZoom,
      maxZoom: this.options_.maxZoom,
    };
  }

  /**
   * Este método establece la capa de OpenLayers en la capa.
   * Método privado.
   * @function
   * @param {M.layer} layer Capa.
   * @private
   * @api stable
   */
  setOLLayerToLayer_(layer) {
    layer.setMap(this.map);
    layer.getImpl().addTo(this.map, false);
  }

  /**
   * Este método establece la visibilidad de la capa.
   *
   * @function
   * @param {boolean} visibility Verdadero para capa visible, falso no lo es.
   * @public
   * @api
   */
  setVisible(visibility) {
    this.visibility = visibility;
    // if this layer is base then it hides all base layers
    if ((visibility === true) && (this.transparent !== true)) {
      // hides all base layers
      this.map.getBaseLayers().forEach((layer) => {
        if (!layer.equals(this.facadeLayer_) && layer.isVisible()) {
          layer.setVisible(false);
        }
      });

      // set this layer visible
      if (!isNullOrEmpty(this.ol3Layer)) {
        this.ol3Layer.setVisible(visibility);
      }

      // updates resolutions and keep the bbox
      this.map.getImpl().updateResolutionsFromBaseLayer();
    } else if (!isNullOrEmpty(this.ol3Layer)) {
      this.ol3Layer.setVisible(visibility);
    }
  }

  /**
   * Este método agrega una capa al grupo.
   * @function
   * @param {M.layer} layer Capa a agregar.
   * @public
   * @api
   */
  addLayer(userLayer) {
    let layer = userLayer;
    if (typeof layer === 'string') {
      layer = this.map.getLayerByString(layer);
    }

    if (!this.layers.includes(layer)) {
      const impl = layer.getImpl();
      this.setOLLayerToLayer_(layer);

      impl.rootGroup = this;
      this.layers.push(layer);

      /* if (this.zIndex_ !== null) {
        // ? Por si existe subgrupos siga todo un orden
        this.setZIndexChildren();
      } */

      this.layersCollection.push(impl.getOL3Layer());
    }

    return layer;
  }

  /**
   * Este método elimina una capa del grupo.
   * @function
   * @param {M.layer} layer Capa a eliminar.
   * @public
   * @api
   */
  removeLayer(layer) {
    this.removeLayers_(layer);
    this.layersCollection.remove(layer.getImpl().getOL3Layer());
  }

  /**
   * Este método elimina una capa del grupo.
   * Método privado.
   * @function
   * @param {M.layer} layer Capa a eliminar.
   * @private
   * @api
   */
  removeLayers_(layer) {
    // ? Elimina las capas de this.layers para poder devolverlas
    // ? en el getLayers
    const id = layer.getImpl().ol3Layer.ol_uid;
    this.layers = this.layers.filter((l) => l.getImpl().ol3Layer.ol_uid !== id);
    this.layersParams_.remove(layer);
  }

  /**
   * Este método saca una capa del grupo.
   * @function
   * @param {M.layer} layer Capa a sacar.
   * @param {boolean} upToMap Indica si se saca hasta el mapa.
   * @public
   * @api
   */
  ungroup(layer, upToMap = false) {
    this.removeLayers_(layer);

    if (layer.getImpl().rootGroup === null) {
      return;
    }

    const layerOl = layer.getImpl().ol3Layer;
    const remove = this.layersCollection.remove(layerOl);
    if (upToMap === false && this.rootGroup !== null) {
      this.setRootGroup_(layer, this.rootGroup);
      this.rootGroup.layers.push(layer);
      this.rootGroup.layersCollection.push(remove);
    } else {
      this.setRootGroup_(layer, null);
      // eslint-disable-next-line no-underscore-dangle
      this.map.getImpl().layers_.push(layer);
      this.map.getMapImpl().addLayer(remove);
    }
  }

  /**
   * Este método establece el grupo raíz de la capa.
   * Método privado.
   * @function
   * @param {M.layer} layer Capa.
   * @param {M.impl.layer.LayerGroup} rootGroup Grupo raíz.
   * @private
   * @api
   */
  setRootGroup_(layer, rootGroup) {
    const facadeLayer = layer;
    if (facadeLayer.getImpl() instanceof LayerGroup) {
      facadeLayer.getImpl().rootGroup = rootGroup;
    }
  }

  /**
   * Este método devuelve las capas del grupo.
   * @function
   * @returns {Array<M.layer>} Capas del grupo.
   * @public
   * @api
   */
  getLayers() {
    return this.layers;
  }

  /**
   * Este método elimina la capa del mapa.
   * @function
   * @public
   * @api
   */
  destroy() {
    const olMap = this.map.getMapImpl();
    if (!isNullOrEmpty(this.ol3Layer)) {
      olMap.removeLayer(this.ol3Layer);
      this.ol3Layer = null;

      // eslint-disable-next-line no-underscore-dangle
      this.map.getImpl().layers_ = this.map.getImpl().layers_.filter((l) => this.name !== l.name);
    }
    this.map = null;
  }

  /**
   * Este método compara si dos objetos son iguales.
   * @function
   * @param {Object} obj Objeto a comparar.
   * @returns {boolean} Verdadero si son iguales, falso si no.
   * @public
   * @api
   */
  equals(obj) {
    let equals = false;
    if (obj instanceof LayerGroup) {
      equals = equals && (this.name === obj.name);
    }

    return equals;
  }
}

export default LayerGroup;
