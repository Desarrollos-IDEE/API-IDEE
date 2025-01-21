/**
 * @module IDEE/control/ZoomPanelControl
 */
import template from 'templates/zoompanel';
import ZoomPanelImpl from 'impl/zoompanelcontrol';
import { getValue } from './i18n/language';

export default class ZoomPanelControl extends IDEE.Control {
  /**
   * Main constructor of the class. Creates a PluginControl
   * control
   *
   * @constructor
   * @extends {IDEE.Control}
   * @api
   */
  constructor(map) {
    if (IDEE.utils.isUndefined(ZoomPanelImpl) || (IDEE.utils.isObject(ZoomPanelImpl)
      && IDEE.utils.isNullOrEmpty(Object.keys(ZoomPanelImpl)))) {
      IDEE.exception(getValue('exception.impl_zoompanel'));
    }
    const impl = new ZoomPanelImpl();
    super(impl, 'ZoomPanelImpl');
    this.facadeMap_ = map;
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
    const zoompanelactive = html.querySelector('#m-viewmanagement-zoompanel').classList.contains('activated');
    this.deactive(html);
    if (!zoompanelactive) {
      html.querySelector('#m-viewmanagement-zoompanel').classList.add('activated');
      const panel = IDEE.template.compileSync(template, {
        vars: {
          translations: {
            zoomin: getValue('zoomin'),
            zoomout: getValue('zoomout'),
          },
        },
      });
      document.querySelector('#div-contenedor-viewmanagement').appendChild(panel);
      const zoomInBtn = html.querySelector('button#m-zoompanel-zoomin');
      const zoomOutBtn = html.querySelector('button#m-zoompanel-zoomout');
      zoomInBtn.addEventListener('click', (evt) => {
        evt.target.classList.add('activated');
        setTimeout(() => {
          evt.target.classList.remove('activated');
        }, 1000);
        this.facadeMap_.setZoom(this.facadeMap_.getZoom() + 1);
      });

      zoomOutBtn.addEventListener('click', (evt) => {
        evt.target.classList.add('activated');
        setTimeout(() => {
          evt.target.classList.remove('activated');
        }, 1000);
        this.facadeMap_.setZoom(this.facadeMap_.getZoom() - 1);
      });
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
    html.querySelector('#m-viewmanagement-zoompanel').classList.remove('activated');
    const panel = html.querySelector('#m-zoompanel-panel');
    if (panel) {
      document.querySelector('#div-contenedor-viewmanagement').removeChild(panel);
    }
  }

  /**
   * This function compares controls
   *
   * @public
   * @function
   * @param {IDEE.Control} control to compare
   * @api
   */
  equals(control) {
    return control instanceof ZoomPanelControl;
  }
}
