/**
 * @module M/plugin/Mirrorpanel
 */
import 'assets/css/mirrorpanel';
import MirrorpanelControl from './mirrorpanelcontrol';
import api from '../../api';
import { getValue } from './i18n/language';

import es from './i18n/es';
import en from './i18n/en';

export default class Mirrorpanel extends M.Plugin {
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
    this.name_ = 'mirrorpanel';

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
    this.className = 'm-plugin-mirrorpanel';

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
     * Modo de visualización
     * Value: number in range 0 - 9
     * @type {number}
     * @public
     */
    this.modeViz = options.modeViz;
    if (this.modeViz === undefined) this.modeViz = 0;

    /**
     * Mirror maps with plugins
     * @type {boolean}
     * @public
     */
    this.enabledPlugins = options.enabledPlugins;
    if (this.enabledPlugins === undefined) this.enabledPlugins = true;

    /**
     * Enabled key functions
     * @type {boolean}
     * @public
     */
    this.enabledKeyFunctions = options.enabledKeyFunctions;
    if (this.enabledKeyFunctions === undefined) this.enabledKeyFunctions = true;

    /**
     * Enabled synchro cursors
     * @type {boolean}
     * @public
     */
    this.showCursors = options.showCursors;
    if (this.showCursors === undefined) this.showCursors = true;

    /**
     * Layer names that will have effects
     * @public
     * Value: the names separated with coma
     * @type {string}
     */

    this.mirrorLayers = [];
    if (options.mirrorLayers !== undefined) {
      if (Array.isArray(options.mirrorLayers)) {
        this.mirrorLayers = options.mirrorLayers;
      } else {
        this.mirrorLayers = options.mirrorLayers.split(',');
      }
    }

    /**
     * Layer base for the three mirror maps
     * @public
     * Value: the names separated with coma
     * @type {string}
     */

    this.defaultBaseLyrs = [];
    if (options.defaultBaseLyrs !== undefined) {
      if (Array.isArray(options.defaultBaseLyrs)) {
        this.defaultBaseLyrs = options.defaultBaseLyrs;
      } else {
        this.defaultBaseLyrs = options.defaultBaseLyrs.split(',');
      }
    }

    /**
     * BackImgLayers' Parameters
     * @public
     * Value: object with backimglayers' parameters
     * @type {Object}
     */
    this.backImgLayersParams = options.backImgLayersParams;
    if (options.backImgLayersParams !== undefined) {
      if (M.utils.isObject(options.backImgLayersParams)) {
        const bIL = new M.plugin.BackImgLayer(options.backImgLayersParams);
        this.backImgLayersParams = bIL.getAPIRest().replace('backimglayer=', '').replace(/\*!/g, '!!');
      }
    }

    /**
     * Show interface
     *@public
     *@type{boolean}
     */
    this.interface = options.interface === undefined ? true : options.interface;

    /**
     *@private
     *@type { string }
     */
    this.tooltip_ = options.tooltip || getValue('tooltip');

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
    return M.language.getTranslation(lang).mirrorpanel;
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
    const pluginOnLeft = !!(['TL', 'BL'].includes(this.position));

    const values = {
      pluginOnLeft,
      collapsible: this.collapsible,
      collapsed: this.collapsed,
      modeViz: this.modeViz,
      enabledPlugins: this.enabledPlugins,
      showCursors: this.showCursors,
      mirrorLayers: this.mirrorLayers,
      defaultBaseLyrs: this.defaultBaseLyrs,
      backImgLayersParams: this.backImgLayersParams,
    };

    this.control_ = new MirrorpanelControl(values);
    this.controls_.push(this.control_);
    this.map_ = map;

    this.panel_ = new M.ui.Panel('panelMirrorpanel', {
      collapsible: this.collapsible,
      collapsed: this.collapsed,
      position: M.ui.position[this.position],
      modeViz: this.modeViz,
      enabledPlugins: this.enabledPlugins,
      showCursors: this.showCursors,
      className: this.interface ? 'm-plugin-panelMirrorpanel' : 'm-plugin-panelMirrorpanel hidden',
      collapsedButtonClass: 'mirrorpanel-icon',
      tooltip: this.tooltip_,
    });
    this.panel_.addControls(this.controls_);
    map.addPanels(this.panel_);

    // Check if backimglayer is main map and backImgLayersParams is defined. If not, throw a error.
    if (this.map_.getControls('BackImgLayer').length > 0 && this.backImgLayersParams === undefined) {
      M.dialog.error(getValue('backimglayersparams_undefined'));
    }
    // Keybindings for Ctrl + Shift + (F1-F8) / ESC
    document.addEventListener('keydown', (zEvent) => {
      if (!this.enabledKeyFunctions) {
        return;
      }
      for (let i = 0; i < 10; i += 1) {
        if (zEvent.ctrlKey && zEvent.shiftKey && zEvent.key === `F${i + 1}`) { // case sensitive
          this.control_.manageVisionPanelByCSSGrid(i);
        }
      }
      const keyStr = ['Control', 'Shift', 'Alt', 'Meta'].includes(zEvent.key) ? '' : zEvent.key;

      const combinedKeys = (zEvent.ctrlKey ? 'Control ' : '')
        + (zEvent.shiftKey ? 'Shift ' : '')
        + (zEvent.altKey ? 'Alt ' : '')
        + (zEvent.metaKey ? 'Meta ' : '') + keyStr;
      if (combinedKeys === 'Escape') {
        this.control_.manageVisionPanelByCSSGrid(0);
      }
    });
  }

  /**
   * This function destroys this plugin
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {
    document.removeEventListener('keydown', (zEvent) => { });
    this.control_.removeMaps();
    this.control_.destroyMapsContainer();
    this.map_.removeControls([this.control_]);
    [this.control_, this.panel_, this.map_, this.collapsible, this.collapsed, this.modeViz,
      this.enabledPlugins, this.enabledKeyFunctions, this.showCursors, this.mirrorLayers,
      this.defaultBaseLyrs, this.backImgLayersParams, this.interface] = [
      null, null, null, null, null, null, null, null, null, null, null, null, null,
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
   * @function
   * @api stable
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
    return `${this.name}=${this.position}*!${this.collapsed}*!${this.collapsible}*!${this.modeViz}*!${this.enabledPlugins}*!${this.enabledKeyFunctions}*!${this.showCursors}*!${this.mirrorLayers}*!${this.defaultBaseLyrs}*!${this.backImgLayersParams}*!${this.interface}`;
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
}
