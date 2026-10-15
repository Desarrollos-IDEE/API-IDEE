/**
 * @module IDEE/plugin/VectorsManagement
 */

import '../assets/css/vectorsmanagement';
import '../assets/css/fonts';
import es from './i18n/es';
import en from './i18n/en';

import VectorsManagementControl from './vectorsmanagementcontrol';
import myhelp from '../../templates/myhelp';
import { getValue } from './i18n/language';
import { parseSnapping } from './snapoptions';

export default class VectorsManagement extends IDEE.Plugin {
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
    super('vectorsmanagement', {
      position: options.position || 'right',
      tooltip: options.tooltip || getValue('tooltip'),
      order: options.order,
      svgPath: 'https://componentes.idee.es/estaticos/Simbologia/svg/icons_cota/icn_vector.svg',
    });

    /**
     * Plugin name
     * @public
     * @type {String}
     */
    this.name = 'vectorsmanagement';

    /**
     * Facade of the map
     * @private
     * @type {IDEE.Map}
     */
    this.map = null;

    /**
     * Button of the plugin
     * @private
     * @type {IDEE.ui.buttons.SidePanelButton}
     */
    this.button = null;

    /**
     * Panel of the plugin
     * @private
     * @type {IDEE.ui.panels.Panel}
     */
    this.panel = null;

    /**
     * @private
     * @type {string}
     *
     * Indicates if the plugin is collapsed on entry (true/false).
     */
    this.collapsed = typeof options.collapsed === 'boolean' ? options.collapsed : true;

    /**
     * Array of controls
     * @private
     * @type {Array<IDEE.Control>}
     */
    this.controls = [];

    /**
     * Plugin parameters
     * @public
     * @type {object}
     */
    this.options = options;

    /**
     * @private
     * @type {boolean}
     *
     * Indicates if the selection control is active (true/false)
     */
    this.selection = typeof options.selection === 'boolean' ? options.selection : true;

    /**
     * @private
     * @type {boolean}
     *
     * Indicates if the addlayer control is active (true/false)
     */
    this.addlayer = typeof options.addlayer === 'boolean' ? options.addlayer : true;

    /**
     * @private
     * @type {boolean}
     *
     * Indicates if the analysis control is active (true/false)
     */
    this.analysis = typeof options.analysis === 'boolean' ? options.analysis : true;

    /**
     * @private
     * @type {boolean}
     *
     * Indicates if the creation control is active (true/false)
     */
    this.creation = typeof options.creation === 'boolean' ? options.creation : true;

    /**
     * @private
     * @type {boolean}
     *
     * Indicates if the download control is active (true/false)
     */
    this.download = typeof options.download === 'boolean' ? options.download : true;

    /**
     * @private
     * @type {boolean}
     *
     * Indicates if the edition control is active (true/false)
     */
    this.edition = typeof options.edition === 'boolean' ? options.edition : true;

    /**
     * @private
     * @type {boolean}
     *
     * Indicates if the help control is active (true/false)
     */
    this.help = typeof options.help === 'boolean' ? options.help : true;

    /**
     * @private
     * @type {boolean}
     *
     * Indicates if the style control is active (true/false)
     */
    this.style = typeof options.style === 'boolean' ? options.style : true;

    /**
     * @private
     * @type {boolean|Object}
     *
     * Snapping configuration
     */
    this.snapping = parseSnapping(options.snapping);

    // Tooltip
    this.tooltip = options.tooltip || getValue('tooltip');
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
    return IDEE.language.getTranslation(lang).vectorsmanagement;
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
      svgPath: this.svgPath,
      order: this.order,
    });
    map.addButtons(this.button);

    this.panel = new IDEE.ui.panels.PluginSidePanel(this.name, {
      tooltip: this.tooltip,
      position: this.position,
      minWidth: this.minPanelWidth,
      maxWidth: this.maxPanelWidth,
      className: 'm-plugin-vectorsmanagement',
      collapsible: this.collapsible,
      collapsed: this.collapsed,
      collapsedButtonClass: 'vectorsmanagement-icon-vectors',
      order: this.order,
    });

    this.controls.push(new VectorsManagementControl({
      map,
      selection: this.selection,
      addlayer: this.addlayer,
      analysis: this.analysis,
      creation: this.creation,
      download: this.download,
      edition: this.edition,
      help: this.help,
      style: this.style,
      snapping: this.snapping,
      order: this.order,
    }));

    this.controls[0].on('vectorsmanagement:activeChanges', (data) => {
      this.layerId = data.activeLayerId;
    });

    this.panel.addControls(this.controls);

    this.button.panel = this.panel;
    this.panel.button = this.button;
    map.addPanels(this.panel);
  }

  /**
   * Gets the API REST Parameters of the plugin
   *
   * # API-REST
   *
   * @function
   * @public
   * @api
   */
  getAPIRest() {
    return `${this.name}=${this.position}*${this.collapsed}*${this.order}*${this.selection}*${this.addlayer}*${this.analysis}*${this.creation}*${this.download}*${this.edition}*${this.help}*${this.style}*${typeof this.snapping === 'boolean' ? this.snapping : JSON.stringify(this.snapping)}`;
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
   * @api stable
   */
  destroy() {
    this.map.removeButton(this.button);
    this.map.removePanel(this.panel);
  }

  /**
   * This function compare if pluging recieved by param is instance of   IDEE.plugin.Printer
   *
   * @public
   * @function
   * @param {IDEE.plugin} plugin to comapre
   * @api stable
   */
  equals(plugin) {
    if (plugin instanceof VectorsManagement) {
      return true;
    }
    return false;
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
            urlImages: `${IDEE.config.API_IDEE_URL}plugins/vectorsmanagement/images/`,
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
            },
          },
        });
        success(html);
      }),
    };
  }
}
