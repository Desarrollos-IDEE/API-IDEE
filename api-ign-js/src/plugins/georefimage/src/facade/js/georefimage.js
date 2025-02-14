/**
 * @module M/plugin/Georefimage
 */
import '../assets/css/georefimage';
import GeorefimageControl from './georefimagecontrol';
import { getValue } from './i18n/language';

import es from './i18n/es';
import en from './i18n/en';

export default class Georefimage extends M.Plugin {
  /**
   * @classdesc
   * Main facade plugin object. This class creates a plugin
   * object which has an implementation Object
   *
   * @constructor
   * @extends {M.Plugin}
   * @param {Object} impl implementation object
   * @api stable
   */
  constructor(parameters = {}) {
    super(null);
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
     * Control that executes the searches
     * @private
     * @type {Object}
     */
    this.control_ = null;

    /**
     * Panel of this plugin
     * @private
     * @type {M.ui.Panel}
     */
    this.panel_ = null;

    /**
     * Name of this control
     * @public
     * @type {string}
     * @api stable
     */
    this.name = Georefimage.NAME;

    /**
     * Position of the plugin
     * @private
     * @type {String}
     */
    this.position_ = parameters.position || 'TR';

    /**
     * Option to allow the plugin to be collapsed or not
     * @private
     * @type {Boolean}
     */
    this.collapsed_ = parameters.collapsed;
    if (this.collapsed_ === undefined) this.collapsed_ = true;

    /**
     * Option to allow the plugin to be collapsible or not
     * @private
     * @type {Boolean}
     */
    this.collapsible_ = parameters.collapsible;
    if (this.collapsible_ === undefined) this.collapsible_ = true;

    /**
      @private *
      @type { string }
      * @type { string }
      */
    this.tooltip_ = parameters.tooltip || getValue('tooltip');

    /**
     * Mapfish server url
     * @private
     * @type {String}
     */
    this.serverUrl_ = parameters.serverUrl || 'https://componentes.cnig.es/geoprint';
    /**
     * Mapfish template url
     * @private
     * @type {String}
     */
    this.printTemplateUrl_ = parameters.printTemplateUrl || 'https://componentes.cnig.es/geoprint/print/mapexport';
    /**
     * Mapfish template url
     * @private
     * @type {String}
     */
    this.printStatusUrl_ = parameters.printStatusUrl || 'https://componentes.cnig.es/geoprint/print/status';
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
    if (lang === 'en' || lang === 'es') {
      return (lang === 'en') ? en : es;
    }
    return M.language.getTranslation(lang).georefimage;
  }

  /**
   * This function adds this plugin into the map
   *
   * @public
   * @function
   * @param {M.Map} map the map to add the plugin
   * @api stable
   */
  addTo(map) {
    this.map_ = map;
    this.control_ = new GeorefimageControl(
      this.serverUrl_,
      this.printTemplateUrl_,
      this.printStatusUrl_,
    );
    this.controls_.push(this.control_);
    this.panel_ = new M.ui.Panel('georefimage', {
      collapsed: this.collapsed_,
      collapsible: this.collapsible_,
      className: 'm-georefimage',
      collapsedButtonClass: 'icon-descargar',
      position: M.ui.position[this.position_],
      tooltip: this.tooltip_,
    });
    this.panel_.on(M.evt.ADDED_TO_MAP, (html) => {
      M.utils.enableTouchScroll(html);
    });
    this.panel_.addControls(this.controls_);
    map.addPanels(this.panel_);
    this.control_.on(M.evt.ADDED_TO_MAP, () => {
      this.fire(M.evt.ADDED_TO_MAP);
    });
  }

  /**
   * Get the API REST Parameters of the plugin
   *
   * @function
   * @public
   * @api
   */
  getAPIRest() {
    return `${this.name}=${this.position_}*${this.collapsed_}*${this.collapsible_}*${this.serverUrl_}*${this.printTemplateUrl_}*${this.printStatusUrl_}`;
  }

  /**
   * This function return the control of plugin
   *
   * @public
   * @function
   * @api stable
   */
  getControls() {
    return this.controls_;
  }

  /**
   * This function destroys this plugin
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {
    this.map_.removeControls(this.controls_);
    this.map_ = null;
    this.control_ = null;
    this.controls_ = null;
    this.panel_ = null;
    this.name = null;
  }

  /**
   * This function compare if pluging recieved by param is instance of   M.plugin.Georefimage
   *
   * @public
   * @function
   * @param {M.plugin} plugin to comapre
   * @api stable
   */
  equals(plugin) {
    if (plugin instanceof Georefimage) {
      return true;
    }
    return false;
  }
}

/**
 * Name to identify this plugin
 * @const
 * @type {string}
 * @public
 * @api stable
 */
Georefimage.NAME = 'georefimage';
