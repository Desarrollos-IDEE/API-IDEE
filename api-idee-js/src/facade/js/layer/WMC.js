/**
 * @module IDEE/layer/WMC
 */
import WMCImpl from 'impl/layer/WMC';
import {
  isUndefined, isNullOrEmpty, isObject,
} from '../util/Utils';
import Exception from '../exception/exception';
import LayerBase from './Layer';
import * as parameter from '../parameter/parameter';
import * as LayerType from './Type';
import { getValue } from '../i18n/language';
import * as EventType from '../event/eventtype';

/**
 * @classdesc
 * WMC (Web Map Context, o Web View Context) es un estándar de definición de mapas OGC que permite
 * agrupar capas en un único contexto de mapas.
 * Facilita trabajar con un número elevado de capas independientes y personalizar
 * sus comportamientos.
 *
 * @property {Object} attribution Atribución de la capa.
 * @property {string} _type Tipo de la capa.
 * @property {string} url URL del servicio.
 * @property {string} name Nombre de la capa.
 * @property {boolean} transparent (deprecated) Falso si es una capa base,
 * verdadero en caso contrario.
 * @property {boolean} isBase Define si la capa es base.
 * @property {Array<Number>} userMaxExtent MaxExtent proporcionado por el usuario, la medida en que
 * restringe la visualización a una región específica.
 * @property {string} legend Indica el nombre que queremos que aparezca en el árbol
 * de contenidos, si lo hay.
 * minZoom
 * maxZoom
 * @property {string} idLayer Identificador de la capa.
 * @property {Mx.parameters.LayerOptions} options Opciones de la capa.
 *
 * @api
 * @extends {IDEE.Layer}
 */
class WMC extends LayerBase {
  /**
   * Constructor principal de la clase. Crea una capa WMC con parámetros
   * especificados por el usuario.
   *
   * @constructor
   * @param {string|Mx.parameters.WMC} userParameters Parámetros para la construcción de la capa.
   * - attribution: Atribución de la capa.
   * - name: Nombre de la capa.
   * - isBase: Indica si la capa es base.
   * - transparent (deprecated): Falso si es una capa base, verdadero en caso contrario.
   * - maxExtent: La medida en que restringe la visualización a una región específica.
   * - legend: Nombre asociado en el árbol de contenidos, si usamos uno.
   * - url: url del servicio.
   * @param {Mx.parameters.LayerOptions} options Estas opciones se mandarán a la
   * implementación de la capa.
   * - visibility: Define si la capa es visible o no. Verdadero por defecto.
   * - displayInLayerSwitcher: Indica si la capa se muestra en el selector de capas.
   * - opacity: Opacidad de capa, por defecto 1.
   * - minZoom: Zoom mínimo aplicable a la capa.
   * - maxZoom: Zoom máximo aplicable a la capa.
   * - minScale: Escala mínima.
   * - maxScale: Escala máxima.
   * @api
   */
  constructor(userParameters, options) {
    // checks if the implementation can create WMC layers
    if (isUndefined(WMCImpl) || (isObject(WMCImpl) && isNullOrEmpty(Object.keys(WMCImpl)))) {
      Exception(getValue('exception').wmc_method);
    }

    // checks if the param is null or empty
    if (isNullOrEmpty(userParameters)) {
      Exception(getValue('exception').no_param);
    }

    const impl = new WMCImpl(options);

    // This Layer is of parameters
    const parameters = parameter.layer(userParameters, LayerType.WMC);
    // calls the super constructor
    super(parameters, impl);

    /**
     * WMC options: Opciones WMC.
     */
    this.options = options;

    // checks if the name is auto-generated
    if (!isNullOrEmpty(this.url) && isNullOrEmpty(this.name)) {
      this.generateName_();
    } else if (isNullOrEmpty(this.url) && !isNullOrEmpty(this.name)) {
      // checks if it is predefined context
      const predefinedIdx = IDEE.config.predefinedWMC.predefinedNames.indexOf(this.name);
      if (predefinedIdx === -1) {
        Exception(`El contexto predefinido '${this.name}' no existe`);
      } else {
        this.url = IDEE.config.predefinedWMC.urls[predefinedIdx];
        this.name = IDEE.config.predefinedWMC.names[predefinedIdx];
      }
    }

    /**
     * Indica si la capa y sus subcapas están cargadas.
     */
    this.loaded_ = false;

    this.once(EventType.LOAD, () => {
      this.setLoaded(true);
    });
  }

  /**
   * Devuelve el valor de la propiedad "selected".
   *
   * @function
   * @getter
   * @return {IDEE.layer.WMC.impl.selected} Devuelve si la capa fue
   * seleccionada o no.
   * @api
   */
  get selected() {
    return this.getImpl().selected;
  }

  /**
   * Sobreescribe el valor de la propiedad "selected".
   *
   * @function
   * @setter
   * @param {IDEE.WMC.selected} newSelectedValue Nuevo valor para la
   * propiedad "selected".
   * @api
   */
  set selected(newSelectedValue) {
    this.getImpl().selected = newSelectedValue;
  }

  /**
   * Devuelve las capas proporcionadas por el archivo WMC.
   *
   * @function
   * @getter
   * @return {IDEE.layer.WMC.impl.layers} Capas de WMC.
   * @api
   */
  get layers() {
    return this.getImpl().layers;
  }

  /**
   * Sobreescribe las capas de una WMC.
   *
   * @function
   * @setter
   * @param {IDEE.WMC.layers} newLayers Nuevas capas de una WMC.
   * @api
   */
  set layers(newLayers) {
    this.getImpl().layers = newLayers;
  }

  /**
   * Devuelve la proyección proporcionada por el archivo WMC.
   *
   * @function
   * @getter
   * @return {IDEE.layer.WMC.impl.projection} Proyección de la
   * capa WMC.
   * @api
   */
  get projection() {
    return this.getImpl().projection;
  }

  /**
   * Sobreescribe la proyección de la capa WMC.
   *
   * @function
   * @setter
   * @param {IDEE.WMC.projection} newProjection Nueva proyección de
   * la capa WMC.
   * @api
   */
  set projection(newProjection) {
    this.getImpl().projection = newProjection;
  }

  /**
   * Sobreescribe la extensión máxima de la capa WMC.
   *
   * @function
   * @setter
   * @param {IDEE.WMC.maxExtent} newMaxExtent Nueva extensión máxima de
   * la capa WMC.
   * @api
   */
  set maxExtent(newMaxExtent) {
    this.getImpl().maxExtent = newMaxExtent;
  }

  /**
   * Devuelve las opciones de la capa WMC.
   *
   * @function
   * @getter
   * @return {IDEE.layer.WMC.impl.options} Opciones de la
   * capa WMC.
   * @api
   */
  get options() {
    return this.getImpl().options;
  }

  /**
   * Sobreescribe las opciones de la capa WMC.
   *
   * @function
   * @setter
   * @param {IDEE.WMC.options} newOptions Nuevas opciones de
   * la capa WMC.
   * @api
   */
  set options(newOptions) {
    this.getImpl().options = newOptions;
  }

  /**
   * Este método obtiene la extensión máxima de la capa.
   *
   * @function
   * @public
   * @return {IDEE.layer.maxExtent} Devuelve la extensión máxima de
   * esta capa.
   * @api
   */
  getMaxExtent(callbackFn) {
    return this.getImpl().getMaxExtent(callbackFn);
  }

  /**
   * Este método obtiene la extensión máxima de la capa.
   * Se trata de la versión asíncrona de getMaxExtent.
   *
   * @function
   * @public
   * @return {IDEE.layer.maxExtent} Devuelve la extensión máxima de
   * esta capa.
   * @api
   */
  calculateMaxExtent() {
    return this.getImpl().calculateMaxExtent();
  }

  /**
   * Esta función selecciona esta capa WMC y lanza el evento para dibujarla.
   *
   * @function
   * @public
   * @api
   */
  select() {
    // checks if the implementation can manage select method
    if (isUndefined(this.getImpl().select)) {
      Exception(getValue('exception').select_method);
    }

    this.getImpl().select();
  }

  /**
   * Esta función deselecciona esta capa WMC y elimina todas sus capas.
   *
   * @function
   * @public
   * @api
   */
  unselect() {
    // checks if the implementation can manage select method
    if (isUndefined(this.getImpl().unselect)) {
      Exception(getValue('exception').unselect_method);
    }

    this.getImpl().unselect();
  }

  /**
   * Este método comprueba si un objeto es igual
   * a esta capa.
   *
   * @function
   * @public
   * @param {Object} obj Objeto a comparar.
   * @return {boolean} Valor verdadero es igual, falso no lo es.
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

  /**
   * Este método indica si la capa está cargada.
   *
   * @function
   * @public
   * @return {boolean} Valor verdadero si está
   * cargada, falso no lo está.
   * @api
   */
  isLoaded() {
    return this.loaded_;
  }

  /**
   * Este método modifica el valor que indica si la capa
   * está cargada o no.
   *
   * @function
   * @public
   * @param {boolean} loaded Verdadero si la capa está cargada, falso
   * si no lo está.
   * @api
   */
  setLoaded(loaded) {
    this.loaded_ = loaded;
  }
}

export default WMC;
