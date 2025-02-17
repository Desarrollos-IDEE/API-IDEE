/**
 * @module IDEE/plugin/Locator
 */
import '../assets/css/locator';
import LocatorControl from './locatorcontrol';
import es from './i18n/es';
import en from './i18n/en';
import { getValue } from './i18n/language';
import myhelp from '../../templates/myhelp';

export default class Locator extends IDEE.Plugin {
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
    this.name = 'locator';

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
     * @type {String} TL | TR | BL | BR | TC
     */
    this.position_ = options.position || 'TR';

    /**
     * Option to allow the plugin to be collapsed or not
     * @private
     * @type {Boolean}
     */
    this.collapsed = !IDEE.utils.isUndefined(options.collapsed) ? options.collapsed : true;

    /**
     * Option to allow the plugin to be collapsible or not
     * @private
     * @type {Boolean}
     */
    this.collapsible = !IDEE.utils.isUndefined(options.collapsible) ? options.collapsible : true;

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
    this.isDraggable = !IDEE.utils.isUndefined(options.isDraggable) ? options.isDraggable : false;

    /**
     * Zoom
     * @private
     * @type {Number}
     */
    this.zoom = options.zoom || 16;

    /**
     * Type of icon to display when a punctual type result is found
     * @private
     * @type {string}
     */
    this.pointStyle = options.pointStyle || 'pinAzul';

    /**
     * Indicates if the control infocatastro is added to the plugin
     * @private
     * @type {Boolean|Object}
     */
    this.byParcelCadastre = IDEE.utils.isUndefined(options.byParcelCadastre)
      || options.byParcelCadastre === true
      ? this.getInfoCatastro()
      : options.byParcelCadastre;

    /**
     * Indicates if the control xylocator is added to the plugin
     * @private
     * @type {Boolean|Object}
     */
    this.byCoordinates = IDEE.utils.isUndefined(options.byCoordinates)
      || options.byCoordinates === true ? this.getXYLocator() : options.byCoordinates;

    /**
     * Indicates if the control ignsearchlocator is added to the plugin
     * @private
     * @type {Boolean|Object}
     */
    this.byPlaceAddressPostal = IDEE.utils.isUndefined(options.byPlaceAddressPostal)
      || options.byPlaceAddressPostal === true
      ? this.getIGNSearchLocator()
      : options.byPlaceAddressPostal;

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
    this.useProxy = IDEE.utils.isUndefined(options.useProxy) ? true : options.useProxy;

    /**
     * Stores the proxy state at plugin load time
     * @private
     * @type {Boolean}
     */
    this.statusProxy = IDEE.useproxy;
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
    return IDEE.language.getTranslation(lang).locator;
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
    if (this.byCoordinates === false && this.byParcelCadastre === false
        && this.byPlaceAddressPostal === false) {
      IDEE.dialog.error(getValue('exception.no_controls'));
    }
    this.controls_.push(new LocatorControl(
      this.isDraggable,
      this.zoom,
      this.pointStyle,
      this.byCoordinates,
      this.byParcelCadastre,
      this.byPlaceAddressPostal,
      this.order,
      this.useProxy,
      this.statusProxy,
      this.position_,
    ));
    this.map_ = map;
    if (this.position_ === 'TC') {
      this.collapsible = false;
    }
    this.panel_ = new IDEE.ui.Panel('panelLocator', {
      collapsible: this.collapsible,
      collapsed: this.collapsed,
      position: IDEE.ui.position[this.position_],
      className: 'm-plugin-locator',
      tooltip: this.tooltip_,
      collapsedButtonClass: 'locator-icon-localizacion2',
      order: this.order,
    });

    this.panel_.addControls(this.controls_);
    map.addPanels(this.panel_);

    this.locatorControl = this.controls_.find((obj) => obj.name === 'Locator');

    this.locatorControl.on('xylocator:locationCentered', (data) => {
      this.fire('xylocator:locationCentered', data);
    });

    this.locatorControl.on('ignsearchlocator:entityFound', (extent) => {
      this.fire('ignsearchlocator:entityFound', [extent]);
    });

    this.locatorControl.on('infocatastro:locationCentered', (data) => {
      this.fire('infocatastro:locationCentered', data);
    });
  }

  /**
   * This function indicates the default values
   * for the control infocatastro
   *
   * @public
   * @function
   * @returns Default values
   * @api
   */
  getInfoCatastro() {
    return {
      cadastreWMS: '',
      CMC_url: '',
      DNPPP_url: '',
      CPMRC_url: '',
    };
  }

  /**
   * This function indicates the default values
   * for the control xylocator
   *
   * @public
   * @function
   * @returns Default values
   * @api
   */
  getXYLocator() {
    return {
      projections: [
        { title: `ETRS89 ${getValue('geographic')} (4258) ${getValue('dd')}`, code: 'EPSG:4258', units: 'd' },
        { title: `WGS84 ${getValue('geographic')} (4326) ${getValue('dd')}`, code: 'EPSG:4326', units: 'd' },
        { title: `ETRS89 ${getValue('geographic')} (4258) ${getValue('dms')}`, code: 'EPSG:4258', units: 'dms' },
        { title: `WGS84 ${getValue('geographic')} (4326) ${getValue('dms')}`, code: 'EPSG:4326', units: 'dms' },
        { title: 'WGS84 Pseudo Mercator (3857)', code: 'EPSG:3857', units: 'm' },
        { title: `ETRS89 UTM ${getValue('zone')} 31N (25831)`, code: 'EPSG:25831', units: 'm' },
        { title: `ETRS89 UTM ${getValue('zone')} 30N (25830)`, code: 'EPSG:25830', units: 'm' },
        { title: `ETRS89 UTM ${getValue('zone')} 29N (25829)`, code: 'EPSG:25829', units: 'm' },
        { title: `ETRS89 UTM ${getValue('zone')} 28N (25828)`, code: 'EPSG:25828', units: 'm' },
      ],
      help: '',
    };
  }

  /**
   * This function indicates the default values
   * for the control ignsearchlocator
   *
   * @public
   * @function
   * @returns Default values
   * @api
   */
  getIGNSearchLocator() {
    return {
      maxResults: 99,
      noProcess: '',
      countryCode: '',
      reverse: true,
      resultVisibility: true,
      urlCandidates: '',
      urlFind: '',
      urlReverse: '',
    };
  }

  /**
   * Gets the API REST Parameters of the plugin
   *
   * @function
   * @public
   * @api
   */
  getAPIRest() {
    return `${this.name}=${this.position_}*${this.collapsed}*${this.collapsible}*${this.tooltip_}*${this.zoom}*${this.pointStyle}*${this.isDraggable}*${!!this.byParcelCadastre}*${!!this.byCoordinates}*${!!this.byPlaceAddressPostal}*${this.useProxy}`;
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
    this.map_.removeControls(this.controls_);
    this.map_ = null;
    this.controls_ = null;
    this.panel_ = null;
    this.name = null;
  }

  /**
   * This function compare if pluging recieved by param is instance of IDEE.plugin.Locator
   *
   * @public
   * @function
   * @param {IDEE.plugin} plugin to comapre
   * @api
   */
  equals(plugin) {
    return plugin instanceof Locator;
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
            urlImages: `${IDEE.config.API_IDEE_URL}plugins/locator/images/`,
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
            },
          },
        });
        success(html);
      }),
    };
  }
}
