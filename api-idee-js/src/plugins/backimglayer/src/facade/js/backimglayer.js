/**
 * @module M/plugin/BackImgLayer
 */
// import '/assets/css/backimglayer';
import '../assets/css/backimglayer';
import api from '../../api';
import myhelp from '../../templates/myhelp';
import BackImgLayerControl from './backimglayercontrol';
import { getValue } from './i18n/language';

import es from './i18n/es';
import en from './i18n/en';

export default class BackImgLayer extends M.Plugin {
  /**
   * @classdesc
   * Main facade plugin object. This class creates a plugin
   * object which has an implementation Object
   *
   * @constructor
   * @extends {M.Plugin}
   * @param {Object} impl implementation object
   * @api stable
   */
  constructor(options = {}) {
    super();
    /**
     * Facade of the map
     * @private
     * @type {M.Map}
     */
    this.map_ = null;

    /**
     * Array of controls
     * @private
     * @type {Array<M.Control>}
     */
    this.controls_ = [];

    /**
     * Plugin name
     * @public
     * @type {String}
     */
    this.name = 'backimglayer';

    /**
     * Plugin parameters
     * @public
     * @type {object}
     */
    this.options = options;

    /**
     * Position of the plugin
     *
     * @private
     * @type {Enum} TL | TR | BL | BR
     */
    this.position_ = options.position || 'TR';

    /**
     * Position of current background layer on layers array.
     * @private
     * @type {Number}
     */
    this.layerId = options.layerId || 0;

    /**
     * Visibility of current background layer.
     * @private
     * @type {Boolean}
     */
    this.layerVisibility = !!(options.layerVisibility);

    /**
     * Layers to use as background. Each one has id, title, preview and layers attributes.
     * @private
     * @type {Object}
     */
    this.layerOpts = options.layerOpts;

    /**
     * Layers id's separated by ','.
     * @public
     * @type {String}
     */
    this.ids = options.ids || 'wmts';

    /**
     * Layers titles separated by ','.
     * @public
     * @type {String}
     */
    this.titles = options.titles || 'IGNBaseTodo';

    /**
     * Layers preview urls separated by ','.
     * @public
     * @type {String}
     */
    this.previews = options.previews || 'https://componentes.cnig.es/api-idee/plugins/backimglayer/images/svqmapa.png';

    /**
     * Layers separated by ','.
     * Each base layer can contain more than one layer separated by 'sumar' (before: '+').
     * Each of these layers has different parameters separated by 'asterisco'(NOT * ).
     * @public
     * @type {String}
     */
    this.layers = options.layers || 'QUICK*BASE_MapaBase_IGNBaseTodo_WMTS';

    /**
     * @private
     * @type {string}
     *
     * Indicates if the plugin is collapsed on entry (true/false).
     */
    this.collapsed = options.collapsed !== undefined ? options.collapsed : true;

    /**
     * @private
     * @type {string}
     *
     * Indicates if the plugin can be collapsed into a button (true/false).
     */
    this.collapsible = options.collapsible !== undefined ? options.collapsible : true;

    /**
     * @private
     * @type {string}
     *
     * Empty Layer
     */
    this.empty = options.empty !== undefined ? options.empty : false;

    /**
     * @private
     * @type {string}
     *
     * Number of columns that parameterize the table of services shown.
     */
    this.columnsNumber = options.columnsNumber != null ? options.columnsNumber : 2;

    /**
     * Metadata from api.json
     * @private
     * @type {Object}
     */
    this.metadata_ = api.metadata;

    /**
     * @private
     * @type {string}
     */
    this.tooltip_ = options.tooltip || getValue('tooltip');

    /**
     *@private
     *@type { Number }
     */
    this.order = options.order >= -1 ? options.order : null;

    this.visible = options.visible !== undefined ? options.visible : true;
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
    return M.language.getTranslation(lang).backimglayer;
  }

  /**
   * This function adds this plugin into the map
   *
   * @public
   * @function
   * @param {M.Map} map the map to add the plugin
   * @api stable
   */
  addTo(map) {
    this.controls_.push(new BackImgLayerControl({
      map,
      visible: this.visible,
      layerOpts: this.layerOpts,
      layerId: this.layerId,
      layerVisibility: this.layerVisibility,
      ids: this.ids,
      titles: this.titles,
      previews: this.previews,
      layers: this.layers,
      numColumns: this.columnsNumber,
      empty: this.empty,
      order: this.order,
    }));
    this.map_ = map;
    this.panel_ = new M.ui.Panel('BackImgLayer', {
      collapsible: this.collapsible,
      collapsed: this.collapsed,
      position: M.ui.position[this.position_],
      className: 'm-plugin-backimglayer',
      tooltip: this.tooltip_,
      collapsedButtonClass: 'backimglyr-simbolo-cuadros',
      order: this.order,
    });

    this.controls_[0].on('backimglayer:activeChanges', (data) => {
      this.layerId = data.activeLayerId;
    });

    this.panel_.addControls(this.controls_);
    map.addPanels(this.panel_);
  }

  /**
   * Gets the API REST Parameters of the plugin
   *
   * @function
   * @public
   * @api
   */
  getAPIRest() {
    const layers = this.layerOpts === undefined
      ? `${this.ids}*!${this.titles}*!${this.previews}*!${this.layers}`
      : this.turnLayerOptsIntoUrl();
    return `${this.name}=${this.position_}*!${this.collapsed}*!${this.collapsible}*!${this.tooltip_}*!${this.layerVisibility}*!${this.layerId}*!${this.columnsNumber}*!${this.empty}*!${layers}`;
  }

  /**
   * Gets the API REST Parameters in base64 of the plugin
   *
   * @function
   * @public
   * @api
   */
  getAPIRestBase64() {
    return `${this.name}=base64=${M.utils.encodeBase64(this.options)}`;
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
    let layersUrl = '';

    this.layerOpts.forEach((l) => {
      const backLayerIndex = this.layerOpts.indexOf(l);
      if (backLayerIndex !== 0) {
        ids += ',';
        titles += ',';
        previews += ',';
        layersUrl += ',';
      }

      ids += l.id;
      titles += l.title;
      previews += l.preview;

      l.layers.forEach((layer) => {
        const isFirstLayer = l.layers.indexOf(layer) === 0;
        const visible = layer.options.visibility === undefined ? true : layer.options.visibility;

        if (!isFirstLayer) layersUrl += 'sumar';

        if (Object.keys(layer.options).length > 0) {
          layersUrl += `${layer.options.type}`;
          layersUrl += `*${layer.options.url}`;
          layersUrl += `*${layer.options.name}`;
          layersUrl += `*${layer.options.matrixSet}`;
          layersUrl += `*${layer.options.legend}`;

          layersUrl += `*${layer.options.transparent}`;

          layersUrl += `*${layer.options.format}`;
          layersUrl += `*${layer.options.displayInLayerSwitcher}`;
          layersUrl += `*${layer.options.queryable}`;
          layersUrl += `*${visible}`;
        } else {
          layersUrl += `${layer.type}`;
          layersUrl += `*${layer.name}`;
          layersUrl += `*${layer.url}`;
          layersUrl += `*${layer.isVisible()}`;
          layersUrl += `*${layer.transparent}`;
          layersUrl += `*${layer.tileGridMaxZoom}`;
        }
      });
    });

    return `${ids}*!${titles}*!${previews}*!${layersUrl}`;
  }

  /**
   * This function destroys this plugin
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {
    this.map_.removeControls(this.controls_);
    this.map_ = null;
    this.control_ = null;
    this.controls_ = null;
    this.panel_ = null;
    this.name = null;
    this.layerOpts = null;
  }

  /**
   * This function compare if pluging recieved by param is instance of M.plugin.BackImgLayer
   *
   * @public
   * @function
   * @param {M.plugin} plugin to comapre
   * @api stable
   */
  equals(plugin) {
    return plugin instanceof BackImgLayer;
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

  changeStyleResponsive(change) {
    // eslint-disable-next-line no-unused-expressions
    (change)
      ? document.querySelectorAll('.m-panel.m-plugin-backimglayer').forEach((e) => e.classList.add('changeStyleResponsive'))
      : document.querySelectorAll('.m-panel.m-plugin-backimglayer').forEach((e) => e.classList.remove('changeStyleResponsive'));
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
            urlImages: `${M.config.API_IDEE_URL}plugins/backimglayer/images/`,
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
