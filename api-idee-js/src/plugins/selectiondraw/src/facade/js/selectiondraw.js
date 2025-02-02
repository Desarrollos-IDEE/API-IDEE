/**
 * @module IDEE/plugin/SelectionDraw
 */
import 'assets/css/selectiondraw';
import SelectionDrawControl from './selectiondrawcontrol';

import es from './i18n/es';
import en from './i18n/en';
import { getValue } from './i18n/language';

export default class SelectionDraw extends IDEE.Plugin {
  /**
   * @classdesc
   * Main facade plugin object. This class creates a plugin
   * object which has an implementation Object
   *
   * @constructor
   * @extends {IDEE.Plugin}
   * @param {Object} impl implementation object
   * @api stable
   */
  constructor(opts = {}) {
    super();

    const options = {
      collapsed: false,
      collapsible: true,
      position: 'TL',
      projection: 'EPSG:3857',
      ...opts,

    };

    /**
     * Facade of the map
     * @private
     * @type {IDEE.Map}
     */
    this.map_ = null;

    /**
     * Array of controls
     * @private
     * @type {Array<IDEE.Control>}
     */
    this.controls_ = [];

    /**
     * Collapsed attribute
     * @public
     * @type {boolean}
     */
    this.collapsed = options.collapsed || false;

    /**
     * Collapsible attribute
     * @public
     * @type {boolean}
     */
    this.collapsible = options.collapsible || true;

    /**
     * Position of plugin
     * @public
     * @type
     */
    this.position = options.position || 'TL';

    /**
     * Name of this control
     * @public
     * @type {string}
     * @api stable
     */
    this.name = SelectionDraw.NAME;

    this.options = options;
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
    return IDEE.language.getTranslation(lang).selectiondraw;
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
    this.control_ = new SelectionDrawControl(this.options);
    this.map_ = map;
    this.panel_ = new IDEE.ui.Panel('panel_selection_raw', {
      collapsible: this.collapsible,
      collapsed: this.collapsed,
      position: IDEE.ui.position[this.position],
      collapsedButtonClass: 'g-plugin-selectordraw-editar',
      className: 'm-selectiondraw',
      tooltip: getValue('tooltip'),
    });
    this.panel_.addControls(this.control_);
    map.addPanels(this.panel_);
    this.control_.on('finished:draw', (geometry) => {
      this.fire('finished:draw', [geometry]);
    });
  }

  /**
   * This function destroys this plugin
   *
   * @public
   * @function
   * @api
   */
  destroy() {
    this.map_.removeControls([this.control_]);
    this.map_ = null;
    this.control_ = null;
    this.panel_ = null;
  }

  /**
   * Get the API REST Parameters of the plugin
   *
   * @function
   * @public
   * @api
   */
  getAPIRest() {
    return `${this.name}=${this.position}*${this.collapsed}*${this.collapsible}`;
  }
}

/**
 * Name to identify this plugin
 * @const
 * @type {string}
 * @public
 * @api stable
 */
SelectionDraw.NAME = 'selectiondraw';
