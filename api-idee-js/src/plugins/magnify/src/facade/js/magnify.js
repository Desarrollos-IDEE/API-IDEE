/**
 * @module IDEE/plugin/Magnify
 */
import 'assets/css/magnify';
import api from '../../api';
import myhelp from '../../templates/myhelp.html';
import en from './i18n/en';
import es from './i18n/es';
import { getValue } from './i18n/language';
import MagnifyControl from './magnifycontrol';

const SVG_PATH = 'https://componentes.idee.es/estaticos/Simbologia/svg/icons_cota/icn_zoom_recuad.svg';

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

export default class Magnify extends IDEE.Plugin {
  /**
   * @classdesc
   * Plugin de efecto lupa/zoom sobre una o varias capas.
   *
   * @constructor
   * @extends {IDEE.Plugin}
   * @param {Object} options opciones del plugin
   * @api stable
   */
  constructor(options = {}) {
    super('magnify', {
      position: normalizePosition(options.position),
      tooltip: options.tooltip || getValue('tooltip'),
      order: options.order,
      svgPath: options.svgPath || SVG_PATH,
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
    this.name = 'magnify';

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

    /**
     * Layer names that will have effects
     * @public
     * @type {string|Array<string>}
     */
    if (options.layers === '' || options.layers === null || options.layers === undefined) {
      this.layers = '';
    } else if (Array.isArray(options.layers)) {
      this.layers = options.layers;
    } else {
      this.layers = options.layers.split(',');
    }

    /**
     * Max limit zoom
     * @public
     * @type {number}
     */
    this.zoomMax = options.zoomMax || 10;

    /**
     * Magnifying effect zoom
     * @public
     * @type {number}
     */
    this.zoom = options.zoom || 1;
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
      className: 'm-plugin-magnify',
      tooltip: this.tooltip,
      order: this.order,
    });

    this.control = new MagnifyControl({
      layers: this.layers,
      zoom: this.zoom,
      zoomMax: this.zoomMax,
    });
    this.controls = [this.control];

    this.control.on(IDEE.evt.ADDED_TO_MAP, () => {
      this.fire(IDEE.evt.ADDED_TO_MAP);
    });

    this.panel.addControls(this.controls);
    this.button.panel = this.panel;
    this.panel.button = this.button;

    this.panel.on(IDEE.evt.SHOW, () => {
      if (map.getLayers().length === 0) {
        this.panel.collapse();
        IDEE.dialog.info(getValue('exception.nolayersavai'));
      }
    });

    map.addPanels(this.panel);
  }

  /**
   * This function destroys this plugin
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {
    if (this.control && this.control.getImpl()) {
      this.control.getImpl().removeEffects();
    }
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
   * Comprueba si el plugin recibido es instancia de Magnify
   *
   * @public
   * @function
   * @param {IDEE.Plugin} plugin Plugin a comparar
   * @returns {boolean}
   * @api
   */
  equals(plugin) {
    return plugin instanceof Magnify;
  }

  /**
   * Get the API REST Parameters of the plugin
   *
   * @function
   * @public
   * @api
   */
  getAPIRest() {
    const layers = Array.isArray(this.layers) ? this.layers.join(',') : this.layers;
    return `${this.name}=${this.position}${this.separatorApiJson}${this.collapsed}${this.separatorApiJson}${this.order}${this.separatorApiJson}${this.tooltip}${this.separatorApiJson}${layers}${this.separatorApiJson}${this.zoomMax}${this.separatorApiJson}${this.zoom}`;
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
    return IDEE.language.getTranslation(lang).magnify;
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
            urlImages: `${IDEE.config.API_IDEE_URL}plugins/magnify/images/`,
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
