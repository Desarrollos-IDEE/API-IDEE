/**
 * @module M/plugin/PredefinedZoom
 */
import 'assets/css/predefinedzoom';
import PredefinedZoomControl from './predefinedzoomcontrol';
import api from '../../api';

import es from './i18n/es';
import en from './i18n/en';

export default class PredefinedZoom extends M.Plugin {
  /**
   * @classdesc
   * Main facade plugin object. This class creates a plugin
   * object which has an implementation Object
   *
   * @constructor
   * @extends {M.Plugin}
   * @param {Object} impl implementation object
   * @api stable
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
     * This variable indicates plugin's position on window
     * @private
     * @type {string} { 'TL' | 'TR' | 'BL' | 'BR' } (corners)
     */
    this.position_ = options.position || 'TL';

    /**
     * Bbox entered by user.
     * @public
     * @type {Array<Object>} [ {name, bbox}, {...} ]
     */
    this.savedZooms = options.savedZooms;

    /**
     * Plugin name
     * @public
     * @type {String}
     */
    this.name = 'predefinedzoom';

    /**
     * Saved zooms names.
     * @public
     * @type {String}
     */
    this.names = options.names || '';

    /**
     * Saved zooms bboxes.
     * @public
     * @type {String}
     */
    this.boxes = options.boxes || [];

    /**
     * Metadata from api.json
     * @private
     * @type {Object}
     */
    this.metadata_ = api.metadata;
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
    return M.language.getTranslation(lang).predefinedzoom;
  }

  /**
   * This function adds this plugin into the map
   *
   * @public
   * @function
   * @param {M.Map} map the map to add the plugin
   * @api stable
   */
  addTo(map) {
    const zooms = this.savedZooms === undefined ? this.turnUrlIntoZooms() : this.savedZooms;
    this.control_ = new PredefinedZoomControl(zooms);
    this.controls_.push(this.control_);
    this.map_ = map;
    this.panel_ = new M.ui.Panel('PredefinedZoom', {
      collapsible: false,
      position: M.ui.position[this.position_],
      className: 'm-predefinedzoom',
    });
    this.panel_.addControls(this.controls_);
    map.addPanels(this.panel_);
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
    [this.map_, this.control_, this.panel_] = [null, null, null];
  }

  /**
   * Turns saved zooms object into string.
   * @public
   * @function
   * @api
   */
  turnZoomsIntoUrl() {
    let names = '';
    let boxes = '';

    this.savedZooms.forEach((zoomObject, idx) => {
      if (idx > 0) {
        names += ',';
        boxes += ',';
      }
      names += zoomObject.name;
      zoomObject.bbox.forEach((coord, index) => {
        if (index > 0) {
          boxes += 'coma';
        }
        boxes += coord;
      });
    });

    return `${names}*${boxes}`;
  }

  /**
   * Turns string received by rest request into zooms object.
   * @public
   * @function
   * @api
   */
  turnUrlIntoZooms() {
    const myZooms = [];

    const names = this.names.split(',');
    const boxes = this.boxes.split(',');

    names.forEach((name, idx) => {
      myZooms.push({ name });
    });
    boxes.forEach((box, index) => {
      myZooms[index].bbox = [];
      const coordinates = box.split('coma');
      coordinates.forEach((c) => {
        myZooms[index].bbox.push(c);
      });
    });

    return myZooms;
  }

  /**
   * Gets the API REST Parameters of the plugin
   *
   * @function
   * @public
   * @api
   */
  getAPIRest() {
    const zooms = this.savedZooms === undefined ? `${this.names}*${this.boxes}` : this.turnZoomsIntoUrl();
    return `${this.name}=${this.position_}*${zooms}`;
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
}
