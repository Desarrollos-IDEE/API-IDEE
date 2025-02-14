/**
 * @module M/plugin/Comparepanel
 */

import 'assets/css/comparepanel';
import ComparepanelControl from './comparepanelcontrol';
import api from '../../api';
import { getValue } from './i18n/language';

import es from './i18n/es';
import en from './i18n/en';

export default class Comparepanel extends M.Plugin {
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
    this.name_ = 'comparepanel';

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
    this.className = 'm-plugin-comparepanel';

    /**
     * Position of the Plugin
     * @public
     * Posible values: TR | TL | BL | BR
     * @type {String}
     */
    const positions = ['TR', 'TL', 'BL', 'BR'];

    this.COMP_PLUGIN_NAMES = {
      'none': 'default',
      'mirror': 'mirrorpanel',
      'curtain': 'lyrcompare',
      'timeline': 'timeline',
      'spyeye': 'transparency',
    };

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
     * Base Layers
     * @public
     * Value: Array of layers with the layout [{name, tag, service},{...}]
     * @type {Array}
     */
    if (options !== undefined) {
      if (M.utils.isString(options.baseLayers)) {
        this.baseLayers = JSON.parse(options.baseLayers.replace(/!!/g, '[').replace(/¡¡/g, ']'));
      } else if (M.utils.isArray(options.baseLayers)) {
        this.baseLayers = options.baseLayers;
      } else {
        M.dialog.error(getValue('baseLayers_error'));
      }
    }

    /**
     * defaultCompareMode of the Plugin
     * @public
     * Posible values: mirror | curtain | spyeye | timeline
     * @type {String}
     */
    const defaultCompareModes = ['mirror', 'curtain', 'spyeye', 'timeline', 'none'];
    this.defaultCompareMode = defaultCompareModes.includes(options.defaultCompareMode) ? options.defaultCompareMode : 'mirror';

    /**
     * defaultCompareViz
     * @public
     * Value: Object with the rest of mirrorpanel's parameters
     * @type {Object}
     */
    this.defaultCompareViz = options.defaultCompareViz || 0;

    /**
     * The name of the vector layer hat contains the attribution information.
     *
     * @private
     * @type {string}
     */
    this.layerName_ = options.layerName || 'attributions';

    /**
      * Layer with attributions
      *
      * @private
      * @type {M.layer.GeoJSON | M.layer.KML}
      */
    this.layerCobertura_ = options.layerCobertura;

    /**
     * Parameter of the features of the layer that contains the information of the URL.
     * @private
     * @type {URLLike}
     */
    this.urlCoberturas_ = options.urlcoberturas || '';

    /**
     * Nivel mínimo en el que empiezan a cargarse las capas
     * Value: number in range 10 - 1000
     * @type {number}
     * @public
     */
    this.lyrsMirrorMinZindex = options.lyrsMirrorMinZindex;
    if (this.lyrsMirrorMinZindex === undefined) this.lyrsMirrorMinZindex = 100;

    /**
     * mirrorpanelParams
     * @public
     * Value: Object with the rest of mirrorpanel's parameters
     * @type {Object}
     */
    this.mirrorpanelParams = options.mirrorpanelParams || {};

    /**
     * timelineParams
     * @public
     * Value: Object with the rest of timeline's parameters
     * @type {Object}
     */
    this.timelineParams = options.timelineParams || {};

    /**
     * lyrcompareParams
     * @public
     * Value: Object with the rest of lyrcompare's parameters
     * @type {Object}
     */
    this.lyrcompareParams = options.lyrcompareParams || {};

    /**
     * transparencyParams
     * @public
     * Value: Object with the rest of transparency's parameters
     * @type {Object}
     */
    this.transparencyParams = options.transparencyParams || {};

    /**
     * backImgLayersConfig
     * @public
     * Value: Object with configuration of BackImgLayers plugin
     * @type {Object}
     */
    this.backImgLayersConfig = options.backImgLayersConfig || {};

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
    return M.language.getTranslation(lang).comparepanel;
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
    // e2m: ponemos el arraque del visualizador mirror a cero por defecto
    this.mirrorpanelParams.modeViz = this.mirrorpanelParams.modeViz || {};
    this.mirrorpanelParams.modeViz = (this.defaultCompareMode === 'mirror' ? this.defaultCompareViz : 0);

    if (this.defaultCompareMode === 'none') {
      this.defaultCompareMode = 'mirror';
      this.defaultCompareViz = 0;
    }

    // e2m: ponemos el arraqnue del visualizador mirror a cero por defecto
    this.lyrcompareParams.comparisonMode = this.lyrcompareParams.comparisonMode || {};
    this.lyrcompareParams.comparisonMode = (this.defaultCompareMode === 'curtain' ? this.defaultCompareViz : 0);
    this.control_ = new ComparepanelControl({
      baseLayers: this.baseLayers,
      mirrorpanelParams: this.mirrorpanelParams,
      timelineParams: this.timelineParams,
      lyrcompareParams: this.lyrcompareParams,
      transparencyParams: this.transparencyParams,
      defaultComparisonMode: this.COMP_PLUGIN_NAMES[this.defaultCompareMode],
      defaultComparisonViz: this.defaultCompareViz,
      position: this.position,
      urlCover: this.urlCoberturas_,
      lyrsMirrorMinZindex: this.lyrsMirrorMinZindex,
      map,
    });

    this.controls_.push(this.control_);
    this.map_ = map;

    this.panel_ = new M.ui.Panel('panelComparepanel', {
      position: M.ui.position[this.position],
      collapsible: this.collapsible,
      collapsed: this.collapsed,
      className: this.className,
      collapsedButtonClass: 'cp-icon-comparepanel',
      tooltip: this.tooltip_,
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
    [this.control_, this.panel_, this.map_, this.baseLayers, this.vertical, this.mirrorpanelParams,
      this.lyrcompareParams, this.timelineParams, this.transparencyParams] = [null, null, null,
      null, null, null, null, null, null];
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
    const baseLayers = JSON.stringify(this.baseLayers).replace(/\[/g, '!!').replace(/\]/g, '¡¡');
    return `${this.name}=${this.position}*!${this.vertical}*!${baseLayers}`;
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
   * by param is instance of M.plugin.Comparepanel
   * @public
   * @function
   * @param {M.plugin} plugin to compare
   * @api stable
   */
  equals(plugin) {
    return plugin instanceof Comparepanel;
  }
}
