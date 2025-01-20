/**
 * @module M/control/TOCControl
 */

import template from '../../templates/toc';
import { getValue } from './i18n/language';

/**
 * @private
 * @function
 */
const listenAll = (html, selector, type, callback) => {
  const nodeList = html.querySelectorAll(selector);
  Array.prototype.forEach.call(nodeList, (node) => node
    .addEventListener(type, (evt) => callback(evt)));
};

export default class TOCControl extends M.Control {
  /**
   * @constructor
   * @extends {M.Control}
   * @api
   */
  constructor() {
    const impl = new M.impl.Control();
    super(impl, 'TOC');
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
    // eslint-disable-next-line
    console.warn(getValue('exception.toc_obsolete'));
    this.map_ = map;
    return new Promise((success, fail) => {
      const templateVars = this.getTemplateVariables();
      const html = M.template.compileSync(template, {
        vars: templateVars,
      });
      this.panelHTML_ = html;
      success(html);
      listenAll(this.panelHTML_, 'li', 'click', (e) => this.toogleVisible(e));
    });
  }

  /**
   * @function
   * @public
   * @api
   */
  getTemplateVariables() {
    // const layers = this.map_.getWMS().concat(this.map_.getWMTS())
    //   .filter((layer) => layer.transparent !== false && layer.displayInLayerSwitcher === true);
    const layers = this.map_.getLayers()
      .filter((layer) => layer.name !== undefined && layer.transparent !== false
        && layer.displayInLayerSwitcher === true
        && layer.name !== 'infocoordinatesLayerFeatures')
      .reverse();
    const layersOpts = layers.map((layer) => {
      return {
        outOfRange: layer instanceof M.layer.TMS || layer instanceof M.layer.XYZ
          ? true
          : !layer.inRange(),
        visible: (layer instanceof M.layer.WMTS ? (layer.options.visibility === true
          || layer.visibility === true) : layer.isVisible()),
        id: layer.name,
        title: layer.legend || layer.name,
      };
    });

    return {
      layers: layersOpts,
      translations: {
        capas: getValue('capas'),
      },
    };
  }

  /**
   * @function
   * @public
   * @api
   */
  render() {
    let scroll;
    if (document.querySelector('.m-panel.m-plugin-toc.opened ul.m-toc-content') !== null) {
      scroll = document.querySelector('.m-panel.m-plugin-toc.opened ul.m-toc-content').scrollTop;
    }
    const templateVars = this.getTemplateVariables();
    const html = M.template.compileSync(template, {
      vars: templateVars,
    });
    this.panelHTML_.innerHTML = html.innerHTML;
    listenAll(this.panelHTML_, 'li', 'click', (e) => this.toogleVisible(e));
    if (scroll !== undefined) {
      document.querySelector('.m-panel.m-plugin-toc.opened ul.m-toc-content').scrollTop = scroll;
    }
  }

  /**
   * @function
   * @public
   * @api
   */
  toogleVisible(evt) {
    const layerName = evt.currentTarget.querySelector('.m-check').dataset.layerName;
    const layerFound = this.map_.getLayers({ name: layerName })[0];
    const visibility = layerFound instanceof M.layer.WMTS ? layerFound.options.visibility
      : layerFound.isVisible();
    layerFound.setVisible(!visibility);
    layerFound.visibility = !visibility;
    if (layerFound.options !== undefined) {
      layerFound.options.visibility = !visibility;
    }

    this.render();
  }

  /**
   * This function is called on the control activation
   *
   * @public
   * @function
   * @api
   */
  activate() {
    super.activate();
  }

  /**
   * This function is called on the control deactivation
   *
   * @public
   * @function
   * @api
   */
  deactivate() {
    super.deactivate();
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
    return html.querySelector('.m-toc button');
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
    return control instanceof TOCControl;
  }
}
