/**
 * @module IDEE/plugin/Magnify
 */
import api from '../../api';
import myhelp from '../../templates/myhelp.html';
import '../assets/css/fonts';
import '../assets/css/magnify';
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

/**
 * @classdesc
 * Plugin de efecto lupa/zoom con SidePanelButton + PluginSidePanel (API-IDEE v2).
 */
export default class Magnify extends IDEE.Plugin {
  /**
   * @constructor
   * @extends {IDEE.Plugin}
   * @param {Object} options opciones del plugin
   * @api stable
   */
  constructor(options = {}) {
    super('magnify', {
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
    this.className = 'm-plugin-magnify';

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
    this.control = new MagnifyControl({
      layers: this.layers,
      zoom: this.zoom,
      zoomMax: this.zoomMax,
      tooltip: this.tooltip,
      position: this.position,
      order: this.order,
    });
    this.controls = [this.control];

    this.button = new IDEE.ui.buttons.SidePanelButton(this.name, {
      position: this.position,
      tooltip: this.tooltip,
      svgPath: SVG_PATH,
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

    this.panel.on(IDEE.evt.SHOW, () => {
      if (map.getLayers().length === 0) {
        this.panel.collapse();
        IDEE.dialog.info(getValue('exception.nolayersavai'));
      }
    });

    this.panel.addControls(this.controls);
    this.button.panel = this.panel;
    this.panel.button = this.button;
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
