/**
 * @module M/plugin/MeasureBar
 */
import MeasureLength from './measurelength';
import MeasureArea from './measurearea';
import MeasureClear from './measureclear';
import { getValue } from './i18n/language';
import '../assets/css/measurebar';
import myhelp from '../../templates/myhelp';

import es from './i18n/es';
import en from './i18n/en';

export default class MeasureBar extends M.Plugin {
  /**
   * @classdesc
   * Main facade plugin object. This class creates a plugin
   * object which has an implementation Object
   *
   * @constructor
   * @extends {M.Plugin}
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
     *
     * @private
     * @type {Array<M.Control>}
     */
    this.controls_ = [];

    /**
     * Position of plugin over map.
     *
     * @private
     * @type {String} 'TL', 'TR', 'BR', 'BL'
     */
    this.position_ = options.position || 'TL';

    /**
     * Control MeasureLength
     * @private
     * @type {M.control.MeasureLength}
     */
    this.measureLength_ = null;

    /**
     * Control MeasureArea
     * @private
     * @type {M.control.MeasureArea}
     */
    this.measureArea_ = null;

    /**
     * Control MeasureClear
     * @private
     * @type {M.control.MeasureClear}
     */
    this.measureClear_ = null;

    /**
     *@private
     *@type { Number }
     */
    this.order = options.order >= -1 ? options.order : null;

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
     * Plugin tooltip
     *
     * @private
     * @type {string}
     */
    this.tooltip_ = options.tooltip || getValue('text.tooltip');

    /**
     * Plugin parameters
     * @public
     * @type {object}
     */
    this.options = options;
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
    return M.language.getTranslation(lang).measurebar;
  }

  /**
   * @inheritdoc
   * @public
   * @function
   * @param {M.Map} map - Map to add the plugin
   * @api stable
   */
  addTo(map) {
    this.map_ = map;

    this.measureLength_ = new MeasureLength(this.order);
    this.measureArea_ = new MeasureArea(this.order);
    this.measureClear_ = new MeasureClear(this.measureLength_, this.measureArea_, this.order);

    this.controls_.push(this.measureLength_, this.measureArea_, this.measureClear_);

    this.panel_ = new M.ui.Panel('MeasureBar', {
      collapsed: this.collapsed_,
      collapsible: this.collapsible_,
      tooltip: this.tooltip_,
      position: M.ui.position[this.position_],
      className: 'm-panel-measurebar',
      collapsedButtonClass: 'measurebar-regla',
      order: this.order,
    });

    this.panel_.addControls(this.controls_);

    this.map_.addPanels(this.panel_);
  }

  /**
   * Name of the plugin
   *
   * @getter
   * @function
   */
  get name() {
    return 'measurebar';
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
   * This function destroys this plugin
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {
    this.map_.removeControls([this.measureLength_, this.measureArea_, this.measureClear_]);
    this.map_ = null;
    this.measureLength_ = null;
    this.measureArea_ = null;
    this.measureClear_ = null;
  }

  /**
   * This function return the control of plugin
   *
   * @public
   * @function
   * @api stable
   */
  getControls() {
    const aControls = [];
    aControls.push(this.measureArea_, this.measureClear_, this.measureLength_);
    return aControls;
  }

  /**
   * This function compare if pluging recieved by param is instance of M.plugin.MeasureBar
   *
   * @public
   * @function
   * @param {M.plugin} plugin to comapre
   * @api stable
   */
  equals(plugin) {
    return plugin instanceof MeasureBar;
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
            urlImages: `${M.config.MAPEA_URL}plugins/measurebar/images/`,
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
            },
          },
        });
        success(html);
      }),
    };
  }
}
