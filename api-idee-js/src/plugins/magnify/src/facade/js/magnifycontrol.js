/**
 * @module IDEE/control/MagnifyControl
 */
import MagnifyImplControl from 'impl/magnifycontrol';
import template from 'templates/magnify';
import { getValue } from './i18n/language';

export default class MagnifyControl extends IDEE.Control {
  /**
   * @classdesc
   * Main constructor of the class. Creates a PluginControl
   * control
   *
   * @constructor
   * @extends {IDEE.Control}
   * @api stable
   */
  constructor(options = {}) {
    if (IDEE.utils.isUndefined(MagnifyImplControl)
      || (IDEE.utils.isObject(MagnifyImplControl)
        && IDEE.utils.isNullOrEmpty(Object.keys(MagnifyImplControl)))) {
      IDEE.exception(getValue('exception.impl'));
    }
    const impl = new MagnifyImplControl();
    super(MagnifyControl.NAME, impl, options);

    this.arrayListNames = options.layers || '';
    this.zoom = options.zoom;
    this.zoomMax = options.zoomMax;
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
    this.map_ = map;
    this.map = map;
    return new Promise((success) => {
      const zoomMax = this.zoomMax;
      const options = {
        jsonp: true,
        vars: {
          zoomMax,
          translations: {
            title: getValue('title'),
            actmagnifier: getValue('actmagnifier'),
            zoomlevel: getValue('zoomlevel'),
          },
        },
      };

      const html = IDEE.template.compileSync(template, options);

      html.querySelector('#input-zoom-offset').value = this.zoom;
      html.querySelector('#input-zoom-offset').addEventListener('change', (evt) => {
        this.zoom = Number(evt.target.value);
        this.getImpl().setOptionZoom(this.zoom);
      });

      html.querySelector('#m-magnify-magnifying').addEventListener('click', () => {
        if (document.getElementsByClassName('buttom-pressed').length === 0) {
          html.querySelector('#m-magnify-magnifying').classList.add('buttom-pressed');

          const allLayers = map.getLayers();
          const usableLayers = allLayers.filter((l) => l.name);
          const layerNames = Array.isArray(this.arrayListNames)
            ? this.arrayListNames
            : (this.arrayListNames || '').split(',').filter((n) => n);
          const layers = usableLayers.filter((l) => layerNames.includes(l.name));
          const layerBase = this.map.getBaseLayers();

          if (!layerBase || layerBase.length === 0) {
            this.getImpl().effectSelected(usableLayers, this.zoom);
          } else if (layers.length === 0) {
            this.getImpl().effectSelected(layerBase, this.zoom);
          } else {
            this.getImpl().effectSelected(layers, this.zoom);
          }
        } else {
          html.querySelector('#m-magnify-magnifying').classList.remove('buttom-pressed');
          this.removeEffects();
        }
      });
      success(html);
    });
  }

  /**
   * This function is called to remove the effects
   *
   * @public
   * @function
   * @api stable
   */
  removeEffects() {
    this.getImpl().removeEffects();
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
    return control instanceof MagnifyControl;
  }
}

MagnifyControl.NAME = 'Magnify';
