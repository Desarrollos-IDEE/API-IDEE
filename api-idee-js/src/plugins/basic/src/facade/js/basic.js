/**
 * @module IDEE/plugin/Basic
 */
import '../assets/css/basic';
import BasicControl from './basiccontrol';
import myhelp from '../../templates/myhelp';
import { getValue } from './i18n/language';

import es from './i18n/es';
import en from './i18n/en';

export default class Basic extends IDEE.Plugin {
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
    super('basic', {
      position: options.position || 'right',
      tooltip: options.tooltip || getValue('tooltip'),
      order: options.order,
      svgPath: options.svgPath || 'https://componentes.idee.es/estaticos/Simbologia/svg/icons_cota/icn_tool.svg',
    });

    /**
     * Atributo colapsado del panel
     * @public
     * @type {Boolean}
     */
    this.collapsed = IDEE.utils.isBoolean(options.collapsed) ? options.collapsed : true;

    /**
     * Anchura mínima del panel
     * @public
     * @type {Number}
     */
    this.minPanelWidth = options.minWidthPanel;

    /**
     * Anchura máxima del panel
     * @public
     * @type {Number}
     */
    this.maxPanelWidth = options.maxWidthPanel;

    /**
     * Contenido personalizado del plugin
     * @public
     * @type {String}
     */
    this.content = options.content;

    /**
     * Parámetros del plugin
     * @public
     * @type {Object}
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
    this.map = map;

    this.button = new IDEE.ui.buttons.SidePanelButton(this.name, {
      position: this.position,
      tooltip: this.tooltip,
      svgPath: this.svgPath,
      order: this.order,
    });
    map.addButtons(this.button);

    this.panel = new IDEE.ui.panels.PluginSidePanel(this.name, {
      tooltip: this.tooltip,
      position: this.position,
      collapsed: this.collapsed,
      minWidth: this.minPanelWidth,
      maxWidth: this.maxPanelWidth,
      className: this.className,
      collapsedButtonClass: 'icon-basic-wrench',
      order: this.order,
    });

    this.controls.push(new BasicControl(this.content));
    this.panel.addControls(this.controls);
    this.button.panel = this.panel;
    this.panel.button = this.button;

    map.addPanels(this.panel);
  }

  /**
   * Esta función destruye el plugin
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {
    this.map.removeButton(this.button);
    this.map.removePanel(this.panel);
    this.map.removeControls(this.controls);
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
    return `${this.name}=${IDEE.utils.serializeUrlParams(this.options)}`;
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
            urlImages: `${IDEE.config.API_IDEE_URL}plugins/basic/images/`,
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
