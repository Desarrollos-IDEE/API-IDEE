/**
 * @module M/plugin/Lyrdropdown
 */

import 'assets/css/lyrdropdown';
import LyrdropdownControl from './lyrdropdowncontrol';
import api from '../../api';
import { getValue } from './i18n/language'; // e2m: Multilanguage support

export default class Lyrdropdown extends M.Plugin {
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
    this.name_ = 'lyrdropdown';

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
    this.className = 'm-plugin-lyrdropdown';

    /**
     * Position of the Plugin
     * @public
     * Posible values: TR | TL | BL | BR
     * @type {String}
     */
    const positions = ['TR', 'TL', 'BL', 'BR'];
    this.position = positions.includes(options.position) ? options.position : 'TR';

    /**
     * Collapsed attribute
     * @public
     * @type {boolean}
     */
    this.collapsed = options.collapsed;
    if (this.collapsed === undefined) this.collapsed = true;

    /**
     * Collapsible attribute
     * @public
     * @type {boolean}
     */
    this.collapsible = options.collapsible;
    if (this.collapsible === undefined) this.collapsible = true;

    /**
     * Layer names that will have effects
     * @public
     * Value: the names separated with coma
     * @type {string}
     */
    this.layers = [];
    if (options.layers === undefined) {
      M.dialog.error('No se ha especificado una capa válida sobre la que aplicar el efecto');
    } else if (Array.isArray(options.layers)) {
      this.layers = options.layers;
    } else {
      this.layers = options.layers.split(',');
    }

    /**
     * Nivel mínimo en el que empiezan a cargarse las capas
     * Value: number in range 10 - 1000
     * @type {number}
     * @public
     */
    this.lyrsMirrorMinZindex = options.lyrsMirrorMinZindex;
    if (this.lyrsMirrorMinZindex === undefined) this.lyrsMirrorMinZindex = 100;

    /**
     *@private
     *@type { string }
     */
    this.tooltip_ = options.tooltip || getValue('tooltip');

    /**
     * Metadata from api.json
     * @private
     * @type {Object}
     */
    this.metadata_ = api.metadata;
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
    const pluginOnLeft = !!(['TL', 'BL'].includes(this.position));
    this.control_ = new LyrdropdownControl({
      pluginOnLeft,
      collapsible: this.collapsible,
      collapsed: this.collapsed,
      layers: this.layers,
      lyrsMirrorMinZindex: this.lyrsMirrorMinZindex,
    });

    this.controls_.push(this.control_);
    this.map_ = map;
    // panel para agregar control - no obligatorio
    this.panel_ = new M.ui.Panel('panelLyrdropdown', {
      collapsible: this.collapsible,
      collapsed: this.collapsed,
      position: M.ui.position[this.position], // M.ui.position.TR
      collapsedButtonClass: 'g-cartografia-flecha-izquierda',
      tooltip: this.tooltip_,
    });

    this.panel_.addControls(this.controls_);
    map.addPanels(this.panel_);
  }

  /**
   * This function destroys this plugin
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {
    this.map_.removeControls([this.control_]);
    [this.control_, this.panel_, this.map_, this.collapsible, this.collapsed, this.layers] = [
      null, null, null, null, null, null];
  }

  setDisabledLyrs(lyrList) {
    if (this.control_ === undefined) {
      return;
    }
    if (this.control_.template === null) {
      return;
    }
    try {
      let optionLyrs = null;
      optionLyrs = this.control_.template.querySelector('#m-lyrdropdown-selector');
      optionLyrs.options[2].disabled = true;
      // eslint-disable-next-line no-plusplus
      for (let iOpt = 1; iOpt < optionLyrs.options.length; iOpt++) {
        optionLyrs.options[iOpt].disabled = !lyrList.includes(optionLyrs.options[iOpt].value);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(error);
    }
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
   * @function
   * @api stable
   */
  getMetadata() {
    return this.metadata_;
  }

  /**
   * Get the API REST Parameters of the plugin
   *
   * @function
   * @public
   * @api
   */
  getAPIRest() {
    return `${this.name}=${this.position}*${this.collapsible}*${this.collapsed}*${this.layers.join(',')}`;
  }

  /**
   * Activate plugin
   *
   * @function
   * @public
   * @api
   */
  activate() {
    this.control_.activate();
  }

  /**
   * Desactivate plugin
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
   *
   * @public
   * @function
   * @param {M.plugin} plugin to compare
   * @api stable
   */
  equals(plugin) {
    return plugin instanceof Lyrdropdown;
  }
}
