/**
 * @module IDEE/control/PopupControl
 */

import templateEN from 'templates/popup_en';
import templateES from 'templates/popup_es';
import PopupImplControl from 'impl/popupcontrol';
import { getValue } from './i18n/language';

export default class PopupControl extends IDEE.Control {
  /**
   * @classdesc
   * Main constructor of the class. Creates a PluginControl
   * control
   *
   * @constructor
   * @extends {IDEE.Control}
   * @api stable
   */
  constructor(url) {
    if (IDEE.utils.isUndefined(PopupImplControl) || (IDEE.utils.isObject(PopupImplControl)
      && IDEE.utils.isNullOrEmpty(Object.keys(PopupImplControl)))) {
      IDEE.exception(getValue('exception_popupcontrol'));
    }
    const impl = new PopupImplControl();
    super(impl, 'Popup');

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
   * @param {IDEE.Map} map to add the control
   * @api stable
   */
  createView(map) {
    // eslint-disable-next-line
    console.warn(getValue('exception.popup_obsolete'));
    document.addEventListener('keydown', (evt) => {
      if (evt.key === 'Escape') {
        const elem = document.querySelector('.m-panel.m-panel-popup.opened');
        if (elem !== null) {
          elem.querySelector('button.m-panel-btn').click();
        }
      }
    });

    if (this.url_ !== 'template_es' && this.url_ !== 'template_en') {
      return IDEE.remote.get(this.url_).then((response) => {
        let html = response.text;
        html = html.substring(html.indexOf('<!-- Start Popup Content -->'), html.lastIndexOf('<!-- End Popup Content -->'));
        const htmlObject = document.createElement('div');
        htmlObject.classList.add('m-control', 'm-container', 'm-popup');
        htmlObject.innerHTML = html;
        return htmlObject;
      });
    }

    const htmlObject = document.createElement('div');
    htmlObject.classList.add('m-control', 'm-container', 'm-popup');
    htmlObject.innerHTML = IDEE.language.getLang() === 'en' ? templateEN : templateES;
    return htmlObject;
  }

  /**
   * This function compares controls
   *
   * @public
   * @function
   * @param {IDEE.Control} control to compare
   * @api stable
   */
  equals(control) {
    return control instanceof PopupControl;
  }
}
