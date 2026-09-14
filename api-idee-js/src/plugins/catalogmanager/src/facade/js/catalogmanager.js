/**
 * @module IDEE/plugin/Catalogmanager
 */
import 'flatpickr/dist/flatpickr.min.css';
import '../assets/css/catalogmanager';
import '../assets/css/fonts';
import CatalogmanagerControl from './catalogmanagercontrol';
import myhelp from '../../templates/myhelp';
import { getValue } from './i18n/language';

import es from './i18n/es';
import en from './i18n/en';

export default class Catalogmanager extends IDEE.Plugin {
  /**
   * @classdesc
   * Fachada del plugin plantilla
   *
   * @constructor
   * @extends {IDEE.Plugin}
   * @param {Object} options Opciones para el plugin
   * @api
   */
  constructor(options = {}) {
    super();

    /**
     * Nombre del plugin
     * @private
     * @type {String}
     */
    this.name_ = 'catalogmanager';

    /**
     * Fachada del mapa
     * @private
     * @type {IDEE.Map}
     */
    this.map_ = null;

    /**
     * Lista de controles
     * @private
     * @type {Array<IDEE.Control>}
     */
    this.controls_ = [];

    /**
     * Nombre de clase de la vista html
     * @public
     * @type {string}
     */
    this.className = 'm-plugin-catalogmanager';

    /**
     * Posición del Plugin
     * @public
     * Posibles valores: TR | TL | BL | BR
     * @type {String}
     */
    const positions = ['TR', 'TL', 'BL', 'BR'];
    this.position = positions.includes(options.position) ? options.position : 'TR';

    /**
     * Tooltip del plugin
     *
     * @private
     * @type {string}
     */
    this.tooltip_ = options.tooltip || getValue('tooltip');

    /**
     * Indicador de si el plugin se muestra contraido
     * @public
     * @type {boolean}
     */
    this.collapsed = options.collapsed !== false;

    /**
     * Indicador de si el plugin se puede contraer no.
     * @public
     * @type {boolean}
     */
    this.collapsible = options.collapsible !== false;

    /**
     * Indicador de si el plugin puede arrastrarse o no
     * @public
     * @type {boolean}
     */
    this.isDraggable = !IDEE.utils.isUndefined(options.isDraggable) ? options.isDraggable : false;

    /**
     * Prioridad en la colocación del plugin en su área
     *@private
     *@type { Number }
     */
    this.order = options.order >= -1 ? options.order : null;

    this.predefinedCatalogs = options.predefinedCatalogs || [];

    this.addCatalogEnabled = options.addCatalogEnabled || false;

    this.downloadUrl = options.downloadUrl || 'https://stac-gneis.idee.es/download-service/v1/download-jobs';

    /**
     * Parámetros del plugin
     * @public
     * @type {object}
     */
    this.options = options;
  }

  /**
   * Esta función añade el plugin al mapa.
   *
   * @public
   * @function
   * @param {IDEE.Map} map el mapa al que se añade el plugin
   * @api stable
   */
  addTo(map) {
    this.controls_.push(new CatalogmanagerControl({
      isDraggable: this.isDraggable,
      order: this.order,
      predefinedCatalogs: this.predefinedCatalogs,
      addCatalogEnabled: this.addCatalogEnabled,
      downloadUrl: this.downloadUrl,
    }));
    this.map_ = map;
    this.panel_ = new IDEE.ui.Panel('Catalogmanager', {
      collapsible: this.collapsible,
      collapsed: this.collapsed,
      position: IDEE.ui.position[this.position],
      className: this.className,
      collapsedButtonClass: 'g-cartografia-catalog-server',
      tooltip: this.tooltip_,
      order: this.order,
    });
    this.panel_.addControls(this.controls_);
    map.addPanels(this.panel_);
  }

  /**
   * Obtiene el nombre del plugin
   *
   * @getter
   * @function
   */
  get name() {
    return this.name_;
  }

  /**
   * Esta función destruye el plugin
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {
    this.map_.removeControls(this.controls_);
  }

  /**
   * Esta función obtiene los parámetros de
   * la API REST del plugin
   *
   * @function
   * @public
   * @api
   */
  getAPIRest() {
    return `${this.name}=${this.position}*${this.collapsed}*${this.collapsible}*${this.tooltip_}*${this.isDraggable}`;
  }

  /**
   * Esta función obtiene los parámetros de
   * la API REST en base64 del plugin
   *
   * @function
   * @public
   * @api
   */
  getAPIRestBase64() {
    return `${this.name}=base64=${IDEE.utils.encodeBase64(this.options)}`;
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
    return IDEE.language.getTranslation(lang).backimglayer;
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
            urlImages: `${IDEE.config.API_IDEE_URL}plugins/catalogmanager/images/`,
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
              help11: getValue('textHelp.help11'),
              help12: getValue('textHelp.help12'),
              help13: getValue('textHelp.help13'),
              help14: getValue('textHelp.help14'),
              help15: getValue('textHelp.help15'),
              help16: getValue('textHelp.help16'),
              help17: getValue('textHelp.help17'),
            },
          },
        });
        success(html);
      }),
    };
  }
}
