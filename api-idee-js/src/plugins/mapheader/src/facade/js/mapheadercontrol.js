/* eslint-disable no-console */
/**
 * @module M/control/MapheaderControl
 */

import MapheaderImplControl from 'impl/mapheadercontrol';
import template from 'templates/mapheader';
import { getValue } from './i18n/language';

export default class MapheaderControl extends IDEE.Control {
  /**
   * @classdesc
   * Main constructor of the class. Creates a PluginControl
   * control
   *
   * @constructor
   * @extends {IDEE.Control}
   * @api stable
   */
  constructor(config) {
    // 1. checks if the implementation can create PluginControl
    if (IDEE.utils.isUndefined(MapheaderImplControl)) {
      IDEE.exception(getValue('exception.impl'));
    }
    // 2. implementation of this control
    const impl = new MapheaderImplControl();
    super(impl, 'Mapheader');

    this.config = config;
    this.htmlCode = this.config.htmlCode;
    this.opened = config.open === true;
    this.cssList = (IDEE.utils.isArray(this.config.cssList) ? this.config.cssList : this.config.cssList.split(',')).map((s) => s.trim());
    this.injectCSS(this.cssList);
    this.templateVars = { vars: { htmlCode: this.htmlCode } };
    /** @type {number} altura del panel mapheader (px). 0 hasta primera medición. */
    this.panelHeight = 0;
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
    return new Promise((success, fail) => {
      const html = IDEE.template.compileSync(template, this.templateVars);
      this.addEvents();
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
    // calls super to manage de/activation
    super.activate();
  }

  /**
   * This function is called on the control deactivation
   *
   * @public
   * @function
   * @api stable
   */
  deactivate() {
    // calls super to manage de/activation
    super.deactivate();
  }

  /**
   * This function gets activation button
   *
   * @public
   * @function
   * @param {HTML} html of control
   * @api stable
   */
  getActivationButton(html) {
    return html.querySelector('.m-mapheader button');
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
    return control instanceof MapheaderControl;
  }

  // Add your own functions
  injectCSS(cssList) {
    cssList.forEach((cssFile) => {
      const link = document.createElement('link');
      link.href = cssFile;
      link.rel = 'stylesheet';
      link.addEventListener('load', () => {
        this.checkHeaderheight();
      });
      link.media = 'screen';
      document.getElementsByTagName('head')[0].appendChild(link);
    });
  }

  addEvents() {
    this.checkHeaderheight();

    // Selector del botón del panel mapheader
    const panelMapheader = document.querySelector('div.m-panel.m-mapheader');
    const btnMapHeader = panelMapheader ? panelMapheader.querySelector('button.m-panel-btn') : null;
    if (!btnMapHeader) {
      return;
    }

    btnMapHeader.title = this.opened ? getValue('hideheader') : getValue('showheader');
    btnMapHeader.addEventListener('click', () => {
      this.opened = !this.opened;
      btnMapHeader.title = this.opened ? getValue('hideheader') : getValue('showheader');
      this.checkHeaderheight();
    });
  }

  checkHeaderheight() {
    const panel = document.querySelector('div.m-panel.m-mapheader');
    if (panel) {
      this.panelHeight = panel.clientHeight;
    }
    this.setTopMargin(this.opened);
  }

  setTopMargin(opened) {
    const ph = this.panelHeight || 0;
    this.applyButtonOffset(opened, ph);
    this.applyTopLeftMargin(opened, ph);
    this.applyHeaderContainerVisibility(opened);
    this.applyTopRightSiblingsMargin(opened, ph);
  }

  applyButtonOffset(opened, ph) {
    const button = document.querySelector('div.m-panel.m-mapheader>button');
    if (!button) {
      return;
    }
    if (opened) {
      button.style.setProperty('top', `${ph}px`, 'important');
    } else {
      button.style.removeProperty('top');
    }
  }

  applyTopLeftMargin(opened, ph) {
    const topLeft = document.querySelector('div.m-area.m-top.m-left');
    if (topLeft) {
      topLeft.style.marginTop = opened ? `${ph + 30}px` : '30px';
    }
  }

  applyHeaderContainerVisibility(opened) {
    const panel = document.querySelector('div.m-panel.m-mapheader');
    if (!panel) {
      return;
    }
    const headerContainer = panel.querySelector('#div-contenedor, .m-control.m-container.m-mapheader');
    if (headerContainer) {
      headerContainer.style.display = opened ? 'block' : 'none';
    }
  }

  applyTopRightSiblingsMargin(opened, ph) {
    const topRight = document.querySelector('div.m-area.m-top.m-right');
    if (!topRight) {
      return;
    }
    const firstMargin = opened ? `${ph + 10}px` : '10px';
    let firstApplied = false;
    Array.from(topRight.children).forEach((element) => {
      if (!element.classList || element.classList.contains('m-mapheader')) {
        return;
      }
      const margin = firstApplied ? '10px' : firstMargin;
      element.style.setProperty('margin-top', margin, 'important');
      firstApplied = true;
    });
  }
}
