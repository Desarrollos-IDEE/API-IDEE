/**
 * @module M/control/IberpixCompareControl
 */

import IberpixCompareImplControl from 'impl/iberpixcomparecontrol';
import template from 'templates/iberpixcompare';
import { getValue } from './i18n/language';
import Mirrorpanel from './cpmirrorpanel';
import LyrCompare from './cplyrcompare';

export default class IberpixCompareControl extends M.Control {
  /**
   * @classdesc
   * Main constructor of the class. Creates a PluginControl
   * control
   *
   * @constructor
   * @extends {M.Control}
   * @api stable
   */
  constructor(options) {
    // 1. checks if the implementation can create PluginControl
    if (M.utils.isUndefined(IberpixCompareImplControl)) {
      M.exception(getValue('exception'));
    }
    // 2. implementation of this control
    const impl = new IberpixCompareImplControl();
    super(impl, 'IberpixCompare');
    /**
     * Template
     * @public
     * @type { HTMLElement }
     */
    this.template = null;
    this.order = options.order;
    this.position = options.position;
    this.params = [options.mirrorpanelParams, options.lyrcompareParams];
    this.params.forEach((p) => {
      // eslint-disable-next-line no-param-reassign
      p.position = this.position;
    });

    this.mirrorpanel = new Mirrorpanel(
      options.mirrorpanelParams,
      options.backImgLayersConfig,
      options.fullTOCConfig,
      options.vectorsConfig,
      options.order,
    );
    this.lyrcompare = new LyrCompare({ ...options.lyrcompareParams, order: options.order });
    this.panels = [];
    this.plugins = [this.mirrorpanel, this.lyrcompare];
    // this.plugins = [this.mirrorpanel];
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
    this.map = map;
    return new Promise((success, fail) => {
      const options = {
        jsonp: true,
        vars: {
          translations: {
            tooltipLyr: getValue('tooltipLyr'),
            tooltipMirrorpanel: getValue('tooltipMirrorpanel'),
          },
        },
      };

      this.template = M.template.compileSync(template, options);
      this.accessibilityTab(this.template);
      success(this.template);
      this.addComparators(map);
    });
  }

  addComparators(map) {
    this.plugins.forEach((p, index) => {
      map.addPlugin(p);
      // eslint-disable-next-line no-underscore-dangle
      this.panels.push(p.panel_._element);
      // eslint-disable-next-line no-underscore-dangle
      const element = document.querySelector(`.${p.panel_._className} .m-panel-controls`);
      element.classList.add(`cp-${p.name}`);
      // eslint-disable-next-line no-underscore-dangle
      document.querySelector(`.${p.panel_._className}`).remove();
      this.template.querySelector(`#m-cp-${p.name}`).append(element);
      if (index === this.plugins.length - 1) {
        this.addButtonEvents();
      }
    });
  }

  addButtonEvents() {
    this.plugins.forEach((p) => {
      this.template.querySelector(`#m-cp-${p.name} .cp-button`).addEventListener('click', (e) => {
        this.deactivateAndActivate(p);
      });

      this.template.querySelector(`#m-cp-${p.name} .cp-button`).addEventListener('keydown', (e) => {
        if (e.keyCode !== 13) this.deactivateAndActivate(p);
        if (e.keyCode === 9) this.deactivateAndActivate(p);
      });
    });
  }

  deactivateAndActivate(plugin) {
    this.plugins.forEach((p) => {
      if (p.name !== plugin.name) {
        this.template.querySelector(`#m-cp-${p.name} .cp-${p.name}`).classList.remove('hide-panel');
        this.template.querySelector(`#m-cp-${p.name} .cp-button`).classList.remove('active');
        p.deactivate();
      } else if (plugin.name !== 'mirrorpanel') {
        p.deactivate();
      }
    });

    this.template.querySelector(`#m-cp-${plugin.name} .cp-button`).classList.toggle('active');
    this.template.querySelector(`#m-cp-${plugin.name} .cp-${plugin.name}`).classList.toggle('hide-panel');
  }

  deactivate() {
    this.plugins.forEach((p, k) => {
      p.deactivate();
      document.querySelector('.m-plugin-iberpixcompare').parentElement.append(this.panels[k]);
    });

    this.map.removePlugins(this.plugins);
  }

  /**
   * This function compares controls
   *
   * @public
   * @function
   * @param {M.Control} control to compare
   * @api stable
   * @return {Boolean}
   */
  equals(control) {
    return control instanceof IberpixCompareControl;
  }

  accessibilityTab(html) {
    html.querySelectorAll('[tabindex="0"]').forEach((el) => el.setAttribute('tabindex', this.order));
  }
}
