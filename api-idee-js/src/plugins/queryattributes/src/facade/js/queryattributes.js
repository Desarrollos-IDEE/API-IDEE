/**
 * @module IDEE/plugin/QueryAttributes
 */
import 'assets/css/queryattributes';
import 'assets/css/fonts';
import QueryAttributesControl from './queryattributescontrol';
import api from '../../api';
import { getValue } from './i18n/language';
import myhelp from '../../templates/myhelp';

import es from './i18n/es';
import en from './i18n/en';

export default class QueryAttributes extends IDEE.Plugin {
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
  constructor(options) {
    super();
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
     * Position of the plugin on browser window
     * @private
     * @type {Enum}
     * Possible values: 'TL', 'TR', 'BR', 'BL'
     */
    this.position_ = options.position || 'TL';

    /**
     * Option to allow the plugin to be collapsed or not
     * @private
     * @type {Boolean}
     */
    this.collapsed_ = options.collapsed;
    if (this.collapsed_ === undefined) this.collapsed_ = true;

    /**
     * Option to allow the plugin to be collapsible or not
     * @private
     * @type {Boolean}
     */
    this.collapsible_ = options.collapsible;
    if (this.collapsible_ === undefined) this.collapsible_ = true;

    if (IDEE.utils.isNullOrEmpty(options.configuration)) {
      // eslint-disable-next-line no-console
      console.warn('options.configuration is null or undefined.');
    }

    this.configuration_ = options.configuration || { columns: [] };

    this.refreshBBOXFilterOnPanning_ = options.refreshBBOXFilterOnPanning;
    if (this.refreshBBOXFilterOnPanning_ === undefined) this.refreshBBOXFilterOnPanning_ = false;

    this.filters_ = options.filters;
    if (this.filters_ === undefined) this.filters_ = true;

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
    return IDEE.language.getTranslation(lang).queryattributes;
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
    this.panel_ = new IDEE.ui.Panel('panelQueryAttributes', {
      className: 'm-queryattributes',
      collapsed: this.collapsed_,
      collapsible: this.collapsible_,
      position: IDEE.ui.position[this.position_],
      collapsedButtonClass: 'icon-tabla',
      tooltip: this.tooltip_,
      refreshBBOXFilterOnPanning: this.refreshBBOXFilterOnPanning_,
    });

    this.control_ = new QueryAttributesControl(this.configuration_, this.filters_, this.collapsed_, this.position_, this.refreshBBOXFilterOnPanning_);
    this.controls_.push(this.control_);
    this.panel_.addControls(this.controls_);
    map.addPanels(this.panel_);
    this.control_.initPanelAttributes();

    // e2m: Lo meto en el control
    // if (this.collapsed_) {
    //   this.addOpenEvent();
    // } else {
    //   this.addCloseEvent();
    //    const container = this.map_.getContainer().parentElement.parentElement;
    //    container.style.width = 'calc(100% - 530px)';
    //    container.style.position = 'fixed';
    //    if (this.position_ === 'TL') {
    //      container.style.left = '530px';
    //    } else {
    //      container.style.right = '530px';
    //    }
    //    this.map_.refresh();
    // }
  }

  // e2m: Lo meto en el control
  /* eslint max-len: ["error", { "code": 150 }] */
  // addOpenEvent()  {
  //   const elem = document.querySelector('.m-panel.m-queryattributes.collapsed .m-panel-btn.icon-tabla');
  //   if (elem !== null) {
  //     elem.addEventListener('click', () => {
  //       const container = this.map_.getContainer().parentElement.parentElement;
  //       container.style.width = 'calc(100% - 530px)';
  //       container.style.position = 'fixed';
  //       if (this.position_ === 'TL') {
  //         container.style.left = '530px';
  //       } else {
  //         container.style.right = '530px';
  //       }
  //       this.map_.refresh();
  //       this.addCloseEvent();
  //     });
  //   }
  // }

  // e2m: Lo meto en el control
  // addCloseEvent() {
  //   const elem = document.querySelector('.m-panel.m-queryattributes.opened .m-panel-btn');
  //   if (elem !== null) {
  //     elem.addEventListener('click', () => {
  //       const container = this.map_.getContainer().parentElement.parentElement;
  //       container.style.width = '100%';
  //       container.style.position = '';
  //       if (this.position_ === 'TL') {
  //         container.style.left = 'unset';
  //       } else {
  //         container.style.right = 'unset';
  //       }
  //       this.map_.refresh();
  //       this.addOpenEvent();
  //     });
  //   }
  // }

  /**
   * Destroys plugin
   * @public
   * @function
   * @api
   */
  destroy() {
    this.map_.removeControls(this.controls_);
    [this.map_, this.control_, this.controls_, this.panel_] = [null, null, null, null];
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
   * Get the API REST Parameters of the plugin
   *
   * @function
   * @public
   * @api
   */
  getAPIRest() {
    // eslint-disable-next-line max-len
    return `${this.name}=${this.position_}*${this.collapsed_}*${this.collapsible_}*${this.tooltip_}*${this.filters_}*${this.refreshBBOXFilterOnPanning_}`;
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
   * @getter
   * @public
   */
  get name() {
    return 'queryattributes';
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
            urlImages: `${IDEE.config.API_IDEE_URL}plugins/queryattributes/images/`,
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
}
