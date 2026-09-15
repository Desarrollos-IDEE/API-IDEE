/**
 * @module IDEE/control/MaxExtZoomControl
 */
import MaxExtZoomImplControl from 'impl/maxextzoomcontrol';
import { getValue } from './i18n/language';

/**
 * @classdesc
 * Control one-shot: al pulsar ajusta la vista a la extensión máxima.
 */
class MaxExtZoomControl extends IDEE.Control {
  /**
   * @constructor
   * @extends {IDEE.Control}
   * @param {Object} options control options
   * @api
   */
  constructor(options = {}) {
    if (IDEE.utils.isUndefined(MaxExtZoomImplControl)
      || (IDEE.utils.isObject(MaxExtZoomImplControl)
      && IDEE.utils.isNullOrEmpty(Object.keys(MaxExtZoomImplControl)))) {
      IDEE.exception(getValue('exception.impl'));
    }
    const impl = new MaxExtZoomImplControl();
    super(MaxExtZoomControl.NAME, impl, {
      tooltip: options.tooltip,
      position: options.position,
      order: options.order,
      svgPath: options.svgPath,
    });
  }

  /**
   * Activación one-shot: no permanece en modo toggle.
   *
   * @public
   * @function
   * @param {HTMLElement} html HTML del control
   * @api
   */
  manageActivation(html) {
    this.activationBtn = this.getActivationButton(this.element || html);
    if (!IDEE.utils.isNullOrEmpty(this.activationBtn)) {
      this.activationBtn.addEventListener('click', (evt) => {
        evt.preventDefault();
        if (this.map) {
          this.map.zoomToMaxExtent();
        }
      }, false);
    }
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
    return control instanceof MaxExtZoomControl;
  }

  /**
   * Limpia el control
   *
   * @public
   * @function
   * @api
   */
  destroy() {
    this.activationBtn = null;
    super.destroy();
  }
}

MaxExtZoomControl.NAME = 'MaxExtZoom';
export default MaxExtZoomControl;
