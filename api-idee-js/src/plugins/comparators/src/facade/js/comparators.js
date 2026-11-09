/**
 * @module IDEE/plugin/Comparators
 */
import '../assets/css/comparators';
import 'assets/css/fonts';
import ComparatorsControl from './comparatorscontrol';
import es from './i18n/es';
import en from './i18n/en';
import { getValue } from './i18n/language';
import { transformToStringLayers } from './utils';
import myhelp from '../../templates/myhelp';

export default class Comparators extends IDEE.Plugin {
  /**
   * @classdesc
   * Main facade plugin object. This class creates a plugin
   * object which has an implementation Object
   *
   * @constructor
   * @extends {IDEE.Plugin}
   * @param {Object} impl implementation object
   * @api
   */
  constructor(options = {}) {
    super('comparators', {
      position: options.position || 'right',
      tooltip: options.tooltip || getValue('tooltip'),
    });

    /**
     * Plugin parameters
     * @public
     * @type {Object}
     */
    this.options = options;

    /**
     * Option to allow the plugin to be collapsed or not
     * @private
     * @type {Boolean}
     */
    this.collapsed = !IDEE.utils.isUndefined(options.collapsed) ? options.collapsed : true;

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
    return IDEE.language.getTranslation(lang).comparators;
  }

  /**
   * This function adds this plugin into the map
   *
   * @public
   * @function
   * @param {IDEE.Map} map the map to add the plugin
   * @api
   */
  addTo(map) {
    this.map = map;
    this.options.listLayers = this.options.listLayers || [];

    // Prevent Generic
    this.options.listLayers = this.options.listLayers.filter((layer) => {
      if (typeof layer === 'string') {
        return !layer.includes('GenericRaster') || !layer.includes('GenericVector');
      }
      return layer.type !== 'GenericRaster' || layer.type !== 'GenericVector';
    });

    this.button = new IDEE.ui.buttons.SidePanelButton(this.name, {
      position: this.position,
      tooltip: this.tooltip,
      svgPath: 'https://componentes.idee.es/estaticos/Simbologia/svg/icons_cota/icn_comparator.svg',
      order: this.order,
    });
    map.addButtons(this.button);

    this.panel = new IDEE.ui.panels.PluginSidePanel(this.name, {
      tooltip: this.tooltip,
      position: this.position,
      minWidth: this.minPanelWidth,
      maxWidth: this.maxPanelWidth,
      className: 'm-plugin-comparators',
      collapsed: this.collapsed,
      collapsedButtonClass: 'comparators-icon-zoom-mapa',
      order: this.order,
    });

    this.controls.push(new ComparatorsControl({
      map: this.map,
      order: this.order,
      options: this.options,
    }));

    this.panel.addControls(this.controls);

    this.button.panel = this.panel;
    this.panel.button = this.button;

    map.addPanels(this.panel);
  }

  /**
   * Gets the API REST Parameters of the plugin
   *
   * @function
   * @public
   * @api
   */
  getAPIRest() {
    let { listLayers } = this.options;
    if (IDEE.utils.isArray(listLayers)) {
      listLayers = listLayers
        .map((layer) => (IDEE.utils.isString(layer)
          ? layer : transformToStringLayers(layer, this.map, false)))
        .filter((layer) => layer);
    }
    return `${this.name}=${IDEE.utils.serializeUrlParams({ ...this.options, listLayers })}`;
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
   * This function destroys this plugin
   *
   * @public
   * @function
   * @api
   */
  destroy() {
    this.controls[0].deactivate();
    this.controls[0].controls = [];
    this.map.removeControls(this.controls);
    this.map.removeButton(this.button);
    this.map.removePanel(this.panel);

    this.map = null;
    this.panel_ = null;
    this.name = null;
    this.options = null;
    this.controls = null;
    this.collapsed = null;
    this.collapsible = null;
    this.tooltip = null;
    this.order = null;
  }

  /**
   * This function compare if pluging recieved by param is instance of IDEE.plugin.Comparators
   *
   * @public
   * @function
   * @param {IDEE.plugin} plugin to comapre
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
        const html = IDEE.template.compileSync(myhelp, {
          vars: {
            urlImages: `${IDEE.config.API_IDEE_URL}plugins/comparators/images/`,
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
