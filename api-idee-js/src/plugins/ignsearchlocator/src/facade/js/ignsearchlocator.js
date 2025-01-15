/**
 * @module M/plugin/IGNSearchLocator
 */
import '../assets/css/ignsearchlocator';
import '../assets/css/fonts';
import api from '../../api';
import geographicNameType from './constants';
import IGNSearchLocatorControl from './ignsearchlocatorcontrol';
import { getValue } from './i18n/language';

import es from './i18n/es';
import en from './i18n/en';

/** IGNSearch List Control
*
* @private
* @type {object}
*/
const IGNSEARCH_TYPES_CONFIGURATION = [
  'Estado',
  // 'Comunidad aut\u00F3noma',
  // 'Ciudad con estatuto de autonom\u00EDa',
  // 'Provincia',
  // 'Municipio',
  // 'EATIM',
  'Isla administrativa',
  'Comarca administrativa',
  'Jurisdicci\u00F3n',
  // 'Capital de Estado',
  // 'Capital de comunidad aut\u00F3noma y ciudad con estatuto de autonom\u00EDa',
  // 'Capital de provincia',
  // 'Capital de municipio',
  // 'Capital de EATIM',
  // 'Entidad colectiva',
  // 'Entidad menor de poblaci\u00F3n',
  // 'Distrito municipal',
  // 'Barrio',
  // 'Entidad singular',
  // 'Construcci\u00F3n/instalaci\u00F3n abierta',
  // 'Edificaci\u00F3n',
  'V\u00E9rtice Geod\u00E9sico',
  // 'Hitos de demarcaci\u00F3n territorial',
  // 'Hitos en v\u00EDas de comunicaci\u00F3n',
  'Alineaci\u00F3n monta\u00F1osa',
  'Monta\u00F1a',
  'Paso de monta\u00F1a',
  'Llanura',
  'Depresi\u00F3n',
  'Vertientes',
  'Comarca geogr\u00E1fica',
  'Paraje',
  'Elemento puntual del paisaje',
  'Saliente costero',
  'Playa',
  'Isla',
  'Otro relieve costero',
  // 'Parque Nacional y Natural',
  // 'Espacio protegido restante',
  // 'Aeropuerto',
  // 'Aer\u00F3dromo',
  // 'Pista de aviaci\u00F3n y helipuerto',
  // 'Puerto de Estado',
  // 'Instalaci\u00F3n portuaria',
  // 'Carretera',
  // 'Camino y v\u00EDa pecuaria',
  // 'V\u00EDa urbana',
  // 'Ferrocarril',
  'Curso natural de agua',
  'Masa de agua',
  'Curso artificial de agua',
  // 'Embalse',
  'Hidr\u00F3nimo puntual',
  'Glaciares',
  'Mar',
  'Entrante costero y estrecho mar\u00EDtimo',
  'Relieve submarino',
];

export default class IGNSearchLocator extends M.Plugin {
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
  constructor(options) {
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
     * This variable indicates which services should be searched
     * (geocoder, nomenclator or both)
     * @private
     * @type {string} - 'g' | 'n' | 'gn'
     */
    this.servicesToSearch = options.servicesToSearch || 'gn';

    /**
     * CMC_url
     * @private
     * @type {String}
     */
    const defectCMC = 'http://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejeroCodigos.asmx/ConsultaMunicipioCodigos';
    this.CMC_url = options.CMC_url != null ? options.CMC_url : defectCMC;

    /**
     * DNPPP_url
     * @private
     * @type {String}
     */
    const defectDNPP = 'http://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejeroCodigos.asmx/Consulta_DNPPP_Codigos';
    this.DNPPP_url = options.DNPPP_url != null ? options.DNPPP_url : defectDNPP;

    /**
     * CPMRC_url
     * @private
     * @type {String}
     */
    const defectCPMRC = 'http://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCoordenadas.asmx/Consulta_CPMRC';
    this.CPMRC_url = options.CPMRC_url != null ? options.CPMRC_url : defectCPMRC;

    /**
     * catastroWMS
     * @private
     * @type {string}
     */
    this.catastroWMS = options.catastroWMS || 'http://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCoordenadas.asmx/Consulta_RCCOOR';

    /**
     * This variable sets the maximun results returned by a service
     * (if both services are searched the maximum results will be twice this number)
     * @private
     * @type {number}
     */
    this.maxResults = options.maxResults || 10;

    /**
     * This variables indicates which entities shouldn't be searched
     * @private
     * @type {string} - 'municipio' | 'poblacion' | 'toponimo' | 'municipio,poblacion' | etc
     */
    this.noProcess = options.noProcess || 'poblacion';

    /**
     * This variable indicates the country code.
     * @private
     * @type {string} - 'es'
     */
    this.countryCode = options.countryCode || 'es';

    /**
     * This variable indicates Geocoder Candidates service url
     * @private
     * @type {string}
     */
    this.urlCandidates = options.urlCandidates || 'https://www.cartociudad.es/geocoder/api/geocoder/candidatesJsonp';

    /**
     * This variable indicates Geocoder Find service url
     * @private
     * @type {string}
     */
    this.urlFind = options.urlFind || 'https://www.cartociudad.es/geocoder/api/geocoder/findJsonp';

    /**
     * This variable indicates Geocoder Reverse service url
     * @private
     * @type {string}
     */
    this.urlReverse = options.urlReverse || 'https://www.cartociudad.es/geocoder/api/geocoder/reverseGeocode';

    /**
     * This variable indicates Nomenclator url prefix
     * @private
     * @type {string}
     */
    this.urlPrefix = options.urlPrefix || 'http://www.idee.es/';

    /**
     * This variable indicates Nomenclator SearchAssistant service url
     * @private
     * @type {string}
     */
    this.urlAssistant = options.urlAssistant || 'https://www.idee.es/communicationsPoolServlet/SearchAssistant';

    /**
     * This variable indicates Nomenclator Dispatcher service url
     * @private
     * @type {string}
     */
    this.urlDispatcher = options.urlDispatcher || 'https://www.idee.es/communicationsPoolServlet/Dispatcher';

    /**
     * This variable indicates which entity types should be searched on Nomenclator service.
     * @private
     * @type {Array<string>}
     */
    this.nomenclatorSearchType = IGNSEARCH_TYPES_CONFIGURATION || geographicNameType;

    /**
     * This variable indicates whether result geometry should be drawn on map.
     * @private
     * @type {boolean}
     */
    this.resultVisibility = options.resultVisibility || true;

    /**
     * This variable indicates whether the plugin can be collapsed.
     * @private
     * @type {boolean}
     */
    this.isCollapsed = options.isCollapsed || false;

    /**
     * This variable indicates whether the plugin can be collapsible.
     * @private
     * @type {boolean}
     */
    this.collapsible = options.collapsible || false;

    /**
     * This variable indicates plugin's position on window
     * @private
     * @type {string} { 'TL' | 'TR' | 'BL' | 'BR' } (corners)
     */
    this.position = options.position || 'TL';

    /**
     * This variable indicates Nomenclator SearchAssistant service url
     * @private
     * @type {string}
     */
    this.pointStyle = options.pointStyle || 'pinBlanco';

    /**
     * @private
     * @type {string} - tooltip on hover on plugin button
     */
    this.tooltip_ = options.tooltip || getValue('tooltip');

    /**
     * @private
     * @type {boolean}
     */
    this.reverse_ = options.reverse || false;

    /**
     * Text to search
     * Text to search
     * @private
     * @type {string}
     */
    this.locationID_ = (options.locationID && options.locationID.replace(/\^/g, '&')) || '';

    /**
     * Text to search
     * @private
     * @type {string}
     */
    this.requestStreet_ = (options.requestStreet && options.requestStreet.replace(/\^/g, '&')) || '';

    let geocoderCoords = options.geocoderCoords;
    if (M.utils.isString(geocoderCoords)) {
      geocoderCoords = geocoderCoords.split(',');
      geocoderCoords = [Number.parseFloat(geocoderCoords[0]),
        Number.parseFloat(geocoderCoords[1]),
      ];
    }

    /**
     * Geocoder reverse coordinates
     *
     * @private
     * @type {number}
     */
    this.geocoderCoords_ = geocoderCoords || [];

    /**
     * Metadata from api.json
     * @private
     * @type {Object}
     */
    this.metadata_ = api.metadata;

    /**
     * Zoom to do
     *
     * @private
     * @type {string / number}
     */
    this.zoom_ = 16;
    if (options.zoom !== undefined) {
      this.zoom_ = parseInt(options.zoom, 10);
    }

    /**
     * This variable indicates Nomenclator SearchAssistant service url
     * @private
     * @type {string}
     */
    this.searchPosition = options.searchPosition || 'nomenclator,geocoder';

    /**
     * URL to the help for the icon
     * @private
     * @type {string}
     */
    this.helpUrl = options.helpUrl;

    /**
     * @private
     * @type {Boolean}
     */

    this.cadastre = options.cadastre;
    if (options.cadastre !== undefined) {
      this.cadastre = true;
    }

    /**
     * @private
     * @type {Boolean}
     */

    this.searchCoordinatesXYZ = options.searchCoordinatesXYZ;
    if (options.searchCoordinatesXYZ !== undefined) {
      this.searchCoordinatesXYZ = true;
    }

    /**
     *@private
     *@type { Number }
     */
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
    return M.language.getTranslation(lang).ignsearchlocator;
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
    this.controls_.push(new IGNSearchLocatorControl(
      this.servicesToSearch,
      this.CMC_url,
      this.DNPPP_url,
      this.CPMRC_url,
      this.catastroWMS,
      this.maxResults,
      this.noProcess,
      this.countryCode,
      this.urlCandidates,
      this.urlFind,
      this.urlReverse,
      this.urlPrefix,
      this.urlAssistant,
      this.urlDispatcher,
      this.resultVisibility,
      this.reverse_,
      this.locationID_,
      this.requestStreet_,
      this.geocoderCoords_,
      this.zoom_,
      this.searchPosition,
      this.position,
      this.pointStyle,
      this.nomenclatorSearchType,
      this.helpUrl,
      this.cadastre,
      this.searchCoordinatesXYZ,
      this.order,
    ));
    this.controls_[0].on('ignsearchlocator:entityFound', (extent) => {
      this.fire('ignsearchlocator:entityFound', [extent]);
    });
    this.controls_[0].on('xylocator:locationCentered', (data) => {
      this.fire('xylocator:locationCentered', data);
    });
    this.map_ = map;
    if (this.position === 'TC') {
      this.collapsible = false;
    }
    this.panel_ = new M.ui.Panel('IGNSearchLocator', {
      collapsible: this.collapsible,
      position: M.ui.position[this.position],
      collapsed: this.isCollapsed,
      className: 'ign-searchlocator-panel',
      collapsedButtonClass: 'icon-ignsearch',
      tooltip: this.tooltip_,
      order: this.order,
    });
    this.panel_.addControls(this.controls_);
    map.addPanels(this.panel_);
  }

  /**
   * This function sets geometry visibility on map (visible|invisible).
   * @public
   * @function
   * @param {boolean} flag
   * @api
   */
  setResultVisibility(flag) {
    this.controls_[0].setResultVisibility(flag);
  }

  /**
   * Name of the plugin
   *
   * @getter
   * @function
   */
  get name() {
    return 'ignsearchlocator';
  }

  /**
   * Reverse parameter
   *
   * @getter
   * @function
   */
  get reverse() {
    return this.reverse_;
  }

  /**
   * Reverse geocoder coordinates
   *
   * @getter
   * @function
   */
  get geocoderCoords() {
    return this.controls_[0].geocoderCoords;
  }

  /**
   * Text to search
   * @getter
   * @function
   */
  get requestStreet() {
    return this.controls_[0].requestStreet;
  }

  /**
   * Text to search
   * @getter
   * @function
   */
  get locationID() {
    return this.controls_[0].locationID;
  }

  /**
   * This function compares plugins
   *
   * @public
   * @function
   * @param {M.Plugin} plugin to compare
   * @api
   */
  equals(plugin) {
    return plugin instanceof IGNSearchLocator;
  }

  /**
   * Get the API REST Parameters of the plugin
   *
   * @function
   * @public
   * @api
   */
  getAPIRest() {
    return `${this.name}=${this.position}*${this.collapsible}*${this.isCollapsed}*${this.order}*${this.tooltip_}*${this.servicesToSearch}*${this.maxResults}*${this.noProcess}*${this.resultVisibility}*${this.reverse_}*${this.requestStreet_}*${this.locationID_}*${this.geocoderCoords_}*${this.zoom_}*${this.searchPosition}*${this.pointStyle}*${this.helpUrl}*${this.countryCode}*${this.cadastre}*${this.searchCoordinatesXYZ}*${this.urlCandidates}*${this.urlFind}*${this.urlReverse}*${this.urlPrefix}*${this.urlAssistant}*${this.urlDispatcher}*${this.CMC_url}*${this.DNPPP_url}*${this.CPMRC_url}*${this.catastroWMS}`;
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
    this.map_.removeControls(this.controls_);
    [this.map_, this.controls_, this.panel_] = [null, null, null];
  }
}
