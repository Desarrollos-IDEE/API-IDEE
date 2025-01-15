/**
 * @module M/plugin/XYLocator
 */
import '../assets/css/xylocator';
import XYLocatorControl from './xylocatorcontrol';
import { getValue } from './i18n/language';

import es from './i18n/es';
import en from './i18n/en';

/**
 * @classdesc
 * Main facade plugin object. This class creates a plugin
 * object which has an implementation Object
 */
export default class XYLocator extends M.Plugin {
  /**
   * @constructor
   * @extends {M.Plugin}
   * @param {Object} impl implementation object
   * @api stable
   */
  constructor(options) {
    super();

    /**
     * Controls of the plugin
     *
     * @private
     * @type {array<M.Control>}
     */
    this.controls_ = [];

    /**
     * Projections options
     *
     * @private
     * @type {Array<object>} - {code: ..., title: ..., units: m | d}
     */
    this.projections_ = options.projections;

    /**
     * Position of the plugin
     *
     * @private
     * @type {string} - TL | TR | BL | BR
     */
    this.position_ = options.position || 'TL';

    if (this.position_ === 'TL' || this.position_ === 'BL') {
      this.positionClass_ = 'left';
    }

    /**
     * Zoom to do
     *
     * @private
     * @type {string / number}
     */
    this.zoom_ = 16;
    if (options.zoom !== undefined) {
      this.zoom_ = parseInt(options.zoom, 10);
    }

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
    return M.language.getTranslation(lang).xylocator;
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
    this.facadeMap_ = map;
    this.control_ = new XYLocatorControl({ projections: this.projections_, zoom: this.zoom_ });
    this.panel_ = new M.ui.Panel('M.plugin.XYLocator.NAME', {
      collapsible: true,
      className: `m-xylocator ${this.positionClass_}`,
      collapsedButtonClass: 'g-cartografia-posicion3',
      position: M.ui.position[this.position_],
      tooltip: this.tooltip_,
    });

    this.controls_.push(this.control_);
    this.controls_[0].on('xylocator:locationCentered', (data) => {
      this.fire('xylocator:locationCentered', data);
    });

    this.panel_.addControls(this.controls_);
    map.addPanels(this.panel_);
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

  /**
   * Name of the plugin
   *
   * @public
   * @function
   * @api
   */
  get name() {
    return 'xylocator';
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
    return `${this.name}=${this.position}`;
  }
}
