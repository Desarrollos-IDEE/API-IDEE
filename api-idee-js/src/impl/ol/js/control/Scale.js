/**
 * @module IDEE/impl/control/Scale
 */
import { isNullOrEmpty } from 'IDEE/util/Utils';
import Utils from 'impl/util/Utils';
import { getValue } from 'IDEE/i18n/language';
import * as Dialog from 'IDEE/dialog';
import Exception from 'IDEE/exception/exception';
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
    elem.innerHTML = map.getZoom().toFixed(2);
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
   * @param {IDEE.Map} map Mapa.
   * @param {function} template Plantilla del control.
   * @api stable
   */
  addTo(map, element) {
    const scaleId = 'm-scale-span';
    const zoomLevel = 'm-level-number';

    this.facadeMap_ = map;
    this.scaleContainer_ = element.querySelector('#'.concat(scaleId));
    this.zoomLevelContainer_ = element.querySelector('#'.concat(zoomLevel));
    this.element = element;
    this.render = this.renderCB;
    this.target_ = null;
    map.getMapImpl().addControl(this);

    if (this.scaleContainer_ !== null) {
      element.addEventListener('mouseenter', () => { this.zoomLevelContainer_.classList.add('blinking-background'); });
      element.addEventListener('mouseleave', () => { this.zoomLevelContainer_.classList.remove('blinking-background'); });
      this.zoomLevelContainer_.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          const zoomText = this.zoomLevelContainer_.textContent.trim();

          try {
            if (!/^-?\d+(\.\d+)?$/.test(zoomText)) {
              this.zoomLevelContainer_.textContent = map.getZoom();
              Exception(getValue('exception').invalid_zoom);
            }
          } catch (err) {
            Dialog.error(err.toString());
            return;
          }
          const zoomValue = parseFloat(zoomText);
          const zoomConstrains = map.getZoomConstrains();

          if (zoomConstrains && !Number.isInteger(zoomValue)) {
            this.zoomLevelContainer_.textContent = Math.floor(zoomValue);
          }
          map.setZoom(zoomConstrains ? Math.round(zoomValue) : zoomValue);
          this.zoomLevelContainer_.blur();
        }
      });
    }
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
    this.zoomLevelContainer_ = null;
  }
}

export default Scale;
