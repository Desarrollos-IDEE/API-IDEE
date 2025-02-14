/* eslint-disable no-restricted-globals */
/**
 * @module M/control/SelectionDrawControl
 */

import SelectionDrawImplControl from 'impl/selectiondrawcontrol';
import template from 'templates/selectiondraw';
import { getValue } from './i18n/language';

export default class SelectionDrawControl extends M.Control {
  /**
   * @classdesc
   * Main constructor of the class. Creates a PluginControl
   * control
   *
   * @constructor
   * @extends {M.Control}
   * @api
   */
  constructor(options) {
    if (M.utils.isUndefined(SelectionDrawImplControl)) {
      M.exception(getValue('exception_selectiondrawcontrol'));
    }
    const impl = new SelectionDrawImplControl(options.projection);
    super(impl, 'SelectionDraw');
    impl.facadeControl = this;
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
    console.warn(getValue('exception.obsolete'));
    return new Promise((success) => {
      const html = M.template.compileSync(template);
      const polygonBtn = html.querySelector('button#polygon');
      const pointBtn = html.querySelector('button#point');
      const clearBtn = html.querySelector('button#clear');
      const drawLayer = map.getLayers().find((l) => l.name === '__draw__');

      clearBtn.addEventListener('click', () => {
        drawLayer.clear();
      });
      pointBtn.addEventListener('click', () => {
        const type = 'Point';
        const pointActive = this.activeGeometry === type;
        if (pointActive) {
          this.deactivate([pointBtn, polygonBtn]);
        } else {
          this.deactivate([pointBtn, polygonBtn]);
          this.activate(type, pointBtn);
        }
      });
      polygonBtn.addEventListener('click', () => {
        const type = 'Polygon';
        const polygonActivate = this.activeGeometry === type;
        if (polygonActivate) {
          this.deactivate([pointBtn, polygonBtn]);
        } else {
          this.deactivate([pointBtn, polygonBtn]);
          this.activate(type, polygonBtn);
        }
      });

      function retroceso(e) {
        // eslint-disable-next-line no-undef
        const evtobj = window.event ? event : e;
        if (evtobj.keyCode === 90 && evtobj.ctrlKey) {
          const numeroFeatures = drawLayer.getImpl().getOL3Layer().getSource().getFeatures().length;
          // eslint-disable-next-line max-len
          drawLayer.getImpl().getOL3Layer().getSource().removeFeature(drawLayer.getImpl().getOL3Layer().getSource().getFeatures()[numeroFeatures - 1]);
        }
      }
      document.onkeydown = retroceso;

      success(html);
    });
  }

  /**
   * @public
   * @function
   * @api
   */
  activate(type, btn) {
    this.activeGeometry = type;
    this.getImpl().activate(type, btn);
  }

  /**
   * @public
   * @function
   * @api
   */
  deactivate(listBtn) {
    this.activeGeometry = '';
    this.getImpl().deactivate(listBtn);
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
    return control instanceof SelectionDrawControl;
  }
}
