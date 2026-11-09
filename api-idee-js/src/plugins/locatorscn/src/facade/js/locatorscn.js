/**
 * @module IDEE/plugin/Locatorscn
 */
import '../assets/css/locatorscn';
import LocatorscnControl from './locatorscncontrol';
import es from './i18n/es';
import en from './i18n/en';
import { getValue } from './i18n/language';

export default class Locatorscn extends IDEE.Plugin {
  /**
   * @classdesc
   * Main facade plugin object. This class creates a plugin
   * object which has an implementation Object
   *
   * @constructor
   * @extends {IDEE.Plugin}
   * @param {Object} impl implementation object
   * @api
   */
  constructor(options = {}) {
    super('locatorscn', {
      position: options.position || 'right',
      tooltip: options.tooltip || getValue('tooltip'),
      order: options.order,
      svgPath: options.svgPath || 'https://componentes.idee.es/estaticos/Simbologia/svg/icons_cota/icn_point_on_plane.svg',
    });

    /**
     * Plugin parameters
     * @public
     * @type {Object}
     */
    this.options = options;

    /**
     * Option to allow the plugin to be collapsed or not
     * @private
     * @type {Boolean}
     */
    this.collapsed = !IDEE.utils.isUndefined(options.collapsed) ? options.collapsed : true;

    /**
     * Tooltip of plugin
     * @private
     * @type {String}
     */
    this.searchOptions = options.searchOptions || {};

    /**
     * Zoom
     * @private
     * @type {Number}
     */
    this.zoom = options.zoom || 16;

    /**
     * Type of icon to display when a punctual type result is found
     * @private
     * @type {string}
     */
    this.pointStyle = options.pointStyle || 'pinAzul';

    /**
     * Indicates if you want to use proxy in requests
     * @private
     * @type {Boolean|String}
     */
    this.useProxy = IDEE.utils.isUndefined(options.useProxy) ? IDEE.useproxy : options.useProxy;

    /**
     * Stores the proxy state at plugin load time
     * @private
     * @type {Boolean}
     */
    this.statusProxy = IDEE.useproxy;
  }

  /**
   * Return plugin language
   *
   * @public
   * @function
   * @param {string} lang type language
   * @api
   */
  static getJSONTranslations(lang) {
    if (lang === 'en' || lang === 'es') {
      return (lang === 'en') ? en : es;
    }
    return IDEE.language.getTranslation(lang).locatorscn;
  }

  /**
   * This function adds this plugin into the map
   *
   * @public
   * @function
   * @param {IDEE.Map} map the map to add the plugin
   * @api
   */
  addTo(map) {
    this.map = map;
    this.button = new IDEE.ui.buttons.SidePanelButton(this.name, {
      position: this.position,
      tooltip: this.tooltip,
      svgPath: this.svgPath,
      order: this.order,
    });
    map.addButtons(this.button);

    this.panel = new IDEE.ui.panels.PluginSidePanel(this.name, {
      collapsed: this.collapsed,
      position: this.position,
      minWidth: this.minPanelWidth,
      maxWidth: this.maxPanelWidth,
      className: 'm-plugin-locatorscn',
      tooltip: this.tooltip,
      collapsedButtonClass: 'locatorscn-icon-localizacion2',
      order: this.order,
    });

    this.controls.push(new LocatorscnControl(
      this.zoom,
      this.pointStyle,
      this.searchOptions,
      this.order,
      this.useProxy,
      this.statusProxy,
      this.position,
    ));

    this.panel.addControls(this.controls);

    this.button.panel = this.panel;
    this.panel.button = this.button;

    map.addPanels(this.panel);
  }

  /**
   * This function indicates the default values
   * for the control ignsearchlocatorscn
   *
   * @public
   * @function
   * @returns Default values
   * @api
   */
  getIGNSearchLocatorscn() {
    return {
      servicesToSearch: '',
      maxResults: 10,
      noProcess: '',
      countryCode: '',
      reverse: true,
      resultVisibility: true,
      urlCandidates: '',
      urlFind: '',
      urlReverse: '',
      urlPrefix: '',
      urlAssistant: '',
      urlDispatcher: '',
      searchPosition: '',
    };
  }

  /**
   * Gets the API REST Parameters of the plugin
   *
   * @function
   * @public
   * @api
   */
  getAPIRest() {
    return `${this.name}=${IDEE.utils.serializeUrlParams(this.options)}`;
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
   * This function destroys this plugin
   *
   * @public
   * @function
   * @api
   */
  destroy() {
    this.map.removeButton(this.button);
    this.map.removePanel(this.panel);
  }

  /**
   * This function compare if pluging recieved by param is instance of IDEE.plugin.Locatorscn
   *
   * @public
   * @function
   * @param {IDEE.plugin} plugin to comapre
   * @api
   */
  equals(plugin) {
    return plugin instanceof Locatorscn;
  }
}
