/**
 * @module IDEE/control/ZoomExtentControl
 */

import ZoomExtentImplControl from 'impl/zoomextentcontrol';
import template from '../../templates/zoomextent';
import { getValue } from './i18n/language';

export default class ZoomExtentControl extends IDEE.Control {
  /**
   * @classdesc
   * Main constructor of the class. Creates a PluginControl
   * control
   *
   * @constructor
   * @extends {IDEE.Control}
   * @api
   */
  constructor() {
    if (IDEE.utils.isUndefined(ZoomExtentImplControl) || (IDEE.utils.isObject(ZoomExtentImplControl)
      && IDEE.utils.isNullOrEmpty(Object.keys(ZoomExtentImplControl)))) {
      IDEE.exception(getValue('exception.impl'));
    }
    const impl = new ZoomExtentImplControl();
    super(impl, 'ZoomExtent');
  }

  /**
   * This function creates the view
   *
   * @public
   * @function
   * @param {IDEE.Map} map to add the control
   * @api
   */
  createView(map) {
    // eslint-disable-next-line
    console.warn(getValue('exception.zoomextent_obsolete'));
    return new Promise((success, fail) => {
      const html = IDEE.template.compileSync(template, {
        vars: {
          translations: {
            tooltip: getValue('tooltip'),
          },
        },
      });
      success(html);
    });
  }

  /**
   * This function is called on the control activation
   *
   * @public
   * @function
   * @api
   */
  activate() {
    super.activate();
    this.getImpl().activateClick(this.map_);
    document.addEventListener('keydown', this.checkEscKey.bind(this));
  }

  checkEscKey(evt) {
    if (evt.key === 'Escape') {
      this.deactivate();
      document.removeEventListener('keydown', this.checkEscKey);
    }
  }

  /**
   * This function is called on the control deactivation
   *
   * @public
   * @function
   * @api
   */
  deactivate() {
    super.deactivate();
    this.getImpl().deactivateClick(this.map_);
  }

  /**
   * This function gets activation button
   *
   * @public
   * @function
   * @param {HTML} html of control
   * @api
   */
  getActivationButton(html) {
    return html.querySelector('.m-zoomextent button');
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
    return control instanceof ZoomExtentControl;
  }
}
