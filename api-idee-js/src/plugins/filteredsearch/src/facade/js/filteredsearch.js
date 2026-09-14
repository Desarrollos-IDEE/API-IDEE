/**
 * @module IDEE/plugin/FilteredSearch
 */
import 'assets/css/filteredsearch';
import api from '../../api';
import myhelp from '../../templates/myhelp.html';
import FilteredSearchControl from './filteredsearchcontrol';
import en from './i18n/en';
import es from './i18n/es';
import { getValue } from './i18n/language';

const POSITION_LEGACY = {
  TL: 'left',
  BL: 'left',
  TR: 'right',
  BR: 'right',
};

/**
 * Normaliza posiciones legacy TL/TR/BL/BR a left/right (API v2).
 * @param {string} position
 * @returns {string}
 */
const normalizePosition = (position) => {
  if (!position) {
    return 'right';
  }
  return POSITION_LEGACY[position] || position;
};

export default class FilteredSearch extends IDEE.Plugin {
  /**
   * @classdesc
   * Plugin de búsqueda filtrada sobre capas vectoriales.
   *
   * @constructor
   * @extends {IDEE.Plugin}
   * @param {Object} options opciones del plugin
   * @api stable
   */
  constructor(options = {}) {
    super('filteredsearch', {
      position: normalizePosition(options.position),
      tooltip: options.tooltip || getValue('tooltip'),
      order: options.order,
      svgPath: options.svgPath || `${IDEE.config.API_IDEE_URL}plugins/filteredsearch/images/icon.svg`,
    });

    /**
     * Plugin options
     * @public
     * @type {Object}
     */
    this.options = options;

    /**
     * Plugin name
     * @public
     * @type {string}
     */
    this.name = 'filteredsearch';

    /**
     * Indicates if the plugin is collapsed on entry
     * @public
     * @type {boolean}
     */
    this.collapsed = options.collapsed !== undefined ? options.collapsed : true;

    /**
     * Metadata from api.json
     * @public
     * @type {Object}
     */
    this.metadata = api.metadata;

    /**
     * Separator for API REST params
     * @public
     * @type {string}
     */
    this.separatorApiJson = api.url.separator;

    // Panel más ancho: el contenido (consultas/listas) necesita ~550px
    this.minPanelWidth = options.minPanelWidth || 360;
    this.maxPanelWidth = options.maxPanelWidth || 550;
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
    this.map = map;

    this.button = new IDEE.ui.buttons.SidePanelButton(this.name, {
      position: this.position,
      tooltip: this.tooltip,
      svgPath: this.svgPath,
      order: this.order,
    });
    map.addButtons(this.button);

    this.panel = new IDEE.ui.panels.PluginSidePanel(this.name, {
      collapsed: this.collapsed,
      position: this.position,
      minWidth: this.minPanelWidth,
      maxWidth: this.maxPanelWidth,
      className: 'm-plugin-filteredsearch filtered-search-panel',
      tooltip: this.tooltip,
      order: this.order,
    });

    this.control = new FilteredSearchControl();
    this.controls = [this.control];

    this.control.on(IDEE.evt.ADDED_TO_MAP, () => {
      this.fire(IDEE.evt.ADDED_TO_MAP);
    });

    this.panel.addControls(this.controls);
    this.button.panel = this.panel;
    this.panel.button = this.button;

    map.addPanels(this.panel);
  }

  /**
   * Destroys plugin
   * @public
   * @function
   * @api
   */
  destroy() {
    if (this.map) {
      if (this.button) {
        this.map.removeButton(this.button);
      }
      if (this.panel) {
        this.map.removePanel(this.panel);
      }
      if (this.controls && this.controls.length > 0) {
        this.map.removeControls(this.controls);
      }
    }
    this.map = null;
    this.button = null;
    this.panel = null;
    this.control = null;
    this.controls = [];
  }

  /**
   * This function return the controls of plugin
   *
   * @public
   * @function
   * @api stable
   */
  getControls() {
    return this.controls;
  }

  /**
   * Comprueba si el plugin recibido es instancia de FilteredSearch
   *
   * @public
   * @function
   * @param {IDEE.Plugin} plugin Plugin a comparar
   * @returns {boolean}
   * @api
   */
  equals(plugin) {
    return plugin instanceof FilteredSearch;
  }

  /**
   * Get the API REST Parameters of the plugin
   *
   * @function
   * @public
   * @api
   */
  getAPIRest() {
    return `${this.name}=${this.position}${this.separatorApiJson}${this.collapsed}${this.separatorApiJson}${this.order}${this.separatorApiJson}${this.tooltip}`;
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
   * This function gets metadata plugin
   *
   * @public
   * @function
   * @api stable
   */
  getMetadata() {
    return this.metadata;
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
