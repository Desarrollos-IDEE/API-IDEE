/**
 * @module IDEE/control/MouseSRSControl
 */

import MouseSRSImplControl from 'impl/mousesrscontrol';
import template from '../../templates/mousesrs';
import { getValue } from './i18n/language';

export default class MouseSRSControl extends IDEE.Control {
  /**
   * @classdesc
   * Main constructor of the class. Creates a PluginControl
   * control
   *
   * @constructor
   * @extends {IDEE.Control}
   * @api
   */
  constructor(
    srs,
    label,
    precision,
    geoDD,
    utmDD,
    tooltip,
    activeZ,
    helpUrl,
    mode,
    coveragePrecisions,
    order = 32766,
    draggableDialog = true,
    epsgFormat = false,
  ) {
    if (IDEE.utils.isUndefined(MouseSRSImplControl) || (IDEE.utils.isObject(MouseSRSImplControl)
      && IDEE.utils.isNullOrEmpty(Object.keys(MouseSRSImplControl)))) {
      IDEE.exception(getValue('exception.impl'));
    }
    // eslint-disable-next-line max-len
    const impl = new MouseSRSImplControl(srs, label, precision, geoDD, utmDD, tooltip, activeZ, helpUrl, mode, coveragePrecisions, order, draggableDialog, epsgFormat);
    super(impl, 'MouseSRS');
    this.tooltip_ = tooltip;
    this.order = order;
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
    return new Promise((success, fail) => {
      const html = IDEE.template.compileSync(template, {
        vars: {
          translations: {
            tooltip: this.tooltip_,
          },
          order: this.order,
        },
      });
      success(html);
    });
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
    return control instanceof MouseSRSControl;
  }

  destroy() {
    this.getImpl().destroy();
  }
}
