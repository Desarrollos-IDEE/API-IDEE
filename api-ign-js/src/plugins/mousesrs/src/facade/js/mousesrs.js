/**
 * @module M/plugin/MouseSRS
 */
import 'assets/css/mousesrs';
import MouseSRSControl from './mousesrscontrol';

export default class MouseSRS extends M.Plugin {
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
     * Position of the plugin
     *
     * @private
     * @type {string} - TL | TR | BL | BR
     */
    this.position_ = options.position || 'BL';

    /**
     * Plugin tooltip
     *
     * @private
     * @type {string}
     */
    this.tooltip_ = options.tooltip || 'Muestra coordenadas';

    /**
     * Shown coordinates SRS
     *
     * @private
     * @type {string}
     */
    this.srs_ = options.srs || 'EPSG:4326';

    /**
     * @private
     * @type {string}
     */
    this.label_ = options.label || 'WGS84';

    /**
     * Precision of coodinates
     *
     * @private
     * @type {number}
     */
    this.precision_ = M.utils.isNullOrEmpty(options.precision) ? 4 : options.precision;
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
    this.controls_.push(new MouseSRSControl(this.srs_, this.label_, this.precision));
    this.map_ = map;
    this.panel_ = new M.ui.Panel('panelMouseSRS', {
      collapsible: false,
      position: M.ui.position[this.position_],
      tooltip: this.tooltip_,
      className: 'm-plugin-mousesrs',
    });
    map.addControls(this.controls_);
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
    return `${this.name}=${this.position}*${this.tooltip_}*${this.srs}*${this.label}*${this.precision}`;
  }
}
