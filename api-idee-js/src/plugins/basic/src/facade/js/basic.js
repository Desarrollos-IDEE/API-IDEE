/**
 * @module M/plugin/Basic
 */
import '../assets/css/basic';
import '../assets/css/fonts';
import BasicControl from './basiccontrol';
import myhelp from '../../templates/myhelp';
import { getValue } from './i18n/language';

export default class Basic extends M.Plugin {
  /**
   * @classdesc
   * Fachada del plugin plantilla
   *
   * @constructor
   * @extends {M.Plugin}
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
    this.name_ = 'basic';

    /**
     * Fachada del mapa
     * @private
     * @type {M.Map}
     */
    this.map_ = null;

    /**
     * Lista de controles
     * @private
     * @type {Array<M.Control>}
     */
    this.controls_ = [];

    /**
     * Nombre de clase de la vista html
     * @public
     * @type {string}
     */
    this.className = 'm-plugin-basic';

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
    this.isDraggable = !M.utils.isUndefined(options.isDraggable) ? options.isDraggable : false;

    /**
     * Prioridad en la colocación del plugin en su área
     *@private
     *@type { Number }
     */
    this.order = options.order >= -1 ? options.order : null;

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
   * @param {M.Map} map el mapa al que se añade el plugin
   * @api stable
   */
  addTo(map) {
    this.controls_.push(new BasicControl(this.isDraggable));
    this.map_ = map;
    this.panel_ = new M.ui.Panel('Basic', {
      collapsible: this.collapsible,
      collapsed: this.collapsed,
      position: M.ui.position[this.position],
      className: this.className,
      collapsedButtonClass: 'icon-basic-wrench',
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
      title: this.name,
      content: new Promise((success) => {
        const html = M.template.compileSync(myhelp, {
          vars: {
            urlImages: `${M.config.API_IDEE_URL}plugins/basic/images/`,
            translations: {
              help1: getValue('textHelp.help1'),
              help2: getValue('textHelp.help2'),
              help3: getValue('textHelp.help3'),
            },
          },
        });
        success(html);
      }),
    };
  }
}
