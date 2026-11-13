/**
 * @module IDEE/plugin/SelectionZoom
 */
import '../assets/css/selectionzoom';
import api from '../../api';
import SelectionZoomControl from './selectionzoomcontrol';
import { getValue } from './i18n/language';
import myhelp from '../../templates/myhelp';

import es from './i18n/es';
import en from './i18n/en';

const DEFAULT_LAYER_OPTIONS = [
  {
    id: 'peninsula',
    title: 'Peninsula',
    preview: 'https://componentes.idee.es/api-idee/plugins/selectionzoom/images/espana.png',
    bbox: '-1200091.444315327, 4348955.797933925, 365338.89496508264, 5441088.058207252',
  },
  {
    id: 'canarias',
    title: 'Canarias',
    preview: 'https://componentes.idee.es/api-idee/plugins/selectionzoom/images/canarias.png',
    center: '-1844272.618465, 3228700.074766',
    zoom: 8,
  },
  {
    id: 'baleares',
    title: 'Baleares',
    preview: 'https://componentes.idee.es/api-idee/plugins/selectionzoom/images/baleares.png',
    bbox: '115720.89020469127,4658411.436032817,507078.4750247937,4931444.501067467',
  },
  {
    id: 'ceuta',
    title: 'Ceuta',
    preview: 'https://componentes.idee.es/api-idee/plugins/selectionzoom/images/ceuta.png',
    bbox: '-599755.2558583047, 4281734.817081453, -587525.3313326766, 4290267.100363785',
  },
  {
    id: 'melilla',
    title: 'Melilla',
    preview: 'https://componentes.idee.es/api-idee/plugins/selectionzoom/images/melilla.png',
    center: '-327838.4143151213, 4203788.135342773',
    zoom: 14,
  },
];

export default class SelectionZoom extends IDEE.Plugin {
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
    super('selectionzoom', {
      position: options.position || 'left',
      tooltip: options.tooltip || getValue('tooltip'),
      order: options.order,
    });

    /**
     * Plugin name
     * @public
     * @type {String}
     */
    this.name = 'selectionzoom';

    /**
     * Plugin parameters
     * @public
     * @type {object}
     */
    this.options = options;

    /**
     * Indicates if the plugin is collapsed on entry (true/false).
     * @public
     * @type {string}
     * @default true
     */
    this.collapsed = options.collapsed !== undefined ? options.collapsed : true;

    /**
     * Metadata from api.json
     * @public
     * @type {Object}
     */
    this.metadata_ = api.metadata;

    /**
     * Array of objects. Each one has the configuration of a layer
     * @public
     * @type {Array<Object>}
     * @default DEFAULT_LAYER_OPTIONS
     */
    this.layerOpts = options.options || DEFAULT_LAYER_OPTIONS;

    /**
     * IDs of each options layer
     * @public
     * @type {String}
     */
    this.ids = this.layerOpts.map((l) => l.id).toString();

    /**
     * Titles of each options layer
     * @public
     * @type {String}
     */
    this.titles = this.layerOpts.map((l) => l.title).toString();

    /**
     * Previews of each options layer
     * @public
     * @type {String}
     */
    this.previews = this.layerOpts.map((l) => l.preview).toString();

    /**
     * Bboxs of each options layer
     * @public
     * @type {Array}
     */
    this.bboxs = [];

    /**
     * Zooms of each options layer
     * @public
     * @type {String}
     */
    this.zooms = [];

    /**
     * Centers of each options layer
     * @public
     * @type {Array}
     */
    this.centers = [];

    this.layerOpts.forEach((l, i) => {
      if ('bbox' in l) {
        this.bboxs[i] = l.bbox;
        this.zooms[i] = '';
        this.centers[i] = '';
      } else if ('zoom' in l && 'center' in l) {
        this.bboxs[i] = '';
        this.zooms[i] = l.zoom;
        this.centers[i] = l.center;
      } else {
        this.bboxs[i] = '';
        this.zooms[i] = '';
        this.centers[i] = '';
      }
    });
    this.zooms = this.zooms.toString();
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
    return IDEE.language.getTranslation(lang).selectionzoom;
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
      svgPath: 'https://componentes.idee.es/estaticos/Simbologia/svg/icons_cota/icn_selectionzoom.svg',
      order: this.order,
    });
    map.addButtons(this.button);

    this.panel = new IDEE.ui.panels.PluginSidePanel(this.name, {
      collapsed: this.collapsed,
      position: this.position,
      minWidth: this.minPanelWidth,
      maxWidth: this.maxPanelWidth,
      className: 'm-plugin-selectionzoom',
      tooltip: this.tooltip,
      collapsedButtonClass: 'g-selectionzoom-selezoom',
      order: this.order,
    });

    this.controls.push(new SelectionZoomControl(
      this.map,
      this.ids,
      this.titles,
      this.previews,
      this.bboxs,
      this.zooms,
      this.centers,
      this.order,
    ));

    this.controls[0].on(IDEE.evt.ADDED_TO_MAP, () => {
      this.fire(IDEE.evt.ADDED_TO_MAP);
    });

    this.panel.addControls(this.controls);

    this.button.panel = this.panel;
    this.panel.button = this.button;

    map.addPanels(this.panel);
  }

  /**
   * Gets the API REST Parameters of the plugin
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
   * Turns layerOpts parameter into piece of REST url.
   * @public
   * @function
   * @api
   */
  turnLayerOptsIntoUrl() {
    let ids = '';
    let titles = '';
    let previews = '';
    let bboxs = '';
    let zooms = '';

    this.layerOpts.forEach((l) => {
      const backLayerIndex = this.layerOpts.indexOf(l);
      if (backLayerIndex !== 0) {
        ids += ',';
        titles += ',';
        previews += ',';
        bboxs += ',';
        zooms += ',';
      }

      ids += l.ids;
      titles += l.titles;
      previews += l.previews;
      bboxs += l.zooms;
      zooms += l.zooms;
    });

    return `${ids}s*${titles}*${previews}*${bboxs}*${zooms}`;
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
  }

  /**
   * This function compare if pluging recieved by param is instance of IDEE.plugin.SelectionZoom
   *
   * @public
   * @function
   * @param {IDEE.plugin} plugin to comapre
   * @api stable
   */
  equals(plugin) {
    return plugin instanceof SelectionZoom;
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
            urlImages: `${IDEE.config.API_IDEE_URL}plugins/selectionzoom/images/`,
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
