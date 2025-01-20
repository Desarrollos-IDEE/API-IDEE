/**
 * @module M/plugin/OverviewMap
 */
import 'assets/css/overviewmap';
import OverviewMapControl from './overviewmapcontrol';
import api from '../../api';
import { getValue } from './i18n/language';
import myhelp from '../../templates/myhelp';

import es from './i18n/es';
import en from './i18n/en';

export default class OverviewMap extends M.Plugin {
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
     * Options of the plugin
     * @private
     * @type {Object}
     */
    this.options_ = options || {};

    /**
     * Position of the plugin
     * @private
     * @type {String}
     */
    this.position_ = options.position !== undefined ? options.position : 'BR';

    /**
     * Plugin tooltip
     *
     * @private
     * @type {string}
     */
    this.tooltip_ = options.tooltip || getValue('tooltip');

    /**
     * Fixed zoom
     * @private
     * @type {Boolean}
     */
    this.fixed_ = options.fixed !== undefined ? options.fixed : false;

    /**
     * Zoom to make fixed
     * @private
     * @type {Number}
     */
    this.zoom_ = options.zoom !== undefined ? options.zoom : '';

    /**
     * Zoom to make fixed
     * @private
     * @type {Number}
     */
    this.baseLayer_ = options.baseLayer !== undefined ? options.baseLayer : 'WMTS*http://www.ign.es/wmts/ign-base?*IGNBaseTodo*GoogleMapsCompatible*Mapa IGN*false*image/jpeg*false*false*true';

    /**
     * Vendor options
     * @public
     * @type {Object}
     */
    this.vendorOptions = {
      collapsed: options.collapsed,
      collapsible: options.collapsible,
    };

    if (options !== undefined && options.collapsed !== undefined && (options.collapsed === false || options.collapsed === 'false')) {
      this.vendorOptions.collapsed = false;
    }

    if (options !== undefined && options.collapsible !== undefined && (options.collapsible === false || options.collapsible === 'false')) {
      this.vendorOptions.collapsible = false;
    }

    /**
     * Name of the plugin
     * @public
     * @type {String}
     */
    this.name = 'overviewmap';

    /**
     * Metadata from api.json
     * @private
     * @type {Object}
     */
    this.metadata_ = api.metadata;

    /**
     *@private
     *@type { Number }
     */
    this.order = (options.order) ? options.order : null;

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
    return M.language.getTranslation(lang).overviewmap;
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
    this.control_ = new OverviewMapControl(this.options_, this.vendorOptions);
    this.controls_.push(this.control_);
    this.map_ = map;
    this.panel_ = new M.ui.Panel('OverviewMap', {
      className: 'm-overviewmap-panel',
      position: M.ui.position[this.position_],
      order: this.order,
      tooltip: this.tooltip_,
    });
    this.panel_.addControls(this.controls_);
    map.addPanels(this.panel_);
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
    this.map_.removeControls([this.control_]);
    [this.map_, this.control_, this.panel_] = [null, null, null];
  }

  /**
   * Get the API REST Parameters of the plugin
   *
   * @function
   * @public
   * @api
   */
  getAPIRest() {
    // position*collapsed*collapsible*fixed*zoom*baseLayer
    return `${this.name}=${this.position_}*!${this.vendorOptions.collapsed}*!${this.vendorOptions.collapsible}*!${this.fixed_}*!${this.zoom_}*!${this.baseLayer_}*!${this.tooltip_}`;
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
            urlImages: `${M.config.API_IDEE_URL}plugins/overviewmap/images/`,
            translations: {
              help1: getValue('textHelp.help1'),
              help2: getValue('textHelp.help2'),
              help3: getValue('textHelp.help3'),
              help4: getValue('textHelp.help4'),
              help5: getValue('textHelp.help5'),
            },
          },
        });
        success(html);
      }),
    };
  }
}
