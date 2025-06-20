/**
 * @module IDEE/impl/control/Scale
 */
import { isNullOrEmpty } from 'IDEE/util/Utils';
import Utils from 'impl/util/Utils';
import { getValue } from 'IDEE/i18n/language';
import * as Dialog from 'IDEE/dialog';
import Exception from 'IDEE/exception/exception';
import { METERS_PER_UNIT } from 'ol/proj';
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
 * @param {HTMLElement} container HTML contenedor del control.
 * @param {Number} map Mapa.
 * @api stable
 */
const updateElement = (container, map) => {
  const containerVariable = container;
  const view = map.getMapImpl().getView();
  const unidades = view.getProjection().getUnits();
  const unidadesMapa = METERS_PER_UNIT[unidades];
  const resolution = view.getResolution();
  const dpi = IDEE.config.DPI || 72;
  const num = Utils.getScaleForResolution(resolution, unidadesMapa, dpi);

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
  }

  /**
   * Este método agrega el control al mapa.
   *
   * @public
   * @function
   * @param {IDEE.Map} map Mapa.
   * @param {function} element Plantilla del control.
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
    this.previousScale_ = null;
    map.getMapImpl().addControl(this);
    this.addZoomLevelListeners();
    this.addScaleListeners();
  }

  /**
   * Agrega los listeners al nivel de zoom.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @this {IDEE.impl.ol.control.Scale}
   * @api stable
   */
  addZoomLevelListeners() {
    if (this.zoomLevelContainer_ !== null) {
      this.zoomLevelContainer_.addEventListener('mouseenter', () => { this.zoomLevelContainer_.classList.add('blinking-background'); });
      this.zoomLevelContainer_.addEventListener('mouseleave', () => { this.zoomLevelContainer_.classList.remove('blinking-background'); });
      this.zoomLevelContainer_.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          const zoomText = this.zoomLevelContainer_.textContent.trim();

          try {
            if (!/^-?\d+(\.\d+)?$/.test(zoomText)) {
              this.zoomLevelContainer_.textContent = this.facadeMap_.getZoom();
              Exception(getValue('exception').invalid_zoom);
            }
          } catch (err) {
            Dialog.error(err.toString());
            return;
          }
          const zoomValue = parseFloat(zoomText);
          const zoomConstrains = this.facadeMap_.getZoomConstrains();

          if (zoomConstrains && !Number.isInteger(zoomValue)) {
            this.zoomLevelContainer_.textContent = Math.floor(zoomValue);
          }
          this.facadeMap_.getMapImpl().getView().animate({
            center: this.facadeMap_.getMapImpl().getView().getCenter(),
            zoom: zoomConstrains ? Math.floor(zoomValue) : zoomValue,
            duration: 500,
          });
          this.zoomLevelContainer_.blur();
        }
      });
    }
  }

  /**
   * Agrega los listeners a la escala.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @this {IDEE.impl.ol.control.Scale}
   * @api stable
   */
  addScaleListeners() {
    if (this.scaleContainer_ !== null) {
      this.scaleContainer_.addEventListener('mouseenter', () => { this.scaleContainer_.classList.add('blinking-background'); });
      this.scaleContainer_.addEventListener('mouseleave', () => { this.scaleContainer_.classList.remove('blinking-background'); });
      this.scaleContainer_.addEventListener('focus', () => { this.previousScale_ = this.scaleContainer_.textContent; });
      this.scaleContainer_.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          const scaleText = this.scaleContainer_.textContent.trim();
          try {
            if (!/^\d+$/.test(scaleText)) {
              Exception(getValue('exception').invalid_scale);
            }
            this.scaleContainer_.textContent = scaleText;
            const view = this.facadeMap_.getMapImpl().getView();
            const resolution = Utils.getCurrentScale(
              this.facadeMap_,
              scaleText,
            );
            view.animate({
              center: view.getCenter(),
              resolution,
              duration: 500,
            });
            this.scaleContainer_.blur();
          } catch (err) {
            this.scaleContainer_.textContent = this.previousScale_;
            Dialog.error(err.toString());
          }
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
      updateElement(this.scaleContainer_, this.facadeMap_);
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
