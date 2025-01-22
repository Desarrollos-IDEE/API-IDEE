/**
 * @module IDEE/plugin/ViewManagement
 */
import '../assets/css/viewmanagement';
import ViewManagementControl from './viewmanagementcontrol';
import es from './i18n/es';
import en from './i18n/en';
import { getValue } from './i18n/language';
import myhelp from '../../templates/myhelp';

export default class ViewManagement extends IDEE.Plugin {
  /**
   * @classdesc
   * Main facade plugin object. This class creates a plugin
   * object which has an implementation Object
   *
   * @constructor
   * @extends {IDEE.Plugin}
   * @param {Object} impl implementation object
   * @api
   */
  constructor(options = {}) {
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
     * Plugin name
     * @public
     * @type {String}
     */
    this.name = 'viewmanagement';

    /**
     * Plugin parameters
     * @public
     * @type {Object}
     */
    this.options = options;

    /**
     * Position of the plugin
     *
     * @private
     * @type {String} TL | TR | BL | BR
     */
    this.position_ = options.position || 'TL';

    /**
     * Option to allow the plugin to be collapsed or not
     * @private
     * @type {Boolean}
     */
    this.collapsed = !IDEE.utils.isUndefined(options.collapsed) ? options.collapsed : true;

    /**
     * Option to allow the plugin to be collapsible or not
     * @private
     * @type {Boolean}
     */
    this.collapsible = !IDEE.utils.isUndefined(options.collapsible) ? options.collapsible : true;

    /**
     * Tooltip of plugin
     * @private
     * @type {String}
     */
    this.tooltip_ = options.tooltip || getValue('tooltip');

    /**
     * Option to allow the plugin to be draggable or not
     * @private
     * @type {Boolean}
     */
    this.isDraggable = !IDEE.utils.isUndefined(options.isDraggable) ? options.isDraggable : false;

    /**
     * Indicates if the control PredefinedZoom is added to the plugin
     * @private
     * @type {Boolean|Array<Object>}
     */
    this.predefinedzoom = IDEE.utils.isUndefined(options.predefinedZoom)
      || options.predefinedZoom === true
      ? this.getPredefinedZoom()
      : options.predefinedZoom;

    /**
     * Indicates if the control ZoomExtent is added to the plugin
     * @private
     * @type {Boolean}
     */
    this.zoomextent = !IDEE.utils.isUndefined(options.zoomExtent) ? options.zoomExtent : true;

    /**
     * Indicates if the control ViewHistory is added to the plugin
     * @private
     * @type {Boolean}
     */
    this.viewhistory = !IDEE.utils.isUndefined(options.viewhistory) ? options.viewhistory : true;

    /**
     * Indicates if the control ZoomPanel is added to the plugin
     * @private
     * @type {Boolean}
     */
    this.zoompanel = !IDEE.utils.isUndefined(options.zoompanel) ? options.zoompanel : true;

    /**
     * Indicates order to the plugin
     * @private
     * @type {Number}
     */
    this.order = options.order >= -1 ? options.order : null;
  }

  /**
   * Return plugin language
   *
   * @public
   * @function
   * @param {string} lang type language
   * @api
   */
  static getJSONTranslations(lang) {
    if (lang === 'en' || lang === 'es') {
      return (lang === 'en') ? en : es;
    }
    return IDEE.language.getTranslation(lang).viewmanagement;
  }

  /**
   * This function adds this plugin into the map
   *
   * @public
   * @function
   * @param {IDEE.Map} map the map to add the plugin
   * @api
   */
  addTo(map) {
    if (this.predefinedzoom === false && this.zoomextent === false
      && this.viewhistory === false && this.zoompanel === false) {
      IDEE.dialog.error(getValue('exception.no_controls'));
    }
    this.controls_.push(new ViewManagementControl(
      this.isDraggable,
      this.predefinedzoom,
      this.zoomextent,
      this.viewhistory,
      this.zoompanel,
      this.order,
    ));
    this.map_ = map;
    this.panel_ = new IDEE.ui.Panel('panelViewManagement', {
      collapsible: this.collapsible,
      collapsed: this.collapsed,
      position: IDEE.ui.position[this.position_],
      className: 'm-plugin-viewmanagement',
      tooltip: this.tooltip_,
      collapsedButtonClass: 'viewmanagement-icon-zoom-mapa',
      order: this.order,
    });

    this.panel_.addControls(this.controls_);
    map.addPanels(this.panel_);
  }

  /**
   * This functions indicates default center and zoom level for
   * the control predefinedZoom
   *
   * @public
   * @function
   * @returns Default center and zoom level
   * @api
   */
  getPredefinedZoom() {
    const predefinedZoom = [{
      center: [-356188.1915089525, 4742037.53423241],
      zoom: 6,
      isDefault: true,
    }];
    return predefinedZoom;
  }

  /**
   * Gets the API REST Parameters of the plugin
   *
   * @function
   * @public
   * @api
   */
  getAPIRest() {
    return `${this.name}=${this.position_}*${this.collapsed}*${this.collapsible}*${this.tooltip_}*${this.isDraggable}*${!!this.predefinedzoom}*${this.zoomextent}*${this.viewhistory}*${this.zoompanel}`;
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
   * This function destroys this plugin
   *
   * @public
   * @function
   * @api
   */
  destroy() {
    this.map_.removeControls(this.controls_);
    this.map_ = null;
    this.controls_ = null;
    this.panel_ = null;
    this.name = null;
  }

  /**
   * This function compare if pluging recieved by param is instance of IDEE.plugin.ViewManagement
   *
   * @public
   * @function
   * @param {IDEE.plugin} plugin to comapre
   * @api
   */
  equals(plugin) {
    if (plugin instanceof ViewManagement) {
      return true;
    }
    return false;
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
            urlImages: `${IDEE.config.API_IDEE_URL}plugins/viewmanagement/images/`,
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
            },
          },
        });
        success(html);
      }),
    };
  }
}
