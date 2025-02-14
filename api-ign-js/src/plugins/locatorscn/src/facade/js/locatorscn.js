/**
 * @module M/plugin/Locatorscn
 */
import '../assets/css/locatorscn';
import LocatorscnControl from './locatorscncontrol';
import es from './i18n/es';
import en from './i18n/en';
import { getValue } from './i18n/language';

export default class Locatorscn extends M.Plugin {
  /**
   * @classdesc
   * Main facade plugin object. This class creates a plugin
   * object which has an implementation Object
   *
   * @constructor
   * @extends {M.Plugin}
   * @param {Object} impl implementation object
   * @api
   */
  constructor(options = {}) {
    super();
    /**
     * Facade of the map
     * @private
     * @type {M.Map}
     */
    this.map_ = null;

    /**
     * Array of controls
     * @private
     * @type {Array<M.Control>}
     */
    this.controls_ = [];

    /**
     * Plugin name
     * @public
     * @type {String}
     */
    this.name = 'locatorscn';

    /**
     * Plugin parameters
     * @public
     * @type {Object}
     */
    this.options = options;

    /**
     * Position of the plugin
     *
     * @private
     * @type {String} TL | TR | BL | BR | TC
     */
    this.position_ = options.position || 'TR';

    /**
     * Option to allow the plugin to be collapsed or not
     * @private
     * @type {Boolean}
     */
    this.collapsed = !M.utils.isUndefined(options.collapsed) ? options.collapsed : true;

    /**
     * Option to allow the plugin to be collapsible or not
     * @private
     * @type {Boolean}
     */
    this.collapsible = !M.utils.isUndefined(options.collapsible) ? options.collapsible : true;

    /**
     * Tooltip of plugin
     * @private
     * @type {String}
     */
    this.tooltip_ = options.tooltip || getValue('tooltip');

    /**
     * Tooltip of plugin
     * @private
     * @type {String}
     */
    this.searchOptions = options.searchOptions || {};

    /**
     * Option to allow the plugin to be draggable or not
     * @private
     * @type {Boolean}
     */
    this.isDraggable = !M.utils.isUndefined(options.isDraggable) ? options.isDraggable : false;

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
     * Indicates order to the plugin
     * @private
     * @type {Number}
     */
    this.order = options.order >= -1 ? options.order : null;

    /**
     * Indicates if you want to use proxy in requests
     * @private
     * @type {Boolean}
     */
    this.useProxy = M.utils.isUndefined(options.useProxy) ? true : options.useProxy;

    /**
     * Stores the proxy state at plugin load time
     * @private
     * @type {Boolean}
     */
    this.statusProxy = M.useproxy;
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
    return M.language.getTranslation(lang).locatorscn;
  }

  /**
   * This function adds this plugin into the map
   *
   * @public
   * @function
   * @param {M.Map} map the map to add the plugin
   * @api
   */
  addTo(map) {
    this.controls_.push(new LocatorscnControl(
      this.isDraggable,
      this.zoom,
      this.pointStyle,
      this.searchOptions,
      this.order,
      this.useProxy,
      this.statusProxy,
      this.position_,
    ));
    this.map_ = map;
    if (this.position_ === 'TC') {
      this.collapsible = false;
    }
    this.panel_ = new M.ui.Panel('panelLocatorscn', {
      collapsible: this.collapsible,
      collapsed: this.collapsed,
      position: M.ui.position[this.position_],
      className: 'm-plugin-locatorscn',
      tooltip: this.tooltip_,
      collapsedButtonClass: 'locatorscn-icon-localizacion2',
      order: this.order,
    });

    this.panel_.addControls(this.controls_);
    map.addPanels(this.panel_);
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
    return `${this.name}=${this.position_}*${this.collapsed}*${this.collapsible}*${this.tooltip_}*${this.zoom}*${this.pointStyle}
    *${this.isDraggable}*${this.searchOptions}*${this.useProxy}`;
  }

  /**
   * Gets the API REST Parameters in base64 of the plugin
   *
   * @function
   * @public
   * @api
   */
  getAPIRestBase64() {
    return `${this.name}=base64=${M.utils.encodeBase64(this.options)}`;
  }

  /**
   * This function destroys this plugin
   *
   * @public
   * @function
   * @api
   */
  destroy() {
    this.map_.removeControls(this.controls_);
    this.map_ = null;
    this.controls_ = null;
    this.panel_ = null;
    this.name = null;
  }

  /**
   * This function compare if pluging recieved by param is instance of M.plugin.Locatorscn
   *
   * @public
   * @function
   * @param {M.plugin} plugin to comapre
   * @api
   */
  equals(plugin) {
    return plugin instanceof Locatorscn;
  }
}
