/**
 * @module M/impl/control/Scale
 */
import { isNullOrEmpty } from 'M/util/Utils';
import Utils from 'impl/util/Utils';
import Control from './Control';

/**
 * Formate un número pasado por parámetro.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 * @public
 * @function
 * @param {Number} num Cadena en formato número.
 * @returns {String} Cadena en formato número.
 * @api stable
 */
export const formatLongNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

/**
 * Actualiza el elemento del control.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 * @public
 * @function
 * @param {Boolean} viewState Estado de la vista.
 * @param {HTMLElement} container HTML contenedor del control.
 * @param {Number} map Mapa.
 * @param {Boolean} exact Devuelve la escala del WMTS o genérica.
 * @api stable
 */
const updateElement = (viewState, container, map, exact) => {
  const containerVariable = container;
  let num;
  if (map.getWMTS().length > 0) {
    num = Utils.getWMTSScale(map, exact);
    // num = map.getExactScale();
  } else if (map.getWMTS().length <= 0 && exact === true) {
    num = Utils.getWMTSScale(map, exact);
    // num = map.getExactScale();
  } else if (map.getWMTS().length <= 0 && !exact === true) {
    num = map.getScale();
  }

  if (!isNullOrEmpty(num)) {
    containerVariable.innerHTML = formatLongNumber(num);
  }
  const elem = document.querySelector('#m-level-number');
  if (elem !== null) {
    elem.innerHTML = Math.round(map.getZoom(), 2);
  }
};

/**
 * @classdesc
 * Agregar escala numérica.
 * @api
 */
class Scale extends Control {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {Object} options Opciones del control.
   * - Order: Orden que tendrá con respecto al
   * resto de plugins y controles por pantalla.
   * - exactScale: Escala exacta.
   * @extends {ol.control.Control}
   * @api stable
   */
  constructor(options = {}) {
    super();
    this.facadeMap_ = null;
    this.exactScale = options.exactScale || false;
  }

  /**
   * Este método agrega el control al mapa.
   *
   * @public
   * @function
   * @param {M.Map} map Mapa.
   * @param {function} template Plantilla del control.
   * @api stable
   */
  addTo(map, element) {
    this.facadeMap_ = map;

    const scaleId = 'm-scale-span';
    this.scaleContainer_ = element.querySelector('#'.concat(scaleId));
    this.element = element;
    this.render = this.renderCB;
    this.target_ = null;
    map.getMapImpl().addControl(this);
  }

  /**
   * Actualiza la linea de la escala.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @param {ol.MapEvent} mapEvent Evento del mapa.
   * @this {ol.control.ScaleLine}
   * @api
   */
  renderCB(mapEvent) {
    const frameState = mapEvent.frameState;
    if (!isNullOrEmpty(frameState)) {
      updateElement(frameState.viewState, this.scaleContainer_, this.facadeMap_, this.exactScale);
    }
  }

  /**
   * Esta función destruye este control, limpiando el HTML y anula el registro de todos los eventos.
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {
    super.destroy();
    this.scaleContainer_ = null;
  }
}

export default Scale;
