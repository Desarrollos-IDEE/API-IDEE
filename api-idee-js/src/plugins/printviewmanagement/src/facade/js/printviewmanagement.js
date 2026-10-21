/**
 * @module IDEE/plugin/PrintViewManagement
 */
import '../assets/css/printviewmanagement';
import 'assets/css/fonts';
import PrintViewManagementControl from './printviewmanagementcontrol';
import es from './i18n/es';
import en from './i18n/en';
import { getValue } from './i18n/language';
import myhelp from '../../templates/myhelp';

export default class PrintViewManagement extends IDEE.Plugin {
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
    super('printviewmanagement', {
      position: options.position || 'right',
      tooltip: options.tooltip || getValue('tooltip'),
      order: options.order,
      svgPath: options.svgPath || 'https://componentes.idee.es/estaticos/Simbologia/svg/icons_cota/icn_impresora.svg',
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
    this.collapsed = typeof options.collapsed === 'boolean' ? options.collapsed : true;

    const { georefImageEpsg = true } = options;

    /**
     * Indicates if the control georefImageEpsg is added to the plugin
     * @private
     * @type {Boolean|Array<Object>}
     */
    if (georefImageEpsg === true) {
      this.georefImageEpsg = {
        layers: [
          {
            url: 'http://www.ign.es/wms-inspire/mapa-raster?',
            name: 'mtn_rasterizado',
            format: 'image/jpeg',
            legend: 'Mapa ETRS89 UTM',
          },
          {
            url: 'http://www.ign.es/wms-inspire/pnoa-ma?',
            name: 'OI.OrthoimageCoverage',
            format: 'image/jpeg',
            legend: 'Imagen (PNOA) ETRS89 UTM',
          },
        ],
        defaultDpiOptions: [72, 150, 300],
      };
    } else if (options.georefImageEpsg) {
      this.georefImageEpsg = this.getGeorefImageEpsg();
    } else {
      this.georefImageEpsg = false;
    }

    const { georefImage = true } = options;

    /**
     * Indicates if the control georefImage is added to the plugin
     * @private
     * @type {Boolean}
     */
    if (georefImage === true) {
      this.georefImage = {
        tooltip: getValue('georeferenced_img'),
        defaultDpiOptions: [72, 150, 300],
      };
    } else if (options.georefImage) {
      this.georefImage = options.georefImage;
    } else {
      this.georefImage = false;
    }

    const { printermap = true } = options;

    /**
     * Indicates if the control printermap is added to the plugin
     * @private
     * @type {Boolean}
     */
    if (printermap === true) {
      this.printermap = {
        filterTemplates: [
          `${IDEE.config.STATIC_RESOURCES_URL}/plantillas/html/mapaConMarco.html`,
          `${IDEE.config.STATIC_RESOURCES_URL}/plantillas/html/mapaConCabeceraYMarco.html`,
          `${IDEE.config.STATIC_RESOURCES_URL}/plantillas/html/mapaConPieYMarco.html`,
          `${IDEE.config.STATIC_RESOURCES_URL}/plantillas/html/PlantillaAMB.html`,
        ],
        showDefaultTemplate: true,
        defaultDpiOptions: [96, 150, 300],
        layoutsRestraintFromDpi: ['screensize', 'A0', 'A1', 'A2'],
      };
    } else if (options.printermap) {
      this.printermap = options.printermap;
    } else {
      this.printermap = false;
    }

    this.defaultOpenControl = options.defaultOpenControl ?? 1;
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
    return IDEE.language.getTranslation(lang).printviewmanagement;
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
    if (this.georefImageEpsg === false && this.georefImage === false
        && this.printermap === false) {
      IDEE.dialog.error(getValue('exception.no_controls'));
    }

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
      className: 'm-plugin-printviewmanagement',
      collapsed: this.collapsed,
      collapsedButtonClass: 'printviewmanagement-icon-flecha-historial',
      order: this.order,
    });

    this.controls.push(new PrintViewManagementControl({
      georefImageEpsg: this.georefImageEpsg,
      georefImage: this.georefImage,
      printermap: this.printermap,
      order: this.order,
      map: this.map,
      defaultOpenControl: this.defaultOpenControl,
    }));
    this.panel.addControls(this.controls);

    this.button.panel = this.panel;
    this.panel.button = this.button;

    map.addPanels(this.panel);
  }

  /**
   * the control georefImageEpsg
   *
   * @public
   * @function
   * @returns Default center and zoom level
   * @api
   */
  getGeorefImageEpsg() {
    const { layers, tooltip, defaultDpiOptions } = this.options.georefImageEpsg;

    const order = 0; // ?¿
    const georefImageEpsg = {
      layers,
      order,
      tooltip,
      defaultDpiOptions,
    };
    return georefImageEpsg;
  }

  /**
   * Gets the API REST Parameters of the plugin
   *
   * @function
   * @public
   * @api
   */
  getAPIRest() {
    return `${this.name}=${this.position}*${this.collapsed}*${this.order}*${this.tooltip}`
      + `*${this.defaultOpenControl}*${!!this.georefImageEpsg}*${!!this.georefImage}*${!!this.printermap}`;
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
    this.map.removeButton(this.button);
    this.map.removePanel(this.panel);
  }

  /**
   * This function compare if pluging recieved by param is instance
   * of IDEE.plugin.PrintViewManagement
   *
   * @public
   * @function
   * @param {IDEE.plugin} plugin to comapre
   * @api
   */
  equals(plugin) {
    return plugin instanceof PrintViewManagement;
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
            urlImages: `${IDEE.config.API_IDEE_URL}plugins/printviewmanagement/images/`,
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
