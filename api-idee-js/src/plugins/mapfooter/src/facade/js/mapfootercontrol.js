/**
 * @module IDEE/control/MapfooterControl
 */
import MapfooterImplControl from 'impl/mapfootercontrol';
import template from 'templates/mapfooter';
import { getValue } from './i18n/language';

class MapfooterControl extends IDEE.Control {
  /**
   * @classdesc
   * Control del pie HTML del mapa.
   *
   * @constructor
   * @extends {IDEE.Control}
   * @param {Object} options control options
   * @api
   */
  constructor(options = {}) {
    if (IDEE.utils.isUndefined(MapfooterImplControl)
      || (IDEE.utils.isObject(MapfooterImplControl)
      && IDEE.utils.isNullOrEmpty(Object.keys(MapfooterImplControl)))) {
      IDEE.exception(getValue('exception.impl'));
    }
    const impl = new MapfooterImplControl();
    super(MapfooterControl.NAME, impl, {
      tooltip: options.tooltip,
      position: options.position,
      order: options.order,
    });

    this.htmlCode = options.htmlCode || '';
    this.opened = options.open === true;
    this.cssList = IDEE.utils.isArray(options.cssList) ? options.cssList : [];
    this.injectedLinks = [];
    this.panelHeight = 0;
    this.panel_ = null;
    this.templateVars = { vars: { htmlCode: this.htmlCode } };

    this.injectCSS(this.cssList);
  }

  /**
   * This function creates the view
   *
   * @public
   * @function
   * @param {IDEE.Map} map to add the control
   * @api
   */
  createView(map) {
    this.map_ = map;
    this.map = map;
    return new Promise((success) => {
      const html = IDEE.template.compileSync(template, this.templateVars);
      this.html_ = html;
      success(html);
    });
  }

  /**
   * Enlaza eventos SHOW/HIDE del CollapsiblePanel
   *
   * @public
   * @function
   * @param {IDEE.ui.panels.CollapsiblePanel} panel panel del plugin
   * @api
   */
  bindPanelEvents(panel) {
    this.panel_ = panel;
    this.updateButtonTitle();
    // Quitar bottom inline residual; la posición la marca el CSS
    this.clearButtonInlineOffset();
    this.scheduleFooterLayout();

    panel.on(IDEE.evt.SHOW, () => {
      this.opened = true;
      this.updateButtonTitle();
      this.clearButtonInlineOffset();
      this.scheduleFooterLayout();
    });

    panel.on(IDEE.evt.HIDE, () => {
      this.opened = false;
      this.updateButtonTitle();
      this.clearButtonInlineOffset();
      this.scheduleFooterLayout();
    });
  }

  /**
   * Recalcula layout tras el siguiente paint (altura real del panel)
   *
   * @private
   * @function
   */
  scheduleFooterLayout() {
    window.requestAnimationFrame(() => {
      this.checkFooterheight();
    });
  }

  /**
   * Elimina bottom inline para que gobierne el CSS (.opened/.collapsed)
   *
   * @private
   * @function
   */
  clearButtonInlineOffset() {
    const button = this.getPanelButton();
    if (button) {
      button.style.removeProperty('bottom');
      button.style.removeProperty('top');
    }
  }

  /**
   * Actualiza el texto y title del botón del panel (Mostrar / Ocultar)
   *
   * @private
   * @function
   */
  updateButtonTitle() {
    const btn = this.getPanelButton();
    if (btn) {
      const label = (this.opened ? getValue('hide') : getValue('show') || '').trim();
      btn.replaceChildren();
      const inner = document.createElement('span');
      inner.className = 'm-mapfooter-btn-inner';
      const text = document.createElement('span');
      text.className = 'm-mapfooter-btn-text';
      text.textContent = label;
      const icon = document.createElement('span');
      icon.className = 'm-mapfooter-btn-icon g-cartografia-btn-mapfooter-chevron';
      icon.setAttribute('aria-hidden', 'true');
      inner.append(text, icon);
      btn.append(inner);
      btn.title = this.opened ? getValue('hidefooter') : getValue('showfooter');
      btn.setAttribute('aria-label', btn.title);
    }
  }

  /**
   * Obtiene el botón del CollapsiblePanel
   *
   * @private
   * @function
   * @returns {HTMLElement|null}
   */
  getPanelButton() {
    const panelEl = this.getPanelElement();
    return panelEl ? panelEl.querySelector('button.m-control-panel-btn') : null;
  }

  /**
   * Obtiene el elemento DOM del panel
   *
   * @private
   * @function
   * @returns {HTMLElement|null}
   */
  getPanelElement() {
    if (this.panel_ && this.panel_.element) {
      return this.panel_.element;
    }
    return document.querySelector('div.m-control-panel.m-plugin-mapfooter');
  }

  /**
   * Sin botón de activación propio (usa el del CollapsiblePanel).
   *
   * @public
   * @function
   * @param {HTMLElement} html HTML del control
   * @api
   */
  getActivationButton(html) {
    return null;
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
    return control instanceof MapfooterControl;
  }

  /**
   * Inyecta hojas de estilo externas
   *
   * @public
   * @function
   * @param {Array<string>} cssList URLs CSS
   * @api
   */
  injectCSS(cssList) {
    cssList.forEach((cssFile) => {
      const link = document.createElement('link');
      link.href = cssFile;
      link.rel = 'stylesheet';
      link.media = 'screen';
      link.addEventListener('load', () => {
        this.checkFooterheight();
      });
      document.getElementsByTagName('head')[0].appendChild(link);
      this.injectedLinks.push(link);
    });
  }

  /**
   * Mide la altura del panel y aplica márgenes
   *
   * @public
   * @function
   * @api
   */
  checkFooterheight() {
    const panel = this.getPanelElement();
    if (panel) {
      this.panelHeight = panel.clientHeight;
    }
    this.setBottomMargin(this.opened);
  }

  /**
   * Aplica offsets al botón y a controles inferiores
   *
   * @public
   * @function
   * @param {boolean} opened si el pie está abierto
   * @api
   */
  setBottomMargin(opened) {
    const ph = this.panelHeight || 0;
    this.clearButtonInlineOffset();
    this.applyBottomContainersMargin(opened, ph);
  }

  /**
   * Empuja contenedores inferiores al abrir el pie
   *
   * @private
   * @function
   * @param {boolean} opened
   * @param {number} ph
   */
  applyBottomContainersMargin(opened, ph) {
    const margin = opened ? `${ph + 10}px` : '';
    const selectors = [
      '.m-api-idee-center-panel-bottom-right',
      '.m-api-idee-center-panel-bottom-left',
      '.m-api-idee-down-panel',
    ];

    selectors.forEach((selector) => {
      const container = document.querySelector(selector);
      if (!container) {
        return;
      }
      Array.from(container.children).forEach((element) => {
        if (!element.classList || element.classList.contains('m-plugin-mapfooter')) {
          return;
        }
        if (opened) {
          element.style.setProperty('margin-bottom', margin, 'important');
        } else {
          element.style.removeProperty('margin-bottom');
        }
        if (element.classList.contains('m-scaleline')
          || element.classList.contains('m-scale')) {
          element.style.setProperty('margin-left', '96px', 'important');
        }
      });
    });
  }

  /**
   * Limpia CSS inyectado y márgenes
   *
   * @public
   * @function
   * @api
   */
  destroy() {
    this.setBottomMargin(false);
    this.injectedLinks.forEach((link) => {
      if (link && link.parentNode) {
        link.parentNode.removeChild(link);
      }
    });
    this.injectedLinks = [];
    this.panel_ = null;
    this.html_ = null;
    this.map = null;
  }
}

MapfooterControl.NAME = 'Mapfooter';
export default MapfooterControl;
