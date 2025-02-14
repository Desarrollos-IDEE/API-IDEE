/**
 * @module IDEE/control/PredefinedZoomControl
 */

import PredefinedZoomImplControl from 'impl/predefinedzoomcontrol';
import template from 'templates/predefinedzoom';
import { getValue } from './i18n/language';

export default class PredefinedZoomControl extends IDEE.Control {
  /**
   * @classdesc
   * Main constructor of the class. Creates a PluginControl
   * control
   *
   * @constructor
   * @extends {IDEE.Control}
   * @api stable
   */
  constructor(savedZooms) {
    if (IDEE.utils.isUndefined(PredefinedZoomImplControl)
      || (IDEE.utils.isObject(PredefinedZoomImplControl)
      && IDEE.utils.isNullOrEmpty(Object.keys(PredefinedZoomImplControl)))) {
      IDEE.exception(getValue('exception_predefinedzoomcontrol'));
    }
    const impl = new PredefinedZoomImplControl();
    super(impl, 'PredefinedZoom');

    this.savedZooms = savedZooms;
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
    this.map = map;
    // eslint-disable-next-line
    console.warn(getValue('predefinedzoom_obsolete'));
    return new Promise((success, fail) => {
      const html = IDEE.template.compileSync(template);
      this.savedZooms.forEach((customZoom) => {
        const newBtn = document.createElement('button');
        newBtn.setAttribute('class', 'icon-expand');
        newBtn.setAttribute('title', customZoom.name);
        if (customZoom.bbox !== undefined) {
          newBtn.addEventListener('click', () => this.zoomToGivenBox(customZoom.bbox));
        } else if (customZoom.center !== undefined && customZoom.zoom !== undefined) {
          newBtn.addEventListener('click', () => this.zoomToCenter(customZoom.center, customZoom.zoom));
        }

        html.appendChild(newBtn);
      });

      success(html);
    });
  }

  /**
   * Zooms to predefined Bbox.
   * @function
   * @public
   * @param {Event} e
   */
  zoomToGivenBox(bbox) {
    this.map.setBbox(bbox);
  }

  /**
   * Zooms to predefined center with a zoom level.
   * @function
   * @public
   * @param {Event} e
   */
  zoomToCenter(center, zoom) {
    this.map.setCenter(center);
    this.map.setZoom(zoom);
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
    return control instanceof PredefinedZoomControl;
  }
}
