/**
 * @module IDEE/layer/LayerGroup
 */

import LayerGroupImpl from 'impl/layer/LayerGroup';
import LayerBase from './Layer';
import * as parameter from '../parameter/parameter';
import * as EventType from '../event/eventtype';
import * as LayerType from './Type';
import {
  isUndefined, isNullOrEmpty, isObject, isString,
} from '../util/Utils';
import Exception from '../exception/exception';
import { getValue } from '../i18n/language';

/**
 * @classdesc
 * Representa un grupo de capas.
 *
 * @property {String} idLayer Identificador de la capa.
 * @property {Array<IDEE.LayerBase|IDEE.LayerGroup>} layers Capas del grupo.
 * @property {boolean} display Indica si el grupo se muestra en el árbol de contenidos.
 * @property {Boolean} transparent (deprecated) Falso si es una capa base,
 * verdadero en caso contrario.
 * @property {Boolean} isBase Define si la capa es base.
 *
 * @extends {IDEE.facade.Base}
 * @api
 */
class LayerGroup extends LayerBase {
  /**
   * Constructor principal de la clase. Crea una capa LayerGroup
   * con parámetros especificados por el usuario.
   *
   * @constructor
   * @param {String|Mx.parameters.LayerGroup} parameters Parámetros para la construcción de la capa,
   * estos parámetros los proporciona el usuario.
   * - name: Nombre de la capa en la leyenda.
   * - layers: Capas que forman el grupo.
   * - display: Indica si el grupo se muestra en el árbol de contenidos.
   * - type: Tipo de la capa.
   * - maxExtent: La medida en que restringe la visualización a una región específica.
   * - legend: Indica el nombre que queremos que aparezca en el árbol de contenidos, si lo hay.
   * - attribution: Atribución de la capa.
   * - isBase: Indica si la capa es base.
   * - transparent (deprecated): Falso si es una capa base, verdadero en caso contrario.
   * - visibility: Verdadero si la capa es visible, falso si queremos que no lo sea.
   * En este caso la capa sería detectado por los plugins de tablas de contenidos
   * y aparecería como no visible.
   * - displayInLayerSwitcher: Indica si la capa se muestra en el selector de capas.
   * @param {Mx.parameters.LayerOptions} options Estas opciones se mandarán a la implementación.
   * - minZoom: Zoom mínimo aplicable a la capa.
   * - maxZoom: Zoom máximo aplicable a la capa.
   * - minScale: Escala mínima.
   * - maxScale: Escala máxima.
   * - minResolution: Resolución mínima.
   * - maxResolution: Resolución máxima.
   * - visibility: Define si la capa es visible o no. Verdadero por defecto.
   * - displayInLayerSwitcher: Indica si la capa se muestra en el selector de capas.
   * - opacity: Opacidad de capa, por defecto 1.
   * @api
   */
  constructor(userParameters, options = {}, vendorOptions = {}) {
    if (isString(userParameters) || !isUndefined(userParameters.transparent)) {
      // eslint-disable-next-line no-console
      console.warn(getValue('exception').transparent_deprecated);
    }

    const parameters = parameter.layer(userParameters, LayerType.LayerGroup);

    // ! Parámetros definifos en super en impl
    const opt = options;
    opt.visibility = userParameters.visibility;
    opt.maxExtent = userParameters.maxExtent;
    opt.displayInLayerSwitcher = parameters.displayInLayerSwitcher;

    if (isUndefined(LayerGroupImpl) || (isObject(LayerGroupImpl)
      && isNullOrEmpty(Object.keys(LayerGroupImpl)))) {
      Exception(getValue('exception').layergroup_method);
    }

    /**
     * Implementation of this layer
     * @public
     * @type {IDEE.impl.layer.LayerGroup}
     */
    const impl = new LayerGroupImpl(parameters, opt, vendorOptions);
    super(parameters, impl);

    this.layers = impl.layers;

    this.display = parameters.display || true;
  }

  /**
   * Cambia la visibilidad de la capa.
   *
   * @function
   * @param {boolean} visibility Visibilidad de la capa.
   * @api
   */
  setVisible(visibility) {
    this.getImpl().setVisible(visibility);
  }

  /**
   * Elimina las capas del grupo.
   *
   * @function
   * @param {Array<IDEE.LayerBase|IDEE.LayerGroup>} layers Capas a eliminar.
   * @api
   */
  removeLayers(layers = []) {
    let arrLayers = layers;
    if (!Array.isArray(arrLayers)) {
      arrLayers = [arrLayers];
    }

    arrLayers.forEach((layer) => {
      if (!layer.getImpl().isWMSfull) {
        this.getImpl().removeLayer(layer);
      } else {
        layer.getImpl().getWMSFullLayers.then((layersWMSFull) => {
          layersWMSFull.forEach((l) => {
            this.getImpl().removeLayer(l);
          });
        });
      }
    });

    // ! Se actualiza this.layers
    this.layers = this.getLayers();
  }

  /**
   * Saca una capa del grupo.
   * @function
   * @param {IDEE.LayerBase|IDEE.LayerGroup} layer Capa a sacar.
   * @param {boolean} upToMap Indica si se saca hasta el mapa.
   * @api
   */
  ungroup(layers, upToMap = false) {
    let arrLayers = layers;
    if (!Array.isArray(arrLayers)) {
      arrLayers = [arrLayers];
    }

    arrLayers.forEach((layer) => {
      this.getImpl().ungroup(layer, upToMap);
    });

    // ! ¿? Se actualiza this.layers
  }

  /**
   * Añade capas al grupo.
   * @function
   * @param {Array<IDEE.LayerBase|IDEE.LayerGroup>} layers Capas a añadir.
   * @api
   */
  addLayers(layers = []) {
    let arrLayers = layers;
    if (!Array.isArray(arrLayers)) {
      arrLayers = [arrLayers];
    }

    arrLayers.forEach((layer) => {
      const l = this.getImpl().addLayer(layer);
      this.fire(EventType.ADDED_TO_LAYERGROUP, [l, this]);
    });

    // ! Se actualiza this.layers
    this.layers = this.getLayers();

    // se actualiza zIndex de grupos relacionados desde el grupo raiz
    if (this.getZIndex() !== null) {
      let topRootGroup = this.getImpl().getTopRootGroup();
      let oldZIndex = this.getZIndex();
      const map = this.getImpl().getMap();
      let base = this.isBase;
      let idLayer = this.idLayer;
      if (topRootGroup) {
        topRootGroup = map.getLayers()
          .find((l) => l.getImpl().getLayer().ol_uid === topRootGroup.getLayer().ol_uid);
        oldZIndex = topRootGroup.getZIndex();
        base = topRootGroup.isBase;
        idLayer = topRootGroup.idLayer;
        // Si es base no va a cambiar el zIndex del grupo
        // pero hay que establecer el de las capas hijas
        if (base) {
          topRootGroup.getImpl().setZIndexChildren();
        } else {
          topRootGroup.setZIndex(oldZIndex + arrLayers.length);
        }
      } else if (base) {
        this.getImpl().setZIndexChildren();
      } else {
        this.setZIndex(oldZIndex + arrLayers.length);
      }
      // Se actualizan los layers que estan por encima para que sigan por encima
      if (!base) {
        const layersUp = map.getLayers()
          .filter((l) => l.idLayer !== idLayer && l.getZIndex() > oldZIndex);
        layersUp.forEach((l) => l.setZIndex(l.getZIndex() + arrLayers.length));
      }
    }
  }

  /**
   * Devuelve las capas del grupo.
   * @function
   * @return {Array<IDEE.LayerBase|IDEE.LayerGroup>} Capas del grupo.
   * @api
   */
  getLayers() {
    return this.getImpl().getLayers();
  }

  /**
   * Devuelve las capas del grupo.
   * @function
   * @return {Array<IDEE.LayerBase|IDEE.LayerGroup>} Capas del grupo.
   * @api
   */
  equals(obj) {
    let equals = false;
    if (obj instanceof LayerGroup) {
      equals = (this.name === obj.name);
      equals = equals && (this.idLayer === obj.idLayer);
    }

    return equals;
  }
}

export default LayerGroup;
