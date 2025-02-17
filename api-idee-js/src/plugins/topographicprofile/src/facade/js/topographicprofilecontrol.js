/**
 * @module IDEE/control/Topographicprofilecontrol
 */

import TopographicprofileImplControl from 'impl/topographicprofilecontrol';
import template from 'templates/perfiltopografico';
import { getValue } from './i18n/language';

export default class TopographicprofileControl extends IDEE.Control {
  /**
   * @classdesc
   * Main constructor of the class. Creates a PluginControl
   * control
   *
   * @constructor
   * @extends {IDEE.Control}
   * @api stable
   */
  constructor(opts) {
    // 1. checks if the implementation can create PluginControl
    if (IDEE.utils.isUndefined(TopographicprofileImplControl)
      || (IDEE.utils.isObject(TopographicprofileImplControl)
      && IDEE.utils.isNullOrEmpty(Object.keys(TopographicprofileImplControl)))) {
      IDEE.exception('La implementación usada no puede crear controles TopographicprofileControl');
    }
    // 2. implementation of this control
    const impl = new TopographicprofileImplControl(opts);
    super(impl, 'Topographicprofile');
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
    // eslint-disable-next-line
    console.warn(getValue('exception.obsolete'));
    if (!IDEE.template.compileSync) { // JGL: retrocompatibilidad API IDEE
      IDEE.template.compileSync = (string, options) => {
        let templateCompiled;
        let templateVars = {};
        let parseToHtml;
        if (!IDEE.utils.isUndefined(options)) {
          templateVars = IDEE.utils.extends(templateVars, options.vars);
          parseToHtml = options.parseToHtml;
        }
        const templateFn = Handlebars.compile(string);
        const htmlText = templateFn(templateVars);
        if (parseToHtml !== false) {
          templateCompiled = IDEE.utils.stringToHtml(htmlText);
        } else {
          templateCompiled = htmlText;
        }
        return templateCompiled;
      };
    }
    this.facadeMap_ = map;

    return new Promise((success, fail) => {
      const html = IDEE.template.compileSync(template);
      // Añadir código dependiente del DOM
      this.template_ = html;
      html.querySelector('#m-topographicprofile-btn').title = getValue('title');
      success(html);
    });
  }

  /**
   * This function gets activation button
   *
   * @public
   * @function
   * @param {HTML} html of control
   * @api stable
   */
  getActivationButton(html) {
    return html.querySelector('#m-topographicprofile-btn');
  }

  /**
   * This function is called on the control deactivation
   *
   * @public
   * @function
   * @api stable
   */
  deactivate() {
    super.deactivate();
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
    return control instanceof TopographicprofileControl;
  }
}
