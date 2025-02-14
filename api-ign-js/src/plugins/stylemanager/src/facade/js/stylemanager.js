/* eslint-disable import/extensions */
/**
 * @module M/plugin/StyleManager
 */
import 'css/stylemanager';
import 'css/font-awesome.min';
import 'templates/categorystyles';
import StyleManagerControl from './stylemanagerControl';
import { ColorPickerPolyfill } from './utils/colorpicker';
import { getValue } from './i18n/language';
import myhelp from '../../templates/myhelp';

export default class StyleManager extends M.Plugin {
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
     * @type {String}
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
     * @private
     * @type {M.ui.Panel}
     */
    this.panel_ = null;

    /**
     * @private
     * @type {M.layer.Vector}
     */
    this.layer_ = options.layer;

    /**
     *@private
     *@type { string }
     */
    this.tooltip_ = options.tooltip || getValue('tooltip');

    /**
     * Plugin parameters
     * @public
     * @type {object}
     */
    this.options = options;

    ColorPickerPolyfill.apply(window);

    M.utils.extends = M.utils.extendsObj;
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
    this.controls_.push(new StyleManagerControl(this.layer_));
    this.map_ = map;
    this.panel_ = new M.ui.Panel(StyleManager.NAME, {
      collapsed: this.collapsed_,
      collapsible: this.collapsible_,
      className: 'm-stylemanager',
      collapsedButtonClass: 'stylemanager-palette',
      position: M.ui.position[this.position_],
      tooltip: this.tooltip_,
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
    return `${this.name}=${this.position_}*${this.collapsed_}*${this.collapsible_}*${this.tooltip_}`;
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
   * TODO
   */
  destroy() {
    this.map_.removeControls(this.controls_);
    [this.control_, this.panel_, this.map_] = [null, null, null];
  }

  get name() {
    return 'stylemanager';
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
            urlImages: `${M.config.MAPEA_URL}plugins/stylemanager/images/`,
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
              help14: getValue('textHelp.help14'),
              help15: getValue('textHelp.help15'),
              help16: getValue('textHelp.help16'),
              help17: getValue('textHelp.help17'),
              help18: getValue('textHelp.help18'),
              help19: getValue('textHelp.help19'),
              help20: getValue('textHelp.help20'),
              help21: getValue('textHelp.help21'),
              help22: getValue('textHelp.help22'),
              help23: getValue('textHelp.help23'),
              help24: getValue('textHelp.help24'),
              help25: getValue('textHelp.help25'),
              help26: getValue('textHelp.help26'),
              help27: getValue('textHelp.help27'),
              help28: getValue('textHelp.help28'),
              help29: getValue('textHelp.help29'),
              help30: getValue('textHelp.help30'),
              help31: getValue('textHelp.help31'),
              help32: getValue('textHelp.help32'),
              help33: getValue('textHelp.help33'),
              help34: getValue('textHelp.help34'),
              help35: getValue('textHelp.help35'),
              help36: getValue('textHelp.help36'),
              help37: getValue('textHelp.help37'),
              help38: getValue('textHelp.help38'),
              help39: getValue('textHelp.help39'),
              help40: getValue('textHelp.help40'),
              help41: getValue('textHelp.help41'),
              help42: getValue('textHelp.help42'),
            },
          },
        });
        success(html);
      }),
    };
  }
}
