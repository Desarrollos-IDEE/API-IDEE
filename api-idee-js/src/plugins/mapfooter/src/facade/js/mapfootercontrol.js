/* eslint-disable no-console */
/**
 * @module M/control/MapfooterControl
 */

import MapfooterImplControl from 'impl/mapfootercontrol';
import template from 'templates/mapfooter';
import { getValue } from './i18n/language';

export default class MapfooterControl extends IDEE.Control {
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
    if (IDEE.utils.isUndefined(MapfooterImplControl)) {
      IDEE.exception(getValue('exception.impl'));
    }
    // 2. implementation of this control
    const impl = new MapfooterImplControl();
    super(impl, 'Mapfooter');
    this.config = config;
    this.htmlCode = this.config.htmlCode;
    this.opened = this.config.open === true;
    this.cssList = (IDEE.utils.isArray(this.config.cssList) ? this.config.cssList : this.config.cssList.split(',')).map((s) => s.trim());
    this.injectCSS(this.cssList);
    this.templateVars = { vars: { htmlCode: this.htmlCode } };
    /** @type {number} altura del panel mapfooter (px). 0 hasta primera medición. */
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
      this.html_ = html;
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
    return html.querySelector('.m-mapfooter button');
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
    return control instanceof MapfooterControl;
  }

  // Add your own functions
  injectCSS(cssList) {
    cssList.forEach((cssFile) => {
      const link = document.createElement('link');
      link.href = cssFile;
      // link.type = "text/css";
      link.rel = 'stylesheet';
      link.addEventListener('load', () => {
        // console.log('se cargo el enlace: ' + cssList[index])
        this.checkFooterheight();
        // console.log(this.panelHeight)
      });
      link.media = 'screen';
      document.getElementsByTagName('head')[0].appendChild(link);
    });
  }

  addEvents() {
    this.checkFooterheight();

    const panelMapfooter = document.querySelector('div.m-panel.m-mapfooter');
    const btnMapFooter = panelMapfooter ? panelMapfooter.querySelector('button.m-panel-btn') : null;
    if (!btnMapFooter) {
      return;
    }

    btnMapFooter.title = this.opened ? getValue('hidefooter') : getValue('showfooter');
    btnMapFooter.addEventListener('click', () => {
      this.opened = !this.opened;
      btnMapFooter.title = this.opened ? getValue('hidefooter') : getValue('showfooter');
      this.checkFooterheight();
    });
  }

  checkFooterheight() {
    const panel = document.querySelector('div.m-panel.m-mapfooter');
    if (panel) {
      this.panelHeight = panel.clientHeight;
    }
    this.setBottomMargin(this.opened);
  }

  setBottomMargin(opened) {
    const ph = this.panelHeight || 0;
    this.applyButtonOffset(opened, ph);
    this.applyBottomRightMargin(opened, ph);
    this.applyBottomLeftSiblingsMargin(opened, ph);
  }

  applyButtonOffset(opened, ph) {
    const button = document.querySelector('div.m-panel.m-mapfooter>button');
    if (!button) {
      return;
    }
    if (opened) {
      button.style.setProperty('bottom', `${ph}px`, 'important');
    } else {
      button.style.removeProperty('bottom');
    }
  }

  applyBottomRightMargin(opened, ph) {
    const bottomRight = document.querySelector('div.m-area.m-bottom.m-right');
    if (bottomRight) {
      bottomRight.style.marginBottom = opened ? `${ph + 10}px` : '10px';
    }
  }

  applyBottomLeftSiblingsMargin(opened, ph) {
    const bottomLeft = document.querySelector('div.m-area.m-bottom.m-left');
    if (!bottomLeft) {
      return;
    }
    const firstMargin = opened ? `${ph + 10}px` : '10px';
    let firstApplied = false;
    Array.from(bottomLeft.children).forEach((element) => {
      if (!element.classList || element.classList.contains('m-mapfooter')) {
        return;
      }
      const margin = firstApplied ? '10px' : firstMargin;
      firstApplied = true;
      element.style.setProperty('margin-bottom', margin, 'important');
      if (element.classList.contains('m-scaleline')) {
        element.style.setProperty('margin-left', '96px', 'important');
      }
    });
  }
}
