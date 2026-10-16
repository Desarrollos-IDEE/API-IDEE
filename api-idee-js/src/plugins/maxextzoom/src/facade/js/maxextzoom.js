/**
 * @module IDEE/plugin/MaxExtZoom
 */
import 'assets/css/maxextzoom';
import api from '../../api';
import myhelp from '../../templates/myhelp.html';
import ca from './i18n/ca';
import en from './i18n/en';
import es from './i18n/es';
import { getValue } from './i18n/language';
import MaxExtZoomControl from './maxextzoomcontrol';

const DEFAULT_SVG = 'https://componentes.idee.es/estaticos/Simbologia/svg/icons_cota/icn_overview.svg';

/**
 * @classdesc
 * Botón one-shot que ajusta la vista a la extensión máxima del mapa (API-IDEE v2).
 * No usa SidePanel ni CollapsiblePanel: es un Control con OverviewMapButton.
 */
export default class MaxExtZoom extends IDEE.Plugin {
  /**
   * @constructor
   * @extends {IDEE.Plugin}
   * @param {Object} options opciones del plugin
   * @api stable
   */
  constructor(options = {}) {
    super('maxextzoom', {
      position: options.position || 'left',
      tooltip: options.tooltip || getValue('tooltip'),
      order: options.order,
      svgPath: options.svgPath || DEFAULT_SVG,
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
     * Icono COTA del botón
     * @private
     * @type {string}
     */
    this.svgPath = options.svgPath || DEFAULT_SVG;

    /**
     * Metadata from api.json
     * @private
     * @type {Object}
     */
    this.metadata = api.metadata;

    this.separatorApiJson = api.url.separator;
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
    this.control = new MaxExtZoomControl({
      tooltip: this.tooltip,
      position: this.position,
      order: this.order,
      svgPath: this.svgPath,
    });
    this.controls = [this.control];

    this.control.on(IDEE.evt.ADDED_TO_MAP, () => {
      this.fire(IDEE.evt.ADDED_TO_MAP);
    });

    map.addControls(this.controls);
  }

  /**
   * This function destroys this plugin
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {
    if (this.map) {
      if (this.control) {
        this.control.deactivate();
        this.control.destroy();
      }
      if (this.controls.length > 0) {
        this.map.removeControls(this.controls);
      }
    }
    this.map = null;
    this.control = null;
    this.controls = [];
  }

  /**
   * This function return the control of plugin
   *
   * @public
   * @function
   * @api stable
   */
  getControls() {
    return this.controls;
  }

  /**
   * Comprueba si el plugin recibido es instancia de MaxExtZoom
   *
   * @public
   * @function
   * @param {IDEE.Plugin} plugin Plugin a comparar
   * @returns {boolean}
   * @api
   */
  equals(plugin) {
    return plugin instanceof MaxExtZoom;
  }

  /**
   * Get the API REST Parameters of the plugin
   *
   * @function
   * @public
   * @api
   */
  getAPIRest() {
    return `${this.name}=${this.position}${this.separatorApiJson}${this.order}${this.separatorApiJson}${this.tooltip}`;
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
    if (lang === 'en' || lang === 'es' || lang === 'ca') {
      if (lang === 'en') {
        return en;
      }
      if (lang === 'ca') {
        return ca;
      }
      return es;
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
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const imageHelp01 = require(`assets/images/${this.getMetadata().version}/help-01.png`);

    return {
      title: getValue('textHelp.squemaTitle'),
      content: new Promise((resolve) => {
        const html = IDEE.template.compileSync(myhelp, {
          vars: {
            title: getValue('textHelp.title'),
            imageHelp01,
            translations: {
              paragraph1: getValue('textHelp.paragraph1'),
              paragraph2: getValue('textHelp.paragraph2'),
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
