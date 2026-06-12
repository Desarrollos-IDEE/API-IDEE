/**
 * @module M/plugin/FilteredSearch
 */
import 'assets/css/filteredsearch';
import 'assets/css/fonts';
import api from '../../api';
import myhelp from '../../templates/myhelp.html';
import FilteredSearchControl from './filteredsearchcontrol';
import en from './i18n/en';
import es from './i18n/es';
import { getValue } from './i18n/language';

export default class FilteredSearch extends IDEE.Plugin {
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
     * Position of the plugin on browser window
     * @private
     * @type {Enum}
     * Possible values: 'TL', 'TR', 'BR', 'BL'
     */
    this.position_ = options.position || 'TR';

    /**
     * Metadata from api.json
     * @private
     * @type {Object}
     */
    this.metadata_ = api.metadata;
  }

  /**
   * Devuelve el diccionario del plugin según el idioma
   *
   * @public
   * @function
   * @param {string} lang lenguaje
   * @api stable
   */
  static getJSONTranslations(lang) {
    if (lang === 'en' || lang === 'es') {
      return (lang === 'en') ? en : es;
    }
    return IDEE.language.getTranslation(lang).filteredsearch;
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
    const pluginOnLeft = !!(['TL', 'BL'].includes(this.position_));

    const values = {
      pluginOnLeft,
    };

    this.control_ = new FilteredSearchControl(values);
    this.controls_.push(this.control_);
    this.map_ = map;

    // Dependiendo de dónde se muestre el plugin, mostrará una flecha u otra.
    const collapsedButton = 'g-plugin-filteredsearch-filter';

    // panel para agregar control - no obligatorio
    this.panel_ = new IDEE.ui.Panel('panelFilteredSearch', {
      className: 'filtered-search-panel',
      collapsible: true,
      position: IDEE.ui.position[this.position_],
      collapsedButtonClass: collapsedButton,
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
    return 'filteredsearch';
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
            urlImages: `${IDEE.config.API_IDEE_URL}plugins/filteredsearch/images/`,
            translations: {
              paragraph1: getValue('textHelp.paragraph1'),
              screenshot1Alt: getValue('textHelp.screenshot1Alt'),
              screenshot1Caption: getValue('textHelp.screenshot1Caption'),
              screenshot2Alt: getValue('textHelp.screenshot2Alt'),
              screenshot2Caption: getValue('textHelp.screenshot2Caption'),
              screenshot2Description: getValue(
                'textHelp.screenshot2Description',
              ),
            },
          },
        });
        resolve(html);
      }),
    };
  }
}
