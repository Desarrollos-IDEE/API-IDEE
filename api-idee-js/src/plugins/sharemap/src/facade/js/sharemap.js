/**
 * @module IDEE/plugin/ShareMap
 */
import '../assets/css/sharemap';
import ShareMapControl from './sharemapcontrol';
import { getValue } from './i18n/language';
import myhelp from '../../templates/myhelp';

import es from './i18n/es';
import en from './i18n/en';

/**
 * @typedef {Object} ShareMapOptions
 * @property {number} [baseUrl] Base url of the shared map.
 * @property {enum<string>} [position='right']? Position of the view plugin.
 * Allowed values: 'left | right'.
 * @property {string} [title='Compartir URL']? The title of the plugin modal.
 * @property {string} [btn='Aceptar']? The button text which close the modal plugin.
 * @property {string} [copyBtn='Copiar']? The button text which copy the url of shared map.
 * @property {StyleOptions} [styles={}]? The object with the information about primary color
 * and secondary color.
 * @property {bool} [overwriteStyles=false]? This flag allows to overwrite the colors of the plugin
 * with a custom css.
 * @property {string} [tooltip='¡Copiado!']? The text what is shown when the shared map url
 * is copied.
 * @property {string} [qrImage]? Url of the image shown over the center of the QR code. By default,
 * the IDEE logo of the static resources ('imagenes/logos/IDEE-logo.png').
 *
 * Note: The character '?' indicates that the parameter is optional.
 */

/**
 * @typedef {Object} StyleOptions
 * @property {string} [primaryColor='#71a7d3']? Primary color of the plugin view in format CSS color
 * @property {string} [secondaryColor = '#fff']? Secondary color of the plugin view
 * in format CSS color.
 *
 * Note: The character '?' indicates that the parameter is optional.
 */

/**
 * Complete example of ShareMapPlugin options
 * @example
 *
 * {
 * 'baseUrl': 'https://componentes-beta.idee.es/api-idee/'
 * 'position': 'BL',
 * 'title': 'Compartir Mapa',
 * 'btn': 'Aceptar',
 * 'copyBtn': 'Copiar url',
 * 'styles': {
 *  'primaryColor': 'yellow',
 *  'secondaryColor': 'green'
 *  },
 *  'overwriteStyles': 'false',
 *  'tooltip': 'Copiado'
 * }
 */

/**
 * Minimum example of ShareMapPlugin options
 * @example
 *
 * {
 * 'baseUrl': 'https://componentes-beta.idee.es/api-idee/'
 * }
 */

/**
 * ShareMap plugin
 * @classdesc
 */
export default class ShareMap extends IDEE.Plugin {
  /**
   * @constructor
   * @extends {IDEE.Plugin}
   * @param {ShareMapOptions} options
   * @api
   */
  constructor({ filterLayers = [], ...options } = {}) {
    super('sharemap', {
      position: options.position || 'right',
      tooltip: options.tooltip || getValue('tooltip'),
      order: options.order,
      svgPath: options.svgPath || 'https://componentes.idee.es/estaticos/Simbologia/svg/icons_cota/icn_share.svg',
    });

    /**
     * Plugin name
     * @public
     * @type {String}
     */
    this.name = 'sharemap';

    /**
     * Base url of the shared map
     *
     * @private
     * @type {URL}
     */
    this.baseUrl_ = options.baseUrl || 'https://componentes.idee.es/api-idee/';

    if (!IDEE.utils.isString(this.baseUrl_)) {
      throw new Error('options.baseUrl is not string type.');
    }

    /**
     * Primary Title / tooltip of the modal
     *
     * @private
     * @type {String}
     */
    this.title_ = options.title || getValue('title');

    /**
     * Secondary Title / tooltip of the modal
     *
     * @private
     * @type {String}
     */
    this.text_ = options.text || getValue('text');

    /**
     * Text of the button which close the modal plugin
     *
     * @private
     * @type {String}
     */
    this.btn_ = options.btn || getValue('accept');

    /**
     * Text of the button with which copy the url of shared map
     *
     * @private
     * @type {String}
     */
    this.copyBtn_ = options.copyBtn || getValue('copy');

    /**
     * Text of the button with which copy the url of shared map in html format
     *
     * @private
     * @type {String}
     */
    this.copyBtnHtml_ = options.copyBtnHtml || getValue('copy');

    /**
     * Text of the tooltip when the url is copied
     *
     * @private
     * @type {String}
     */
    this.tooltipCopy_ = options.tooltipCopy || getValue('tooltipCopy');

    /**
     * Styles options
     * @private
     * @type {Object}
     */
    this.styles_ = options.styles || {};

    /**
     * Flag to overwrite the styles of the plugin with a custom css
     *
     * @private
     * @type {Boolean}
     */
    this.overwriteStyles_ = options.overwriteStyles || false;

    /**
     * Flag to generate minimized URL
     *
     * @private
     * @type {Boolean}
     */
    this.minimize_ = options.minimize || false;

    /**
     * Flag to generate URL with API REST or not
     *
     * @private
     * @type @type {Boolean}
     */
    this.urlAPI_ = options.urlAPI || false;

    /**
     * Array of layers to share in the URL
     *
     * @private
     * @type {Array<String>}
     */
    this.filterLayers = (options.shareLayer === undefined || options.shareLayer === false)
      ? filterLayers
      : [];

    /**
     * Flag to share the layers of the map
     *
     * @private
     * @type {Boolean}
     */
    this.shareLayer = options.shareLayer || false;

    /**
     * Url of the image shown over the center of the QR code
     *
     * @private
     * @type {String}
     */
    this.qrImage_ = options.qrImage || `${IDEE.config.STATIC_RESOURCES_URL}/imagenes/logos/IDEE-logo.png`;

    /**
     * Plugin parameters
     *
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
    return IDEE.language.getTranslation(lang).sharemap;
  }

  /**
   * This function adds this plugin into the map.
   *
   * @public
   * @function
   * @param {IDEE.Map} map the map to add the plugin
   * @api
   */
  addTo(map) {
    this.map = map;

    this.button = new IDEE.ui.buttons.OverviewMapButton(this.name, {
      position: this.position,
      tooltip: this.tooltip,
      svgPath: this.svgPath,
      order: this.order,
    });

    this.controls.push(new ShareMapControl({
      baseUrl: this.baseUrl_,
      title: this.title_,
      text: this.text_,
      btn: this.btn_,
      copyBtn: this.copyBtn_,
      copyBtnHtml: this.copyBtnHtml_,
      primaryColor: this.styles_.primaryColor,
      secondaryColor: this.styles_.secondaryColor,
      tooltip: this.tooltipCopy_,
      overwriteStyles: this.overwriteStyles_,
      minimize: this.minimize_,
      urlAPI: this.urlAPI_,
      order: this.order,
      filterLayers: this.filterLayers,
      shareLayer: this.shareLayer,
      qrImage: this.qrImage_,
    }));
    // eslint-disable-next-line no-underscore-dangle
    this.controls[0].map_ = map;

    const superActivate = this.button.activate.bind(this.button);
    this.button.activate = () => {
      if (document.querySelector('#m-plugin-sharemap-title')) return;
      superActivate();
      this.controls[0].activateModal(() => this.button.deactivate());
    };

    map.addButtons(this.button);
  }

  /**
   * This function destroys this plugin
   *
   * @public
   * @function
   * @api
   */
  destroy() {
    const dialog = document.querySelector('#m-plugin-sharemap-dialog');
    if (dialog) {
      dialog.parentElement.removeChild(dialog);
    }
    this.map.removeButton(this.button);
  }

  /**
   * Get the API REST Parameters of the plugin
   *
   * @function
   * @public
   * @api
   */
  getAPIRest() {
    return `${this.name}=${IDEE.utils.serializeUrlParams({ ...this.options, filterLayers: this.filterLayers })}`;
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
            urlImages: `${IDEE.config.API_IDEE_URL}plugins/sharemap/images/`,
            translations: {
              help1: getValue('textHelp.help1'),
              help2: getValue('textHelp.help2'),
              help3: getValue('textHelp.help3'),
              help4: getValue('textHelp.help4'),
              help5: getValue('textHelp.help5'),
              help6: getValue('textHelp.help6'),
              help7: getValue('textHelp.help7'),
              help8: getValue('textHelp.help8'),
            },
          },
        });
        success(html);
      }),
    };
  }
}
