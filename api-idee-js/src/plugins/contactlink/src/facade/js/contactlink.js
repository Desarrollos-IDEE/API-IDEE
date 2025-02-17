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
    super();

    /**
     * Name plugin
     * @private
     * @type {String}
     */
    this.name_ = 'contactlink';

    /**
     * Facade of the map
     * @private
     * @type {IDEE.Map}
     */
    this.map_ = null;

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
     * Position of the Plugin
     * @public
     * Posible values: TR | TL | BL | BR
     * @type {String}
     */
    const positions = ['TR', 'TL', 'BL', 'BR'];
    this.position = positions.includes(options.position) ? options.position : 'TR';

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
    this.linksMail = options.mail || 'mailto:ign@fomento.es';

    /**
     * Metadata from api.json
     * @private
     * @type {Object}
     */
    this.metadata_ = api.metadata;

    /**
     * Plugin tooltip
     *
     * @private
     * @type {string}
     */
    this.tooltip_ = options.tooltip || getValue('tooltip');

    /**
     * Collapsed attribute
     * @public
     * @type {boolean}
     */
    this.collapsed = options.collapsed !== false;

    /**
     * Collapsible attribute
     * @public
     * @type {boolean}
     */
    this.collapsible = options.collapsible !== false;

    /**
     *@private
     *@type { Number }
     */
    this.order = options.order >= -1 ? options.order : null;

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
    // this.controls_.push(new ContactLinkControl(values));
    this.map_ = map;
    this.panel_ = new IDEE.ui.Panel('ContactLink', {
      collapsible: this.collapsible,
      collapsed: this.collapsed,
      position: IDEE.ui.position[this.position],
      className: this.className,
      collapsedButtonClass: 'g-contactlink-link',
      tooltip: this.tooltip_,
      order: this.order,
    });
    this.panel_.addControls(this.control_);
    map.addPanels(this.panel_);
  }

  /**
   * Name of the plugin
   *
   * @getter
   * @function
   */
  get name() {
    return 'contactlink';
  }

  /**
   * This function destroys this plugin
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {
    this.map_.removeControls([this.control_]);
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
    return `${this.name}=${this.position}*${this.collapsed}*${this.collapsible}*${this.tooltip_}*${this.linksDescargasCnig}*${this.linksPnoa}*${this.linksVisualizador3d}*${this.linksFototeca}*${this.linksTwitter}*${this.linksInstagram}*${this.linksFacebook}*${this.linksPinterest}*${this.linksYoutube}*${this.linksMail}`;
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
