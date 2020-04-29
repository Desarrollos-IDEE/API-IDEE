/**
 * @module M/plugin/Attributions
 */
import '../assets/css/attributions';
import AttributionsImpl from '../../impl/ol/js/attributions';
import AttributionsControl from './attributionscontrol';
import { intersect } from './filter';
import { getValue } from './i18n/language';

const MODES = {
  mapAttributions: 1, // Map attributions from vector layer
  layerAttributions: 2, // Attributions layer from its capabilities wms service
  mixed: 3, // Mixed mode ( 1 + 2)
};

/**
 * @typedef {AttributionsOptions}
 *
 * The mode according to which the plugin will consult the attributions.
 * @param {mode}
 * @type {number}
 *
 *
 * @param {url}
 * @type {URLLike}
 */

/**
 * Class of attributions plugin
 * @param {object}
 * @classdesc
 */
export default class Attributions extends M.Plugin {
  /**
   * @constructor
   * @extends {M.Plugin}
   * @param {AttributionsOptions} options
   * @api
   */
  constructor(options = {}) {
    super();

    if (M.utils.isNullOrEmpty(options.mode) || !Object.values(MODES).includes(options.mode)) {
      throw new Error(getValue('exception.mode'));
    }

    if (options.mode === MODES.mapAttributions && !M.utils.isNullOrEmpty(options.url)) {
      if (M.utils.isNullOrEmpty(options.type)) {
        throw new Error(getValue('exception.type'));
      }
    }

    if (options.mode === MODES.mapAttributions && !M.utils.isNullOrEmpty(options.layerName)) {
      if (M.utils.isNullOrEmpty(options.type)) {
        throw new Error(getValue('exception.layerName'));
      }
    }

    /**
     * Facade of the map
     *
     * @private
     * @type {M.Map}
     */
    this.map_ = null;

    /**
     * Array of controls
     *
     * @private
     * @type {Array<M.Control>}
     */
    this.controls_ = [];

    /**
     * Mode of the plugin
     *
     * @private
     * @type {number}
     */
    this.mode_ = Number.parseInt(options.mode, 10);

    /**
     * Vectorial service attributions
     *
     * @private
     * @type {URLLike}
     */
    this.url_ = options.url || M.config.attributions.url; // 'https://componentes.ign.es/NucleoVisualizador/vectorial_examples/atribucionPNOA.kml';
    /**
     * Type of the data url
     *
     * @private
     * @type {string}
     */
    this.type_ = options.type || 'kml';

    /**
     * The name of the vector layer hat contains the attribution information.
     *
     * @private
     * @type {string}
     */
    this.layerName_ = options.layerName || 'attributions';

    /**
     * Layer of Mapea with attributions
     *
     * @private
     * @type {M.layer.GeoJSON | M.layer.KML}
     */
    this.layer_ = options.layer;

    /**
     * Zoom from which attributions are displayed
     *
     * @private
     * @type {number}
     */
    this.scale_ = Number.parseInt(options.scale, 10) || 10000;

    /**
     * Parameter of the features of the layer that contains the information of the attributions.
     *
     * @private
     * @type {string}
     */
    this.attributionParam_ = options.attributionParam || 'atribucion';

    /**
     * Parameter of the features of the layer that contains the information of the URL.
     * @private
     * @type {URLLike}
     */
    this.urlParam_ = options.urlParam || 'url';

    /**
     * Minimum width of the view control
     * @private
     * @type {string}
     */
    this.minWidth_ = options.minWidth || '100px';

    /**
     * Minimum width of the view control
     * @private
     * @type {string}
     */
    this.maxWidth_ = options.maxWidth || '200px';

    /**
     * Position of the view control
     * @private
     * @type {string}
     */
    this.position_ = options.position || 'BL';

    /**
     * Default text attribution
     *
     * @private
     * @type {string}
     */
    // eslint-disable-next-line max-len
    this.defaultAttribution_ = options.defaultAttribution || M.config.attributions.defaultAttribution; // options.defaultAttribution;

    /**
     * Default url attribution
     *
     * @private
     * @type {string}
     */
    // eslint-disable-next-line max-len
    this.defaultURL_ = options.defaultURL || M.config.attributions.defaultURL; // options.defaultURL;

    /**
     * Tooltip of the UI Plugin
     *
     * @private
     * @type {string}
     */
    this.tooltip_ = options.tooltip || getValue('tooltip');

    window.addEventListener('resize', e => this.setCollapsiblePanel(e));
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
    this.map_ = map;
    this.impl_ = new AttributionsImpl(map);
    this.control_ = new AttributionsControl(this.position_, this.closePanel);
    this.controls_.push(this.control_);

    this.panel_ = new M.ui.Panel('Attributions', {
      collapsible: window.innerWidth < 769,
      position: M.ui.position[this.position_],
      className: 'm-panel-attributions',
      collapsedButtonClass: 'g-cartografia-info',
      tooltip: this.tooltip_,
    });

    this.panel_.addControls(this.control_);

    this.map_.addPanels(this.panel_);
    this.initMode();

    this.onMoveEnd(() => {
      this.changeAttributions();
    });
  }

  /**
   * This function destroys this plugin
   *
   * @public
   * @function
   * @api
   */
  destroy() {
    this.map_.removeControls([this.control_]);
    this.panel_ = null;
    // this.mode_ = null;
    // this.url_ = null;
    // this.type_ = null;
    // this.layerName_ = null;
    // this.layer_ = null;
    // this.scale_ = null;
    // this.attributionParam_ = null;
    // this.urlParam_ = null;
    // this.minWidth_ = null;
    // this.maxWidth_ = null;
  }

  /**
   * @public
   * @function
   */
  initMode() {
    if (this.mode_ === MODES.mapAttributions) {
      if (!(this.layer_ instanceof M.layer.Vector)) {
        const optionsLayer = {
          name: this.layerName_,
          url: this.url_,
        };

        if (this.type_ === 'geojson') {
          this.layer_ = new M.layer.GeoJSON(optionsLayer, { displayInLayerSwitcher: false });
        } else if (this.type_ === 'kml') {
          this.layer_ = new M.layer.KML(optionsLayer, { displayInLayerSwitcher: false });
        } else if (this.type === 'topojson') {
          // TODO: Implement in Mapea M.layer.TopoJSON
        }
      }

      if (this.map_.getLayers({ name: this.layer_ }).length < 1) {
        this.map_.addLayers(this.layer_);
        this.layer_.displayInLayerSwitcher = false;
        this.layer_.setVisible(false);
      }
    }
  }


  /**
   * This method shows the layer attributions
   *
   * @function
   * @public
   */
  changeAttributions() {
    this.clearContent();
    if (this.map_.getScale() <= this.scale_) {
      this.setVisible(true);
      let mapAttributions = [];
      if (this.mode_ === MODES.mapAttributions) {
        mapAttributions = this.getMapAttributions();
      } else if (this.mode_ === MODES.layerAttributions) {
        // TODO:
      } else if (this.mode === MODES.mixed) {
        // TODO:
      }

      this.addContent(mapAttributions);
    } else if (typeof this.defaultAttribution_ !== 'string') {
      // this.setVisible(false);
    } else {
      // this.setVisible(true);
      this.addContent([{
        attribution: this.defaultAttribution_,
        url: this.defaultURL_,
      }]);
    }
  }

  /**
   * This method adds the text content to the view attribution
   *
   * @function
   * @public
   */
  addContent(attributions) {
    const html = this.control_.getElement();
    const links = attributions.map((attrOpt, index, arr) => {
      const link = document.createElement('a');
      link.target = '_blank';
      link.href = attrOpt.url;
      link.innerHTML = attrOpt.attribution;
      link.innerHTML += arr.length - 1 === index ? '' : ',';
      return link;
    });
    const div = document.createElement('div');
    links.forEach((link) => {
      div.append(link);
    });
    html.append(div);
  }

  /**
   * This method adds the text content to the view attribution
   *
   * @function
   * @public
   */
  clearContent() {
    if (!M.utils.isNullOrEmpty(this.control_)) {
      const html = this.control_.getElement();
      html.querySelectorAll('div').forEach(child => html.removeChild(child));
    }
  }

  /**
   * This method toggle de visibility of the view attribution
   */
  setVisible(visibility) {
    const html = this.control_.getElement();
    html.style.display = visibility === false ? 'none' : '';
  }

  /**
   * @function
   * @public
   */
  getMapAttributions() {
    this.updateBBoxFeature();
    const featuresAttributions = this.map_.getLayers().filter(l => l.name.includes('attributions'))[0].getFeatures();
    const interFilter = intersect(this.bboxFeature_);
    const filteredFeatures = interFilter.execute(featuresAttributions);
    return filteredFeatures.map((feature) => {
      return {
        attribution: feature.getAttribute(this.attributionParam_) || '',
        url: feature.getAttribute(this.urlParam_) || this.defaultURL_,
      };
    }).filter((element, index, array) => // remove repeat elements
      array.map(e => e.attribution).indexOf(element.attribution) === index);
  }

  /**
   * @function
   * @public
   */
  getLayerAttributions() {
    // TODO:
  }

  /**
   * @function
   * @public
   */
  closePanel() {
    this.getPanel().collapse();
  }

  /**
   * @function
   * @public
   */
  changeContentAttribution(content) {
    this.control_.changeContent(content);
  }

  /**
   * @function
   * @public
   */
  updateBBoxFeature() {
    const { x, y } = this.map_.getBbox();
    this.bboxFeature_ = new M.Feature('bbox_feature', {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [x.min, y.min],
            [x.min, y.max],
            [x.max, y.max],
            [x.max, y.min],
            [x.min, y.min],
          ],
        ],
      },
    });
  }

  /**
   * @function
   * @public
   */
  setCollapsiblePanel(e) {
    if (this.getPanel() && this.getPanel().getTemplatePanel()) {
      if (e.target.innerWidth < 769) {
        this.getPanel().getTemplatePanel().classList.remove('no-collapsible');
        this.closePanel();
      } else {
        this.getPanel().getTemplatePanel().classList.add('no-collapsible');
        this.getPanel().getTemplatePanel().classList.remove('collapsed');
      }
    }
  }
  /**
   * @function
   * @public
   */
  onMoveEnd(callback) {
    this.impl_.registerEvent('moveend', e => callback(e));
  }

  /**
   * @function
   * @public
   */
  getPanel() {
    return this.panel_;
  }

  /**
   * Name of the plugin
   *
   * @getter
   * @function
   */
  get name() {
    return 'attributions';
  }

  /**
   * Mode of the plugin
   *
   * @public
   * @function
   * @api
   */
  get mode() {
    return this.mode_;
  }

  /**
   * Position of the plugin
   *
   * @public
   * @function
   * @api
   */
  get position() {
    return this.position_;
  }

  /**
   * Scale of the plugin
   *
   * @public
   * @function
   * @api
   */
  get scale() {
    return this.scale_;
  }

  /**
   * Attribution of the plugin
   *
   * @public
   * @function
   * @api
   */
  get defaultAttribution() {
    return this.defaultAttribution_;
  }

  /**
   * Default url of the plugin
   *
   * @public
   * @function
   * @api
   */
  get defaultURL() {
    return this.defaultURL_;
  }

  /**
   * url of the layer
   *
   * @public
   * @function
   * @api
   */
  get url() {
    return this.url_;
  }

  /**
   * Type
   *
   * @public
   * @function
   * @api
   */
  get type() {
    return this.type_;
  }

  /**
   * Layer name
   *
   * @public
   * @function
   * @api
   */
  get layerName() {
    return this.layerName_;
  }

  /**
   * Parameter of the features of the layer that contains the information of the attributions.
   *
   * @public
   * @function
   * @api
   */
  get attributionParam() {
    return this.attributionParam_;
  }

  /**
   * Parameter of the features of the layer that contains the information of the URL.
   *
   * @public
   * @function
   * @api
   */
  get urlParam() {
    return this.urlParam_;
  }

  /**
   * Get the API REST Parameters of the plugin
   *
   * @function
   * @public
   * @api
   */
  getAPIRest() {
    return `${this.name}=${this.position}*${this.mode}*${this.scale}*${this.defaultAttribution}*${this.defaultURL}*${this.url}*${this.type}*${this.layerName}*${this.attributionParam}*${this.urlParam}`;
  }
}
