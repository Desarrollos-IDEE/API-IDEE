/**
 * @module IDEE/control/ViewHistoryControl
 */

import ViewHistoryImplControl from 'impl/viewhistorycontrol';
import template from 'templates/viewhistory';
import { getValue } from './i18n/language';

export default class ViewHistoryControl extends IDEE.Control {
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
    if (IDEE.utils.isUndefined(ViewHistoryImplControl)
      || (IDEE.utils.isObject(ViewHistoryImplControl)
      && IDEE.utils.isNullOrEmpty(Object.keys(ViewHistoryImplControl)))) {
      IDEE.exception('La implementación usada no puede crear controles ViewHistoryControl');
    }
    const impl = new ViewHistoryImplControl();
    super(impl, 'ViewHistory');

    this.facadeMap_ = null;

    this.completed_ = false;

    this.load_ = false;
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
    this.facadeMap_ = map;
    // eslint-disable-next-line
    console.warn(getValue('viewhistory_obsolete'));
    this.addOnLoadEvents();
    return new Promise((success, fail) => {
      const options = {
        jsonp: true,
        vars: {
          translations: {
            nextView: getValue('nextView'),
            previousView: getValue('previousView'),
          },
        },
      };

      const html = IDEE.template.compileSync(template, options);
      html.querySelector('#m-historyprevious-button').addEventListener('click', this.previousStep_.bind(this));
      html.querySelector('#m-historynext-button').addEventListener('click', this.nextStep_.bind(this));
      success(html);
    });
  }

  /**
   * Adds event listeners to control and map
   * @public
   * @function
   * @api
   */
  addOnLoadEvents() {
    this.on(IDEE.evt.ADDED_TO_MAP, () => {
      this.load_ = true;
      if (this.completed_ && this.load_) {
        this.registerViewEvents_();
      }
    });

    this.facadeMap_.on(IDEE.evt.COMPLETED, () => {
      this.completed_ = true;
      if (this.completed_ && this.load_) {
        this.registerViewEvents_();
      }
    });
  }

  /**
   * This function registers view events on map
   *
   * @function
   * @private
   */
  registerViewEvents_() {
    this.getImpl().registerViewEvents();
  }

  /**
   * This function shows the next zoom change to the map
   *
   * @private
   * @function
   * @param {Event} evt - Event
   */
  nextStep_(evt) {
    evt.preventDefault();
    this.getImpl().nextStep();
  }

  /**
   * This function shows the previous zoom change to the map
   *
   * @private
   * @function
   * @param {Event} evt - Event
   */
  previousStep_(evt) {
    evt.preventDefault();
    this.getImpl().previousStep();
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
    return control instanceof ViewHistoryControl;
  }
}
