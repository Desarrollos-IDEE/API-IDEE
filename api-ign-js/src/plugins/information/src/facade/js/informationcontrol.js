/**
 * @module M/control/InformationControl
 */

import InformationImplControl from '../../impl/ol/js/informationcontrol';
import template from '../../templates/information';
import { getValue } from './i18n/language';

export default class InformationControl extends M.Control {
  /**
   * @classdesc
   * Main constructor of the class. Creates a PluginControl
   * control
   *
   * @constructor
   * @extends {M.Control}
   * @api
   */
  constructor(format, featureCount, buffer, tooltip, opened, order) {
    if (M.utils.isUndefined(InformationImplControl)) {
      M.exception('');
    }
    const impl = new InformationImplControl(format, featureCount, buffer, opened);
    super(impl, 'Information');
    this.tooltip = tooltip;
    this.order = order;
  }

  /**
   * This function creates the view
   *
   * @public
   * @function
   * @param {M.Map} map to add the control
   * @api
   */
  createView(map) {
    return new Promise((success, fail) => {
      const html = M.template.compileSync(template, {
        vars: {
          translations: {
            tooltip: this.tooltip || getValue('tooltip'),
          },
          order: this.order,
        },
      });
      success(html);
    });
  }

  /**
   * This function is called on the control activation
   *
   * @public
   * @function
   * @api
   */
  activate() {
    this.invokeEscKey();
    this.getImpl().activate();
    document.body.style.cursor = 'url(\'https://i.ibb.co/HBtH3Qs/click-info.png\') 1 7, auto';
    document.addEventListener('keyup', this.checkEscKey.bind(this));
  }

  /**
   * This function is called on the control deactivation
   *
   * @public
   * @function
   * @api
   */
  deactivate() {
    this.getImpl().deactivate();
    document.body.style.cursor = 'default';
    document.removeEventListener('keyup', this.checkEscKey.bind(this));
  }

  checkEscKey(evt) {
    const contains = document.querySelector('.m-control.m-container.m-information-container').classList.contains('activated');
    if (evt.key === 'Escape' && contains) {
      document.removeEventListener('keyup', this.checkEscKey.bind(this));
      document.querySelector('#m-information-btn').click();
    }
  }

  invokeEscKey() {
    try {
      document.dispatchEvent(new window.KeyboardEvent('keyup', {
        key: 'Escape',
        keyCode: 27,
        code: '',
        which: 69,
        shiftKey: false,
        ctrlKey: false,
        metaKey: false,
      }));
    } catch (err) {
      /* eslint-disable no-console */
      console.error(err);
    }
  }

  /**
   * This function gets activation button
   *
   * @public
   * @function
   * @param {HTML} html of control
   * @api
   */
  getActivationButton(html) {
    return html.querySelector('#m-information-btn');
  }

  /**
   * This function compares controls
   *
   * @public
   * @function
   * @param {M.Control} control to compare
   * @api
   */
  equals(control) {
    return control instanceof InformationControl;
  }
}
