/**
 * @module IDEE/plugin/Infocoordinates
 */
import 'assets/css/fonts';
import 'assets/css/infocoordinates';
import InfocoordinatesControl from './infocoordinatescontrol';
import api from '../../api';
import { getValue } from './i18n/language';
import myhelp from '../../templates/myhelp';

import es from './i18n/es';
import en from './i18n/en';

export default class Infocoordinates extends IDEE.Plugin {
  /**
   * @classdesc
   * Main facade plugin object. This class creates a plugin
   * object which has an implementation Object
   *
   * @constructor
   * @extends {IDEE.Plugin}
   * @param {Object} impl implementation object
   * @api stable
   */
  constructor(options = {}) {
    super();
    /**
     * Facade of the map
     * @private
     * @type {IDEE.Map}
     */
    this.map_ = null;

    /**
     *  Decimal digits fixed on geographic coordinates
     * @public     *
     * @type {int}
     */
    this.decimalGEOcoord_ = options.decimalGEOcoord || 4;

    /**
     *  Decimal digits fixed on projected coordinates
     * @public     *
     * @type {int}
     */
    this.decimalUTMcoord_ = options.decimalUTMcoord || 2;

    /**
     * Name plugin
     * @private
     * @type {String}
     */
    this.name_ = 'infocoordinates';

    /**
     * Array of controls
     * @private
     * @type {Array<IDEE.Control>}
     */
    this.controls_ = [];

    this.control_ = null;

    /**
     * Position of the Plugin
     * @public
     * Posible values: TR | TL | BL | BR
     * @type {String}
     */
    const positions = ['TR', 'TL', 'BL', 'BR'];
    this.position_ = positions.includes(options.position) ? options.position : 'TR';

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
     * Metadata from api.json
     * @private
     * @type {Object}
     */
    this.metadata_ = api.metadata;

    /**
     * URL to the help for the icon
     * @private
     * @type {string}
     */
    this.helpUrl_ = options.helpUrl || 'https://www.ign.es/';

    /**
     * Output Format
     * @private
     * @type {string}
     */
    this.outputDownloadFormat_ = options.outputDownloadFormat || 'txt';

    /**
     *@private
     *@type { Number }
     */
    this.order = options.order >= -1 ? options.order : null;

    /**
     * Tooltip of the UI Plugin
     *
     * @private
     * @type {string}
     */
    this.tooltip_ = options.tooltip || getValue('tooltip');

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
    return IDEE.language.getTranslation(lang).infocoordinates;
  }

  /**
   * This function adds this plugin into the map
   *
   * @public
   * @function
   * @param {IDEE.Map} map the map to add the plugin
   * @api stable
   */
  addTo(map) {
    this.control_ = new InfocoordinatesControl(
      this.decimalGEOcoord_,
      this.decimalUTMcoord_,
      this.helpUrl_,
      this.order,
      this.outputDownloadFormat_,
    );
    this.controls_.push(this.control_);
    this.map_ = map;
    // panel para agregar control - no obligatorio
    this.panel_ = new IDEE.ui.Panel('Infocoordinates', {
      collapsed: this.collapsed_,
      collapsible: this.collapsible_,
      position: IDEE.ui.position[this.position_],
      className: 'm-plugin-infocoordinates',
      collapsedButtonClass: 'icon-target',
      tooltip: this.tooltip_,
      order: this.order,
    });
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
    this.map_.removeControls([this.control_]);
    this.control_.deactivate();
    this.control_.removeLayerFeatures();
    [this.control_, this.panel_, this.map] = [null, null, null];
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
    return `${this.name}=${this.position_}*${this.collapsed_}*${this.collapsible_}*${this.tooltip_}*${this.decimalGEOcoord_}*${this.decimalUTMcoord_}*${this.helpUrl_}*${this.outputDownloadFormat_}`;
  }

  /**
   * Gets the API REST Parameters in base64 of the plugin
   *
   * @function
   * @public
   * @api
   */
  getAPIRestBase64() {
    return `${this.name}=base64=${IDEE.utils.encodeBase64(this.options)}`;
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
        const html = IDEE.template.compileSync(myhelp, {
          vars: {
            urlImages: `${IDEE.config.API_IDEE_URL}plugins/infocoordinates/images/`,
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
