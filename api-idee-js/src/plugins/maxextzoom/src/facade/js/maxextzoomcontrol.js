/**
 * @module M/control/MaxExtZoomControl
 */

import MaxExtZoomImplControl from 'impl/maxextzoomcontrol';
import template from 'templates/maxextzoom';
import { getValue } from './i18n/language';

export default class MaxExtZoomControl extends IDEE.Control {
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
    if (IDEE.utils.isUndefined(MaxExtZoomImplControl)) {
      IDEE.exception(getValue('exception.impl'));
    }
    const impl = new MaxExtZoomImplControl();
    super(impl, 'MaxExtZoom');
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
    this.map = map;
    return new Promise((success, fail) => {
      const html = IDEE.template.compileSync(template, {
        vars: {
          translations: {
            zoommapextend: getValue('zoommapextend'),
          },
        },
      });
      html.querySelector('#m-maxextzoom-button').addEventListener('click', this.zoomToDefaultBox.bind(this));
      success(html);
    });
  }

  zoomToDefaultBox() {
    this.map.zoomToMaxExtent();
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
    return control instanceof MaxExtZoomControl;
  }
}
