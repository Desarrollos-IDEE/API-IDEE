/**
 * @module IDEE/control/WMCSelector
 */
import 'assets/css/controls/wmcselector';
import wmcselectorTemplate from 'templates/wmcselector';
import WMCSelectorImpl from 'impl/control/WMCSelector';
import ControlBase from './Control';
import {
  isUndefined, isNullOrEmpty, isObject,
} from '../util/Utils';
import Exception from '../exception/exception';
import { compileSync as compileTemplate } from '../util/Template';
import { getValue } from '../i18n/language';
import * as Position from '../ui/position';

/**
 * @typedef {Object} module:IDEE/control/WMCSelector~Options
 * @api
 * @property {String} [position] Posición del control en el mapa.
 * @property {String} [tooltip] Texto del tooltip.
 * @property {Number} [order] Accesibilidad, z-index.
 * @property {Object} [vendorOptions] Opciones específicas para la implementación.
 */

/**
 * @classdesc
 * Agregar selector de capas WMC.
 * @property {String} [position='down'] Posición del control.
 * @property {String} [tooltip] Texto del tooltip. por defecto la traducción.
 * @property {Number} [order=0] Accesibilidad, z-index.
 * @api
 * @extends {IDEE.Control}
 *
 * @note Para más opciones heredadas, ver {@link module:IDEE/control/Control~Options}.
 */
class WMCSelector extends ControlBase {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {module:IDEE/control/WMCSelector~Options} options Opciones del control.
   * @example
   * const control = new IDEE.control.WMCSelector({
   *   position: 'down',
   *   tooltip: 'Selector WMC',
   *   order: 2,
   * });
   * @api
   */
  constructor(options = {}) {
    if (isUndefined(WMCSelectorImpl) || (isObject(WMCSelectorImpl)
      && isNullOrEmpty(Object.keys(WMCSelectorImpl)))) {
      Exception(getValue('exception').wmcselector_method);
    }

    let vendorOptions = {};
    if (isObject(options.vendorOptions)) {
      vendorOptions = options.vendorOptions;
    }

    // implementation of this control
    const impl = new WMCSelectorImpl(vendorOptions);

    // calls the super constructor
    super(WMCSelector.NAME, impl, options);

    this.position = options.position ?? Position.DOWN;
  }

  /**
   * Esta función crea la vista del mapa especificado.
   *
   * @public
   * @function
   * @param {IDEE.Map} map Mapa
   * @returns {Promise} Plantilla HTML.
   * @api
   */
  createView(map) {
    let title = getValue('wmcselector').title;
    if (this.tooltip) {
      title = this.tooltip;
    }

    // compiles the template
    return compileTemplate(wmcselectorTemplate, {
      vars: {
        layers: map.getWMC(),
        title,
        order: this.order,
      },
    });
  }

  /**
   * Esta función comprueba si un objeto es igual
   * a este control.
   *
   * @public
   * @function
   * @param {*} obj Objeto a comparar.
   * @returns {boolean} Iguales devuelve verdadero, falso si no son iguales.
   * @api
   */
  equals(obj) {
    const equals = (obj instanceof WMCSelector);
    return equals;
  }

  /**
   * Elimina el control.
   *
   * @public
   * @function
   * @api
   */
  destroy() {
    super.destroy();
    const panel = this.getPanel();
    if (!isNullOrEmpty(panel)) {
      panel.removeClassName('m-with-wmcselector');
    }
  }
}

/**
 * Nombre del control
 * @const
 * @type {string}
 * @public
 * @api
 */
WMCSelector.NAME = 'wmcselector';

export default WMCSelector;
