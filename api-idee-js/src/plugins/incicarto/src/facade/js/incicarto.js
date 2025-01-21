/**
 * @module IDEE/plugin/Incicarto
 */
import '../assets/css/incicarto';
import '../assets/css/fonts';
import IncicartoControl from './incicartocontrol';
import api from '../../api';
import { getValue } from './i18n/language';
import myhelp from '../../templates/myhelp';

import es from './i18n/es';
import en from './i18n/en';

export default class Incicarto extends IDEE.Plugin {
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
     * Array of controls
     * @private
     * @type {Array<IDEE.Control>}
     */
    this.controls_ = [];

    /**
     * Position of the plugin
     * @private
     * @type {String}
     */
    this.position_ = options.position || 'TR';

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
     * Option to allow the plugin to be collapsible or not
     * @private
     * @type {Boolean}
     */
    this.wfszoom_ = parseInt(options.wfszoom, 10);
    if (this.wfszoom_ === undefined || Number.isNaN(this.wfszoom_)) this.wfszoom_ = 12;

    this.controllist_ = options.controllist || [{
      id: 'themeList',
      name: 'Temas de errores',
      mandatory: true,
    },
    {
      id: 'errorList',
      name: 'Tipos de errores',
      mandatory: true,
    },
    {
      id: 'productList',
      name: 'Lista de productos',
      mandatory: true,
    },
    ];

    this.interfazmode_ = options.interfazmode;
    if (this.interfazmode_ === undefined) this.interfazmode_ = 'simple';

    this.buzones_ = options.buzones || [];
    this.themes_ = options.themeList || [];
    this.errors_ = options.errorList || [];
    this.products_ = options.productList || [];

    this.prefixSubject_ = options.prefixSubject;
    if (this.prefixSubject_ === undefined) this.prefixSubject_ = 'Incidencia cartografía - ';

    /**
     * Name of the plugin
     * @private
     * @type {String}
     */
    this.name_ = 'incicarto';

    /**
     * Metadata from api.json
     * @private
     * @type {Object}
     */
    this.metadata_ = api.metadata;

    /**
     * Tooltip of the UI Plugin
     *
     * @private
     * @type {string}
     */
    this.tooltip_ = options.tooltip || getValue('tooltip');

    /**
     * Option to allow the plugin to be draggable or not
     * @private
     * @type {Boolean}
     */
    this.isDraggable = !IDEE.utils.isUndefined(options.isDraggable) ? options.isDraggable : false;

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
    return IDEE.language.getTranslation(lang).incicarto;
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
    this.map_ = map;
    this.panel_ = new IDEE.ui.Panel('panelIncicarto', {
      className: 'm-incicarto',
      collapsed: this.collapsed_,
      collapsible: this.collapsible_,
      position: IDEE.ui.position[this.position_],
      collapsedButtonClass: 'icon-incicarto',
      tooltip: this.tooltip_,
    });

    if (this.controllist_[0].id === 'themeList') {
      this.errThemes_ = this.controllist_[0];
    }
    if (this.controllist_[1].id === 'errorList') {
      this.errTypes_ = this.controllist_[1];
    }
    if (this.controllist_[2].id === 'productList') {
      this.errProducts_ = this.controllist_[2];
    }

    this.control_ = new IncicartoControl({
      wfszoom: this.wfszoom_,
      controllist: this.controllist_,
      interfazmode: this.interfazmode_,
      prefixSubject: this.prefixSubject_,
      buzones: this.buzones_,
      themes: this.themes_,
      errors: this.errors_,
      products: this.products_,
      errThemes: this.errThemes_,
      errTypes: this.errTypes_,
      errProducts: this.errProducts_,
      isDraggable: this.isDraggable,
    });

    this.controls_.push(this.control_);

    this.map_.on(IDEE.evt.ADDED_LAYER, () => {
      if (this.control_ !== null) {
        this.control_.renderLayers();
      }
    });

    this.map_.on(IDEE.evt.REMOVED_LAYER, () => {
      if (this.control_ !== null) {
        this.control_.renderLayers();
      }
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
    // eslint-disable-next-line max-len
    // *${JSON.stringify(this.buzones_)}*${JSON.stringify(this.controllist_)}*${JSON.stringify(this.themes_)}*${JSON.stringify(this.errors_)}*${JSON.stringify(this.products_)}
    return `${this.name_}=${this.position_}*${this.collapsed_}*${this.collapsible_}*${this.tooltip_}*${this.wfszoom_}*${this.prefixSubject_}*${this.interfazmode_}*${this.isDraggable}`;
  }

  /**
   * Gets the API REST Parameters in base64 of the plugin
   *
   * @function
   * @public
   * @api
   */
  getAPIRestBase64() {
    return `${this.name_}=base64=${IDEE.utils.encodeBase64(this.options)}`;
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
   * @api
   */
  destroy() {
    this.control_.resetInteractions();
    this.map_.removeControls([this.control_]);
    [this.map_, this.control_, this.panel_] = [null, null, null];
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
      title: this.name_,
      content: new Promise((success) => {
        const html = IDEE.template.compileSync(myhelp, {
          vars: {
            urlImages: `${IDEE.config.API_IDEE_URL}plugins/incicarto/images/`,
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
            },
          },
        });
        success(html);
      }),
    };
  }
}
