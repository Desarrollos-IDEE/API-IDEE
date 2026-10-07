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
   * Fachada del plugin de gestión de catálogos STAC. Crea el panel y el control
   * que permiten explorar colecciones e ítems, aplicar filtros y visualizar
   * imágenes en el mapa.
   *
   * @constructor
   * @extends {IDEE.Plugin}
   * @param {Object} [options={}] Opciones de configuración del plugin
   * @param {string} [options.position='TR'] Posición del panel (`TL`, `TR`, `BL`, `BR`)
   * @param {boolean} [options.collapsed=true] Si el plugin se muestra colapsado al cargar
   * @param {boolean} [options.collapsible=true] Si el panel puede abrirse y cerrarse
   * @param {string} [options.tooltip] Texto del tooltip; por defecto la traducción i18n
   * @param {boolean} [options.isDraggable=false] Si el panel puede arrastrarse
   * @param {number} [options.order] Prioridad de colocación del plugin en su área
   * @param {Array<Object>} [options.predefinedCatalogs=[]] Catálogos STAC precargados al iniciar
   * @param {boolean} [options.addCatalogEnabled=true] Si se permite añadir catálogos desde la UI
   * @param {number} [options.cogCacheSize=350] Tamaño de caché de OpenLayers para capas COG
   * @param {string} [options.downloadUrl='https://stac-gneis.idee.es/download-service/v1/download-jobs']
   *   URL del servicio de descarga masiva de imágenes
   * @api stable
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
     * Indicador de si el plugin se puede contraer o no
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
     * @private
     * @type {number|null}
     */
    this.order = options.order >= -1 ? options.order : null;

    /**
     * Catálogos STAC precargados al iniciar el plugin
     * @public
     * @type {Array<Object>}
     */
    this.predefinedCatalogs = options.predefinedCatalogs || [];

    /**
     * Indica si el usuario puede añadir catálogos desde la interfaz
     * @public
     * @type {boolean}
     */
    this.addCatalogEnabled = options.addCatalogEnabled !== false;

    /**
     * Tamaño de la caché de OpenLayers para peticiones parciales de COG
     * @public
     * @type {number}
     */
    this.cogCacheSize = options.cogCacheSize || 350;

    /**
     * URL del servicio REST de descarga masiva de imágenes TIFF
     * @public
     * @type {string}
     */
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
      cogCacheSize: this.cogCacheSize,
      downloadUrl: this.downloadUrl,
    }));
    this.map_ = map;
    /**
     * Panel de interfaz que contiene el control del plugin
     * @private
     * @type {IDEE.ui.Panel}
     */
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
   * @returns {string} Identificador del plugin (`catalogmanager`)
   * @api stable
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
   * Obtiene la cadena de parámetros del plugin para la API REST
   *
   * @function
   * @public
   * @returns {string} Parámetros separados por `*`: posición, colapsado,
   *   colapsable, tooltip y arrastrable
   * @api stable
   */
  getAPIRest() {
    return `${this.name}=${this.position}*${this.collapsed}*${this.collapsible}*${this.tooltip_}*${this.isDraggable}`;
  }

  /**
   * Obtiene los parámetros del plugin codificados en base64 para la API REST
   *
   * @function
   * @public
   * @returns {string} Nombre del plugin y opciones serializadas en base64
   * @api stable
   */
  getAPIRestBase64() {
    return `${this.name}=base64=${IDEE.utils.encodeBase64(this.options)}`;
  }

  /**
   * Devuelve el diccionario de traducciones del plugin según el idioma
   *
   * @public
   * @function
   * @param {string} lang Código de idioma (`es`, `en` u otro registrado en API-IDEE)
   * @returns {Object} Claves de traducción del plugin catalogmanager
   * @api stable
   */
  static getJSONTranslations(lang) {
    if (lang === 'en' || lang === 'es') {
      return (lang === 'en') ? en : es;
    }
    return IDEE.language.getTranslation(lang).catalogmanager;
  }

  /**
   * Obtiene la ayuda del plugin
   *
   * @function
   * @public
   * @returns {{title: string, content: Promise<string>}} Título y contenido HTML de ayuda
   * @api stable
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
