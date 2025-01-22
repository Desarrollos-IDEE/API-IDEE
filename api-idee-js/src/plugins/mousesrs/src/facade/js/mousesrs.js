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
     * Plugin tooltip
     *
     * @private
     * @type {string}
     */
    this.tooltip_ = options.tooltip || getValue('tooltip');

    this.epsgFormat = options.epsgFormat === true;

    /**
     * Shown coordinates SRS
     *
     * @private
     * @type {string}
     */
    this.srs_ = options.srs || 'EPSG:4326';

    /**
     * Label with SRS name
     * @private
     * @type {string}
     */
    this.label_ = options.label || 'WGS84';

    /**
     * Precision of coordinates
     *
     * @private
     * @type {number}
     */
    this.precision_ = IDEE.utils.isNullOrEmpty(options.precision) ? 4 : options.precision;

    /**
     * Coordinates decimal digits for geographical projections
     * @private
     * @type {number}
     */
    this.geoDecimalDigits = options.geoDecimalDigits;

    /**
     * Coordinates decimal digits for UTM projections
     * @private
     * @type {number}
     */
    this.utmDecimalDigits = options.utmDecimalDigits;

    /**
     * Activate viewing z value
     * @private
     * @type {boolean}
     */
    this.activeZ = options.activeZ || false;

    /**
     * Draggable dialog
     */
    this.draggableDialog = options.draggableDialog === undefined ? true : options.draggableDialog;

    /**
     * URL to the help for the icon
     * @private
     * @type {string}
     */
    this.helpUrl = options.helpUrl;

    /**
     *@private
     *@type { Number }
     */
    this.order = options.order >= -1 ? options.order : null;

    /**
     * Service to use for Z value
     * Values: wcs, ogc
     * @private
     * @type {string}
     */
    this.mode = MODE_VALUES.includes(options.mode) ? options.mode : MODE_VALUES[0];

    this.coveragePrecissions = options.coveragePrecissions || DEFAULT_COVERAGE_PRECISSIONS;

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
    this.control_ = new MouseSRSControl(
      this.srs_,
      this.label_,
      this.precision_,
      this.geoDecimalDigits,
      this.utmDecimalDigits,
      this.tooltip_,
      this.activeZ,
      this.helpUrl,
      this.mode,
      this.coveragePrecissions,
      this.order,
      this.draggableDialog,
      this.epsgFormat,
    );
    this.controls_.push(this.control_);
    this.map_ = map;
    this.panel_ = new IDEE.ui.Panel('panelMouseSRS', {
      collapsible: false,
      tooltip: this.tooltip_,
      className: 'm-plugin-mousesrs',
      order: this.order,
    });
    map.addControls(this.controls_);
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
    this.map_ = null;
    this.control_ = null;
    this.panel_ = null;
  }

  /**
   * Name of the plugin
   *
   * @getter
   * @function
   */
  get name() {
    return 'mousesrs';
  }

  /**
   * This function returns the position
   *
   * @public
   * @return {string}
   * @api
   */
  get position() {
    return this.position_;
  }

  /**
   * This function returns the label
   *
   * @public
   * @function
   * @api
   */
  get label() {
    return this.label_;
  }

  /**
   * This function returns the srs (Spatial Reference System)
   *
   * @public
   * @function
   * @api
   */
  get srs() {
    return this.srs_;
  }

  /**
   * Precision of coordinates
   * @public
   * @function
   * @api
   */
  get precision() {
    return this.precision_;
  }

  /**
   * Get the API REST Parameters of the plugin
   *
   * @function
   * @public
   * @api
   */
  getAPIRest() {
    let cadena = `${this.name}=${this.tooltip_}*${this.srs_}*${this.label_}*${this.precision_}`;

    if (this.geoDecimalDigits === undefined || this.geoDecimalDigits == null || this.geoDecimalDigits === '') {
      cadena += '*';
    } else {
      cadena += `*${this.geoDecimalDigits}`;
    }

    if (this.utmDecimalDigits === undefined || this.utmDecimalDigits == null || this.utmDecimalDigits === '') {
      cadena += '*';
    } else {
      cadena += `*${this.utmDecimalDigits}`;
    }

    cadena += `*${this.activeZ}*${this.helpUrl}*${this.draggableDialog}*${this.epsgFormat}`;

    return cadena;
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
