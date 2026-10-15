/* eslint-disable import/extensions */
/**
 * @module IDEE/plugin/StyleManager
 */
import 'css/stylemanager.css';
import 'css/font-awesome.min.css';
import 'css/fonts.css';
import 'templates/categorystyles';
import StyleManagerControl from './stylemanagerControl';
import { ColorPickerPolyfill } from './utils/colorpicker';
import { getValue } from './i18n/language';
import myhelp from '../../templates/myhelp';

export default class StyleManager extends IDEE.Plugin {
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
    super('stylemanager', {
      position: options.position || 'right',
      tooltip: options.tooltip || getValue('tooltip'),
      order: options.order,
    });

    /**
     * Option to allow the plugin to be collapsed or not
     * @private
     * @type {Boolean}
     */
    this.collapsed = options.collapsed;
    if (this.collapsed === undefined) this.collapsed = true;

    /**
     * Sets the preselected layer in the plugin, if it is not defined, no layer will be preselected
     * @private
     * @type {IDEE.layer.Vector}
     */
    this.layer_ = options.layer;

    /**
     * Plugin parameters
     * @public
     * @type {object}
     */
    this.options = options;

    /**
     * Minimum width of the panel
      * @private
      * @type {number}
     */
    this.minPanelWidth = 608;

    ColorPickerPolyfill.apply(window);

    IDEE.utils.extends = IDEE.utils.extendsObj;
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
      svgPath: 'https://componentes.idee.es/estaticos/Simbologia/svg/icons_cota/icn_stylemanager.svg',
      order: this.order,
    });
    map.addButtons(this.button);

    this.panel = new IDEE.ui.panels.PluginSidePanel(this.name, {
      tooltip: this.tooltip,
      position: this.position,
      minWidth: this.minPanelWidth,
      maxWidth: this.maxPanelWidth,
      className: 'm-stylemanager',
      collapsed: this.collapsed,
      collapsedButtonClass: 'stylemanager-palette',
      order: this.order,
    });

    this.controls.push(new StyleManagerControl(this.layer_));
    this.panel.addControls(this.controls);

    this.button.panel = this.panel;
    this.panel.button = this.button;

    map.addPanels(this.panel);
  }

  /**
   * Get the API REST Parameters of the plugin
   *
   * @function
   * @public
   * @api
   */
  getAPIRest() {
    return `${this.name}=${this.position}*${this.collapsed}*${this.order}*${this.tooltip}`;
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
   * TODO
   */
  destroy() {
    this.map.removeButton(this.button);
    this.map.removePanel(this.panel);
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
            urlImages: `${IDEE.config.API_IDEE_URL}plugins/stylemanager/images/`,
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
