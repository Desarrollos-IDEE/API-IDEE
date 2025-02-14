/**
 * @module M/plugin/Transparency
 */
import 'assets/css/cptransparency';
import TransparencyControl from './cptransparencycontrol';
import api from '../../api';
import { getValue } from './i18n/language';

export default class Transparency extends M.Plugin {
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
     * Name plugin
     * @private
     * @type {String}
     */
    this.name_ = 'transparency';

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
     * Class name of the html view Plugin
     * @public
     * @type {string}
     */
    this.className = 'm-plugin-transparency';

    /**
     * Position of the Plugin
     * @public
     * Posible values: TR | TL | BL | BR
     * @type {String}
     */
    this.position = options.position;

    /**
     * Enabled key functions
     * @type {boolean}
     * @public
     */
    this.enabledKeyFunctions = options.enabledKeyFunctions;
    if (this.enabledKeyFunctions === undefined) this.enabledKeyFunctions = true;

    /**
     * Layer names that will have effects
     * @public
     * Value: the names separated with coma
     * @type {string}
     */
    if (options.layers === undefined || options.layers === '') {
      M.dialog.error(getValue('errorLayer'));
      this.layers = [];
    } else if (Array.isArray(options.layers)) {
      this.layers = options.layers;
    } else {
      this.layers = options.layers.split(',');
    }

    /**
     * Transparent effect radius
     * Value: number in range 30 - 200
     * @type {number}
     * @public
     */

    if (!Number.isNaN(parseInt(options.radius, 10))) {
      if (options.radius >= 30 && options.radius <= 200) {
        this.radius = parseInt(options.radius, 10);
      } else if (options.radius > 200) {
        this.radius = 200;
      } else if (options.radius < 30) {
        this.radius = 30;
      }
    } else {
      this.radius = 100; // Default value
    }

    /**
     * Metadata from api.json
     * @private
     * @type {Object}
     */
    this.metadata_ = api.metadata;

    this.separatorApiJson = api.url.separator;

    /**
     *@private
     *@type { string }
     */
    this.tooltip_ = options.tooltip || getValue('tooltip');

    /**
     * Collapsed attribute
     * @public
     * @type {boolean}
     */
    this.collapsed = options.collapsed || true;

    /**
     * Collapsible attribute
     * @public
     * @type {boolean}
     */
    this.collapsible = options.collapsible || true;
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
    const values = {
      layers: this.layers,
      radius: this.radius,
    };

    this.control_ = new TransparencyControl(values);
    this.controls_.push(this.control_);
    this.map_ = map;
    this.panel_ = new M.ui.Panel('panelTransparency', {
      collapsible: this.collapsible,
      collapsed: this.collapsed,
      position: M.ui.position[this.position],
      className: this.className,
      collapsedButtonClass: 'icon-gps4',
      tooltip: this.tooltip_,
    });

    this.panel_.addControls(this.controls_);
    map.addPanels(this.panel_);

    document.addEventListener('keydown', (zEvent) => {
      if (!this.enabledKeyFunctions) {
        return;
      }
      if (zEvent.ctrlKey && zEvent.shiftKey && zEvent.key === 'ArrowUp') { // case sensitive
        if (this.control_.radius >= 200) return;
        this.control_.radius += 20;
        this.control_.getImpl().setRadius(this.control_.radius);
        this.control_.template.querySelector('#input-transparent-radius').value = this.control_.radius;
      }
      if (zEvent.ctrlKey && zEvent.shiftKey && zEvent.key === 'ArrowDown') { // case sensitive
        if (this.control_.radius <= 32) return;
        this.control_.radius -= 20;
        this.control_.getImpl().setRadius(this.control_.radius);
        this.control_.template.querySelector('#input-transparent-radius').value = this.control_.radius;
      }
      if (zEvent.ctrlKey && zEvent.shiftKey && zEvent.key === 'Enter') {
        this.control_.freeze = !this.control_.freeze;
        this.control_.getImpl().setFreeze(this.control_.freeze);
        if (this.control_.freeze) {
          this.control_.template.querySelector('#m-transparency-lock').style.visibility = 'hidden';
          this.control_.template.querySelector('#m-transparency-unlock').style.visibility = 'visible';
        } else {
          this.control_.template.querySelector('#m-transparency-lock').style.visibility = 'visible';
          this.control_.template.querySelector('#m-transparency-unlock').style.visibility = 'hidden';
        }
      }
    });
  }

  manageLyrAvailable(lyrAvailable) {
    this.control_.manageLyrAvailable(lyrAvailable);
  }

  /**
   * This function destroys this plugin
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {
    this.control_.removeEffects();
    this.control_.removeTransparencyLayers(this.control_.getLayersNames());
    this.map_.removeControls([this.control_]);
    [this.control_, this.panel_, this.map_, this.layers, this.radius] = [
      null, null, null, null, null];
  }

  /**
   * This function gets name plugin
   * @getter
   * @public
   * @returns {string}
   * @api stable
   */
  get name() {
    return this.name_;
  }

  /**
   * This function gets metadata plugin
   *
   * @public
   * @getter
   * @api stable
   * @return {Object}
   */
  getMetadata() {
    return this.metadata_;
  }

  setDefaultLayer() {
    this.control_.setDefaultLayer();
  }

  /**
   * Activate plugin SpyEye
   *
   * @function
   * @public
   * @api
   */
  activate() {
    this.control_.activate();
  }

  /**
   * Desactivate plugin SpyEye
   *
   * @function
   * @public
   * @api
   */
  deactivate() {
    this.control_.deactivate();
  }

  /**
   * This
   function compare
   if pluging recieved by param is instance of M.plugin.Transparency
   *
   * @public
   * @function
   * @param {M.plugin} plugin to compare
   * @api stable
   */
  equals(plugin) {
    return plugin instanceof Transparency;
  }
}
