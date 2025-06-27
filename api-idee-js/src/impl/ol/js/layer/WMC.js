/**
 * @module IDEE/impl/layer/WMC
 */
import { isNullOrEmpty, isFunction } from 'IDEE/util/Utils';
import { get as getRemote } from 'IDEE/util/Remote';
import * as EventType from 'IDEE/event/eventtype';
import { get as getProj } from 'ol/proj';
import FormatWMC from '../format/wmc/WMC';
import Layer from './Layer';

/**
 * @classdesc
 * WMC (Web Map Context, o Web View Context) es un estándar de definición de mapas OGC que permite
 * agrupar capas en un único contexto de mapas.
 * Facilita trabajar con un número elevado de capas independientes y personalizar
 * sus comportamientos.
 *
 * @property {boolean} selected Indica si la capa fue seleccionada.
 * @property {Array<IDEE.layer.WMS>} layers Capas definidas en WMC.
 * @property {Array<IDEE.layer.Section>} sections Secciones definidas en WMC.
 * @property {Promise} loadContextPromise Promesa para la carga del WMC.
 * @property {Mx.Extent} maxExtent Máxima extensión de la capa.
 * @property {ol.Projection} extentProj_ Proyección actual.
 *
 * @api
 * @extends {IDEE.impl.layer.Layer}
 */
class WMC extends Layer {
  /**
   * Constructor principal de la clase. Crea una capa WMC
   * con parámetros especificados por el usuario.
   *
   * @constructor
   * @implements {IDEE.impl.Layer}
   * @param {Mx.parameters.LayerOptions} options Parámetros opcionales para la capa.
   * - displayInLayerSwitcher: Indica si la capa se muestra en el selector de capas.
   * @api
   */
  constructor(options = {}) {
    // calls the super constructor
    super(options);

    /**
     * WMC selected. Indica si la capa
     * fue seleccionada.
     *
     * @public
     * @type {boolean}
     */
    this.selected = false;

    /**
     * WMC layers. Capas definidas
     * en WMC.
     *
     * @public
     * @type {Array<IDEE.layer.WMS>}
     */
    this.layers = [];

    /**
     * WMC sections. Secciones definidas en WMC.
     *
     * @public
     * @type {Array<IDEE.layer.Section>}
     */
    this.sections = [];

    /**
     * WMC loadContextPromise. Promesa para
     * carga del fichero WMC.
     *
     * @public
     * @type {Promise}
     */
    this.loadContextPromise = null;

    /**
     * WMC maxExtent. Máxima extensión de la capa.
     *
     * @public
     * @type {Mx.Extent}
     */
    this.maxExtent = null;

    /**
     * WMC extentProj_. Proyección actual.
     *
     * @private
     * @type {ol.Projection}
     */
    this.extentProj_ = null;
  }

  /**
   * Este método agrega la capa al mapa.
   *
   * @public
   * @function
   * @param {IDEE.Map} map Mapa
   * @api
   */
  addTo(map) {
    this.map = map;
    this.facadeLayer_?.fire(EventType.ADDED_TO_MAP);
  }

  /**
   * Este método selecciona la capa WMC y lanza
   * el evento para dibujarla.
   *
   * @public
   * @function
   * @api
   */
  select() {
    if (this.selected === false) {
      // unselect layers
      this.map.getWMC().forEach((wmcLayer) => wmcLayer.unselect());
      this.map.getImpl().setCalculatedResolutions(false);

      this.selected = true;

      // loads layers from this WMC if it is not cached
      this.loadContextPromise = new Promise((success, fail) => {
        getRemote(this.url).then((response) => {
          let proj;
          if (this.map.defaultProj === false) {
            proj = this.map.getProjection().code;
          }
          const wmcDocument = response.xml;
          const formater = new FormatWMC({ projection: proj });
          const context = formater.readFromDocument(wmcDocument);
          success.call(this, context);
        });
      });
      this.loadContextPromise.then((context) => {
        // set projection with the wmc
        if (this.map.defaultProj) {
          const olproj = getProj(context.projection);
          this.map.setProjection({
            code: olproj.getCode(),
            units: olproj.getUnits(),
          }, true);
        }
        // load layers
        this.loadLayers(context);
        this.map.fire(EventType.CHANGE_WMC, this);
      });
    }
  }

  /**
   * Este método deselecciona la capa WMC y
   * lanza el evento para borrarla.
   *
   * @public
   * @function
   * @api
   */
  unselect() {
    if (this.selected === true) {
      this.selected = false;

      // removes all loaded layers
      if (!isNullOrEmpty(this.layers)) {
        this.map.removeLayers(this.layers);
      }

      // removes all sections
      if (!isNullOrEmpty(this.sections)) {
        const aux = [...this.sections];
        this.sections = [];
        this.map.removeSections(aux);
      }
    }
  }

  /**
   * Este método carga todas las capa de una WMC y
   * las añade al mapa.
   *
   * @public
   * @function
   * @param {Object} context Contexto.
   * @api
   */
  loadLayers(context) {
    this.layers = context.layers;
    this.maxExtent = context.maxExtent;
    if (!isNullOrEmpty(context.layerGroups)) {
      this.sections = this.sections.concat(context.layerGroups);
    } else {
      this.sections = [];
    }
    this.layers.forEach((wms) => wms.setWMCParent(this.facadeLayer_));
    this.map.addWMS(this.layers, true);
    this.map.addSections(this.sections);

    this.facadeLayer_.fire(EventType.LOAD, [this.layers]);
    this.facadeLayer_.fire(EventType.LOAD, [this.sections]);
  }

  /**
   * Este método establece la clase de fachada WMC.
   * La fachada se refiere a un patrón estructural como una capa de abstracción
   * con un patrón de diseño.
   *
   * @function
   * @param {object} obj Capa de la fachada.
   * @api stable
   */
  setFacadeObj(obj) {
    this.facadeLayer_ = obj;
  }

  /**
   * Este método obtiene la extensión máxima de la capa WMC.
   *
   * @public
   * @function
   * @param {Function} callbackFn Función "callback".
   * @return {Mx.Extent} Extensión máxima de la capa.
   * @api
   */
  getMaxExtent(callbackFn) {
    if (isNullOrEmpty(this.maxExtent)) {
      this.loadContextPromise.then((context) => {
        this.maxExtent = context.maxExtent;
        if (isFunction(callbackFn)) {
          callbackFn(this.maxExtent);
        }
      });
    }
    if (!isNullOrEmpty(this.maxExtent) && isFunction(callbackFn)) {
      callbackFn(this.maxExtent);
    }
    return this.maxExtent;
  }

  /**
   * Este método obtiene la promesa con la máxima extensión
   * de la capa WMC.
   *
   * @public
   * @function
   * @return {Promise<Mx.Extent>} Promesa con la máxima extensión
   * de la capa.
   * @api
   */
  calculateMaxExtent() {
    return new Promise((resolve) => { this.getMaxExtent(resolve); });
  }

  /**
   * Este método obtiene las capas incluidas en WMC.
   *
   * @public
   * @function
   * @return {Array<IDEE.layer.WMS>} Capas incluidas en WMC.
   * @api
   */
  getLayers() {
    return this.layers;
  }

  /**
    * Este método destruye el mapa, limpiando el HTML
    * y anular el registro de todos los eventos.
    *
    * @public
    * @function
    * @api
    */
  destroy() {
    if (!isNullOrEmpty(this.layers)) {
      this.map.removeLayers(this.layers);
    }
    this.map = null;
    this.layers.length = 0;
    this.wmcDocument = null;
  }

  /**
    * Este método comprueba si un objeto es igual
    * a esta capa.
    *
    * @function
    * @param {Object} obj Objeto a comparar.
    * @return {boolean} Verdadero es igual, falso si no.
    * @api
    */
  equals(obj) {
    let equals = false;

    if (obj instanceof WMC) {
      equals = (this.url === obj.url);
      equals = equals && (this.name === obj.name);
      equals = equals && (this.idLayer === obj.idLayer);
    }

    return equals;
  }
}

export default WMC;
