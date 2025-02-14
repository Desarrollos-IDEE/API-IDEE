/**
 * @module IDEE/control/ViewHistoryControl
 */

import template from 'templates/viewhistory';
import ViewHistoryImpl from 'impl/viewhistorycontrol';
import { getValue } from './i18n/language';

export default class ViewHistoryControl extends IDEE.Control {
  /**
   * Main constructor of the class. Creates a PluginControl
   * control
   *
   * @constructor
   * @extends {IDEE.Control}
   * @api
   */
  constructor(map) {
    if (IDEE.utils.isUndefined(ViewHistoryImpl) || (IDEE.utils.isObject(ViewHistoryImpl)
      && IDEE.utils.isNullOrEmpty(Object.keys(ViewHistoryImpl)))) {
      IDEE.exception(getValue('exception.impl_viewhistory'));
    }
    const impl = new ViewHistoryImpl(map);
    super(impl, 'ViewHistoryImpl');

    this.registerViewEvents_();
  }

  /**
   * This function registers view events on map
   *
   * @function
   * @private
   */
  registerViewEvents_() {
    this.getImpl().registerViewEvents();
  }

  /**
   * This functions active control
   *
   * @public
   * @function
   * @param {Node} html
   * @api
   */
  active(html) {
    const viewhistoryactive = html.querySelector('#m-viewmanagement-viewhistory').classList.contains('activated');
    this.deactive(html);
    if (!viewhistoryactive) {
      html.querySelector('#m-viewmanagement-viewhistory').classList.add('activated');
      const panel = IDEE.template.compileSync(template, {
        vars: {
          translations: {
            previousView: getValue('previousView'),
            nextView: getValue('nextView'),
          },
        },
      });
      document.querySelector('#div-contenedor-viewmanagement').appendChild(panel);
      html.querySelector('#m-historyprevious-button').addEventListener('click', this.previousStep_.bind(this));
      html.querySelector('#m-historynext-button').addEventListener('click', this.nextStep_.bind(this));
    }
  }

  /**
   * This functions deactive control
   *
   * @public
   * @function
   * @param {Node} html
   * @api
   */
  deactive(html) {
    html.querySelector('#m-viewmanagement-viewhistory').classList.remove('activated');
    const panel = html.querySelector('#m-viewhistory-panel');
    if (panel) {
      document.querySelector('#div-contenedor-viewmanagement').removeChild(panel);
    }
  }

  /**
   * This function shows the next zoom change to the map
   *
   * @private
   * @function
   * @param {Event} evt - Event
   */
  nextStep_(evt) {
    evt.preventDefault();
    evt.target.classList.add('activated');
    setTimeout(() => {
      evt.target.classList.remove('activated');
    }, 1000);
    this.getImpl().nextStep();
  }

  /**
   * This function shows the previous zoom change to the map
   *
   * @private
   * @function
   * @param {Event} evt - Event
   */
  previousStep_(evt) {
    evt.preventDefault();
    evt.target.classList.add('activated');
    setTimeout(() => {
      evt.target.classList.remove('activated');
    }, 1000);
    this.getImpl().previousStep();
  }

  /**
   * This function compares controls
   *
   * @public
   * @function
   * @param {IDEE.Control} control to compare
   * @api
   */
  equals(control) {
    return control instanceof ViewHistoryControl;
  }

  /**
   * This function destroys this control
   *
   * @public
   * @function
   * @api
   */
  destroy() {
    this.getImpl().unRegisterViewEvents();
  }
}
