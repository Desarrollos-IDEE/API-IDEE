/**
 * @module IDEE/plugin/ViewShed
 */
import 'assets/css/fonts';
import 'assets/css/viewshed';
import ViewShedControl from './viewshedcontrol';
import api from '../../api';
import { getValue } from './i18n/language';

import es from './i18n/es';
import en from './i18n/en';

export default class ViewShed extends IDEE.Plugin {
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
     * Position of the plugin
     *
     * @private
     * @type {string} - TL | TR | BL | BR
     */
    this.position_ = options.position || 'TL';

    /**
     * Option to allow the plugin to be collapsed or not
     * @private
     * @type {Boolean}
     */
    this.collapsed_ = options.collapsed;
    if (this.collapsed_ === undefined) this.collapsed_ = true;

    /**
     * Option to allow the plugin to be collapsible or not
     * @private
     * @type {Boolean}
     */
    this.collapsible_ = options.collapsible;
    if (this.collapsible_ === undefined) this.collapsible_ = true;

    /**
     * Geoprocess URL
     *
     * @private
     * @type {string}
     */
    this.url_ = options.url || 'https://componentes-desarrollo.idee.es/geoprocess-services';

    /**
     * Metadata from api.json
     * @private
     * @type {Object}
     */
    this.metadata_ = api.metadata;

    /**
     * Name of the plugin
     * @private
     * @type {String}
     */
    this.name_ = 'viewshed';
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
    return IDEE.language.getTranslation(lang).viewshed;
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
    this.controls_.push(new ViewShedControl({ url: this.url_ }));
    this.map_ = map;
    this.panel_ = new IDEE.ui.Panel('panelViewShed', {
      className: 'm-viewshed-container',
      collapsed: this.collapsed_,
      collapsible: this.collapsible_,
      position: IDEE.ui.position[this.position_],
      tooltip: getValue('tooltip'),
      collapsedButtonClass: 'icon-viewshed',
    });
    this.panel_.addControls(this.controls_);
    map.addPanels(this.panel_);

    const that = this;
    this.controls_[0].on(IDEE.evt.ADDED_TO_MAP, () => {
      that.fire(IDEE.evt.ADDED_TO_MAP);
    });
  }

  /**
   * @getter
   * @public
   */
  get name() {
    return 'viewshed';
  }

  /**
   * This function returns the position
   *
   * @public
   * @return {string}
   * @api
   */
  get position() {
    return this.position_;
  }

  /**
   * Get the API REST Parameters of the plugin
   *
   * @function
   * @public
   * @api
   */
  getAPIRest() {
    return `${this.name_}=${this.position_}`;
  }

  /**
   * This function compares plugins
   *
   * @public
   * @function
   * @param {IDEE.Plugin} plugin to compare
   * @api
   */
  equals(plugin) {
    return plugin instanceof ViewShed;
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
   * @api stable
   */
  destroy() {
    this.map_.removeControls(this.controls_);
    [this.map_, this.controls_, this.panel_] = [null, null, null];
  }
}
