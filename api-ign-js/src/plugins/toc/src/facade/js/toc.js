/**
 * @module M/plugin/TOC
 */
import '../assets/css/toc';
import '../assets/css/fonts';
import TOCControl from './toc_control';
import { getValue } from './i18n/language';

import es from './i18n/es';
import en from './i18n/en';

export default class TOC extends M.Plugin {
  /**
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
     * Position of the plugin
     * @private
     * @type {string}
     */
    this.position_ = options.position || 'TR';

    /**
     * This parameter set if the plugin is collapsed
     * @private
     * @type {boolean}
     */
    this.collapsed_ = options.collapsed === true;

    /**
     * This parameter set if the plugin is collapsible
     * @private
     * @type {boolean}
     */
    this.collapsible_ = options.collapsible === true;

    /**
     * Plugin tooltip
     *
     * @private
     * @type {string}
     */
    this.tooltip_ = options.tooltip || getValue('tooltip');
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
    return M.language.getTranslation(lang).toc;
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
    this.control = new TOCControl();
    this.map_ = map;
    this.panel_ = new M.ui.Panel('panelTOC', {
      collapsible: this.collapsible_,
      position: M.ui.position[this.position_],
      collapsedButtonClass: 'g-plugin-toc-capas2',
      className: 'm-plugin-toc',
      tooltip: this.tooltip_,
      collapsed: this.collapsed_,
    });
    this.panel_.addControls([this.control]);
    map.addPanels(this.panel_);

    map.on(M.evt.ADDED_LAYER, () => {
      this.control.render();
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
    this.map_.removeControls(this.control);
    [this.map_, this.control, this.panel_] = [null, null, null];
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
   * Name of the plugin
   *
   * @getter
   * @function
   */
  get name() {
    return 'toc';
  }

  /**
   * Collapsed parameter
   *
   * @getter
   * @function
   */
  get collapsed() {
    return this.panel_.isCollapsed();
  }

  /**
   * Collapsed parameter
   *
   * @getter
   * @function
   */
  get collapsible() {
    return this.collapsible_;
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
