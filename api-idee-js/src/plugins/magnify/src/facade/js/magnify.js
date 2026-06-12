/* eslint-disable no-console */
/**
 * @module M/plugin/Magnify
 */
import 'assets/css/magnify';
import api from '../../api';
import myhelp from '../../templates/myhelp.html';
import en from './i18n/en';
import es from './i18n/es';
import { getValue } from './i18n/language';
import MagnifyControl from './magnifycontrol';

export default class Magnify extends IDEE.Plugin {
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
     * This flag indicates if the plugin is collapsible
     * @type {boolean}
     */
    this.collapsible = true;

    /**
     * Class name of the html view Plugin
     * @type {string}
     */
    this.className = 'm-plugin-magnify';

    /**
     * Position of the Plugin
     * @type {string}
     */
    this.position = options.position || 'TR';

    /**
     * Layer names that will have effects
     * Value: the names separated with coma
     * @type {string}
     */
    /* Al crear el plugin pueden darse tres casos:
      1. que no se haya incluido el parámetro layers.
      2. que el parámetro layers esté vacío (layers: '')
      3. que el parámetro layers contenga una capa o varias separadas por comas */
    if (options.layers === '' || options.layers === null || options.layers === undefined) {
      this.layers = '';
    } else {
      this.layers = options.layers.split(',');
    }

    /**
     * Max limit zoom
     * Value: number
     * @type {number}
     */
    this.zoomMax = options.zoomMax || 10;

    /**
     * Magnifying effect zoom
     * Value: number in range 1 - zoomMax
     * @type {number}
     */
    this.zoom = options.zoom || 1;

    /**
     * Metadata from api.json
     * @private
     * @type {Object}
     */
    this.metadata_ = api.metadata;
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
    const pluginOnLeft = !!(['TL', 'BL'].includes(this.position));
    const values = {
      pluginOnLeft,
      layers: this.layers,
      zoom: this.zoom,
      zoomMax: this.zoomMax,
    };
    this.control_ = new MagnifyControl(values);
    this.controls_.push(this.control_);

    this.map_ = map;

    // panel para agregar control - no obligatorio
    this.panel_ = new IDEE.ui.Panel('panelMagnify', {
      collapsible: this.collapsible,
      position: IDEE.ui.position[this.position],
      className: this.className,
      collapsedButtonClass: 'g-cartografia-zoom-extension',
      tooltip: getValue('tooltip'),
    });
    this.panel_.addControls(this.controls_);
    this.panel_.on(IDEE.evt.SHOW, (evt) => {
      if (map.getWFS().length === 0 && map.getKML().length === 0 && map.getGeoJSON() === 0) {
        this.panel_.collapse();
        IDEE.dialog.info(getValue('exception.nolayersavai'));
      }
    });
    map.addPanels(this.panel_);
  }

  /**
   * This function destroys this plugin
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {
    // Eliminar el efecto de magnificación (overlay de OL)
    if (this.control_ && this.control_.getImpl()) {
      this.control_.getImpl().removeEffects();
    }
    // Eliminar también el elemento visual de la lupa del DOM
    const magnifyElement = document.querySelector('.ol-magnify');
    if (magnifyElement) {
      magnifyElement.remove();
    }
    if (this.map_ && this.controls_) {
      this.map_.getImpl().removeControls(this.controls_);
    }
    // Eliminar el panel del DOM por su clase CSS
    const panelElement = document.querySelector('.m-plugin-magnify');
    if (panelElement) {
      panelElement.remove();
    }
    if (this.panel_ && this.map_) {
      // Eliminar el panel del array de paneles del mapa
      // eslint-disable-next-line no-underscore-dangle
      this.map_._panels = this.map_._panels.filter((p) => !p.equals(this.panel_));
    }
    [this.control_, this.controls_, this.panel_, this.map_] = [null, null, null, null];
  }

  /**
   * This function return the control of plugin
   *
   * @public
   * @function
   * @api stable
   */
  getControls() {
    const aControl = [];
    aControl.push(this.control_);
    return aControl;
  }

  /**
   * @getter
   * @public
   */
  get name() {
    return 'magnify';
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
    return IDEE.language.getTranslation(lang).magnify;
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
      title: getValue('textHelp.squemaTitle'),
      content: new Promise((resolve) => {
        const html = IDEE.template.compileSync(myhelp, {
          vars: {
            title: getValue('textHelp.title'),
            urlImages: `${IDEE.config.API_IDEE_URL}plugins/magnify/images/`,
            translations: {
              paragraph1: getValue('textHelp.paragraph1'),
              screenshot1Alt: getValue('textHelp.screenshot1Alt'),
              screenshot1Caption: getValue('textHelp.screenshot1Caption'),
              screenshot2Alt: getValue('textHelp.screenshot2Alt'),
              screenshot2Caption: getValue('textHelp.screenshot2Caption'),
              screenshot2Description: getValue(
                'textHelp.screenshot2Description',
              ),
            },
          },
        });
        resolve(html);
      }),
    };
  }
}
