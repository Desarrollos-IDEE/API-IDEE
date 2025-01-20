/**
 * @module M/plugin/InfoCatastro
 */
import 'assets/css/infocatastro';
import InfoCatastroControl from './infocatastrocontrol';
import api from '../../api';
import { getValue } from './i18n/language';

import es from './i18n/es';
import en from './i18n/en';

export default class InfoCatastro extends M.Plugin {
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
  constructor(options) {
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
     *
     * @private
     * @type {string} - TL | TR | BL | BR
     */
    this.position_ = options.position || 'TR';

    /**
     * Plugin tooltip
     *
     * @private
     * @type {string}
     */
    this.tooltip_ = options.tooltip || getValue('tooltip');

    /**
     * catastroWMS
     * @private
     * @type {string}
     */
    this.catastroWMS = options.catastroWMS || 'http://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCoordenadas.asmx/Consulta_RCCOOR';

    /**
     * Metadata from api.json
     * @private
     * @type {Object}
     */
    this.metadata_ = api.metadata;

    /**
     * Name of the plugin
     * @private
     * @type {String}
     */
    this.name_ = 'infocatastro';
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
    return M.language.getTranslation(lang).infocatastro;
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
    this.controls_.push(new InfoCatastroControl({ url: this.catastroWMS, tooltip: this.tooltip_ }));
    this.map_ = map;
    this.panel_ = new M.ui.Panel('panelInfoCatastro', {
      className: 'm-plugin-catastro',
      position: M.ui.position[this.position_],
      tooltip: this.tooltip_,
      collapsedButtonClass: 'icon-posicion4',
    });
    this.panel_.addControls(this.controls_);
    map.addPanels(this.panel_);

    const that = this;
    this.controls_[0].on(M.evt.ADDED_TO_MAP, () => {
      that.fire(M.evt.ADDED_TO_MAP);
    });
  }

  /**
   * @getter
   * @public
   */
  get name() {
    return 'infocatastro';
  }

  /**
   * This function returns the position
   *
   * @public
   * @return {string}
   * @api
   */
  get position() {
    return this.position_;
  }

  /**
   * Get the API REST Parameters of the plugin
   *
   * @function
   * @public
   * @api
   */
  getAPIRest() {
    return `${this.name_}=${this.position_}*${this.tooltip_}*${this.catastroWMS}`;
  }

  /**
   * This function compares plugins
   *
   * @public
   * @function
   * @param {M.Plugin} plugin to compare
   * @api
   */
  equals(plugin) {
    return plugin instanceof InfoCatastro;
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
   * This function destroys this plugin
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {
    this.map_.removeControls(this.controls_);
    [this.map_, this.controls_, this.panel_] = [null, null, null];
  }
}
