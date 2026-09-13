/**
 * @module IDEE/control/GeoprocessControl
 */

import GeoprocessControlImpl from 'impl/geoprocesscontrol';
import template from '../../templates/geoprocess';
import HistogramControl from './histogramcontrol';
import CalculatorControl from './calculatorcontrol';
import { getValue } from './i18n/language';

export default class GeoprocessControl extends IDEE.Control {
  /**
   * @param {IDEE.control.RasterManagementControl} parentControl Control padre.
   * @param {IDEE.Map} map Mapa asociado.
   */
  constructor(parentControl, map) {
    if (IDEE.utils.isUndefined(GeoprocessControlImpl)
      || (IDEE.utils.isObject(GeoprocessControlImpl)
      && IDEE.utils.isNullOrEmpty(Object.keys(GeoprocessControlImpl)))) {
      IDEE.exception(getValue('exception.impl'));
    }
    const impl = new GeoprocessControlImpl(map);
    super(impl, GeoprocessControl.NAME);
    this.parentControl_ = parentControl;
    this.map_ = map;
    this.template_ = null;
    this.activated_ = false;
    this.histogramControl_ = new HistogramControl(parentControl);
    this.calculatorControl_ = new CalculatorControl(parentControl);
  }

  get html() {
    return this.parentControl_.html;
  }

  /**
   * Compila variables de plantilla para la sección Geoprocesos.
   * @returns {object}
   */
  getTemplateVars() {
    return {
      geoprocessSection: getValue('geoprocessSection'),
      histograms: getValue('histograms'),
      rasterCalculator: getValue('rasterCalculator'),
    };
  }

  /**
   * Activa la sección Geoprocesos.
   * @param {HTMLElement} html Plantilla principal.
   */
  active(html) {
    this.html_ = html;
    const container = html.querySelector('#m-rastermanagement-geoprocess-section');
    if (!this.activated_) {
      const content = IDEE.template.compileSync(template, {
        vars: this.getTemplateVars(),
      });
      container.appendChild(content);
      this.template_ = content;
      this.histogramControl_.init(html);
      this.calculatorControl_.init(html);
      this.addGeoprocessTabEvents(html);
      this.activated_ = true;
    }
    container.classList.remove('hidden');
    this.histogramControl_.loadIfVisible();
    this.calculatorControl_.loadIfVisible();
  }

  /**
   * Desactiva la sección Geoprocesos.
   */
  deactive() {
    if (!this.html_) {
      return;
    }
    const container = this.html_.querySelector('#m-rastermanagement-geoprocess-section');
    if (container) {
      container.classList.add('hidden');
    }
  }

  /**
   * Notifica cambio de capa seleccionada.
   */
  onLayerSelected() {
    this.histogramControl_.loadIfVisible();
    this.calculatorControl_.loadIfVisible();
  }

  equals(control) {
    return control instanceof GeoprocessControl;
  }

  destroy() {
    if (this.histogramControl_) {
      this.histogramControl_ = null;
    }
    if (this.calculatorControl_) {
      this.calculatorControl_ = null;
    }
  }

  addGeoprocessTabEvents(html) {
    const tabsContainer = html.querySelector('#m-rastermanagement-geoprocess-tabs');
    tabsContainer.addEventListener('click', (evt) => this.toggleGeoprocessTabs(evt));
  }

  /**
   * Cambia la pestaña activa en la sección Geoprocesos.
   *
   * @private
   * @function
   * @param {Event} evt Evento de clic
   */

  toggleGeoprocessTabs(evt) {
    evt.stopPropagation();
    let tab = evt.target;
    if (!tab.classList.contains('m-rastermanagement-tab')) {
      tab = tab.closest('.m-rastermanagement-tab');
    }
    if (!tab || !tab.closest('#m-rastermanagement-geoprocess-tabs')) {
      return;
    }

    const tabs = tab.parentNode.children;
    for (let i = 0; i < tabs.length; i += 1) {
      const child = tabs.item(i);
      child.classList.remove('active');
      child.setAttribute('aria-selected', 'false');
    }
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');

    const tabsContent = this.html.querySelector('#m-rastermanagement-geoprocess-contents').children;
    for (let i = 0; i < tabsContent.length; i += 1) {
      const child = tabsContent.item(i);
      if (child.id !== `${tab.id}-content`) {
        child.classList.add('hidden');
      } else if (child.classList.contains('hidden')) {
        child.classList.remove('hidden');
      }
    }

    this.histogramControl_.loadIfVisible();
    this.calculatorControl_.loadIfVisible();
  }
}

/**
 * Identificador del control.
 * @const
 * @type {string}
 * @public
 * @api stable
 */
GeoprocessControl.NAME = 'GeoprocessControl';
