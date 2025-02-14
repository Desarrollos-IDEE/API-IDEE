/**
 * @module M/control/PredefinedZoomControl
 */
import template from 'templates/predefinedzoom';
import PredefinedZoomImpl from '../../impl/ol/js/predefinedzoomcontrol';
import { getValue } from './i18n/language';

export default class PredefinedZoomControl extends M.Control {
  /**
   * Main constructor of the class. Creates a PluginControl
   * control
   *
   * @constructor
   * @extends {M.Control}
   * @api
   */
  constructor(map, predefinedzoom) {
    if (M.utils.isUndefined(PredefinedZoomImpl)) {
      M.exception(getValue('exception.impl_predefinedzoom'));
    }
    const impl = new PredefinedZoomImpl();
    super(impl, 'PredefinedZoomImpl');

    this.savedZooms_ = predefinedzoom;
    this.map = map;
  }

  /**
   * This functions active control
   *
   * @public
   * @function
   * @param {Node} html
   * @api
   */
  active(html) {
    const predefinedzoomactive = html.querySelector('#m-viewmanagement-predefinedzoom').classList.contains('activated');
    this.deactive(html);
    if (!predefinedzoomactive) {
      if (M.utils.isArray(this.savedZooms_) && this.savedZooms_.length > 1) {
        // predefinedZoom is an array with more than one zoom level
        html.querySelector('#m-viewmanagement-predefinedzoom').classList.add('activated');
        const panel = M.template.compileSync(template);
        this.savedZooms_.forEach((customZoom) => {
          const newDiv = document.createElement('div');
          newDiv.classList.add('m-predefinedzoom-button-container');
          const newBtn = document.createElement('button');
          newBtn.setAttribute('class', 'viewmanagement-icon-expand');
          newBtn.setAttribute('id', `m-predefinedzoom-${customZoom.name}`);
          newBtn.setAttribute('title', customZoom.name);
          if (customZoom.bbox !== undefined) {
            newDiv.addEventListener('click', () => this.zoomToGivenBox(newBtn, customZoom.bbox));
          } else if (customZoom.center !== undefined && customZoom.zoom !== undefined) {
            newDiv.addEventListener('click', () => this.zoomToCenter(newBtn, customZoom.center, customZoom.zoom));
          }
          const newSpan = document.createElement('span');
          newSpan.classList.add('m-predefinedzoom-namezoom');
          newSpan.textContent = customZoom.name;
          newDiv.appendChild(newBtn);
          newDiv.appendChild(newSpan);
          panel.appendChild(newDiv);
        });
        document.querySelector('#div-contenedor-viewmanagement').appendChild(panel);
      } else {
        // predefinedZoom: true or array with one zoom level
        const element = html.querySelector('#m-viewmanagement-predefinedzoom');
        element.classList.add('activated');
        if (this.savedZooms_[0].bbox !== undefined) {
          this.zoomToGivenBox(element, this.savedZooms_[0].bbox);
        } else if (this.savedZooms_[0].center !== undefined
          && this.savedZooms_[0].zoom !== undefined) {
          this.zoomToCenter(element, this.savedZooms_[0].center, this.savedZooms_[0].zoom);
        }
      }
    }
  }

  /**
   * This functions deactive control
   *
   * @public
   * @function
   * @param {Node} html
   * @api
   */
  deactive(html) {
    html.querySelector('#m-viewmanagement-predefinedzoom').classList.remove('activated');
    const panel = html.querySelector('#m-predefinedzoom-panel');
    if (panel) {
      document.querySelector('#div-contenedor-viewmanagement').removeChild(panel);
    }
  }

  /**
   * Zooms to predefined Bbox.
   *
   * @function
   * @public
   * @param {Node} element
   * @param {Array} bbox
   * @api
   */
  zoomToGivenBox(element, bbox) {
    element.classList.add('activated');
    setTimeout(() => {
      element.classList.remove('activated');
    }, 1000);
    this.map.setBbox(bbox);
  }

  /**
   * Zooms to predefined center with a zoom level.
   *
   * @function
   * @public
   * @param {Node} element
   * @param {Array} center
   * @param {Number} zoom
   * @api
   */
  zoomToCenter(element, center, zoom) {
    element.classList.add('activated');
    setTimeout(() => {
      element.classList.remove('activated');
    }, 1000);
    this.map.setCenter(center);
    this.map.setZoom(zoom);
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
    return control instanceof PredefinedZoomControl;
  }
}
