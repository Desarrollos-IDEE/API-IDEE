import MeasureLengthImpl from 'impl/measurelength';
import Measure from './measurebase';
import measurelengthHTML from '../../templates/measurelength';
import { getValue } from './i18n/language';

/**
 * @classdesc
 * Main constructor of the class. Creates a MeasureLength
 * control to provides measure distances
 *
 * @constructor
 * @extends {M.control.Measure}
 * @api stable
 */

export default class MeasureLength extends Measure {
  constructor(order) {
    // checks if the implementation can create WMC layers
    if (M.utils.isUndefined(MeasureLengthImpl) || (M.utils.isObject(MeasureLengthImpl)
      && M.utils.isNullOrEmpty(Object.keys(MeasureLengthImpl)))) {
      M.Exception(getValue('exception.impl_length'));
    }

    // implementation of this control
    const impl = new MeasureLengthImpl();

    // calls the super constructor
    super(impl, measurelengthHTML, MeasureLength.NAME, order);
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
    if (obj instanceof MeasureLength) {
      equals = (this.name === obj.name);
    }
    return equals;
  }
}

/**
 * Name for this controls
 * @const
 * @type {string}
 * @public
 * @api stable
 */
MeasureLength.NAME = 'measurelength';

/**
 * Template for this controls
 * @const
 * @type {string}
 * @public
 * @api stable
 */
MeasureLength.TEMPLATE = 'measurelength.html';

/**
 * Help message
 * @const
 * @type {string}
 * @public
 * @api stable
 */
export const HELP_KEEP_MESSAGE = getValue('text.keep_drawing');
