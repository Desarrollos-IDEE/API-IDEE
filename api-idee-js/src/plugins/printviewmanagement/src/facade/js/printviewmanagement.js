/**
 * @module M/plugin/PrintViewManagement
 */
import '../assets/css/printviewmanagement';
import PrintViewManagementControl from './printviewmanagementcontrol';
import es from './i18n/es';
import en from './i18n/en';
import { getValue } from './i18n/language';
import myhelp from '../../templates/myhelp';

export default class PrintViewManagement extends M.Plugin {
  /**
   * @classdesc
   * Main facade plugin object. This class creates a plugin
   * object which has an implementation Object
   *
   * @constructor
   * @extends {M.Plugin}
   * @param {Object} impl implementation object
   * @api
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
     * Plugin name
     * @public
     * @type {String}
     */
    this.name = 'printviewmanagement';

    /**
     * Plugin parameters
     * @public
     * @type {Object}
     */
    this.options = options;

    /**
     * Position of the plugin
     *
     * @private
     * @type {String} TL | TR | BL | BR
     */
    this.position_ = options.position || 'TL';

    /**
     * Option to allow the plugin to be collapsed or not
     * @private
     * @type {Boolean}
     */
    this.collapsed = !M.utils.isUndefined(options.collapsed) ? options.collapsed : true;

    /**
     * Option to allow the plugin to be collapsible or not
     * @private
     * @type {Boolean}
     */
    this.collapsible = !M.utils.isUndefined(options.collapsible) ? options.collapsible : true;

    /**
     * Tooltip of plugin
     * @private
     * @type {String}
     */
    this.tooltip_ = options.tooltip || getValue('tooltip');

    /**
     * Option to allow the plugin to be draggable or not
     * @private
     * @type {Boolean}
     */
    this.isDraggable = options.isDraggable === true || options.isDraggable === 'true';

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
        order: 0,
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
        tooltip: 'Georeferenciar imagen',
        printTemplateUrl: 'https://componentes.cnig.es/geoprint/print/mapexport',
        printSelector: true,
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
        printTemplateUrl: 'https://componentes.cnig.es/geoprint/print/CNIG',
        // headerLegend: 'https://www.idee.es/csw-codsi-idee/images/cabecera-CODSI.png',
        filterTemplates: [],
        credits: '',
        // logo: 'https://www.idee.es/csw-codsi-idee/images/cabecera-CODSI.png',
      };
    } else if (options.printermap) {
      this.printermap = options.printermap;
    } else {
      this.printermap = false;
    }

    let serverUrl = options.serverUrl;
    if (serverUrl && serverUrl.endsWith('/geoprint/')) {
      serverUrl = serverUrl.replace('/geoprint/', '/geoprint');
    }
    this.serverUrl = serverUrl || 'https://componentes.cnig.es/geoprint';

    this.printStatusUrl = options.printStatusUrl || 'https://componentes.cnig.es/geoprint/print/status';

    this.defaultOpenControl = options.defaultOpenControl || 0;

    /**
     * Indicates order to the plugin
     * @private
     * @type {Number}
     */
    this.order = options.order >= -1 ? options.order : null;

    /**
     * Indicates if you want to use proxy in requests
     * @private
     * @type {Boolean}
     */
    this.useProxy = M.utils.isUndefined(options.useProxy) ? false : options.useProxy;

    /**
     * Stores the proxy state at plugin load time
     * @private
     * @type {Boolean}
     */
    this.statusProxy = M.useproxy;
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
    return M.language.getTranslation(lang).printviewmanagement;
  }

  /**
   * This function adds this plugin into the map
   *
   * @public
   * @function
   * @param {M.Map} map the map to add the plugin
   * @api
   */
  addTo(map) {
    this.map_ = map;
    if (this.georefImageEpsg === false && this.georefImage === false
        && this.printermap === false) {
      M.dialog.error(getValue('exception.no_controls'));
    }

    // TO-DO Cambiar por un objeto
    this.controls_.push(new PrintViewManagementControl({
      isDraggable: this.isDraggable,
      georefImageEpsg: this.georefImageEpsg,
      georefImage: this.georefImage,
      printermap: this.printermap,
      order: this.order,
      map: this.map_,
      serverUrl: this.serverUrl,
      printTemplateUrl: this.printTemplateUrl,
      printStatusUrl: this.printStatusUrl,
      defaultOpenControl: this.defaultOpenControl,
      useProxy: this.useProxy,
      statusProxy: this.statusProxy,
    }));

    this.panel_ = new M.ui.Panel('panelPrintViewManagement', {
      collapsible: this.collapsible,
      collapsed: this.collapsed,
      position: M.ui.position[this.position_],
      className: 'm-plugin-printviewmanagement',
      tooltip: this.tooltip_,
      collapsedButtonClass: 'printviewmanagement-icon-flecha-historial',
      order: this.order,
    });

    this.panel_.addControls(this.controls_);
    map.addPanels(this.panel_);
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
    const { layers, tooltip } = this.options.georefImageEpsg;

    const order = 0; // ?¿
    const georefImageEpsg = {
      layers,
      order,
      tooltip,
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
    return `${this.name}=${this.position_}*${this.collapsed}*${this.collapsible}*${this.tooltip_}*${this.isDraggable}`
      + `*${this.serverUrl}*${this.printStatusUrl}*${!!this.georefImageEpsg}*${!!this.georefImage}*${!!this.printermap}*${this.defaultOpenControl}`;
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
   * This function destroys this plugin
   *
   * @public
   * @function
   * @api
   */
  destroy() {
    this.map_.removeControls(this.controls_);
    this.map_ = null;
    this.controls_ = null;
    this.panel_ = null;
    this.name = null;
  }

  /**
   * This function compare if pluging recieved by param is instance of M.plugin.PrintViewManagement
   *
   * @public
   * @function
   * @param {M.plugin} plugin to comapre
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
        const html = M.template.compileSync(myhelp, {
          vars: {
            urlImages: `${M.config.API_IDEE_URL}plugins/printviewmanagement/images/`,
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
