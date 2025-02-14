/**
 * @module M/plugin/LyrCompare
 */
import 'assets/css/lyrcompare';
import LyrCompareControl from './lyrcomparecontrol';
import api from '../../api';
import {
  getValue,
} from './i18n/language';

import es from './i18n/es';
import en from './i18n/en';

export default class LyrCompare extends M.Plugin {
  /**
   * @classdesc
   * Main facade plugin object. This class creates a plugin
   * object which has an implementation Object
   *
   * @constructor
   * @extends {M.Plugin}
   * @param {Object} options plugin configuration options
   * @api stable
   */
  constructor(options = {}) {
    super();

    /**
     * Name plugin
     * @private
     * @type {String}
     */
    this.name_ = 'lyrcompare';

    /** Error control
     *@private
     *@type{boolean}
     */
    this.error_ = false;

    /**
     * Layer names that will have effects
     * @public
     * Value: the names separated with commas
     * @type {Array<String>}
     */
    this.layers = [];
    if (options.layers === undefined || options.layers.length < 2) {
      M.dialog.error(getValue('no_layers_plugin'), 'lyrcompare');
      this.error_ = true;
    } else if (Array.isArray(options.layers)) {
      this.layers = options.layers;
    } else {
      this.layers = options.layers.split(',');
    }

    /**
     * Array of controls
     * @private
     * @type {Array<M.Control>}
     */
    this.controls_ = [];

    /**
     * Facade of the map
     * @private
     * @type {M.Map}
     */
    this.map_ = null;

    if (this.error_ === false) {
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
       * staticDivision
       * Value: number in range 0 - 1
       * @type {number}
       * @public
       */
      this.staticDivision = options.staticDivision === undefined
        ? 1
        : parseInt(options.staticDivision, 10);

      /**
       * Opacity
       * Value: number in range 0 - 100
       * @type {number}
       * @public
       */
      if (options.opacityVal === undefined) {
        this.opacityVal = 100;
      } else {
        this.opacityVal = parseInt(options.opacityVal, 10);
        if (this.opacityVal <= 0) {
          this.opacityVal = 0;
        } else if (this.opacityVal >= 100) {
          this.opacityVal = 100;
        }
      }

      /**
       * Comparison Mode
       * Value: number in range 0 - 3
       * @type {number}
       * @public
       */
      if (options.comparisonMode === undefined) {
        this.comparisonMode = 0;
      } else {
        this.comparisonMode = parseInt(options.comparisonMode, 10);
        if (this.comparisonMode <= 0 || this.comparisonMode > 3) {
          this.comparisonMode = 0;
        }
      }

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
       * Default Layer A
       * @type {number}
       * @public
       */
      if (options.defaultLyrA === undefined) {
        this.defaultLyrA = 0;
      } else {
        this.defaultLyrA = parseInt(options.defaultLyrA, 10);
      }

      /**
       * Default Layer B
       * @type {number}
       * @public
       */
      if (options.defaultLyrB === undefined) {
        this.defaultLyrB = this.defaultLyrA !== 0 ? 0 : 1;
      } else {
        this.defaultLyrB = parseInt(options.defaultLyrB, 10);
      }
      if (this.defaultLyrA === this.defaultLyrB) {
        M.dialog.error(getValue('repeated_layers'), 'lyrcompare');
        this.error_ = true;
      }

      /**
       * Default Layer C
       * @type {number}
       * @public
       */
      if (options.defaultLyrC === undefined) {
        this.defaultLyrC = 2;
      } else {
        this.defaultLyrC = parseInt(options.defaultLyrC, 10);
      }
      if ((this.defaultLyrA === this.defaultLyrC) || (this.defaultLyrB === this.defaultLyrC)) {
        M.dialog.error(getValue('repeated_layers'), 'lyrcompare');
        this.error_ = true;
      }

      /**
       * Default Layer D
       * @type {number}
       * @public
       */
      if (options.defaultLyrD === undefined) {
        this.defaultLyrD = 3;
      } else {
        this.defaultLyrD = parseInt(options.defaultLyrD, 10);
      }
      if ((this.defaultLyrA === this.defaultLyrD)
        || (this.defaultLyrB === this.defaultLyrD)
        || (this.defaultLyrC === this.defaultLyrD)) {
        M.dialog.error(getValue('repeated_layers'), 'lyrcompare');
        this.error_ = true;
      }
    }
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
    return M.language.getTranslation(lang).lyrcompare;
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
    const values = {
      layers: this.layers,
      collapsible: this.collapsible,
      collapsed: this.collapsed,
      staticDivision: this.staticDivision,
      opacityVal: this.opacityVal,
      comparisonMode: this.comparisonMode,
      defaultLyrA: this.defaultLyrA,
      defaultLyrB: this.defaultLyrB,
      defaultLyrC: this.defaultLyrC,
      defaultLyrD: this.defaultLyrD,
    };
    this.control_ = new LyrCompareControl(values);
    this.controls_.push(this.control_);
    if (this.error_) {
      const plugin = map.getPlugins('lyrcompare');
      if (plugin.length !== 0) map.removePlugins(map.getPlugins('lyrcompare'));
    } else {
      this.panel_ = new M.ui.Panel('panelLyrcompare', {
        collapsible: this.collapsible,
        collapsed: this.collapsed,
        position: M.ui.position[this.position],
        className: 'm-plugin-lyrcompare',
        collapsedButtonClass: 'lyrcompare-icon',
        tooltip: this.tooltip_,
      });
      this.panel_.addControls(this.controls_);
      map.addPanels(this.panel_);
    }
  }

  /**
   * This function destroys this plugin
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {
    this.deactivate();
    const swipeControl = document.querySelector('.lyrcompare-swipe-control');
    if (swipeControl) {
      swipeControl.remove();
    }
    this.map_.removeControls([this.control_]);
    this.control_.removeCurtainLayers(this.control_.getLayersNames());
    [this.name_, this.error_, this.layers, this.controls_, this.map_, this.position,
      this.collapsed, this.collapsible, this.staticDivision, this.opacityVal,
      this.comparisonMode, this.metadata_, this.tooltip_, this.defaultLyrA,
      this.defaultLyrB, this.defaultLyrC, this.defaultLyrD,
    ] = [null, null, null, null, null, null, null, null, null,
      null, null, null, null, null, null, null, null, null];
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
    return `${this.name}=${this.position}*!${this.layers.join(',')}*!${this.collapsible}*!${this.collapsed}*!${this.staticDivision}*!${this.opacityVal}*!${this.comparisonMode}*!${this.defaultLyrA}*!${this.defaultLyrB}*!${this.defaultLyrC}*!${this.defaultLyrD}`;
  }

  /**
   * Activate plugin
   *
   * @function
   * @public
   * @api
   */
  activate() {
    this.control_.activateCurtain();
  }

  /**
   * Desactivate plugin
   *
   * @function
   * @public
   * @api
   */
  deactivate() {
    this.control_.deactivateCurtain();
  }

  /**
   * This
   function compare
   *
   * @public
   * @function
   * @param {M.plugin} plugin to compare
   * @api stable
   */
  equals(plugin) {
    if (plugin instanceof LyrCompare) {
      return true;
    }
    return false;
  }
}
