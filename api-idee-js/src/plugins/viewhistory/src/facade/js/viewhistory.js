/**
 * @module IDEE/plugin/ViewHistory
 */
import 'assets/css/viewhistory';
import ViewHistoryControl from './viewhistorycontrol';
import api from '../../api';

import es from './i18n/es';
import en from './i18n/en';

export default class ViewHistory extends IDEE.Plugin {
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
  constructor(options = {}) {
    super();
    /**
     * Array of controls
     * @private
     * @type {Array<IDEE.Control>}
     */
    this.controls_ = [];

    /**
     * Position of the plugin on browser window
     * @private
     * @type {String}
     * Possible values: 'TL', 'TR', 'BR', 'BL'
     */
    this.position = options.position || 'TL';

    /**
     * Name of the plugin
     * @private
     * @type {String}
     */
    this.name = 'viewhistory';

    /**
     * Metadata from api.json
     * @private
     * @type {Object}
     */
    this.metadata_ = api.metadata;
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
    return IDEE.language.getTranslation(lang).viewhistory;
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
    this.facadeMap_ = map;
    this.control_ = new ViewHistoryControl();
    this.controls_.push(this.control_);
    this.panel_ = new IDEE.ui.Panel('panelViewHistory', {
      collapsible: false,
      position: IDEE.ui.position[this.position],
      className: 'viewhistory-plugin',
    });
    this.panel_.addControls(this.controls_);
    map.addPanels(this.panel_);
  }

  /**
   * Get the API REST Parameters of the plugin
   *
   * @function
   * @public
   * @api
   */
  getAPIRest() {
    return `${this.name}=${this.position}`;
  }

  /**
   * This function gets metadata plugin
   *
   * @public
   * @function
   * @api stable
   */
  getMetadata() {
    return this.metadata_;
  }

  /**
   * This function destroys this plugin
   *
   * @public
   * @function
   * @api
   */
  destroy() {
    this.facadeMap_.removeControls([this.control_]);
    [this.facadeMap_, this.control_, this.panel_] = [null, null, null];
  }
}
