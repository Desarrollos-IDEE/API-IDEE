/**
 * @module IDEE/plugin/ContactLink
 */
import 'assets/css/contactlink';
import 'assets/css/fonts';
import ContactLinkControl from './contactlinkcontrol';
import api from '../../api';
import { getValue } from './i18n/language';
import myhelp from '../../templates/myhelp';

import es from './i18n/es';
import en from './i18n/en';

export default class ContactLink extends IDEE.Plugin {
  /**
   * @classdesc
   * Main facade plugin object. This class creates a plugin
   * object which has an implementation Object
   *
   * @constructor
   * @extends {IDEE.Plugin}
   * @param {Object} impl implementation object
   * @api stable
   */
  constructor(options = {}) {
    super('contactlink', {
      position: options.position || 'left',
      tooltip: options.tooltip || getValue('tooltip'),
      order: options.order,
    });

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
    this.controls_ = [];

    /**
     * Class name of the html view Plugin
     * @public
     * @type {string}
     */
    this.className = 'm-plugin-contactlink';

    /**
     * Link to cnig downloads
     * @private
     * @type {String}
     */
    this.linksDescargasCnig = options.descargascnig || 'http://centrodedescargas.cnig.es/CentroDescargas/index.jsp';

    /**
     * Link to pnoa comparator
     * @private
     * @type {String}
     */
    this.linksPnoa = options.pnoa || 'https://www.ign.es/web/comparador_pnoa/index.html';

    /**
     * Link to 3d visualizer
     * @private
     * @type {String}
     */
    this.linksVisualizador3d = options.visualizador3d || 'https://visualizadores.ign.es/estereoscopico/';

    /**
     * Link to fototeca
     * @private
     * @type {String}
     */
    this.linksFototeca = options.fototeca || 'https://fototeca.cnig.es/';

    /**
     * Link to twitter
     * @private
     * @type {String}
     */
    this.linksTwitter = options.twitter || 'https://twitter.com/IGNSpain';

    /**
     * Link to instagram
     * @private
     * @type {String}
     */
    this.linksInstagram = options.instagram || 'https://www.instagram.com/ignspain/';

    /**
     * Link to facebook
     * @private
     * @type {String}
     */
    this.linksFacebook = options.facebook || 'https://www.facebook.com/IGNSpain/';

    /**
     * Link to pinterest
     * @private
     * @type {String}
     */
    this.linksPinterest = options.pinterest || 'https://www.pinterest.es/IGNSpain/';

    /**
     * Link to cnig downloads
     * @private
     * @type {String}
     */
    this.linksYoutube = options.youtube || 'https://www.youtube.com/user/IGNSpain';

    /**
     * Link to mail
     * @private
     * @type {String}
     */
    this.linksMail = options.mail || 'mailto:consulta@cnig.es';

    /**
     * Metadata from api.json
     * @private
     * @type {Object}
     */
    this.metadata_ = api.metadata;

    /**
     * Collapsed attribute
     * @public
     * @type {boolean}
     */
    this.collapsed = IDEE.utils.isBoolean(options.collapsed) ? options.collapsed : true;

    /**
     * Plugin parameters
     * @public
     * @type {object}
     */
    this.options = options;
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
    return IDEE.language.getTranslation(lang).contactlink;
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
      svgPath: 'https://componentes.idee.es/estaticos/Simbologia/svg/icons_cota/icn_link.svg',
      order: this.order,
    });
    map.addButtons(this.button);

    this.panel = new IDEE.ui.panels.PluginSidePanel(this.name, {
      collapsed: this.collapsed,
      position: this.position,
      minWidth: this.minPanelWidth,
      maxWidth: this.maxPanelWidth,
      className: this.className,
      collapsedButtonClass: 'g-contactlink-link',
      tooltip: this.tooltip,
      order: this.order,
    });

    this.control_ = new ContactLinkControl({
      descargascnig: this.linksDescargasCnig,
      pnoa: this.linksPnoa,
      visualizador3d: this.linksVisualizador3d,
      facebook: this.linksFacebook,
      fototeca: this.linksFototeca,
      twitter: this.linksTwitter,
      instagram: this.linksInstagram,
      youtube: this.linksYoutube,
      mail: this.linksMail,
      pinterest: this.linksPinterest,
    });

    this.control_.on(IDEE.evt.ADDED_TO_MAP, () => {
      this.fire(IDEE.evt.ADDED_TO_MAP);
    });

    this.panel.addControls(this.control_);

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
    this.map.removeButton(this.button);
    this.map.removePanel(this.panel);
    this.map.removeControls([this.control_]);
    this.links = null;
  }

  /**
   * Get the API REST Parameters of the plugin
   *
   * @function
   * @public
   * @api
   */
  getAPIRest() {
    return `${this.name}=${IDEE.utils.serializeUrlParams(this.options)}`;
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
    return this.metadata_;
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
            urlImages: `${IDEE.config.API_IDEE_URL}plugins/contactlink/images/`,
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
            },
          },
        });
        success(html);
      }),
    };
  }
}
