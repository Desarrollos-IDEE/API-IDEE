/**
 * @module IDEE/plugin/StoryMap
 */
import '../assets/css/storymap';
import '../assets/css/fonts';
import api from '../../api';
import StoryMapControl from './storymapcontrol';
import myhelp from '../../templates/myhelp';
import { getValue } from './i18n/language';

import es from './i18n/es';
import en from './i18n/en';

export default class StoryMap extends IDEE.Plugin {
  /**
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
     * Position of the plugin
     * @private
     * @type {string}
     */
    this.position_ = options.position || 'TR';

    /**
     * This parameter set if the plugin is collapsed
     * @private
     * @type {boolean}
     */
    this.collapsed_ = options.collapsed === true;

    /**
     * Metadata from api.json
     * @private
     * @type {Object}
     */
    this.metadata_ = api.metadata;

    /**
     * Plugin tooltip
     *
     * @private
     * @type {string}
     */
    this.tooltip_ = options.tooltip || getValue('tooltip');

    /**
    * JSON HTML
    *
    * @private
    * @type {string}
    */
    this.content_ = options.content || {};

    /**
       * Delay auto move scroll
       *
       * @private
       * @type {string}
       */
    this.delay = options.delay || 2000;

    /**
      * collapsible panel
      *
      * @private
      * @type {string}
      */
    this.collapsible = options.collapsible || false;

    /**
     * Content of index
     * @private
     * @type {Object}
     */
    this.indexInContent = options.indexInContent || false;

    /**
     * Options of the plugin
     * @private
     * @type {Object}
     */
    this.options_ = options;

    /**
     * Option to allow the plugin to be draggable or not
     * @private
     * @type {Boolean}
     */
    this.isDraggable = !IDEE.utils.isUndefined(options.isDraggable) ? options.isDraggable : false;
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
    return IDEE.language.getTranslation(lang).storymap;
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
    // TO DO Parametrizar indice y poner que sea un max de x minimo
    this.control = new StoryMapControl(
      this.content_[IDEE.language.getLang()],
      this.delay,
      this.indexInContent,
      this.isDraggable,
    );
    this.map_ = map;
    window.map = map;
    window.mapjs = map;

    this.panel_ = new IDEE.ui.Panel('panelStoryMap', {
      collapsible: this.collapsible,
      position: IDEE.ui.position[this.position_],
      collapsedButtonClass: 'icon-capas2',
      className: 'm-plugin-storymap',
      tooltip: this.tooltip_,
      collapsed: this.collapsed_,
    });
    this.panel_.addControls([this.control]);
    map.addPanels(this.panel_);

    // No funciona en el cervantes
    // map.on(IDEE.evt.ADDED_LAYER, () => {
    //   this.control.render();
    // });

    // map.on(IDEE.evt.COMPLETED, () => {
    //   this.control.render();
    // });
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
   * Name of the plugin
   *
   * @getter
   * @function
   */
  get name() {
    return 'storymap';
  }

  /**
   * Collapsed parameter
   *
   * @getter
   * @function
   */
  get collapsed() {
    return this.panel_.isCollapsed();
  }

  /**
   * Get the API REST Parameters of the plugin
   *
   * @function
   * @public
   * @api
   */
  getAPIRest() {
    return `${this.name}=${this.position}*${this.collapsed}*${this.tooltip}*${this.delay}*${this.isDraggable}`;
  }

  /**
   * Gets the API REST Parameters in base64 of the plugin
   *
   * @function
   * @public
   * @api
   */
  getAPIRestBase64() {
    return `${this.name}=base64=${IDEE.utils.encodeBase64(this.options_)}`;
  }

  /**
   * This function compares plugins
   *
   * @public
   * @function
   * @param {IDEE.Plugin} plugin to compare
   * @api
   */
  equals(plugin) {
    return plugin instanceof StoryMap;
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
    this.map_.removeControls(this.control);
    [this.map_, this.control, this.panel_] = [null, null, null];
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
            urlImages: `${IDEE.config.API_IDEE_URL}plugins/storymap/images/`,
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
            },
          },
        });
        success(html);
      }),
    };
  }
}
