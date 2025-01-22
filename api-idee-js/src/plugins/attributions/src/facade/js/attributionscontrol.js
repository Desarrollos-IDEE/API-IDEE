/**
 * @module IDEE/control/AttributionsControl
 */
import AttributionsImplControl from '../../impl/ol/js/attributionscontrol';
import template from '../../templates/attributions';
import { getValue } from './i18n/language';

/**
 * @classdesc
 * Main constructor of the class. Creates a PluginControl
 * control
 */
export default class AttributionsControl extends IDEE.Control {
  /**
   * @constructor
   * @extends {IDEE.Control}
   * @api
   */
  constructor(position, closePanel) {
    if (IDEE.utils.isUndefined(AttributionsImplControl)
      || (IDEE.utils.isObject(AttributionsImplControl)
      && IDEE.utils.isNullOrEmpty(Object.keys(AttributionsImplControl)))) {
      IDEE.exception(getValue('exception.impl'));
    }
    const impl = new AttributionsImplControl();
    super(impl, 'Attributions');
    this.position = position;
    this.closePanel = closePanel;
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
    this.map = map;
    // eslint-disable-next-line
    console.warn(getValue('exception.attribution_obsolete'));
    return new Promise((success, fail) => {
      const html = IDEE.template.compileSync(template, {
        vars: {
          icon: this.position === 'BR' || this.position === 'TR'
            ? 'g-cartografia-flecha-derecha'
            : 'g-cartografia-flecha-izquierda',
        },
      });
      html.querySelector('#close-button').addEventListener('click', () => this.closePanel());
      this.html_ = html;

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
    return control instanceof AttributionsControl;
  }

  destroy() {
    this.getImpl().destroy();
  }
}
