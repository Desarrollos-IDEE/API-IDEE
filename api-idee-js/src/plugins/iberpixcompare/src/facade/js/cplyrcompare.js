/**
 * @module M/plugin/LyrCompare
 */
import 'assets/css/cplyrcompare';
import LyrCompareControl from './cplyrcomparecontrol';
import api from '../../api';
import { getValue } from './i18n/language';

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

    /**
     * Position of the Plugin
     * @public
     * @type {String}
     */
    this.position = options.position;

    /**
     * Collapsed attribute
     * @public
     * @type {boolean}
     */
    this.collapsed = true;

    /**
     * Collapsible attribute
     * @public
     * @type {boolean}
     */
    this.collapsible = true;

    /**
     * staticDivision
     * Value: number in range 0 - 1
     * @type {number}
     * @public
     */
    this.staticDivision = 1;

    /**
     * Opacity
     * Value: number in range 0 - 100
     * @type {number}
     * @public
     */
    this.opacityVal = 100;

    /**
     * Comparison Mode
     * Value: number in range 0 - 3
     * @type {number}
     * @public
     */
    this.comparisonMode = 0;

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

    /** Show interface
     *@public
     *@type{boolean}
     */
    this.interface = options.interface === undefined ? true : options.interface;

    /**
     * Default Layer A
     * @type {number}
     * @public
     */
    this.defaultLyrA = 0;

    /**
     * Default Layer B
     * @type {number}
     * @public
     */
    this.defaultLyrB = this.defaultLyrA !== 0 ? 0 : 1;

    /**
     * Default Layer C
     * @type {number}
     * @public
     */
    this.defaultLyrC = 2;

    /**
     * Default Layer D
     * @type {number}
     * @public
     */
    this.defaultLyrD = 3;

    this.order = options.order;
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
      collapsible: this.collapsible,
      collapsed: this.collapsed,
      staticDivision: this.staticDivision,
      opacityVal: this.opacityVal,
      comparisonMode: this.comparisonMode,
      defaultLyrA: this.defaultLyrA,
      defaultLyrB: this.defaultLyrB,
      defaultLyrC: this.defaultLyrC,
      defaultLyrD: this.defaultLyrD,
      interface: this.interface,
      order: this.order,
    };

    this.control_ = new LyrCompareControl(values);
    this.controls_.push(this.control_);
    if (this.interface) {
      this.panel_ = new M.ui.Panel('panelLyrcompare', {
        collapsible: this.collapsible,
        collapsed: this.collapsed,
        position: M.ui.position[this.position],
        className: 'm-plugin-lyrcompare',
        collapsedButtonClass: 'cp-icon',
        tooltip: this.tooltip_,
      });
    } else {
      this.panel_ = new M.ui.Panel('panelLyrcompare', {
        collapsible: false,
        collapsed: true,
        position: M.ui.position[this.position],
        className: 'm-plugin-lyrcompare-hidden',
      });
    }

    this.panel_.addControls(this.controls_);
    map.addPanels(this.panel_);
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
    [this.name_, this.controls_, this.map_, this.position, this.collapsed, this.collapsible,
      this.staticDivision, this.opacityVal, this.comparisonMode,
      this.metadata_, this.tooltip_, this.interface, this.defaultLyrA,
      this.defaultLyrB, this.defaultLyrC, this.defaultLyrD,
    ] = [null, null, null, null, null, null, null, null,
      null, null, null, null, null, null, null, null];
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
    return plugin instanceof LyrCompare;
  }
}
