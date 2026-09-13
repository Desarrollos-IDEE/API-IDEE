import template from 'templates/calculator';
import { getValue } from './i18n/language';

/**
 * Control de calculadora ráster de la capa seleccionada.
 */
export default class CalculatorControl {
  /**
   * @param {IDEE.control.RasterManagementControl} parentControl Control principal.
   */
  constructor(parentControl) {
    /**
     * @private
     * @type {IDEE.control.RasterManagementControl}
     */
    this.parentControl_ = parentControl;

    /**
     * @private
     * @type {HTMLElement|null}
     */
    this.root_ = null;
  }

  /**
   * Inicializa la interfaz dentro del contenedor de la calculadora.
   *
   * @param {HTMLElement} html Plantilla principal del control.
   */
  init(html) {
    const container = html.querySelector('#m-rastermanagement-calculator-container');
    const content = IDEE.template.compileSync(template, {
      vars: {
        inDevelopment: getValue('inDevelopment'),
      },
    });
    container.innerHTML = '';
    container.appendChild(content);
    this.root_ = content;
    this.loadIfVisible();
  }

  /**
   * Actualiza la vista de la calculadora si la pestaña está visible.
   */
  loadIfVisible() {
    if (!this.isActive_()) {
      return;
    }
    this.refreshView_();
  }

  /**
   * Restablece la vista de la calculadora.
   *
   * @private
   * @function
   */
  refreshView_() {
    if (!this.root_) {
      return;
    }
    const messageEl = this.root_.querySelector('#m-rastermanagement-calculator-message');
    messageEl.innerText = getValue('inDevelopment');
  }

  /**
   * @private
   * @function
   * @returns {boolean}
   */
  isActive_() {
    const html = this.parentControl_.html;
    if (!html) {
      return false;
    }

    const geoprocessSection = html.querySelector('#m-rastermanagement-geoprocess-section');
    if (geoprocessSection.classList.contains('hidden')) {
      return false;
    }

    const calculatorTab = html.querySelector('#m-rastermanagement-calculator-tab');
    return calculatorTab.classList.contains('active');
  }
}
