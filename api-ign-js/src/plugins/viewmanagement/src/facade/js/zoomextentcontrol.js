/**
 * @module M/control/ZoomExtentControl
 */

import ZoomExtentImpl from '../../impl/ol/js/zoomextentcontrol';
import { getValue } from './i18n/language';

export default class ZoomExtentControl extends M.Control {
  /**
   * Main constructor of the class. Creates a PluginControl
   * control
   *
   * @constructor
   * @extends {M.Control}
   * @api
   */
  constructor(map) {
    if (M.utils.isUndefined(ZoomExtentImpl)) {
      M.exception(getValue('exception.impl_zoomextent'));
    }
    const impl = new ZoomExtentImpl();
    super(impl, 'ZoomExtentImpl');
    this.getImpl().createInteraction(map);
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
    const zoomextentactive = html.querySelector('#m-viewmanagement-zoomextent').classList.contains('activated');
    if (!zoomextentactive) {
      html.querySelector('#m-viewmanagement-zoomextent').classList.add('activated');
      this.getImpl().activateClick(this.map_);
      this.escKey_ = this.checkEscKey.bind(this);
      document.addEventListener('keydown', this.escKey_);
    } else {
      this.deactive();
    }
  }

  /**
   * This function disables control when pressing
   * the Escape key
   *
   * @public
   * @function
   * @param {Event} evt
   * @api
   */
  checkEscKey(evt) {
    if (evt.key === 'Escape') {
      this.deactive();
      document.removeEventListener('keydown', this.escKey_);
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
  deactive() {
    document.querySelector('#m-viewmanagement-zoomextent').classList.remove('activated');
    this.getImpl().deactivateClick(this.map_);
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
    return control instanceof ZoomExtentControl;
  }

  /**
   * This function destroys this control
   *
   * @public
   * @function
   * @api
   */
  destroy() {
    this.getImpl().removeInteraction();
    document.removeEventListener('keydown', this.escKey_);
  }
}
