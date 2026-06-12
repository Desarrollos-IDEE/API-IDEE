/**
 * @module IDEE/control/DeleteFeature
 */
import DeleteFeatureImpl from '../../impl/ol/js/deletefeature';
import deletefeatureHTML from '../../templates/deletefeature.html';
import { getValue } from './i18n/language';

export default class DeleteFeature extends IDEE.Control {
  /**
   * @classdesc
   * Main constructor of the class. Creates a DeleteFeature
   * control to remove features map
   *
   * @constructor
   * @param {IDEE.layer.WFS} layer - Layer for use in control
   * @extends {IDEE.Control}
   * @api stable
   */
  constructor(layer) {
    // implementation of this control
    const impl = new DeleteFeatureImpl(layer);

    // calls the super constructor
    super(impl, DeleteFeature.NAME);

    this.name = DeleteFeature.NAME;

    if (IDEE.utils.isUndefined(DeleteFeatureImpl)) {
      IDEE.exception(getValue('exception.impl_delete'));
    }
  }

  /**
   * This function creates the view to the specified map
   *
   * @public
   * @function
   * @param {IDEE.Map} map - Map to add the control
   * @returns {HTMLElement} html response
   * @api stable
   */
  createView(map) {
    return IDEE.template.compileSync(deletefeatureHTML, {
      jsonp: true,
      vars: {
        translations: {
          delete: getValue('delete'),
        },
      },
    });
  }

  /**
   * This function returns the HTML button
   *
   * @public
   * @function
   * @param {HTMLElement} element - HTML control
   * @return {HTMLElement} return HTML button
   * @api stable
   * @export
   */
  getActivationButton(element) {
    return element.querySelector('button#m-button-deletefeature');
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
    const equals = (obj instanceof DeleteFeature);
    return equals;
  }

  /**
   * This function set layer for delete features
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
 * Name for this controls
 * @const
 * @type {string}
 * @public
 * @api stable
 */
DeleteFeature.NAME = 'deletefeature';

/**
 * Template for this controls - button
 * @const
 * @type {string}
 * @public
 * @api stable
 */
DeleteFeature.TEMPLATE = 'deletefeature.html';
