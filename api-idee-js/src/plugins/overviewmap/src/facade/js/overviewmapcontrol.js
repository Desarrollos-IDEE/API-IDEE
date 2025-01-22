/**
 * @module IDEE/control/OverviewMapControl
 */

import OverviewMapImplControl from 'impl/overviewmapcontrol';
import template from 'templates/overviewmap';
import { getValue } from './i18n/language';

export default class OverviewMapControl extends IDEE.Control {
  /**
   * @classdesc
   * Main constructor of the class. Creates a PluginControl
   * control
   *
   * @constructor
   * @extends {IDEE.Control}
   * @api stable
   */
  constructor(options = {}, vendorOptions = {}) {
    if (IDEE.utils.isUndefined(OverviewMapImplControl)
      || (IDEE.utils.isObject(OverviewMapImplControl)
      && IDEE.utils.isNullOrEmpty(Object.keys(OverviewMapImplControl)))) {
      IDEE.exception(getValue('exception.impl'));
    }
    const impl = new OverviewMapImplControl(options, vendorOptions);
    super(impl, 'OverviewMap');

    impl.facadeControl = this;
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
    return new Promise((success, fail) => {
      const html = IDEE.template.compileSync(template);
      success(html);
    });
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
    return control instanceof OverviewMapControl;
  }
}
