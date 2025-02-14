/**
 * @module M/control/BasicControl
 */

import BasicImplControl from 'impl/basiccontrol';
import template from 'templates/basic';
import { getValue } from './i18n/language';

export default class BasicControl extends M.Control {
  /**
   * @classdesc
   * Constructor de la clase. Crea un control BasicControl
   *
   * @constructor
   * @extends {M.Control}
   * @api stable
   */
  constructor(isDraggable) {
    // 1. Comprueba si la implementación puede crear el control
    if (M.utils.isUndefined(BasicImplControl)) {
      M.exception(getValue('exceptions.impl'));
    }
    // 2. Crea la implementación del control
    const impl = new BasicImplControl();
    super(impl, 'Basic');

    /**
     * Indicador de si el plugin puede arrastrarse o no
     * @public
     * @type {boolean}
     */
    this.isDraggable_ = isDraggable || false;
  }

  /**
   * Esta función crea la vista
   *
   * @public
   * @function
   * @param {M.Map} map Mapa al que se añade el control
   * @api stable
   */
  createView(map) {
    return new Promise((success, fail) => {
      const html = M.template.compileSync(template, {
        vars: {
          translations: {
            title: getValue('title'),
            text: getValue('text'),
          },
        },
      });

      if (this.isDraggable_) {
        M.utils.draggabillyPlugin(this.getPanel(), '#m-basic-title');
      }
      success(html);
    });
  }

  /**
   * Esta función compara controles
   *
   * @public
   * @function
   * @param {M.Control} control control para comparar
   * @api stable
   */
  equals(control) {
    return control instanceof BasicControl;
  }
}
