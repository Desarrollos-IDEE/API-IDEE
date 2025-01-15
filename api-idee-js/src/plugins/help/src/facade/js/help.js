/**
 * @module M/plugin/Help
 */
import '../assets/css/help';
import '../assets/css/fonts';
import api from '../../api';
import HelpControl from './helpcontrol';

import myhelp from '../../templates/myhelp';

import { getValue } from './i18n/language';
import es from './i18n/es';
import en from './i18n/en';

export default class Help extends M.Plugin {
  /**
   * @classdesc
   * Fachada del plugin
   *
   * @constructor
   * @extends {M.Plugin}
   * @param {Object} options Opciones para el plugin
   * @api stable
   */
  constructor(options) {
    super();

    /**
     * Fachada del mapa
     * @private
     * @type {M.Map}
     */
    this.map_ = null;

    /**
     * Array de controles
     * @private
     * @type {Array<M.Control>}
     */
    this.controls_ = [];

    /**
     * Posición del plugin
     *
     * @private
     * @type {string} - TL | TR | BL | BR
     */
    this.position_ = options.position || 'TR';

    /**
     * Tooltip
     *
     * @private
     * @type {string}
     */
    this.tooltip_ = options.tooltip || getValue('tooltip');

    const header = options.header || {};

    /**
     * Imágenes para la cabecera
     *
     * @private
     * @type {Array}
     */
    this.headerImages_ = header.images ? header.images : [`${M.config.API_IDEE_URL}img/logo_ge.svg`, `${M.config.API_IDEE_URL}img/ign.svg`];

    /**
     * Título
     *
     * @private
     * @type {String}
     */
    this.headerTitle_ = header.title ? header.title : getValue('long_title');

    /**
     * Nombre
     *
     * @private
     * @type {string}
     */
    this.name_ = 'help';

    /**
     * Contenido extra para la ayuda - Inicio
     *
     * @private
     * @type {Array}
     */
    this.initialExtraContents_ = options.initialExtraContents || [];

    /**
     * Define si se extiende el contenido inicial o no
     *
     * @private
     * @type {Boolean}
     */
    this.extendInitialExtraContents = M.utils.isUndefined(options.extendInitialExtraContents)
      ? true
      : options.extendInitialExtraContents;

    /**
     * Contenido extra para la ayuda - Final
     *
     * @private
     * @type {Array}
     */
    this.finalExtraContents_ = options.finalExtraContents || [];

    /**
     * Metadata api.json
     * @private
     * @type {Object}
     */
    this.metadata_ = api.metadata;

    /**
     * @private
     * @type {Number}
     */
    this.order = options.order >= -1 ? options.order : null;

    /**
     * Index de la sección a mostrar por defecto
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
      return (lang === 'en') ? en : es;
    }
    return M.language.getTranslation(lang).help;
  }

  /**
   * Añade el plugin al mapa
   *
   * @public
   * @function
   * @param {M.Map} map mapa donde se añadirá el plugin
   * @api stable
   */
  addTo(map) {
    M.remote.get(`${M.config.API_IDEE_URL}api/actions/controls`).then((response) => {
      const controls = response.text.replace('[', '').replace(']', '').replaceAll('"', '').split(',');
      this.ctrl = new HelpControl({
        tooltip: this.tooltip_,
        order: this.order,
        initialExtraContents: this.initialExtraContents_,
        finalExtraContents: this.finalExtraContents_,
        extendInitialExtraContents: this.extendInitialExtraContents,
        headerImages: this.headerImages_,
        headerTitle: this.headerTitle_,
        initialIndex: this.initialIndex,
        controls,
      });
      this.controls_.push(this.ctrl);
      this.map_ = map;
      this.panel_ = new M.ui.Panel('Help', {
        className: 'm-plugin-help',
        position: M.ui.position[this.position_],
        tooltip: this.tooltip_,
        collapsedButtonClass: 'm-help-icons-query-support',
        order: this.order,
      });
      this.panel_.addControls(this.controls_);
      map.addPanels(this.panel_);
    });
  }

  /**
   * Nombre del plugin
   *
   * @getter
   * @function
   */
  get name() {
    return 'help';
  }

  /**
   * Posición del plugin
   *
   * @public
   * @return {string}
   * @api
   */
  get position() {
    return this.position_;
  }

  /**
   * Obtiene API-REST
   *
   * @function
   * @public
   * @api
   */
  getAPIRest() {
    const cadena = `${this.name_}=${this.position_}*${this.tooltip_}*${this.extendInitialExtraContents}`;
    return cadena;
  }

  /**
   * Obtiene API-REST Base64
   *
   * @function
   * @public
   * @api
   */
  getAPIRestBase64() {
    return `${this.name}=base64=${M.utils.encodeBase64(this.options)}`;
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
      title: this.name_,
      content: new Promise((success) => {
        const html = M.template.compileSync(myhelp, {
          vars: {
            urlImages: `${M.config.API_IDEE_URL}plugins/help/images/`,
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
   * @param {M.Plugin} plugin plugin para comparar
   * @api
   */
  equals(plugin) {
    return plugin instanceof Help;
  }

  /**
   * Matadata
   *
   * @public
   * @function
   * @api stable
   */
  getMetadata() {
    return this.metadata_;
  }

  /**
   * Elimina el plugin
   *
   * @public
   * @function
   * @api
   */
  destroy() {
    this.map_.removeControls(this.controls_);
    [this.map_, this.controls_, this.panel_] = [null, null, null];
  }
}
