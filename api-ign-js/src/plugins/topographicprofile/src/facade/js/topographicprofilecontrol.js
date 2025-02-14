/**
 * @module M/control/Topographicprofilecontrol
 */

import TopographicprofileImplControl from 'impl/topographicprofilecontrol';
import template from 'templates/perfiltopografico';
import { getValue } from './i18n/language';

export default class TopographicprofileControl extends M.Control {
  /**
   * @classdesc
   * Main constructor of the class. Creates a PluginControl
   * control
   *
   * @constructor
   * @extends {M.Control}
   * @api stable
   */
  constructor(opts) {
    // 1. checks if the implementation can create PluginControl
    if (M.utils.isUndefined(TopographicprofileImplControl)) {
      M.exception('La implementación usada no puede crear controles TopographicprofileControl');
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
   * @param {M.Map} map to add the control
   * @api stable
   */
  createView(map) {
    // eslint-disable-next-line
    console.warn(getValue('exception.obsolete'));
    if (!M.template.compileSync) { // JGL: retrocompatibilidad Mapea4
      M.template.compileSync = (string, options) => {
        let templateCompiled;
        let templateVars = {};
        let parseToHtml;
        if (!M.utils.isUndefined(options)) {
          templateVars = M.utils.extends(templateVars, options.vars);
          parseToHtml = options.parseToHtml;
        }
        const templateFn = Handlebars.compile(string);
        const htmlText = templateFn(templateVars);
        if (parseToHtml !== false) {
          templateCompiled = M.utils.stringToHtml(htmlText);
        } else {
          templateCompiled = htmlText;
        }
        return templateCompiled;
      };
    }
    this.facadeMap_ = map;

    return new Promise((success, fail) => {
      const html = M.template.compileSync(template);
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
   * @param {M.Control} control to compare
   * @api stable
   */
  equals(control) {
    return control instanceof TopographicprofileControl;
  }
}
