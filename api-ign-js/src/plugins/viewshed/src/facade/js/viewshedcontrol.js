/**
 * @module M/control/ViewShedControl
 */

import ViewShedImplControl from 'impl/viewshedcontrol';
import template from 'templates/viewshed';
import { getValue } from './i18n/language';

export default class ViewShedControl extends M.Control {
  /**
   * @classdesc
   * Main constructor of the class. Creates a PluginControl
   * control
   *
   * @constructor
   * @extends {M.Control}
   * @api stable
   */
  constructor(parameters) {
    const impl = new ViewShedImplControl();
    super(impl, 'ViewShed');

    this.facadeMap_ = null;

    /**
     * Main control's html element
     * @private
     * @type {HTMLElement}
     */
    this.element_ = null;

    /**
     * Geoprocess URL
     *
     * @private
     * @type {string}
     */
    this.url_ = parameters.url;
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
    this.facadeMap_ = map;
    return new Promise((success, fail) => {
      const html = M.template.compileSync(template, {
        vars: {
          translations: {
            tooltip: getValue('tooltip'),
            active_viewshed: getValue('active_viewshed'),
            clear: getValue('clear'),
          },
        },
      });
      this.element_ = html;
      html.querySelector('#m-viewshed-clear-btn').addEventListener('click', this.clear.bind(this));
      html.querySelector('#m-viewshed-calculate-btn').addEventListener('click', this.activate.bind(this));
      success(html);
    });
  }

  /**
   * This function is called on the control activation
   *
   * @public
   * @function
   * @api stable
   */
  activate() {
    if (this.activated) {
      this.deactivate();
    } else {
      this.facadeMap_.on(M.evt.CLICK, this.analizeVisibility, this);
      this.activated = true;
      this.element_.querySelector('#m-viewshed-calculate-btn').classList.add('activated');
      document.addEventListener('keydown', this.checkEscKey.bind(this));
    }
  }

  checkEscKey(evt) {
    if (evt.key === 'Escape') {
      this.deactivate();
      document.removeEventListener('keydown', this.checkEscKey);
    }
  }

  /**
   * This function is called on the control deactivation
   *
   * @public
   * @function
   * @api stable
   */
  deactivate() {
    this.facadeMap_.removePopup();
    this.facadeMap_.un(M.evt.CLICK, this.analizeVisibility, this);
    this.activated = false;
    this.element_.querySelector('#m-viewshed-calculate-btn').classList.remove('activated');
  }

  /**
   * This function throws analysis of visibility area and shows result
   *
   * @private
   * @function
   * @param {ol.MapBrowserPointerEvent} evt - Browser point event
   */
  analizeVisibility(evt) {
    const remove = this.facadeMap_.getLayers().filter((layer) => {
      return layer.type === 'Vector' && layer.name === 'viewresult';
    });

    this.facadeMap_.removeLayers(remove);
    const coord = this.getImpl().transformCoordinates(evt.coord, 'EPSG:4326');
    const config = `<div class="m-viewshed-message">${getValue('calculating')}...<br/><br/><p class="m-viewshed-loading"><span class="icon-spinner" /></p></div>`;
    M.dialog.info(config);
    setTimeout(() => {
      document.querySelector('div.m-mapea-container div.m-dialog div.m-title').style.backgroundColor = '#71a7d3';
      const button = document.querySelector('div.m-dialog.info div.m-button > button');
      button.remove();
    }, 10);

    M.remote.get(`${this.url_}/api/operations/checkCoordinates?x=${coord[0]}&y=${coord[1]}`).then((response) => {
      const res = JSON.parse(response.text);
      if (res.valid === true) {
        const url = `${this.url_}/api/operations/viewshed?x=${coord[0]}&y=${coord[1]}&distance=0.1`;
        M.remote.get(url).then((response2) => {
          document.querySelector('div.m-mapea-container div.m-dialog').remove();
          const features = this.getImpl().loadGeoJSONLayer(response2.text, evt.coord);
          this.getImpl().centerFeatures(features);
        }).catch((err) => {
          document.querySelector('div.m-mapea-container div.m-dialog').remove();
          M.dialog.error(getValue('error_query'));
        });
      } else {
        document.querySelector('div.m-mapea-container div.m-dialog').remove();
        M.dialog.error(getValue('outbox'), getValue('warning'));
      }
    }).catch((err) => {
      document.querySelector('div.m-mapea-container div.m-dialog').remove();
      M.dialog.error(getValue('error_query'));
    });
  }

  /**
   * This function clears the layer with the area
   *
   * @public
   * @function
   * @api stable
   */
  clear() {
    const remove = this.facadeMap_.getLayers().filter((layer) => {
      return layer.type === 'Vector' && layer.name === 'viewresult';
    });

    this.facadeMap_.removeLayers(remove);
    this.deactivate();
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
    return control instanceof ViewShedControl;
  }
}
