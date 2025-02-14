/**
 * @module M/control/ModalControl
 */

import templateEN from 'templates/modal_en';
import templateES from 'templates/modal_es';
import ModalImplControl from 'impl/modalcontrol';
import { getValue } from './i18n/language';

export default class ModalControl extends M.Control {
  /**
   * @classdesc
   * Main constructor of the class. Creates a PluginControl
   * control
   *
   * @constructor
   * @extends {M.Control}
   * @api stable
   */
  constructor(url) {
    if (M.utils.isUndefined(ModalImplControl)) {
      M.exception(getValue('exception_modalcontrol'));
    }
    const impl = new ModalImplControl();
    super(impl, 'Modal');

    /**
     * Help documentation link.
     * @private
     * @type {String}
     */
    this.url_ = url;
  }

  /**
   * This function creates the view
   *
   * @public
   * @function
   * @param {M.Map} map to add the control
   * @api stable
   */
  createView(map) {
    document.addEventListener('keydown', (evt) => {
      if (evt.key === 'Escape') {
        const elem = document.querySelector('.m-panel.m-panel-modal.opened');
        if (elem !== null) {
          elem.querySelector('button.m-panel-btn').click();
        }
      }
    });
    if (this.url_ !== 'template_es' && this.url_ !== 'template_en') {
      return M.remote.get(this.url_).then((response) => {
        let html = response.text;
        html = html.substring(html.indexOf('<!-- Start Popup Content -->'), html.lastIndexOf('<!-- End Popup Content -->'));
        const htmlObject = document.createElement('div');
        htmlObject.classList.add('m-control', 'm-container', 'm-modal');
        htmlObject.innerHTML = html;
        return htmlObject;
      });
    }

    const htmlObject = document.createElement('div');
    htmlObject.classList.add('m-control', 'm-container', 'm-modal');
    htmlObject.innerHTML = M.language.getLang() === 'en' ? templateEN : templateES;
    return htmlObject;
  }

  /**
   * This function compares controls
   *
   * @public
   * @function
   * @param {M.Control} control to compare
   * @api stable
   */
  equals(control) {
    return control instanceof ModalControl;
  }
}
