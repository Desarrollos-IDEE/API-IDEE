import MeasureClearImpl from '../../impl/ol/js/measureclear';
import measureclearHTML from '../../templates/measureclear';
import { getValue } from './i18n/language';

/**
 * @classdesc
 * Main constructor of the class. Creates a MeasureClear
 * control to provides clean items drawn on the map
 *
 * @constructor
 * @param {M.control.Measure} measureLengthControl - Control measure distances
 * @param {M.control.Measure} measureAreaControl - Control measure areas
 * @extends {M.Control}
 * @api stable
 */

export default class MeasureClear extends M.Control {
  constructor(measureLengthControl, measureAreaControl, order) {
    // implementation of this control
    const impl = new MeasureClearImpl(measureLengthControl.getImpl(), measureAreaControl.getImpl());

    // calls the super constructor
    super(impl, MeasureClear.NAME);

    // checks if the implementation can create MeasureClear
    if (M.utils.isUndefined(MeasureClearImpl)) {
      M.Exception(getValue('exception.impl_clear'));
    }
    this.order = order;
  }

  /**
   * This function creates the view to the specified map
   *
   * @public
   * @function
   * @param {M.Map} map - Map to add the control
   * @returns {HTMLElement} HTML template
   * @api stable
   */
  createView(map) {
    return M.template.compileSync(measureclearHTML, {
      jsonp: true,
      vars: {
        translations: getValue('text'),
        order: this.order,
      },
    });
  }

  /**
   * This function checks if an object is equals
   * to this control
   *
   * @public
   * @function
   * @param {*} obj - Object to compare
   * @returns {boolean} equals - Returns if they are equal or not
   * @api stable
   */
  equals(obj) {
    let equals = false;
    if (obj instanceof MeasureClear) {
      equals = (this.name === obj.name);
    }
    return equals;
  }

  /**
   * This function destroys this plugin
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {
    this.getImpl().destroy();
    this.impl = null;
  }
}

/**
 * Name to identify this control
 * @const
 * @type {string}
 * @public
 * @api stable
 */
MeasureClear.NAME = 'measurebar';

/**
 * Template for this controls
 * @const
 * @type {string}
 * @public
 * @api stable
 */
MeasureClear.TEMPLATE = 'measureclear.html';
