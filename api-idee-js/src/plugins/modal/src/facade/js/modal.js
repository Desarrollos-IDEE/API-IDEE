/**
 * @module IDEE/plugin/Modal
 */
import 'assets/css/modal';
import ModalControl from './modalcontrol';
import api from '../../api';
import { getValue } from './i18n/language';
import myhelp from '../../templates/myhelp';
// eslint-disable-next-line import/no-relative-packages
import * as Position from '../../../../../facade/js/ui/position';

import es from './i18n/es';
import en from './i18n/en';

export default class Modal extends IDEE.Plugin {
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
    super('modal', {
      position: options.position ?? Position.LEFT,
      tooltip: options.tooltip ?? getValue('tooltip'),
      order: options.order,
      svgPath: options.svgPath || 'https://componentes.idee.es/estaticos/Simbologia/svg/icons_cota/icn_modal.svg',
    });
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
     * Option to allow the plugin to be collapsed or not
     * @private
     * @type {Boolean}
     */
    this.collapsed = options.collapsed !== undefined ? options.collapsed : true;

    /**
     * Collapsible attribute
     * @private
     * @type {boolean}
     */
    this.collapsible = options.collapsible !== undefined ? options.collapsible : true;

    /**
     * Url of HTML with the content for modal in the selected language.
     * @private
     * @type {String}
     */
    this.url_ = null;

    /**
    * Raw HTML string or plain text to inject directly into the modal,
    * instead of loading from a URL.
    * @private
    * @type {null | string}
    */
    this.content_ = null;

    if (!IDEE.utils.isUndefined(options.content)) {
      this.content_ = options.content;
    } else if (
      !IDEE.utils.isUndefined(options.url_es)
      && !IDEE.utils.isUndefined(options.url_en)
      && !IDEE.utils.isUndefined(options.url_ca)
    ) {
      const urlMap = {
        es: options.url_es,
        en: options.url_en,
      };
      this.url_ = urlMap[IDEE.language.getLang()] ?? options.url_ca;
    } else {
      const templateMap = {
        es: 'template_es',
        en: 'template_en',
        ca: 'template_ca',
      };
      this.url_ = templateMap[IDEE.language.getLang()] ?? 'template_ca';
    }

    /**
     * Metadata from api.json
     * @private
     * @type {Object}
     */
    this.metadata_ = api.metadata;

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
    return IDEE.language.getTranslation(lang).modal;
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
    this.map_ = map;

    this.control_ = new ModalControl(this.url_, {
      content: this.content_,
    });
    this.controls_.push(this.control_);

    if (this.collapsible !== false) {
      this.button = new IDEE.ui.buttons.OverviewMapButton(this.name, {
        position: this.position,
        tooltip: this.tooltip,
        svgPath: this.svgPath,
        order: this.order,
      });
      const activate = this.button.activate;
      this.button.activate = () => {
        activate.call(this.button);
        this.control_.triggerModal();
      };
      const deactivate = this.button.deactivate;
      this.button.deactivate = () => {
        deactivate.call(this.button);
        this.control_.closeModal();
      };
      const modalClosedByWindow = this.control_.modalClosedByWindow;
      this.control_.modalClosedByWindow = () => {
        modalClosedByWindow.call(this.control_);
        deactivate.call(this.button);
      };
      map.addButtons(this.button);
    }

    map.addControls(this.controls_);

    if (this.collapsed === false || this.collapsible === false) {
      setTimeout(() => {
        this.control_.triggerModal();
      }, 300);
    }
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
            urlImages: `${IDEE.config.API_IDEE_URL}plugins/modal/images/`,
            translations: {
              help1: getValue('textHelp.help1'),
              help2: getValue('textHelp.help2'),
              help3: getValue('textHelp.help3'),
              help4: getValue('textHelp.help4'),
            },
          },
        });
        success(html);
      }),
    };
  }

  /**
   * This function destroys this plugin
   *
   * @public
   * @function
   * @api
   */
  destroy() {
    if (this.control_) {
      this.control_.getImpl().toggleModal(false);
    }

    if (this.button) {
      this.button.destroy();
    }

    if (this.map_ && this.controls_) {
      this.map_.removeControls(this.controls_);
    }

    this.map_ = null;
    this.control_ = null;
    this.controls_ = [];
    this.button = null;
    this.panel_ = null;
  }
}
