/**
 * @module IDEE/plugin/VectorsManagement
 */
import '../assets/css/vectorsmanagement';
import VectorsManagementControl from './vectorsmanagementcontrol';
import myhelp from '../../templates/myhelp';
import { getValue } from './i18n/language';

import es from './i18n/es';
import en from './i18n/en';

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
     * Plugin name
     * @public
     * @type {String}
     */
    this.name = 'vectorsmanagement';

    /**
     * Plugin parameters
     * @public
     * @type {object}
     */
    this.options = options;

    /**
     * Position of the plugin
     *
     * @private
     * @type {Enum} TL | TR | BL | BR
     */
    this.position_ = options.position || 'TR';

    /**
     * @private
     * @type {string}
     *
     * Indicates if the plugin is collapsed on entry (true/false).
     */
    this.collapsed = options.collapsed !== undefined ? options.collapsed : true;

    /**
     * @private
     * @type {string}
     *
     * Indicates if the plugin can be collapsed into a button (true/false).
     */
    this.collapsible = options.collapsible !== undefined ? options.collapsible : true;

    /**
     * @private
     * @type {boolean}
     *
     * Indicates if the selection control is active (true/false)
     */
    this.selection = options.selection !== undefined ? options.selection : true;

    /**
     * @private
     * @type {boolean}
     *
     * Indicates if the addlayer control is active (true/false)
     */
    this.addlayer = options.addlayer !== undefined ? options.addlayer : true;

    /**
     * @private
     * @type {boolean}
     *
     * Indicates if the analysis control is active (true/false)
     */
    this.analysis = this.selection && (options.analysis !== undefined ? options.analysis : true);

    /**
     * @private
     * @type {boolean}
     *
     * Indicates if the creation control is active (true/false)
     */
    this.creation = options.creation !== undefined ? options.creation : true;

    /**
     * @private
     * @type {boolean}
     *
     * Indicates if the download control is active (true/false)
     */
    this.download = options.download !== undefined ? options.download : true;

    /**
     * @private
     * @type {boolean}
     *
     * Indicates if the edition control is active (true/false)
     */
    this.edition = this.selection && (options.edition !== undefined ? options.edition : true);

    /**
     * @private
     * @type {boolean}
     *
     * Indicates if the help control is active (true/false)
     */
    this.help = (options.help !== undefined ? options.help : true);

    /**
     * @private
     * @type {boolean}
     *
     * Indicates if the style control is active (true/false)
     */
    this.style = options.style !== undefined ? options.style : true;

    // Tooltip
    this.tooltip_ = options.tooltip || getValue('tooltip');

    // Determina si el plugin es draggable o no
    this.isDraggable = !IDEE.utils.isUndefined(options.isDraggable) ? options.isDraggable : false;

    // Indicates order to the plugin
    this.order = options.order >= -1 ? options.order : null;
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
    this.controls_.push(new VectorsManagementControl({
      map,
      selection: this.selection,
      addlayer: this.addlayer,
      analysis: this.analysis,
      creation: this.creation,
      download: this.download,
      edition: this.edition,
      help: this.help,
      style: this.style,
      isDraggable: this.isDraggable,
      order: this.order,
    }));
    this.map_ = map;
    this.panel_ = new IDEE.ui.Panel('VectorsManagement', {
      collapsible: this.collapsible,
      collapsed: this.collapsed,
      position: IDEE.ui.position[this.position_],
      className: 'm-plugin-vectorsmanagement',
      tooltip: this.tooltip_,
      collapsedButtonClass: 'vectorsmanagement-icon-vectors',
      order: this.order,
    });

    this.controls_[0].on('vectorsmanagement:activeChanges', (data) => {
      this.layerId = data.activeLayerId;
    });

    this.panel_.addControls(this.controls_);
    map.addPanels(this.panel_);
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
    return `${this.name}=${this.position_}*${this.collapsed}*${this.collapsible}*${this.selection}*${this.addlayer}*${this.analysis}*${this.creation}*${this.download}*${this.edition}*${this.help}*${this.style}`;
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
    this.map_.removeControls(this.controls_);
    this.map_ = null;
    this.control_ = null;
    this.controls_ = null;
    this.panel_ = null;
    this.name = null;
    this.layerOpts = null;
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
