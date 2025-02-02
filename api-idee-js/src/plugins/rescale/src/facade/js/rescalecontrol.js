/**
 * @module IDEE/control/RescaleControl
 */

import RescaleImplControl from 'impl/rescalecontrol';
import template from 'templates/rescale';
import { getValue } from './i18n/language';

// let typingTimer;

export default class RescaleControl extends IDEE.Control {
  /**
   * @classdesc
   * Main constructor of the class. Creates a PluginControl
   * control
   *
   * @constructor
   * @extends {IDEE.Control}
   * @api stable
   */
  constructor() {
    if (IDEE.utils.isUndefined(RescaleImplControl)
      || (IDEE.utils.isObject(RescaleImplControl)
      && IDEE.utils.isNullOrEmpty(Object.keys(RescaleImplControl)))) {
      IDEE.exception('La implementación usada no puede crear controles RescaleControl');
    }
    const impl = new RescaleImplControl();
    super(impl, 'Rescale');
    this.impl_ = impl;
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
    this.map_ = map;
    return new Promise((success, fail) => {
      const html = IDEE.template.compileSync(template, {
        vars: {
          translations: {
            insertscale: getValue('insertscale'),
          },
        },
      });
      html.querySelector('#m-rescale-scaleinput').addEventListener('keyup', (e) => this.zoomToInputScale(e));
      success(html);
    });
  }

  /**
   * Zooms to written scale (aproximately).
   * @public
   * @function
   * @param {Event} e
   * @api
   */
  zoomToInputScale(e) {
    if (e.keyCode === 13) {
      const writtenScale = e.target.value.trim().replace(/ /g, '').replace(/\./g, '').replace(/,/g, '');
      const scaleRegExp = /^1:[1-9]\d*$/;
      const simpleScaleRegExp = /^[1-9]\d*$/;
      if (scaleRegExp.test(writtenScale)) {
        this.impl_.zoomToScale(parseInt(writtenScale.substring(2), 10));
      } else if (simpleScaleRegExp.test(writtenScale)) {
        this.impl_.zoomToScale(parseInt(writtenScale, 10));
      }
    }
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
    return control instanceof RescaleControl;
  }
}
