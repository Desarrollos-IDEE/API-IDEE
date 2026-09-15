/**
 * @module IDEE/plugin/FilteredSearch
 */
import api from '../../api';
import myhelp from '../../templates/myhelp.html';
import '../assets/css/fonts';
import '../assets/css/filteredsearch';
import FilteredSearchControl from './filteredsearchcontrol';
import en from './i18n/en';
import es from './i18n/es';
import { getValue } from './i18n/language';

const ICON_SVG = 'https://componentes.idee.es/estaticos/Simbologia/svg/icons_cota/icn_lupa.svg';

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

/**
 * @classdesc
 * Plugin de búsqueda filtrada con SidePanelButton + PluginSidePanel (API-IDEE v2).
 */
export default class FilteredSearch extends IDEE.Plugin {
  /**
   * @constructor
   * @extends {IDEE.Plugin}
   * @param {Object} options opciones del plugin
   * @api stable
   */
  constructor(options = {}) {
    super('filteredsearch', {
      position: normalizePosition(options.position) || 'right',
      tooltip: options.tooltip || getValue('tooltip'),
      order: options.order,
    });

    /**
     * Plugin options
     * @private
     * @type {Object}
     */
    this.options = options;

    /**
     * Facade of the map
     * @private
     * @type {IDEE.Map}
     */
    this.map = null;

    /**
     * Array of controls
     * @private
     * @type {Array<IDEE.Control>}
     */
    this.controls = [];

    /**
     * CSS class name for the panel
     * @private
     * @type {string}
     */
    this.className = 'm-plugin-filteredsearch';

    /**
     * Option to allow the plugin to be initially collapsed
     * @private
     * @type {boolean}
     */
    this.collapsed = true;
    if (IDEE.utils.isBoolean(options.collapsed)) {
      this.collapsed = options.collapsed;
    }

    /**
     * Metadata from api.json
     * @private
     * @type {Object}
     */
    this.metadata = api.metadata;

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
    this.control = new FilteredSearchControl({
      tooltip: this.tooltip,
      position: this.position,
      order: this.order,
    });
    this.controls = [this.control];

    this.button = new IDEE.ui.buttons.SidePanelButton(this.name, {
      position: this.position,
      tooltip: this.tooltip,
      svgPath: ICON_SVG,
      order: this.order,
    });
    map.addButtons(this.button);

    this.panel = new IDEE.ui.panels.PluginSidePanel(this.name, {
      collapsed: this.collapsed,
      position: this.position,
      minWidth: this.minPanelWidth,
      maxWidth: this.maxPanelWidth,
      className: this.className,
      tooltip: this.tooltip,
      order: this.order,
    });

    this.control.setPanel(this.panel);

    this.control.on(IDEE.evt.ADDED_TO_MAP, () => {
      this.fire(IDEE.evt.ADDED_TO_MAP);
    });

    this.panel.on(IDEE.evt.ADDED_TO_MAP, (html) => {
      IDEE.utils.enableTouchScroll(html);
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
      if (this.control) {
        this.control.setPanel(null);
      }
      if (this.button) {
        this.map.removeButton(this.button);
      }
      if (this.panel) {
        this.map.removePanel(this.panel);
      }
      if (this.controls.length > 0) {
        this.map.removeControls(this.controls);
      }
    }
    this.map = null;
    this.control = null;
    this.controls = [];
    this.panel = null;
    this.button = null;
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
   * Devuelve el panel del plugin
   *
   * @public
   * @function
   * @returns {IDEE.ui.panels.PluginSidePanel}
   * @api
   */
  getPanel() {
    return this.panel;
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
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const imageHelp01 = require(`assets/images/${this.getMetadata().version}/help-01.png`);
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const imageHelp02 = require(`assets/images/${this.getMetadata().version}/help-02.png`);

    return {
      title: getValue('textHelp.squemaTitle'),
      content: new Promise((resolve) => {
        const html = IDEE.template.compileSync(myhelp, {
          vars: {
            title: getValue('textHelp.title'),
            imageHelp01,
            imageHelp02,
            translations: {
              paragraph1: getValue('textHelp.paragraph1'),
              paragraph2: getValue('textHelp.paragraph2'),
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
