/**
 * @module IDEE/plugin/Infocoordinates
 */
import 'assets/css/infocoordinates';
import 'assets/css/fonts';
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
    super('infocoordinates', {
      position: options.position || 'right',
      tooltip: options.tooltip || getValue('tooltip'),
      order: options.order,
    });
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
     * Option to allow the plugin to be collapsed or not
     * @private
     * @type {Boolean}
     */
    this.collapsed_ = options.collapsed;
    if (this.collapsed_ === undefined) this.collapsed_ = true;

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
     * EPSG codes to display simultaneously. Accepts "EPSG:4326" or "4326" format.
     * When null, single-EPSG mode is used with the selector.
     * @private
     * @type {string[]|null}
     */
    this.epsgResults_ = options.epsgResults
      ? (Array.isArray(options.epsgResults) ? options.epsgResults : String(options.epsgResults).split(','))
        .map((code) => {
          const str = String(code).trim();
          return str.startsWith('EPSG:') ? str : `EPSG:${str}`;
        })
        .filter((code) => code !== 'EPSG:')
      : null;

    /**
     * Plugin parameters
     * @public
     * @type {object}
     */
    this.options = options;

    /**
     * InfoCoordinatesControl instance
     * @private
     * @type {InfocoordinatesControl}
     */
    this.control_ = null;
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
    this.map = map;
    this.button = new IDEE.ui.buttons.SidePanelButton(this.name, {
      position: this.position,
      tooltip: this.tooltip,
      svgPath: 'https://componentes.idee.es/estaticos/Simbologia/svg/icons_cota/icn_infoCoor.svg',
      order: this.order,
    });

    map.addButtons(this.button);

    this.panel = new IDEE.ui.panels.PluginSidePanel(this.name, {
      collapsed: this.collapsed_,
      position: this.position,
      minWidth: this.minPanelWidth,
      maxWidth: this.maxPanelWidth,
      className: 'm-plugin-infocoordinates',
      collapsedButtonClass: 'icon-target',
      tooltip: this.tooltip,
      order: this.order,
    });

    this.control_ = new InfocoordinatesControl({
      decimalGEOcoord: this.decimalGEOcoord_,
      decimalUTMcoord: this.decimalUTMcoord_,
      helpUrl: this.helpUrl_,
      order: this.order,
      outputDownloadFormat: this.outputDownloadFormat_,
      epsgResults: this.epsgResults_,
    });

    this.controls.push(this.control_);
    this.panel.addControls(this.controls);

    this.panel.on(IDEE.evt.SHOW, this.control_.activate, this.control_);
    this.panel.on(IDEE.evt.HIDE, this.control_.deactivate, this.control_);

    this.button.panel = this.panel;
    this.panel.button = this.button;

    map.addPanels(this.panel);
  }

  /**
   * This function destroys this plugin
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {
    this.control_.removeAllDisplaysPoints();
    this.control_.removeAllPoints();
    this.control_.removeLayerFeatures();
    this.control_.deactivate();
    this.map.removeButton(this.button);
    this.map.removePanel(this.panel);
    this.control_ = null;
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
    return `${this.name}=${IDEE.utils.serializeUrlParams(this.options)}`;
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
