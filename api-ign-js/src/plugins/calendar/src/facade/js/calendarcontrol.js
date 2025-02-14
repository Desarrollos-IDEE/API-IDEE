/**
 * @module M/control/CalendarControl
 */

import CalendarImplControl from 'impl/calendarcontrol';
import { getValue } from './i18n/language';

export default class CalendarControl extends M.Control {
  /**
   * @classdesc
   * Main constructor of the class. Creates a PluginControl
   * control
   *
   * @constructor
   * @extends {M.Control}
   * @api stable
   */
  constructor() {
    if (M.utils.isUndefined(CalendarImplControl)) {
      M.exception(getValue('exception_calendarcontrol'));
    }
    const impl = new CalendarImplControl();
    super(impl, 'Calendar');
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
    const content = '<iframe src="https://outlook.office365.com/owa/calendar/fototeca1@cnig.es/bookings/" width="100%" height="460" scrolling="yes" style="border:0"></iframe>';
    const htmlObject = document.createElement('div');
    htmlObject.classList.add('m-control', 'm-container', 'm-calendar');
    htmlObject.setAttribute('id', 'calendar-box');
    htmlObject.innerHTML = content;
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
    return control instanceof CalendarControl;
  }
}
