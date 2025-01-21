import FacadeMeasureArea from '../../../facade/js/measurearea';
import FacadeMeasureLength from '../../../facade/js/measurelength';

/**
 * @classdesc
 * Main constructor of the class. Creates a MeasureClear
 * control
 *
 * @constructor
 * @extends {IDEE.impl.Control}
 * @api stable
 */
export default class MeasureClear extends IDEE.impl.Control {
  constructor(measureLengthControl, measureAreaControl) {
    super();

    /**
     * Implementation measureLength
     * @private
     * @type {IDEE.impl.control.Measure}
     */
    this.measureLengthControl_ = measureLengthControl;

    /**
     * Facade of the map
     * @private
     * @type {IDEE.Map}
     */
    this.facadeMap_ = null;

    /**
     * Implementation measureArea
     * @private
     * @type {IDEE.impl.control.Measure}
     */
    this.measureAreaControl_ = measureAreaControl;
  }

  /**
   * This function adds the control to the specified map
   *
   * @public
   * @function
   * @param {IDEE.Map} map - Map to add the plugin
   * @param {HTMLElement} element - Container MeasureClear
   * @api stable
   */
  addTo(map, element) {
    this.facadeMap_ = map;
    const button = element.querySelector('#measurebar-clear-btn');
    button.addEventListener('click', this.onClick.bind(this));
    this.element = element;
    map.getMapImpl().addControl(this);
  }

  /**
   * This function remove items drawn on the map
   *
   * @public
   * @function
   * @api stable
   */
  onClick() {
    this.measureLengthControl_.clear();
    this.measureAreaControl_.clear();
    this.deactivateOtherBtns();
  }

  /**
   * Deactivates length measure and area measure buttons.
   * @public
   * @function
   * @api
   */
  deactivateOtherBtns() {
    this.facadeMap_.getControls().forEach((control) => {
      if (control instanceof FacadeMeasureLength) { // measureLength
        control.deactivate();
      } else if (control instanceof FacadeMeasureArea) { // measureArea
        control.deactivate();
      }
    });
  }

  /**
   * This function destroys this control and cleaning the HTML
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {
    this.element.remove();
    this.facadeMap_.removeControls(this);
    this.facadeMap_ = null;
  }
}
