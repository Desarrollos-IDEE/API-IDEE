/**
 * @module IDEE/plugin/Mapheader
 */
import api from '../../api';
import myhelp from '../../templates/myhelp.html';
import '../assets/css/fonts';
import '../assets/css/mapheader';
import ca from './i18n/ca';
import en from './i18n/en';
import es from './i18n/es';
import { getValue } from './i18n/language';
import MapheaderControl from './mapheadercontrol';

/**
 * @classdesc
 * Plugin de cabecera HTML colapsable sobre el mapa (CollapsiblePanel, API-IDEE v2).
 * No usa SidePanel: es un overlay de cabecera, como attributions.
 */
export default class Mapheader extends IDEE.Plugin {
  /**
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

    /**
     * Plugin options
     * @private
     * @type {Object}
     */
    this.options = options;

    /**
     * Facade of the map
     * @private
     * @type {IDEE.Map}
     */
    this.map = null;

    /**
     * Array of controls
     * @private
     * @type {Array<IDEE.Control>}
     */
    this.controls = [];

    /**
     * CSS class name for the panel
     * @private
     * @type {string}
     */
    this.className = 'm-plugin-mapheader';
    if (!IDEE.utils.isNullOrEmpty(options.className)) {
      this.className = `${this.className} ${options.className}`;
    }

    /**
     * Option to allow the plugin to be initially collapsed
     * Compat legacy: `open` → collapsed = !open
     * @private
     * @type {boolean}
     */
    this.collapsed = true;
    if (IDEE.utils.isBoolean(options.collapsed)) {
      this.collapsed = options.collapsed;
    } else if (IDEE.utils.isBoolean(options.open)) {
      this.collapsed = !options.open;
    }

    /**
     * Option to allow the panel to be collapsible
     * @private
     * @type {boolean}
     */
    this.collapsible = options.collapsible;
    if (this.collapsible === undefined) {
      this.collapsible = true;
    }

    /**
     * CSS class for the collapsed panel button
     * @private
     * @type {string}
     */
    this.collapsedButtonClass = 'g-cartografia-btn-mapheader-chevron';
    if (!IDEE.utils.isNullOrEmpty(options.collapsedButtonClass)) {
      this.collapsedButtonClass = options.collapsedButtonClass;
    }

    /**
     * CSS class for the opened panel button
     * @private
     * @type {string}
     */
    this.openedButtonClass = 'g-cartografia-btn-mapheader-chevron';
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
      minWidth: this.minPanelWidth,
      maxWidth: this.maxPanelWidth,
      className: this.className,
      tooltip: this.tooltip,
      order: this.order,
      collapsedButtonClass: this.collapsedButtonClass,
      openedButtonClass: this.openedButtonClass,
    });

    this.control.setPanel(this.panel);
    this.panel.addControls(this.controls);
    map.addControlPanels(this.panel);

    this.control.on(IDEE.evt.ADDED_TO_MAP, () => {
      this.fire(IDEE.evt.ADDED_TO_MAP);
    });

    this.panel.on(IDEE.evt.ADDED_TO_MAP, (html) => {
      IDEE.utils.enableTouchScroll(html);
    });

    // ADDED_TO_MAP del panel puede ser síncrono: enlazar layout tras add
    if (this.panel.element) {
      IDEE.utils.enableTouchScroll(this.panel.element);
    }
    this.control.bindPanelEvents(this.panel);
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

  /**
   * Devuelve el panel del plugin
   *
   * @public
   * @function
   * @returns {IDEE.ui.panels.CollapsiblePanel}
   * @api
   */
  getPanel() {
    return this.panel;
  }

  /**
   * This function return the controls of plugin
   *
   * @public
   * @function
   * @api stable
   */
  getControls() {
    return this.controls;
  }

  /**
   * Get the API REST Parameters of the plugin
   *
   * @function
   * @public
   * @api
   */
  getAPIRest() {
    return `${this.name}=${this.position}${this.separatorApiJson}${this.collapsed}${this.separatorApiJson}${this.order}${this.separatorApiJson}${this.tooltip}${this.separatorApiJson}${this.collapsible}`;
  }

  /**
   * Gets the API REST Parameters in base64 of the plugin
   *
   * @function
   * @public
   * @api
   */
  getAPIRestBase64() {
    return `${this.name}=base64=${IDEE.utils.encodeBase64(this.options)}`;
  }

  /**
   * This function gets metadata plugin
   *
   * @public
   * @function
   * @api stable
   */
  getMetadata() {
    return this.metadata;
  }

  /**
   * Comprueba si el plugin recibido es instancia de Mapheader
   *
   * @public
   * @function
   * @param {IDEE.Plugin} plugin Plugin a comparar
   * @returns {boolean}
   * @api
   */
  equals(plugin) {
    return plugin instanceof Mapheader;
  }

  /**
   * Return plugin language
   *
   * @public
   * @function
   * @param {string} lang type language
   * @api stable
   */
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

  /**
   * Obtiene la ayuda del plugin
   *
   * @function
   * @public
   * @api
   */
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
              paragraph2: getValue('textHelp.paragraph2'),
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
