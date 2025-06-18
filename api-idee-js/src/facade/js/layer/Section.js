/**
 * @module IDEE/layer/Section
 */
import SectionImpl from 'impl/layer/Section';
import MObject from '../Object';
import {
  isUndefined, isNullOrEmpty, isObject, generateRandom, isArray,
} from '../util/Utils';
import Exception from '../exception/exception';
import { getValue } from '../i18n/language';
import * as EventType from '../event/eventtype';
import LayerBase from './Layer';
import LayerGroup from './LayerGroup';

/**
 * @classdesc
 * Esta clase representa una sección de capas de cualquier tipo dentro de un mapa. Si la
 * sección ya está añadida al mapa, las capas añadidas a la sección se añadirán automáticamente
 * al mapa, y las capas eliminadas de la sección se eliminarán automáticamente del mapa.
 * Los elementos dentro de la sección son considerados como hijos de la sección.
 *
 * @property {string} idLayer Identificador de la sección.
 * @property {string} title Título de la sección.
 * @property {boolean} collapsed Verdadero o falso para mostrar la sección colapsada
 * o expandida en el árbol de contenidos, si lo hay.
 * @property {number} order Posición de la sección.
 * @property {IDEE.layer.Section} parent Sección padre de esta sección, si la hay.
 * @property {Array<IDEE.layer.Section|IDEE.Layer>} children Capas hijas de esta sección.
 * @property {IDEE.impl.layer.Section} impl Implementación de la capa.
 * @property {number} zIndex Z-index de la sección para el orden de visualización.
 * @api
 * @extends {IDEE.Object}
 */
class Section extends MObject {
  /**
   * Constructor principal de la clase. Crea una nueva instancia de la clase Section con
   * parametros especificados por el usuario.
   *
   * @constructor
   * @param {string|Mx.parameters.Layer} userParameters Parámetros especificados por el usuario.
   * - idLayer: Identificador de la sección.
   * - title: Título de la sección.
   * - collapsed: Verdadero o falso para mostrar la sección colapsada o expandida
   * en el árbol de contenidos, si lo hay.
   * - order: Posición de la sección.
   * - zIndex: Z-index de la sección para el orden de visualización.
   * - children: Array de capas hijas de esta sección.
   *
   * @api
   */
  constructor(userParameters) {
    // checks if the implementation can create Section
    if (isUndefined(SectionImpl) || (isObject(SectionImpl)
      && isNullOrEmpty(Object.keys(SectionImpl)))) {
      Exception(getValue('exception').sectionlayer_method);
    }

    const parameters = { ...userParameters };

    if (isNullOrEmpty(parameters.idLayer)) {
      parameters.idLayer = generateRandom('Section').replace(/[^a-zA-Z0-9\-_]/g, '');
    }

    if (isNullOrEmpty(parameters.title)) {
      parameters.title = getValue('section').title;
    }

    if (isNullOrEmpty(parameters.zIndex)) {
      parameters.zIndex = 41;
    }

    if (isNullOrEmpty(parameters.order)) {
      parameters.order = 0;
    }

    /**
     * Implementación de la capa.
     * @public
     * @implements {IDEE.layer.Section}
     * @type {IDEE.layer.Section}
     */
    const impl = new SectionImpl(parameters);
    super(impl);

    /**
     * Section idLayer: Identificador de la sección.
     * @public
     * @type {string}
     * @api
     */
    this.idLayer = parameters.idLayer;

    /**
     * Section title: Título de la sección.
     * @public
     * @type {string}
     * @api
     */
    this.title = parameters.title;

    /**
     * Section collapsed: Verdadero o falso para mostrar la sección colapsada o expandida en el TOC.
     * @public
     * @type {boolean}
     * @api
     */
    this.collapsed = !!parameters.collapsed;

    /**
     * Section order: Posición de la sección.
     * @public
     * @type {number}
     * @api
     */
    this.order = parameters.order;

    /**
     * Sección padre de esta sección, si la hay.
     * @public
     * @type {IDEE.layer.Section}
     * @api
     */
    this.parent = null;

    /**
     * Capas hijas de esta sección.
     * @private
     * @type {Array<IDEE.layer.Section|IDEE.Layer>}
     * @api
     */
    this.children_ = [];

    /**
     * Implementación de la capa.
     * @private
     * @type {Array<IDEE.impl.layer.Section>}
     * @api
     */
    this.impl_ = impl;

    /**
     * Section zIndex: Z-index de la sección para el orden de visualización.
     * @private
     * @type {number}
     * @api
     */
    this.zIndex_ = parameters.zIndex;

    if (Array.isArray(parameters.children)) {
      this.addChildren(parameters.children);
    }
  }

  /**
   * Este método añade la capa al mapa.
   *
   * @public
   * @function
   * @param {IDEE.Map} map Mapa al que se añade la sección.
   * @api
   */
  addTo(map) {
    this.map = map;
    this.children_.forEach((child) => {
      if (child instanceof Section) {
        child.addTo(map);
      }
    });
    this.fire(EventType.ADDED_TO_MAP);
  }

  /**
   * Este método sobreescribe la visibilidad de la sección y de todas sus capas.
   *
   * @public
   * @function
   * @param {boolean} visibility Define si la sección es visible o no.
   * @api
   */
  setVisible(visibility) {
    this.getAllLayers().forEach((l) => (l.isBase === false) && l.setVisible(visibility));
  }

  /**
   * Este método establece el z-index de la sección y de todas sus capas hijas.
   * El z-index se aplica a la primera capa de la sección, luego se incrementa en uno
   * y se aplica a la siguiente capa, y así sucesivamente.
   *
   * @public
   * @function
   * @param {number} zIndex Nuevo z-index.
   * @api
   */
  setZIndex(zIndex) {
    this.zIndex_ = zIndex;
    const layersOfLayerGroup = [...this.getChildren()];
    const reverseLayers = layersOfLayerGroup.reverse();
    let countZindex = zIndex;
    reverseLayers.forEach((layer) => {
      layer.setZIndex(countZindex);
      countZindex += 1;
    });
  }

  /**
   * Este método obtiene el z-index de la sección.
   * Este z-index se corresponde con el más bajo de sus capas.
   *
   * @public
   * @function
   * @returns {number} Devuelve el z-index de la sección.
   * @api
   */
  getZIndex() {
    return this.zIndex_;
  }

  /**
   * Este método añade capas hijas a la sección.
   *
   * @public
   * @function
   * @param {IDEE.Layer|IDEE.layer.Section} layer Capa o sección a añadir.
   * @param {number} index Posición a añadir la capa.
   * @api
   */
  addChild(childParam, index) {
    let zIndex = this.getZIndex() + this.children_.length;
    const child = childParam;

    if (!(child instanceof LayerGroup)) {
      if (isNullOrEmpty(index)) {
        this.children_.unshift(child);
      } else {
        this.children_.splice(index, 0, child);
        zIndex = this.getZIndex() + index;
      }
      if (child instanceof Section) {
        child.parent = this;
      } else if (child instanceof LayerBase) {
        child.setSection(this);
        child.setZIndex(zIndex);
        if (!isNullOrEmpty(this.map)
          && !this.map.getRootLayers().some((rootLayer) => rootLayer.equals(child))) {
          this.map.addLayers(child);
          if (child instanceof Section) {
            this.map.addSections(child);
          }
        }
      }
    } else {
      // eslint-disable-next-line no-console
      console.warn(getValue('exception').not_layergroup_in_section);
    }
  }

  /**
   * Este método elimina una capa hija de la sección.
   *
   * @public
   * @function
   * @param {IDEE.Layer|IDEE.layer.Section} child Capa o sección a eliminar.
   * @api
   */
  deleteChild(child) {
    const childI = child;
    if (childI instanceof Section) {
      childI.parent = null;
      this.map.removeSections(childI);
    } else if (childI instanceof LayerBase) {
      this.map.removeLayers(childI);
      this.ungroup(child);
    }
  }

  /**
   * Este método elimina un conjunto de capas hijas de la sección.
   *
   * @public
   * @function
   * @param {Array<IDEE.Layer|IDEE.layer.Section>} children Capas o secciones a eliminar.
   * @api
   */
  deleteChildren(children) {
    children.forEach(this.deleteChild, this);
  }

  /**
   * Este método saca una capa de la sección.
   *
   * @public
   * @function
   * @param {IDEE.Layer|IDEE.layer.Section} child Capa o sección a sacar.
   * @api
   */
  ungroup(child) {
    child.setSection(null);
    this.children_.remove(child);
  }

  /**
   * Este método añade un conjunto de capas hijas a la sección.
   *
   * @public
   * @function
   * @param {Array<IDEE.Layer|IDEE.layer.Section>} children Capas o secciones a añadir.
   * @api
   */
  addChildren(children = []) {
    let arrChildren = children;
    if (!Array.isArray(children)) {
      arrChildren = [arrChildren];
    }

    arrChildren.forEach(this.addChild, this);
  }

  /**
   * Este método devuelve todas las capas hijas de la sección.
   *
   * @public
   * @function
   * @returns {Array<IDEE.Layer|IDEE.layer.Section>} Capas de la sección.
   * @api
   */
  getChildren() {
    return this.children_;
  }

  /**
   * Este método devuelve todas las capas hijas de la sección que son instancia de Layer,
   * ya sean directas o indirectas (de secciones internas).
   *
   * @public
   * @function
   * @returns {Array<IDEE.Layer>} Capas que son instancia de Layer de la sección.
   * @api
   */
  getAllLayers() {
    let layers = [];
    this.getChildren().forEach((child) => {
      if (child instanceof LayerBase) {
        layers.push(child);
      } else if (child instanceof Section) {
        layers = layers.concat(child.getAllLayers());
      }
    });
    return layers;
  }

  /**
   * Este método destruye la sección y todas sus capas hijas.
   *
   * @public
   * @function
   * @api
   */
  destroy() {
    this.map.removeLayers(this.getAllLayers());
  }

  /**
   * Este método busca una sección por su id, recursivamente si hay secciones anidadas.
   *
   * @public
   * @function
   * @param {number} groupId Identificador de la sección a buscar.
   * @param {Array<IDEE.layer.Section>} sections Conjunto de secciones donde buscar.
   * @api
   */
  static findGroupById(groupId, sections) {
    let group = null;
    if (isArray(sections) && sections.length > 0) {
      group = sections.find((g) => g instanceof Section && g.idLayer === groupId);
      if (group == null) {
        const childGroups = sections.map((g) => g.getChildren())
          .reduce((current, next) => current.concat(next), [])
          .filter((g) => g instanceof Section);
        group = Section.findGroupById(groupId, childGroups);
      }
    }
    return group;
  }
}

export default Section;
