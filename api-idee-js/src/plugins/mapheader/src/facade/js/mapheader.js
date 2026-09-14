/**
 * @module IDEE/plugin/Mapheader
 */
import 'assets/css/mapheader';
import api from '../../api';
import myhelp from '../../templates/myhelp.html';
import ca from './i18n/ca';
import en from './i18n/en';
import es from './i18n/es';
import { getValue } from './i18n/language';
import MapheaderControl from './mapheadercontrol';

export default class Mapheader extends IDEE.Plugin {
  /**
   * @classdesc
   * Plugin de cabecera HTML colapsable sobre el mapa.
   *
   * @constructor
   * @extends {IDEE.Plugin}
   * @param {Object} options opciones del plugin
   * @api stable
   */
  constructor(options = {}) {
    super('mapheader', {
      position: options.position || 'center-top-left',
      tooltip: options.tooltip || getValue('tooltip'),
      order: options.order,
    });

    this.options = options;
    this.map = null;
    this.controls = [];

    this.className = 'm-plugin-mapheader';
    if (!IDEE.utils.isNullOrEmpty(options.className)) {
      this.className = `${this.className} ${options.className}`;
    }

    // Compat: legacy `open` → collapsed = !open
    this.collapsed = true;
    if (IDEE.utils.isBoolean(options.collapsed)) {
      this.collapsed = options.collapsed;
    } else if (IDEE.utils.isBoolean(options.open)) {
      this.collapsed = !options.open;
    }

    this.collapsible = options.collapsible;
    if (this.collapsible === undefined) {
      this.collapsible = true;
    }

    this.collapsedButtonClass = 'g-cartografia-flecha-abajo';
    if (!IDEE.utils.isNullOrEmpty(options.collapsedButtonClass)) {
      this.collapsedButtonClass = options.collapsedButtonClass;
    }

    this.openedButtonClass = 'g-cartografia-flecha-arriba';
    if (!IDEE.utils.isNullOrEmpty(options.openedButtonClass)) {
      this.openedButtonClass = options.openedButtonClass;
    }

    this.htmlCode = options.htmlCode || '';

    this.cssList = [];
    if (!IDEE.utils.isNullOrEmpty(options.cssList)) {
      if (IDEE.utils.isArray(options.cssList)) {
        this.cssList = options.cssList;
      } else if (IDEE.utils.isString(options.cssList)) {
        this.cssList = options.cssList.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }

    this.metadata = api.metadata;
    this.separatorApiJson = api.url.separator;
  }

  /**
   * This function adds this plugin into the map
   *
   * @public
   * @function
   * @param {IDEE.Map} map the map to add the plugin
   * @api stable
   */
  addTo(map) {
    this.map = map;
    this.control = new MapheaderControl({
      htmlCode: this.htmlCode,
      cssList: this.cssList,
      open: !this.collapsed,
      tooltip: this.tooltip,
      position: this.position,
      order: this.order,
    });
    this.controls = [this.control];

    this.panel = new IDEE.ui.panels.CollapsiblePanel(this.name, {
      collapsed: this.collapsed,
      collapsible: this.collapsible,
      position: this.position,
      className: this.className,
      tooltip: this.tooltip,
      order: this.order,
      collapsedButtonClass: this.collapsedButtonClass,
      openedButtonClass: this.openedButtonClass,
    });

    this.control.setPanel(this.panel);
    this.panel.addControls(this.controls);
    map.addControlPanels(this.panel);

    // ADDED_TO_MAP del panel es síncrono: enlazar después
    if (this.panel.element) {
      IDEE.utils.enableTouchScroll(this.panel.element);
    }
    this.control.bindPanelEvents(this.panel);

    this.control.on(IDEE.evt.ADDED_TO_MAP, () => {
      this.fire(IDEE.evt.ADDED_TO_MAP);
    });
  }

  /**
   * This function destroys this plugin
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {
    if (this.map) {
      if (this.control) {
        this.control.setPanel(null);
        this.control.deactivate();
        this.control.destroy();
      }
      if (this.panel) {
        this.map.removePanel(this.panel);
      }
      if (this.controls.length > 0) {
        this.map.removeControls(this.controls);
      }
    }
    this.map = null;
    this.control = null;
    this.controls = [];
    this.panel = null;
  }

  getPanel() {
    return this.panel;
  }

  getControls() {
    return this.controls;
  }

  getAPIRest() {
    return `${this.name}=${this.position}${this.separatorApiJson}${this.collapsed}${this.separatorApiJson}${this.order}${this.separatorApiJson}${this.tooltip}${this.separatorApiJson}${this.collapsible}`;
  }

  getAPIRestBase64() {
    return `${this.name}=base64=${IDEE.utils.encodeBase64(this.options)}`;
  }

  getMetadata() {
    return this.metadata;
  }

  equals(plugin) {
    return plugin instanceof Mapheader;
  }

  static getJSONTranslations(lang) {
    if (lang === 'en' || lang === 'es' || lang === 'ca') {
      if (lang === 'en') {
        return en;
      }
      if (lang === 'ca') {
        return ca;
      }
      return es;
    }
    return IDEE.language.getTranslation(lang).mapheader;
  }

  getHelp() {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const imageHelp01 = require(`assets/images/${this.getMetadata().version}/help-01.png`);
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const imageHelp02 = require(`assets/images/${this.getMetadata().version}/help-02.png`);

    return {
      title: getValue('textHelp.squemaTitle'),
      content: new Promise((resolve) => {
        const html = IDEE.template.compileSync(myhelp, {
          vars: {
            title: getValue('textHelp.title'),
            imageHelp01,
            imageHelp02,
            translations: {
              paragraph1: getValue('textHelp.paragraph1'),
              screenshot1Alt: getValue('textHelp.screenshot1Alt'),
              screenshot1Caption: getValue('textHelp.screenshot1Caption'),
              screenshot1Description: getValue(
                'textHelp.screenshot1Description',
              ),
              screenshot2Alt: getValue('textHelp.screenshot2Alt'),
              screenshot2Caption: getValue('textHelp.screenshot2Caption'),
              screenshot2Description: getValue(
                'textHelp.screenshot2Description',
              ),
            },
          },
        });
        resolve(html);
      }),
    };
  }
}
