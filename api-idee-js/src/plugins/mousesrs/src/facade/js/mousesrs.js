/**
 * @module IDEE/plugin/MouseSRS
 */
import '../assets/css/fonts';
import '../assets/css/mousesrs';
import MouseSRSControl from './mousesrscontrol';
import { getValue } from './i18n/language';
import myhelp from '../../templates/myhelp';

import es from './i18n/es';
import en from './i18n/en';

const MODE_VALUES = ['wcs', 'ogcapicoverage'];
const DEFAULT_COVERAGE_PRECISSIONS = [
  {
    url: 'https://api-coverages.idee.es/collections/EL.ElevationGridCoverage_4326_1000/coverage',
    minzoom: 0,
    maxzoom: 11,
  },
  {
    url: 'https://api-coverages.idee.es/collections/EL.ElevationGridCoverage_4326_500/coverage',
    minzoom: 12,
    maxzoom: 28,
  },
];

export default class MouseSRS extends IDEE.Plugin {
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
    super('mousesrs', {
      position: options.position ?? 'down',
      tooltip: options.tooltip ?? getValue('tooltip'),
      order: options.order,
    });

    /**
     * Plugin parameters
     * @public
     * @type {object}
     */
    this.options = options;

    /**
     * Position of the plugin
     * @private
     * @type {String}
     * @default down
     */
    this.position = options.position || 'down';

    /**
     * Plugin tooltip
     * @private
     * @type {string}
     * @default Coordenadas
     */
    this.tooltip = options.tooltip || getValue('tooltip');

    /**
     * Option to show the SRS of the selected EPSG
     * @private
     * @type {Boolean}
     * @default false
     */
    this.epsgFormat = options.epsgFormat === true;

    /**
     * EPSG on which the coordinates are shown
     * @private
     * @type {string}
     * @default EPSG:4326
     */
    this.srs = options.srs || 'EPSG:4326';

    /**
     * Label with SRS name
     * @private
     * @type {string}
     * @default WGS84
     */
    this.label = options.label || 'WGS84';

    /**
     * Precision of coordinates. Only works if geoDecimalDigits and utmDecimalDigits are undefined
     * @private
     * @type {number}
     * @default 4
     */
    this.precision = IDEE.utils.isNullOrEmpty(options.precision) ? 4 : options.precision;

    /**
     * Coordinates decimal digits for geographical projections
     * @private
     * @type {number}
     * @default undefined
     */
    this.geoDecimalDigits = options.geoDecimalDigits;

    /**
     * Coordinates decimal digits for UTM projections
     * @private
     * @type {number}
     * @default undefined
     */
    this.utmDecimalDigits = options.utmDecimalDigits;

    /**
     * Activate viewing z value
     * @private
     * @type {boolean}
     * @default false
     */
    this.activeZ = options.activeZ || false;

    /**
     * Help URL accessible via the help icon in the modal
     * @private
     * @type {string}
     * @default undefined
     */
    this.helpUrl = options.helpUrl;

    /**
     * Service to use for Z value
     * @private
     * @type {string}
     * @default wcs
     */
    this.mode = MODE_VALUES.includes(options.mode) ? options.mode : MODE_VALUES[0];

    /**
     * Object of coverage services with their min and max zooms
     * @private
     * @type {Object}
     * @default DEFAULT_COVERAGE_PRECISSIONS
     */
    this.coveragePrecissions = options.coveragePrecissions || DEFAULT_COVERAGE_PRECISSIONS;
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
    return IDEE.language.getTranslation(lang).mousesrs;
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

    this.control = new MouseSRSControl({
      position: this.position,
      order: this.order,
      tooltip: this.tooltip,
      srs: this.srs,
      label: this.label,
      precision: this.precision,
      geoDecimalDigits: this.geoDecimalDigits,
      utmDecimalDigits: this.utmDecimalDigits,
      activeZ: this.activeZ,
      helpUrl: this.helpUrl,
      mode: this.mode,
      coveragePrecissions: this.coveragePrecissions,
      epsgFormat: this.epsgFormat,
    });

    this.controls.push(this.control);

    this.panel = new IDEE.ui.panels.CollapsiblePanel('panelMouseSRS', {
      collapsible: false,
      tooltip: this.tooltip,
      className: 'm-plugin-mousesrs',
      order: this.order,
      position: this.position,
    });

    this.control.setPanel(this.panel);
    map.addControls(this.controls);
  }

  /**
   * This function destroys this plugin
   *
   * @public
   * @function
   * @api
   */
  destroy() {
    this.control.setPanel(null);
    this.map.removeControls(this.controls);
    this.map.removePanel(this.panel);
  }

  /**
   * Get the API REST Parameters of the plugin
   *
   * @function
   * @public
   * @api
   */
  getAPIRest() {
    return `${this.name}=${IDEE.utils.serializeUrlParams(this.options)}`;
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
            urlImages: `${IDEE.config.API_IDEE_URL}plugins/mousesrs/images/`,
            translations: {
              help1: getValue('textHelp.help1'),
              help2: getValue('textHelp.help2'),
              help3: getValue('textHelp.help3'),
              help4: getValue('textHelp.help4'),
              help5: getValue('textHelp.help5'),
              help6: getValue('textHelp.help6'),
              help7: getValue('textHelp.help7'),
              help8: getValue('textHelp.help8'),
            },
          },
        });
        success(html);
      }),
    };
  }
}
