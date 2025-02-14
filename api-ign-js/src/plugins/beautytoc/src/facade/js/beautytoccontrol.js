/**
 * @module M/control/BeautyTOCControl
 */

import BeautyTOCImplControl from '../../impl/ol/js/beautytoccontrol';
import template from '../../templates/beautytoc';
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

export default class BeautyTOCControl extends M.Control {
  /**
   * @constructor
   * @extends {M.Control}
   * @api
   */
  constructor() {
    const impl = new BeautyTOCImplControl();
    super(impl, 'BeautyTOC');
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
    const layers = this.map_.getWMS().concat(this.map_.getWMTS())
      .filter((layer) => layer.transparent !== false && layer.displayInLayerSwitcher === true);
    const layersOpts = layers.map((layer) => {
      return {
        // disabled: this.getLayerDisabled(layer),
        visible: (layer instanceof M.layer.WMTS
          ? layer.options.visibility === true
          : layer.isVisible()),
        id: layer.name,
        title: layer.legend || layer.name,
        type: layer.type,
        url: layer.url,
        isOrtofoto: layer.url === 'https://www.ign.es/wms/pnoa-historico?',
      };
    });
    return {
      layers: layersOpts,
      translations: {
        layers: getValue('layers'),
        vectoriallayers: getValue('vectoriallayers'),
        ortofotos: getValue('ortofotos'),
      },
    };
  }

  getLayerDisabled(layer) {
    let res = false;
    if (this.getImpl().isLayerLoaded(layer)) {
      res = res || !layer.inRange() || !this.getImpl().isLayerAvailable(layer);
    }

    return res;
  }

  /**
   * @function
   * @public
   * @api
   */
  render(scroll) {
    const templateVars = this.getTemplateVariables();
    const html = M.template.compileSync(template, {
      vars: templateVars,
    });
    this.panelHTML_.innerHTML = html.innerHTML;
    listenAll(this.panelHTML_, 'li', 'click', (e) => this.toogleVisible(e));
    if (scroll !== undefined) {
      document.querySelector('#m-beautytoc-panel').scrollTop = scroll;
    }
  }

  /**
   * @function
   * @public
   * @api
   */
  toogleVisible(evt) {
    const bbox = this.map_.getBbox();
    const bboxFormatted = [bbox.x.min, bbox.y.min, bbox.x.max, bbox.y.max];
    const scroll = document.querySelector('#m-beautytoc-panel').scrollTop;
    const layerName = evt.currentTarget.querySelector('.m-beautytoc-eye span').dataset.layerName;
    const filtered = this.map_.getLayers({ name: layerName }).filter((l) => {
      return l.displayInLayerSwitcher;
    });

    const layerFound = filtered.length > 0 ? filtered[0] : null;
    if (layerFound !== null && layerFound.url === 'https://www.ign.es/wms/pnoa-historico?' && !layerFound.isVisible()) {
      const width = document.querySelector('.m-mapea-container').offsetWidth;
      const height = document.querySelector('.m-mapea-container').offsetHeight;
      const urlCheck = layerFound.url.concat('SERVICE=WMS&VERSION=')
        .concat(layerFound.version)
        .concat('&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=true&LAYERS=')
        .concat(layerFound.name)
        .concat('&TILED=true&CRS=')
        .concat(this.map_.getProjection().code)
        .concat('&STYLES=&WIDTH=')
        .concat(width)
        .concat('&HEIGHT=')
        .concat(height)
        .concat('&BBOX=')
        .concat(bboxFormatted.join(','));
      M.dialog.info(getValue('exception.cobertura'));
      setTimeout(() => {
        document.querySelector('div.m-dialog > div > div > div.m-button').innerHTML = '';
      }, 10);
      M.proxy(false);
      M.remote.get(urlCheck).then((response) => {
        M.proxy(true);
        const rowImage = Buffer.from(response.text).toString('base64');
        const outputImg = document.createElement('img');
        outputImg.src = 'data:image/png;base64,'.concat(rowImage);
        if (outputImg.outerHTML.length > ((width * height) / 100)) {
          const dialogs = document.querySelectorAll('div.m-dialog');
          Array.prototype.forEach.call(dialogs, (dialog) => {
            const parent = dialog.parentElement;
            parent.removeChild(dialog);
          });

          const visibility = layerFound instanceof M.layer.WMTS
            ? layerFound.options.visibility
            : layerFound.isVisible();
          layerFound.setVisible(!visibility);
          layerFound.options.visibility = !visibility;
          this.render(scroll);
        } else {
          setTimeout(() => {
            M.dialog.error(getValue('exception.nocobertura'), getValue('warning'));
          }, 10);
        }
      }).catch((err) => {
        M.proxy(true);
      });
    } else if (layerFound !== null) {
      const visibility = layerFound instanceof M.layer.WMTS
        ? layerFound.options.visibility
        : layerFound.isVisible();
      layerFound.setVisible(!visibility);
      layerFound.options.visibility = !visibility;
      this.render(scroll);
    }
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
    return html.querySelector('.m-beautytoc button');
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
    return control instanceof BeautyTOCControl;
  }
}
