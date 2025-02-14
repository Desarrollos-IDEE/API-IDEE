/**
 * @module M/plugin/Comparators
 */
import '../assets/css/comparators';
import ComparatorsControl from './comparatorscontrol';
import es from './i18n/es';
import en from './i18n/en';
import { getValue } from './i18n/language';
import myhelp from '../../templates/myhelp';

export default class Comparators extends M.Plugin {
  /**
   * @classdesc
   * Main facade plugin object. This class creates a plugin
   * object which has an implementation Object
   *
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
     * Plugin name
     * @public
     * @type {String}
     */
    this.name = 'comparators';

    /**
     * Plugin parameters
     * @public
     * @type {Object}
     */
    this.options = options;

    /**
     * Position of the plugin
     *
     * @private
     * @type {String} TL | TR | BL | BR
     */
    this.position_ = options.position || 'TL';

    /**
     * Option to allow the plugin to be collapsed or not
     * @private
     * @type {Boolean}
     */
    this.collapsed = !M.utils.isUndefined(options.collapsed) ? options.collapsed : true;

    /**
     * Option to allow the plugin to be collapsible or not
     * @private
     * @type {Boolean}
     */
    this.collapsible = !M.utils.isUndefined(options.collapsible) ? options.collapsible : true;

    /**
     * Tooltip of plugin
     * @private
     * @type {String}
     */
    this.tooltip_ = options.tooltip || getValue('tooltip');

    /**
     * Option to allow the plugin to be draggable or not
     * @private
     * @type {Boolean}
     */
    this.isDraggable = !M.utils.isUndefined(options.isDraggable) ? options.isDraggable : false;

    /**
     * Indicates order to the plugin
     * @private
     * @type {Number}
     */
    this.order = options.order >= -1 ? options.order : null;
  }

  /**
   * Return plugin language
   *
   * @public
   * @function
   * @param {string} lang type language
   * @api
   */
  static getJSONTranslations(lang) {
    if (lang === 'en' || lang === 'es') {
      return (lang === 'en') ? en : es;
    }
    return M.language.getTranslation(lang).comparators;
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
    this.options.listLayers = this.options.listLayers || [];

    // Prevent Generic
    this.options.listLayers = this.options.listLayers.filter((layer) => {
      if (typeof layer === 'string') {
        return !layer.includes('GenericRaster') || !layer.includes('GenericVector');
      }
      return layer.type !== 'GenericRaster' || layer.type !== 'GenericVector';
    });

    this.controls_.push(new ComparatorsControl(this.isDraggable, this.order, this.options, map));
    this.map_ = map;
    this.panel_ = new M.ui.Panel('panelComparators', {
      collapsible: this.collapsible,
      collapsed: this.collapsed,
      position: M.ui.position[this.position_],
      className: 'm-plugin-comparators',
      tooltip: this.tooltip_,
      collapsedButtonClass: 'comparators-icon-zoom-mapa',
      order: this.order,
    });

    this.panel_.addControls(this.controls_);
    map.addPanels(this.panel_);
  }

  /**
   * Gets the API REST Parameters of the plugin
   *
   * @function
   * @public
   * @api
   */
  getAPIRest() {
    return `${this.name}=${this.position_}*${this.collapsed}*${this.collapsible}*${this.tooltip_}*${this.isDraggable}*${this.options.listLayers}*${this.options.defaultCompareMode}*${this.options.enabledKeyFunctions}*${!!this.options.transparencyParams}*${!!this.options.lyrcompareParams}*${!!this.options.mirrorpanelParams}*${!!this.options.windowsyncParams}`;
  }

  /**
   * Gets the API REST Parameters in base64 of the plugin
   *
   * @function
   * @public
   * @api
   */
  getAPIRestBase64() {
    return `${this.name}=base64=${M.utils.encodeBase64(this.options)}`;
  }

  /**
   * This function destroys this plugin
   *
   * @public
   * @function
   * @api
   */
  destroy() {
    this.controls_[0].deactivate();
    this.controls_[0].controls = [];
    this.map_.removeControls(this.controls_);

    this.map_ = null;
    this.panel_ = null;
    this.name = null;
    this.options = null;
    this.position_ = null;
    this.collapsed = null;
    this.collapsible = null;
    this.tooltip_ = null;
    this.isDraggable = null;
    this.order = null;
  }

  /**
   * This function compare if pluging recieved by param is instance of M.plugin.Comparators
   *
   * @public
   * @function
   * @param {M.plugin} plugin to comapre
   * @api
   */
  equals(plugin) {
    return plugin instanceof Comparators;
  }

  /**
   * Obtiene la ayuda del plugin
   *
   * @function
   * @public
   * @api
   */
  getHelp() {
    return {
      title: this.name,
      content: new Promise((success) => {
        const html = M.template.compileSync(myhelp, {
          vars: {
            urlImages: `${M.config.MAPEA_URL}plugins/comparators/images/`,
            translations: {
              help1: getValue('textHelp.help1'),
              help2: getValue('textHelp.help2'),
              help3: getValue('textHelp.help3'),
              help4: getValue('textHelp.help4'),
              help5: getValue('textHelp.help5'),
              help6: getValue('textHelp.help6'),
              help7: getValue('textHelp.help7'),
              help8: getValue('textHelp.help8'),
              help9: getValue('textHelp.help9'),
              help10: getValue('textHelp.help10'),
              help11: getValue('textHelp.help11'),
              help12: getValue('textHelp.help12'),
              help13: getValue('textHelp.help13'),
            },
          },
        });
        success(html);
      }),
    };
  }
}
