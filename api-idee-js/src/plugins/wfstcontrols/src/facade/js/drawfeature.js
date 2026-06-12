/**
 * @module IDEE/control/DrawFeature
 */
import DrawFeatureImpl from '../../impl/ol/js/drawfeature';
import drawfeatureHTML from '../../templates/drawfeature';
import { getValue } from './i18n/language';

export default class DrawFeature extends IDEE.Control {
  /**
   * @classdesc Main constructor of the class. Creates a DrawFeature
   * control to draw features on the map.
   *
   * @constructor
   * @param {IDEE.layer.WFS} layer - Layer for use in control
   * @extends {IDEE.Control}
   * @api stable
   */
  constructor(layer) {
    // implementation of this control
    const impl = new DrawFeatureImpl(layer);

    // calls the super constructor
    super(impl, DrawFeature.NAME);

    /**
     * Name of the control
     * @public
     * @type {String}
     */
    this.name = DrawFeature.NAME;

    if (IDEE.utils.isUndefined(DrawFeatureImpl)) {
      IDEE.Exception(getValue('exception.impl_draw'));
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
    return IDEE.template.compileSync(drawfeatureHTML, {
      jsonp: true,
      vars: {
        translations: {
          draw: getValue('draw'),
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
    return element.querySelector('button#m-button-drawfeature');
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
    const equals = (obj instanceof DrawFeature);
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
 *
 * @const
 * @type {string}
 * @public
 * @api stable
 */
DrawFeature.NAME = 'drawfeature';

/**
 * Template for this controls - button
 *
 * @const
 * @type {string}
 * @public
 * @api stable
 */
DrawFeature.TEMPLATE = 'drawfeature.html';
