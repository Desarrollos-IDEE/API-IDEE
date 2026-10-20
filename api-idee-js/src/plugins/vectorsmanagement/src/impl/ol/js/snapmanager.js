import SnapGuides from 'ol-ext/interaction/SnapGuides';

/**
 * @module IDEE/impl/control/SnapManager
 */

/**
 * Default snap options
 * @const
 * @type {Object}
 */
const DEFAULT_SNAP_OPTIONS = {
  active: true,
  vertex: true,
  edge: true,
  intersection: false,
  pixelTolerance: 10,
  allLayers: false,
  guides: false,
};

/**
 * Key that temporarily disables snapping while pressed
 * @const
 * @type {String}
 */
const DISABLE_SNAP_KEY = 'Control';

export default class SnapManager {
  /**
   * @classdesc
   * Manages snap interactions for draw and modify interactions.
   *
   * @constructor
   * @param {IDEE.Map} map facade map
   * @api
   */
  constructor(map) {
    /**
     * Facade map
     * @private
     * @type {IDEE.Map}
     */
    this.facadeMap_ = map;

    /**
     * OL snap interaction
     * @private
     * @type {ol.interaction.Snap}
     */
    this.snap_ = null;

    /**
     * ol-ext snap guides interaction
     * @private
     * @type {SnapGuides}
     */
    this.guides_ = null;

    /**
     * Features collection where snap is applied
     * @private
     * @type {ol.Collection}
     */
    this.features_ = null;

    /**
     * Sources listeners keys
     * @private
     * @type {Array}
     */
    this.sourceKeys_ = [];

    /**
     * Layers listeners keys
     * @private
     * @type {Array}
     */
    this.layerKeys_ = [];

    /**
     * Layer to show snapped point
     * @private
     * @type {ol.layer.Vector}
     */
    this.indicatorLayer_ = null;

    /**
     * Interaction the snap is associated with
     * @private
     * @type {ol.interaction.Interaction}
     */
    this.interaction_ = null;

    /**
     * Function to get the layer selected for management
     * @private
     * @type {Function}
     */
    this.getLayer_ = null;

    /**
     * Current snap options
     * @private
     * @type {Object}
     */
    this.options_ = { ...DEFAULT_SNAP_OPTIONS };

    this.keydownListener_ = this.onKeyChange_.bind(this, false);
    this.keyupListener_ = this.onKeyChange_.bind(this, true);
  }

  /**
   * Enables snap for the given draw/modify interaction.
   * @public
   * @function
   * @param {ol.interaction.Interaction} interaction draw or modify interaction
   * @param {Function} getLayer returns the layer selected for management
   * @param {Object} options snap options
   * @api
   */
  enable(interaction, getLayer, options) {
    this.disable();
    this.interaction_ = interaction;
    this.getLayer_ = getLayer;
    this.options_ = { ...DEFAULT_SNAP_OPTIONS, ...options };
    if (!this.options_.active || !interaction) {
      return;
    }

    const olMap = this.facadeMap_.getMapImpl();
    const { vertex, edge, intersection } = this.options_;
    const pixelTolerance = parseInt(this.options_.pixelTolerance, 10) || 0;

    if (vertex || edge || intersection) {
      this.features_ = new ol.Collection([], { unique: true });
      this.refreshSources_();
      this.watchLayers_();
      this.snap_ = new ol.interaction.Snap({
        features: this.features_,
        vertex,
        edge,
        intersection,
        pixelTolerance,
      });
      this.snap_.on('snap', (evt) => this.showIndicator_(evt.vertex));
      this.snap_.on('unsnap', () => this.hideIndicator_());
      olMap.addInteraction(this.snap_);
      this.addIndicatorLayer_(olMap);
    }

    if (this.options_.guides) {
      this.guides_ = new SnapGuides({
        pixelTolerance,
        vectorClass: ol.layer.Vector,
      });
      this.guides_.setDrawInteraction(interaction);
      olMap.addInteraction(this.guides_);
    }

    document.addEventListener('keydown', this.keydownListener_);
    document.addEventListener('keyup', this.keyupListener_);
  }

  /**
   * Updates snap options, recreating snap interactions.
   * @public
   * @function
   * @param {Object} options snap options
   * @api
   */
  update(options) {
    if (this.interaction_ && this.interaction_.getMap()) {
      this.enable(this.interaction_, this.getLayer_, options);
    } else {
      this.options_ = { ...DEFAULT_SNAP_OPTIONS, ...options };
    }
  }

  /**
   * Removes snap interactions from map.
   * @public
   * @function
   * @api
   */
  disable() {
    const olMap = this.facadeMap_.getMapImpl();
    if (this.snap_) {
      olMap.removeInteraction(this.snap_);
      this.snap_ = null;
    }
    if (this.guides_) {
      olMap.removeInteraction(this.guides_);
      this.guides_ = null;
    }
    if (this.indicatorLayer_) {
      this.indicatorLayer_.setMap(null);
      this.indicatorLayer_ = null;
    }
    this.sourceKeys_.forEach((key) => ol.Observable.unByKey(key));
    this.sourceKeys_ = [];
    this.layerKeys_.forEach((key) => ol.Observable.unByKey(key));
    this.layerKeys_ = [];
    this.features_ = null;
    this.interaction_ = null;
    document.removeEventListener('keydown', this.keydownListener_);
    document.removeEventListener('keyup', this.keyupListener_);
  }

  /**
   * Returns the vector layers of the map other than the selected one.
   * @private
   * @function
   * @return {Array<IDEE.layer.Vector>} vector layers
   */
  getOtherVectorLayers_() {
    if (!this.options_.allLayers) {
      return [];
    }
    const selectedLayer = this.getLayer_ ? this.getLayer_() : null;
    return this.facadeMap_.getLayers()
      .concat(this.facadeMap_.getImpl().getAllLayerInGroup())
      .filter((l) => (l instanceof IDEE.layer.Vector || l instanceof IDEE.layer.GenericVector)
        && l !== selectedLayer && l.name !== 'selectLayer' && l.getImpl().getLayer());
  }

  /**
   * Returns the OL sources to snap to.
   * @private
   * @function
   * @return {Array<ol.source.Vector>} OL vector sources
   */
  getSources_() {
    const getSource = (layer) => (layer && layer.getImpl().getLayer()
      ? layer.getImpl().getLayer().getSource() : null);
    const selectedLayer = this.getLayer_ ? this.getLayer_() : null;
    const sources = [getSource(selectedLayer)]
      .concat(this.getOtherVectorLayers_().filter((l) => l.isVisible()).map(getSource));
    return sources.filter((source, i) => source && typeof source.getFeatures === 'function'
      && sources.indexOf(source) === i);
  }

  /**
   * Rebuilds the snap collection from the current sources.
   * @private
   * @function
   */
  refreshSources_() {
    this.sourceKeys_.forEach((key) => ol.Observable.unByKey(key));
    this.sourceKeys_ = [];
    this.features_.clear();
    this.syncSources_(this.getSources_());
  }

  /**
   * Refreshes the snap collection when a layer
   * changes its visibility or a layer is added/removed from the map.
   * @private
   * @function
   */
  watchLayers_() {
    this.layerKeys_.forEach((key) => ol.Observable.unByKey(key));
    this.layerKeys_ = [];
    if (!this.options_.allLayers) {
      return;
    }
    this.getOtherVectorLayers_().forEach((l) => {
      this.layerKeys_.push(l.getImpl().getLayer().on('change:visible', () => this.refreshSources_()));
    });
    this.layerKeys_.push(this.facadeMap_.getMapImpl().getLayers().on(['add', 'remove'], () => {
      this.watchLayers_();
      this.refreshSources_();
    }));
  }

  /**
   * Adds the features of the sources to the snap collection.
   * @private
   * @function
   * @param {Array<ol.source.Vector>} sources OL vector sources
   */
  syncSources_(sources) {
    sources.forEach((source) => {
      this.features_.extend(source.getFeatures()
        .filter((f) => this.features_.getArray().indexOf(f) === -1));
      this.sourceKeys_.push(source.on('addfeature', (evt) => {
        if (this.features_.getArray().indexOf(evt.feature) === -1) {
          this.features_.push(evt.feature);
        }
      }));
      this.sourceKeys_.push(source.on('removefeature', (evt) => {
        this.features_.remove(evt.feature);
      }));
      this.sourceKeys_.push(source.on('clear', () => this.refreshSources_()));
    });
  }

  /**
   * Creates layer to show snapped point.
   * @private
   * @function
   * @param {ol.Map} olMap OL map
   */
  addIndicatorLayer_(olMap) {
    this.indicatorLayer_ = new ol.layer.Vector({
      source: new ol.source.Vector(),
      style: new ol.style.Style({
        image: new ol.style.Circle({
          radius: 7,
          stroke: new ol.style.Stroke({ color: '#FF00FF', width: 2 }),
          fill: new ol.style.Fill({ color: 'rgba(255, 0, 255, 0.2)' }),
        }),
      }),
    });
    this.indicatorLayer_.setMap(olMap);
  }

  /**
   * Shows snapped point.
   * @private
   * @function
   * @param {Array<Number>} coordinate snapped coordinate
   */
  showIndicator_(coordinate) {
    if (this.indicatorLayer_ && coordinate) {
      const source = this.indicatorLayer_.getSource();
      source.clear();
      source.addFeature(new ol.Feature(new ol.geom.Point(coordinate)));
    }
  }

  /**
   * Hides snapped point.
   * @private
   * @function
   */
  hideIndicator_() {
    if (this.indicatorLayer_) {
      this.indicatorLayer_.getSource().clear();
    }
  }

  /**
   * Temporarily de/activates snap while DISABLE_SNAP_KEY is pressed.
   * @private
   * @function
   * @param {Boolean} active snap active
   * @param {KeyboardEvent} evt keyboard event
   */
  onKeyChange_(active, evt) {
    if (evt.key === DISABLE_SNAP_KEY) {
      if (this.snap_) {
        this.snap_.setActive(active);
      }
      if (this.guides_) {
        this.guides_.setActive(active);
      }
      if (!active) {
        this.hideIndicator_();
      }
    }
  }
}
