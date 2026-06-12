/**
 * @module IDEE/control/SaveFeature
 */
import SaveFeatureImpl from '../../impl/ol/js/savefeature';
import savefeatureHTML from '../../templates/savefeature';
import { getValue } from './i18n/language';

export default class SaveFeature extends IDEE.Control {
  /**
   * @classdesc
   * Main constructor of the class. Creates a SaveFeature
   * control save changes to features
   *
   * @constructor
   * @param {IDEE.layer.WFS} layer - Layer for use in control
   * @extends {IDEE.Control}
   * @api stable
   */
  constructor(layer, proxy) {
    // implementation of this control
    const impl = new SaveFeatureImpl(layer, proxy);
    // calls the super constructor
    super(impl, SaveFeature.NAME);

    /**
     * Name of the control
     * @public
     * @type {String}
     */

    this.name = SaveFeature.NAME;

    if (IDEE.utils.isUndefined(SaveFeatureImpl)) {
      IDEE.exception('exception.impl_save');
    }
  }

  /**
   * This function creates the view to the specified map
   *
   * @public
   * @function
   * @param {IDEE.Map} map - Map to add the control
   * @returns {Promise} html response
   * @api stable
   */
  createView(map) {
    this.facadeMap_ = map;
    return IDEE.template.compileSync(savefeatureHTML, {
      jsonp: true,
      vars: {
        translations: {
          save: getValue('save'),
        },
      },
    });
  }

  /**
   * This function checks if an object is equals to this control
   *
   * @function
   * @api stable
   * @param {*} obj - Object to compare
   * @returns {boolean} equals - Returns if they are equal or not
   */
  equals(obj) {
    const equals = (obj instanceof SaveFeature);
    return equals;
  }

  /**
   * This function adds the click event to the button
   *
   * @public
   * @function
   * @param {HTMLElement} html - HTML control
   * @api stable
   * @export
   */
  manageActivation(html) {
    const button = html.querySelector('button#m-button-savefeature');
    button.addEventListener('click', this.saveFeature_.bind(this));
  }

  /**
   * This function saves changes
   *
   * @public
   * @function
   * @param {goog.events.BrowserEvent} evt - Event
   * @api stable
   */
  saveFeature_(evt) {
    evt.preventDefault();
    this.getImpl().saveFeature();
  }

  /**
   * This function set layer for save features
   *
   * @public
   * @function
   * @param {IDEE.layer.WFS} layer - Layer
   * @api stable
   */
  setLayer(layer) {
    this.getImpl().setLayer(layer);
  }
}

/**
 * Template for this controls - button
 * @const
 * @type {string}
 * @public
 * @api stable
 */
SaveFeature.NAME = 'savefeature';

/**
 * Template for this controls - button
 * @const
 * @type {string}
 * @public
 * @api stable
 */
SaveFeature.TEMPLATE = 'savefeature.html';
