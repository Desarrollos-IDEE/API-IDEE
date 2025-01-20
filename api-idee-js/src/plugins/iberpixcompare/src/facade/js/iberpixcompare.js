/**
 * @module M/plugin/IberpixCompare
 */

import 'assets/css/iberpixcompare';
import IberpixCompareControl from './iberpixcomparecontrol';
import api from '../../api';
import { getValue } from './i18n/language';

import es from './i18n/es';
import en from './i18n/en';

export default class IberpixCompare extends M.Plugin {
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
  constructor(options = {}) {
    super();

    /**
     * Name plugin
     * @private
     * @type {String}
     */
    this.name_ = 'iberpixcompare';

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
     * Class name of the html view Plugin
     * @public
     * @type {string}
     */
    this.className = 'm-plugin-iberpixcompare';

    /**
     * Position of the Plugin
     * @public
     * Posible values: TR | TL | BL | BR
     * @type {String}
     */
    const positions = ['TR', 'TL', 'BL', 'BR'];
    this.position = positions.includes(options.position) ? options.position : 'TR';

    /**
     * Collapsed attribute
     * @public
     * @type {boolean}
     */
    this.collapsed = options.collapsed;
    if (this.collapsed === undefined) this.collapsed = true;

    /**
     * Collapsible attribute
     * @public
     * @type {boolean}
     */
    this.collapsible = options.collapsible;
    if (this.collapsible === undefined) this.collapsible = true;

    /**
     * Vertical attribute
     * @public
     * Changes the plugin's orientation
     * @type {boolean}
     */
    this.vertical = options.vertical;
    if (this.vertical === undefined) this.vertical = true;

    /**
     * mirrorpanelParams
     * @public
     * Value: Object with the rest of mirrorpanel's parameters
     * @type {Object}
     */
    this.mirrorpanelParams = options.mirrorpanelParams || {};

    /**
     * lyrcompareParams
     * @public
     * Value: Object with the rest of lyrcompare's parameters
     * @type {Object}
     */
    this.lyrcompareParams = options.lyrcompareParams || {};

    /**
     * backImgLayersConfig
     * @public
     * Value: Object with configuration of BackImgLayers plugin
     * @type {Object}
     */
    this.backImgLayersConfig = options.backImgLayersConfig || {};

    /**
     * fullTOCConfig
     * @public
     * Value: Object with configuration of FullTOC plugin
     * @type {Object}
     */
    this.fullTOCConfig = options.fullTOCConfig || {};

    /**
     * vectorsConfig
     * @public
     * Value: Object with configuration of Vectors plugin
     * @type {Object}
     */
    this.vectorsConfig = options.vectorsConfig || {};

    /**
     * Metadata from api.json
     * @private
     * @type {Object}
     */
    this.metadata_ = api.metadata;

    /**
     *@private
     *@type { string }
     */
    this.tooltip_ = options.tooltip || getValue('tooltip');

    /**
     *@private
     *@type { Number }
     */
    this.order = options.order >= -1 ? options.order : null;
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
    return M.language.getTranslation(lang).iberpixcompare;
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
    this.control_ = new IberpixCompareControl({
      mirrorpanelParams: this.mirrorpanelParams,
      lyrcompareParams: this.lyrcompareParams,
      backImgLayersConfig: this.backImgLayersConfig,
      fullTOCConfig: this.fullTOCConfig,
      vectorsConfig: this.vectorsConfig,
      position: this.position,
      order: this.order,
    });

    this.controls_.push(this.control_);
    this.panel_ = new M.ui.Panel('panelIberpixCompare', {
      collapsible: this.collapsible,
      collapsed: this.collapsed,
      position: M.ui.position[this.position],
      className: this.className,
      collapsedButtonClass: 'cp-icon',
      tooltip: this.tooltip_,
      order: this.order,
    });

    this.panel_.addControls(this.controls_);
    map.addPanels(this.panel_);
    // eslint-disable-next-line no-underscore-dangle
    this.panel_._element.classList.add(this.vertical ? 'orientation-vertical' : 'orientation-horizontal');
  }

  /**
   * This function destroys this plugin
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {
    this.control_.deactivate();
    this.map_.removeControls([this.control_]);
    [this.control_, this.panel_, this.map_,
      this.vertical, this.mirrorpanelParams, this.lyrcompareParams] = [
      null, null, null, null, null, null,
    ];
  }

  /**
   * This function gets name plugin
   * @getter
   * @public
   * @returns {string}
   * @api stable
   */
  get name() {
    return this.name_;
  }

  /**
   * This function gets metadata plugin
   *
   * @public
   * @getter
   * @api stable
   * @return {Object}
   */
  getMetadata() {
    return this.metadata_;
  }

  /**
   * Get the API REST Parameters of the plugin
   *
   * @function
   * @public
   * @api
   */
  getAPIRest() {
    return `${this.name}=${this.position}*!${this.vertical}`;
  }

  /**
   * Activate plugin
   *
   * @function
   * @public
   * @api
   */
  activate() {
    this.control_.activate();
  }

  /**
   * Desactivate plugin
   *
   * @function
   * @public
   * @api
   */
  deactivate() {
    this.control_.deactivate();
  }

  /**
   * This function compare if pluging recieved
   * by param is instance of M.plugin.IberpixCompare
   * @public
   * @function
   * @param {M.plugin} plugin to compare
   * @api stable
   */
  equals(plugin) {
    return plugin instanceof IberpixCompare;
  }
}
