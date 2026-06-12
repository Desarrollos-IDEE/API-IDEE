/**
 * @module M/plugin/MaxExtZoom
 */
import 'assets/css/maxextzoom';
import api from '../../api';
import myhelp from '../../templates/myhelp.html';
import en from './i18n/en';
import es from './i18n/es';
import { getValue } from './i18n/language';
import MaxExtZoomControl from './maxextzoomcontrol';

export default class MaxExtZoom extends IDEE.Plugin {
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
     * This variable indicates plugin's position on window
     * @private
     * @type {string} { 'TL' | 'TR' | 'BL' | 'BR' } (corners)
     */
    this.position = options.position || 'TL';

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
   * @param {IDEE.Map} map the map to add the plugin
   * @api stable
   */
  addTo(map) {
    this.controls_.push(new MaxExtZoomControl());
    this.map_ = map;
    // panel para agregar control - no obligatorio
    this.panel_ = new IDEE.ui.Panel('panelMaxExtZoom', {
      collapsible: false,
      position: IDEE.ui.position[this.position],
      className: 'm-maxextzoom',
      tooltip: getValue('tooltip'),
    });
    this.panel_.addControls(this.controls_);
    map.addPanels(this.panel_);
  }

  /**
   * Destroys plugin
   * @public
   * @function
   * @api
   */
  destroy() {
    this.map_.removeControls(this.controls_);
    [this.map_, this.control_, this.controls_, this.panel_] = [null, null, null, null];
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
   * @getter
   * @public
   */
  get name() {
    return 'maxextzoom';
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
    return IDEE.language.getTranslation(lang).maxextzoom;
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
      title: getValue('textHelp.squemaTitle'),
      content: new Promise((resolve) => {
        const html = IDEE.template.compileSync(myhelp, {
          vars: {
            title: getValue('textHelp.title'),
            urlImages: `${IDEE.config.API_IDEE_URL}plugins/maxextzoom/images/`,
            translations: {
              paragraph1: getValue('textHelp.paragraph1'),
              screenshot1Alt: getValue('textHelp.screenshot1Alt'),
              screenshot1Caption: getValue('textHelp.screenshot1Caption'),
              screenshot1Description: getValue(
                'textHelp.screenshot1Description',
              ),
            },
          },
        });
        resolve(html);
      }),
    };
  }
}
