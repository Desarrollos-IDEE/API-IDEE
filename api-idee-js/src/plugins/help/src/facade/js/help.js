/**
 * @module IDEE/plugin/Help
 */
import '../assets/css/help';
import api from '../../api';
import HelpControl from './helpcontrol';

import myhelp from '../../templates/myhelp';

import { getValue } from './i18n/language';
import es from './i18n/es';
import en from './i18n/en';

export default class Help extends IDEE.Plugin {
  /**
   * @classdesc
   * Fachada del plugin
   *
   * @constructor
   * @extends {IDEE.Plugin}
   * @param {Object} options Opciones para el plugin
   * @api stable
   */
  constructor(options = {}) {
    super('help', {
      position: options.position || 'right',
      tooltip: options.tooltip || getValue('tooltip'),
      order: options.order,
    });

    const header = options.header || {};

    /**
     * Imágenes para la cabecera
     * @private
     * @type {Array}
     */
    this.headerImages = header.images
      ? header.images
      : [
        `${IDEE.config.STATIC_RESOURCES_URL}/imagenes/logos/logo_ge.svg`,
        `${IDEE.config.STATIC_RESOURCES_URL}/imagenes/logos/ign.svg`,
      ];

    /**
     * Título
     * @private
     * @type {String|Object}
     */
    this.headerTitle = header.title ? header.title : getValue('long_title');

    /**
     * Contenido extra - Inicio
     * @private
     * @type {Array|Object}
     */
    this.initialExtraContents = options.initialExtraContents || [];

    /**
     * Extiende el contenido inicial con el de API-IDEE
     * @private
     * @type {Boolean}
     */
    this.extendInitialExtraContents = IDEE.utils.isUndefined(options.extendInitialExtraContents)
      ? true
      : options.extendInitialExtraContents;

    /**
     * Contenido extra - Final
     * @private
     * @type {Array|Object}
     */
    this.finalExtraContents = options.finalExtraContents || [];

    /**
     * Metadata api.json
     * @private
     * @type {Object}
     */
    this.metadata = api.metadata;

    /**
     * Separador API REST
     * @private
     * @type {String}
     */
    this.separatorApiJson = api.url.separator;

    /**
     * Índice de sección por defecto
     * @private
     * @type {Number}
     */
    this.initialIndex = 0;
    if (options.initialIndex && options.initialIndex > 0) {
      this.initialIndex = options.initialIndex;
    }

    /**
     * Parámetros del plugin
     * @public
     * @type {object}
     */
    this.options = options;
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
      if (lang === 'en') {
        return en;
      }
      return es;
    }
    return IDEE.language.getTranslation(lang).help;
  }

  /**
   * Añade el plugin al mapa
   *
   * @public
   * @function
   * @param {IDEE.Map} map mapa donde se añadirá el plugin
   * @api stable
   */
  addTo(map) {
    this.map = map;

    IDEE.remote.get(`${IDEE.config.API_IDEE_URL}api/actions/controls`).then((response) => {
      const controls = response.text.replace('[', '').replace(']', '').replaceAll('"', '').split(',');

      this.control = new HelpControl({
        tooltip: this.tooltip,
        order: this.order,
        initialExtraContents: this.initialExtraContents,
        finalExtraContents: this.finalExtraContents,
        extendInitialExtraContents: this.extendInitialExtraContents,
        headerImages: this.headerImages,
        headerTitle: this.headerTitle,
        initialIndex: this.initialIndex,
        controls,
      });
      this.controls = [this.control];
      this.control.map = map;

      this.button = new IDEE.ui.buttons.OverviewMapButton(this.name, {
        position: this.position,
        tooltip: this.tooltip,
        svgPath: 'https://api-idee.juntadeandalucia.es/estaticos/Simbologia/svg/icons_cota/icn_ayuda.svg',
        order: this.order,
      });
      this.panel = null;

      const superActivate = this.button.activate.bind(this.button);
      this.button.activate = () => {
        superActivate();
        this.control.showHelp(this.initialIndex);
        this.button.deactivate();
      };

      map.addButtons(this.button);
      this.fire(IDEE.evt.ADDED_TO_MAP);
    });
  }

  /**
   * Obtiene API-REST
   *
   * @function
   * @public
   * @api
   */
  getAPIRest() {
    return `${this.name}=${this.position}${this.separatorApiJson}${this.order}${this.separatorApiJson}${this.tooltip}${this.separatorApiJson}${this.extendInitialExtraContents}`;
  }

  /**
   * Obtiene API-REST Base64
   *
   * @function
   * @public
   * @api
   */
  getAPIRestBase64() {
    return `${this.name}=base64=${IDEE.utils.encodeBase64(this.options)}`;
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
    const imageHelp01 = require(`assets/images/${this.getMetadata().version}/help1.png`);

    return {
      title: this.name,
      content: new Promise((success) => {
        const html = IDEE.template.compileSync(myhelp, {
          vars: {
            imageHelp01,
            translations: {
              help1: getValue('textHelp.help1'),
              help2: getValue('textHelp.help2'),
            },
          },
        });
        success(html);
      }),
    };
  }

  /**
   * Compara si dos plugins son iguales
   *
   * @public
   * @function
   * @param {IDEE.Plugin} plugin plugin para comparar
   * @api
   */
  equals(plugin) {
    return plugin instanceof Help;
  }

  /**
   * Metadata
   *
   * @public
   * @function
   * @api stable
   */
  getMetadata() {
    return this.metadata;
  }

  /**
   * Elimina el plugin
   *
   * @public
   * @function
   * @api
   */
  destroy() {
    if (this.map) {
      if (this.button) {
        this.map.removeButton(this.button);
      }
    }
    this.map = null;
    this.control = null;
    this.controls = [];
    this.button = null;
    this.panel = null;
  }
}
