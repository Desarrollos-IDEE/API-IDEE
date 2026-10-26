/**
 * @module IDEE/impl/layer/WMC
 */
import { isNullOrEmpty, isFunction } from 'IDEE/util/Utils';
import { get as getRemote } from 'IDEE/util/Remote';
import * as EventType from 'IDEE/event/eventtype';
import { getValue } from 'IDEE/i18n/language';
import FormatWMC from '../../../ol/js/format/wmc/WMC';
import ImplUtils from '../util/Utils';
import Layer from './Layer';

/**
 * Proyecciones cuyas coordenadas ya están en grados.
 * @const
 * @type {Array<String>}
 */
const DEGREES_PROJECTIONS = ['EPSG:4326', 'EPSG:4258', 'EPSG:4979', 'CRS:84'];

/**
 * Capas WMS de una colección de capas y secciones (recorre las secciones anidadas).
 *
 * @param {Array<IDEE.layer.WMS|IDEE.layer.Section>} items Capas y secciones.
 * @returns {Array<IDEE.layer.WMS>} Capas WMS.
 */
const leafLayers = (items = []) => items.flatMap((item) => {
  return isFunction(item.getChildren) ? leafLayers(item.getChildren()) : [item];
});

/**
 * @classdesc
 * Implementación para Cesium de la capa WMC (contexto de mapa). Reutiliza el
 * lector de contextos de OpenLayers y añade las capas WMS y las secciones del
 * contexto. Cesium trabaja siempre en EPSG:4979, así que la proyección del
 * contexto no cambia la del mapa: sus extensiones se pasan a grados.
 *
 * @api
 * @extends {IDEE.impl.layer.Layer}
 */
class WMC extends Layer {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {Object} options Opciones de la capa.
   * @api
   */
  constructor(options = {}) {
    super(options);

    /**
     * Indica si el contexto está seleccionado.
     * @public
     * @type {Boolean}
     */
    this.selected = false;

    /**
     * Capas WMS del contexto (fuera de secciones).
     * @public
     * @type {Array<IDEE.layer.WMS>}
     */
    this.layers = [];

    /**
     * Secciones del contexto.
     * @public
     * @type {Array<IDEE.layer.Section>}
     */
    this.sections = [];

    /**
     * Promesa de carga del contexto.
     * @public
     * @type {Promise|null}
     */
    this.loadContextPromise = null;

    /**
     * Extensión máxima del contexto, en grados.
     * @public
     * @type {Array<Number>|null}
     */
    this.maxExtent = null;
  }

  /**
   * Añade la capa al mapa. Las capas del contexto se añaden al seleccionarlo.
   *
   * @public
   * @function
   * @param {IDEE.Map} map Mapa.
   * @api
   */
  addTo(map) {
    this.map = map;
    this.fireAddedToMap_();
  }

  /**
   * No disponible para WMC.
   *
   * @public
   * @function
   * @param {Object} layer Capa.
   * @api
   */
  setLayer(layer) {
    // eslint-disable-next-line no-console
    console.warn(getValue('exception').setlayer_method);
  }

  /**
   * Selecciona el contexto: deselecciona el resto, lo carga y añade sus capas.
   *
   * @public
   * @function
   * @api
   */
  select() {
    if (this.selected === false) {
      this.map.getWMC().forEach((wmcLayer) => wmcLayer.unselect());
      this.selected = true;

      this.loadContextPromise = getRemote(this.url).then((response) => {
        const context = new FormatWMC({}).readFromDocument(response.xml);
        return WMC.contextToDegrees(context);
      }).catch((error) => {
        // eslint-disable-next-line no-console
        console.error(error);
        return { layers: [], layerGroups: [], maxExtent: null };
      });

      this.loadContextPromise.then((context) => {
        // Deseleccionado o quitado del mapa mientras se cargaba
        if (this.selected === false || isNullOrEmpty(this.map)) return;
        this.loadLayers(context);

        // eslint-disable-next-line no-underscore-dangle
        const userCenter = this.map.userCenter_;
        if (!isNullOrEmpty(userCenter)) {
          this.map.getImpl().setCenter(userCenter);
        }

        this.map.fire(EventType.CHANGE_WMC, this);
      });
    }
  }

  /**
   * Deselecciona el contexto y quita sus capas y secciones del mapa.
   *
   * @public
   * @function
   * @api
   */
  unselect() {
    if (this.selected === true) {
      this.selected = false;

      if (!isNullOrEmpty(this.layers)) {
        this.map.removeLayers(this.layers);
      }

      if (!isNullOrEmpty(this.sections)) {
        const aux = [...this.sections];
        this.sections = [];
        this.map.removeSections(aux);
      }
    }
  }

  /**
   * Añade al mapa las capas y secciones del contexto.
   *
   * @public
   * @function
   * @param {Object} context Contexto leído.
   * @api
   */
  loadLayers(context) {
    this.layers = context.layers || [];
    this.maxExtent = context.maxExtent;
    this.sections = isNullOrEmpty(context.layerGroups)
      ? [] : this.sections.concat(context.layerGroups);
    this.layers.forEach((wms) => wms.setWMCParent(this.facadeLayer_));
    this.map.addWMS(this.layers, true);
    this.map.addSections(this.sections);

    this.layers.forEach((layer, i) => layer.setZIndex(this.getZIndex() + i));
    this.sections.forEach((section, i) => section.setZIndex(this.getZIndex() + i));
    this.facadeLayer_.fire(EventType.LOAD, [this.layers]);
    this.facadeLayer_.fire(EventType.LOAD, [this.sections]);
  }

  /**
   * Pasa a grados las extensiones del contexto y de sus capas (las de la capa y
   * la global, que usa la fachada de WMS como extensión máxima).
   *
   * @public
   * @function
   * @param {Object} context Contexto leído.
   * @returns {Object} El mismo contexto.
   * @api
   */
  static contextToDegrees(context) {
    const ctx = context;
    const projection = ctx.projection;
    const toDegrees = (extent) => {
      if (isNullOrEmpty(extent) || isNullOrEmpty(projection)
        || DEGREES_PROJECTIONS.includes(projection.toUpperCase())) {
        return extent;
      }
      return ImplUtils.transformExtent(extent, projection, 'EPSG:4326') || null;
    };
    ctx.maxExtent = toDegrees(ctx.maxExtent);
    ctx.bounds = toDegrees(ctx.bounds);
    leafLayers((ctx.layers || []).concat(ctx.layerGroups || [])).forEach((layer) => {
      const { options } = layer;
      if (isNullOrEmpty(options)) return;
      options.wmcMaxExtent = toDegrees(options.wmcMaxExtent);
      options.wmcGlobalMaxExtent = ctx.maxExtent;
    });
    return ctx;
  }

  /**
   * Establece la fachada de la capa.
   *
   * @public
   * @function
   * @param {IDEE.layer.WMC} obj Fachada.
   * @api
   */
  setFacadeObj(obj) {
    this.facadeLayer_ = obj;
  }

  /**
   * Extensión máxima del contexto, en grados.
   *
   * @public
   * @function
   * @param {Function} callbackFn Función que recibe la extensión cuando se conoce.
   * @returns {Array<Number>|null} Extensión, si ya se conoce.
   * @api
   */
  getMaxExtent(callbackFn) {
    if (isNullOrEmpty(this.maxExtent) && !isNullOrEmpty(this.loadContextPromise)) {
      this.loadContextPromise.then((context) => {
        this.maxExtent = context.maxExtent;
        if (isFunction(callbackFn)) {
          callbackFn(this.maxExtent);
        }
      });
    } else if (isFunction(callbackFn)) {
      callbackFn(this.maxExtent);
    }
    return this.maxExtent;
  }

  /**
   * Versión asíncrona de getMaxExtent.
   *
   * @public
   * @function
   * @returns {Promise<Array<Number>|null>} Extensión.
   * @api
   */
  calculateMaxExtent() {
    return new Promise((resolve) => { this.getMaxExtent(resolve); });
  }

  /**
   * Capas WMS del contexto.
   *
   * @public
   * @function
   * @returns {Array<IDEE.layer.WMS>} Capas.
   * @api
   */
  getLayers() {
    return this.layers;
  }

  /**
   * Quita del mapa las capas del contexto.
   *
   * @public
   * @function
   * @api
   */
  destroy() {
    this.facadeLayer_?.stopAutoRefresh();
    if (!isNullOrEmpty(this.layers) && !isNullOrEmpty(this.map)) {
      this.map.removeLayers(this.layers);
    }
    this.map = null;
    this.layers.length = 0;
  }

  /**
   * Comprueba si un objeto es igual a esta capa.
   *
   * @public
   * @function
   * @param {Object} obj Objeto.
   * @returns {Boolean} Verdadero si es la misma capa.
   * @api
   */
  equals(obj) {
    return obj instanceof WMC && this.url === obj.url && this.name === obj.name
      && this.idLayer === obj.idLayer;
  }

  /**
   * El autorefresco del contexto recarga sus capas.
   *
   * @public
   * @function
   * @returns {Boolean} Verdadero.
   * @api
   */
  isAutoRefreshContainer() {
    return true;
  }
}

export default WMC;
