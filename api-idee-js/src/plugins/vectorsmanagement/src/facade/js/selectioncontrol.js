/**
 * @module IDEE/control/SelectionControl
 */
// import template from '../../templates/selection';
import {
  FEATURE_EMPHASIS,
  SELECT_INTERACTION,
  implementsContracts,
  requireImplementation,
} from './contracts';

/**
 * Name of the layer where selected features are emphasized.
 * @const
 * @type {String}
 */
const SELECTION_LAYER_NAME = 'selectLayer';

/**
 * @classdesc
 * Features selected in the managed layer and their emphasis. It is the only
 * selection of the plugin: selection, creation and edition controls update it
 * and the rest of controls read it through VectorsManagementControl.
 */
export class FeatureSelection {
  /**
   * @constructor
   * @param {IDEE.Map} map
   * @param {Object} [impl] platform implementation (FEATURE_EMPHASIS optional,
   * without it features are selected but not emphasized)
   * @param {function()} onChange called every time the selection is replaced
   */
  constructor(map, impl, onChange) {
    this.map_ = map;

    this.impl_ = implementsContracts(impl, FEATURE_EMPHASIS) ? impl : null;

    this.onChange_ = onChange;

    /**
     * Selected features
     * @private
     * @type {Array<IDEE.Feature>}
     */
    this.features_ = [];

    /**
     * Emphasis features added to the selection layer, which other plugins can share
     * @private
     * @type {Array<IDEE.Feature>}
     */
    this.emphasis_ = [];
  }

  /**
   * Returns selected features array
   *
   * @public
   * @function
   * @returns {Array<IDEE.Feature>}
   * @api
   */
  getFeatures() {
    return this.features_;
  }

  /**
   * Replaces the selection, emphasizes it and notifies the change.
   *
   * @public
   * @function
   * @param {Array<IDEE.Feature|undefined>} features
   * @api
   */
  select(features) {
    this.features_ = features.filter((f, i) => f && features.indexOf(f) === i);
    this.refresh();
    this.onChange_();
  }

  /**
   * Adds a feature to the selection.
   *
   * @public
   * @function
   * @param {IDEE.Feature} feature
   * @api
   */
  add(feature) {
    if (feature && !this.features_.includes(feature)) {
      this.select([...this.features_, feature]);
    }
  }

  /**
   * Removes features from the selection, notifying only if it changes.
   *
   * @public
   * @function
   * @param {Array<IDEE.Feature>} features
   * @api
   */
  remove(features) {
    const kept = this.features_.filter((f) => !features.includes(f));
    if (kept.length !== this.features_.length) {
      this.select(kept);
    }
  }

  /**
   * Empties the selection and notifies the change.
   *
   * @public
   * @function
   * @api
   */
  clear() {
    this.select([]);
  }

  /**
   * Draws again the emphasis of selected features (e.g. after their geometry changes).
   *
   * @public
   * @function
   * @api
   */
  refresh() {
    const layer = this.findLayer_();
    if (layer && this.emphasis_.length > 0) {
      layer.removeFeatures(this.emphasis_);
    }
    this.emphasis_ = this.impl_ ? this.features_.map((f) => this.createEmphasis_(f)) : [];
    if (this.emphasis_.length > 0) {
      this.getLayer().addFeatures(this.emphasis_);
    }
  }

  /**
   * Empties the selection and removes its emphasis without notifying it.
   *
   * @public
   * @function
   * @api
   */
  destroy() {
    this.features_ = [];
    this.refresh();
  }

  /**
   * Returns the layer where selected features are emphasized, adding it to the map if needed.
   *
   * @public
   * @function
   * @returns {IDEE.layer.Vector}
   * @api
   */
  getLayer() {
    let layer = this.findLayer_();
    if (!layer) {
      layer = new IDEE.layer.Vector({
        extract: false,
        name: SELECTION_LAYER_NAME,
      }, { displayInLayerSwitcher: false });
      this.map_.addLayers(layer);
      layer.setZIndex(1045);
    }
    return layer;
  }

  /**
   * Returns the emphasis layer if it is in the map.
   * @private
   * @function
   * @returns {IDEE.layer.Vector|undefined}
   */
  findLayer_() {
    return this.map_.getLayers().find((l) => l.name === SELECTION_LAYER_NAME);
  }

  /**
   * Creates the emphasis of a feature: a circle for points, its extent otherwise.
   * @private
   * @function
   * @param {IDEE.Feature} feature
   * @returns {IDEE.Feature}
   */
  createEmphasis_(feature) {
    const geometryType = feature.getGeometry().type;
    let emphasis;
    if (geometryType === 'Point' || geometryType === 'MultiPoint') {
      emphasis = this.impl_.getApiIdeeFeatureClone(feature);
      emphasis.setStyle(new IDEE.style.Point({
        radius: 20,
        stroke: {
          color: '#FF0000',
          width: 2,
        },
      }));
    } else {
      emphasis = this.impl_.getExtentFeature(feature);
      emphasis.setStyle(new IDEE.style.Line({
        stroke: {
          color: '#FF0000',
          width: 2,
        },
      }));
    }
    return emphasis;
  }
}

export default class SelectionControl extends IDEE.Control {
  /**
   * @classdesc
   * Main constructor of the class. Creates a PluginControl
   * control
   *
   * @constructor
   * @extends {IDEE.Control}
   * @param {IDEE.Map} map
   * @param {VectorsManagementControl} managementControl
   * @param {Object} impl platform implementation (SELECT_INTERACTION)
   * @api stable
   */
  constructor(map, managementControl, impl) {
    // 1. checks if the implementation fulfils the contracts of this control
    requireImplementation(impl, [SELECT_INTERACTION], 'exception.impl_selectioncontrol');

    // 2. implementation of this control
    super('Selection', impl);
    this.getImpl().facadeControl = this;

    this.map_ = map;

    this.managementControl_ = managementControl;

    /**
     * Template
     * @public
     * @type { HTMLElement }
     */
    this.template = null;

    this.selection_ = 'layer';

    this.layer_ = null;
  }

  /**
   * This functions active control
   *
   * @public
   * @function
   * @param {Node} html
   * @api
   */
  active(html) {
    this.initializeLayers();
    this.getImpl().activateSelection(this.getSelectedFeatures());
    this.selection_ = 'feature';
  }

  /**
   * Adds selection layer to map.
   * @public
   * @function
   * @api
   */
  initializeLayers() {
    this.managementControl_.getFeatureSelection().getLayer();
    this.layer_.getImpl().extract = false;
  }

  /**
   * Returns selection
   *
   * @public
   * @function
   * @api stable
   */
  getSelection() {
    return this.selection_;
  }

  /**
   * This function disable selection.
   *
   * @public
   * @function
   * @api stable
   */
  hideSelectionLayer() {
    this.getImpl().removeSelectInteraction();
  }

  /**
   * This function enable selection.
   *
   * @public
   * @function
   * @api stable
   */
  showSelectedLayer() {
    this.getImpl().activateSelection(this.getSelectedFeatures());
  }

  /**
   * Returns selected features array
   *
   * @public
   * @function
   * @api stable
   */
  getSelectedFeatures() {
    return this.managementControl_.getFeatureSelection().getFeatures();
  }

  /**
   * Returns selected OL features array
   *
   * @public
   * @function
   * @api stable
   */
  getSelectedOLFeatures() {
    return this.getSelectedFeatures().map((f) => f.getImpl().getFeature());
  }

  /**
   * Clean selected features array
   *
   * @public
   * @function
   * @api stable
   */
  removeSelectedFeatures() {
    this.managementControl_.getFeatureSelection().clear();
  }

  /**
   * This function adds a feature to selected features array.
   *
   * @public
   * @function
   * @param {IDEE.Feature} feature
   * @api stable
   */
  addFeatureToSelection(feature) {
    this.managementControl_.getFeatureSelection().add(feature);
  }

  /**
   * Replaces the selection with the selected features
   * and shows feature info on select.
   * @public
   * @function
   * @api
   * @param {{features: Array<IDEE.Feature|undefined>}} e selection event of the implementation
   */
  onSelect(e) {
    const selection = this.managementControl_.getFeatureSelection();
    selection.select(e.features);

    const features = selection.getFeatures();
    if (features.length === 1 && document.querySelector('.m-vectorsmanagement-analysis') !== null) {
      this.managementControl_.analysisControl.showFeatureInfo(features[0]);
    }
  }

  /**
   * Draws again the emphasis of selected features.
   * @public
   * @function
   * @api
   */
  emphasizeSelectedFeature() {
    this.managementControl_.getFeatureSelection().refresh();
  }

  /**
   * This function destroys this control
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {}

  /**
   * Sets the layer selected for management
   * @public
   * @function
   * @api
   * @param {IDEE.layer} layer
   */
  setLayer(layer) {
    this.layer_ = layer;
  }

  /**
   * This function returns the layer selected for management
   *
   * @public
   * @function
   * @api stable
   */
  getLayer() {
    return this.layer_;
  }

  /**
   * This function is called on the control activation
   *
   * @public
   * @function
   * @api stable
   */
  activate() {
    super.activate();
  }

  /**
   * This function is called on the control deactivation
   *
   * @public
   * @function
   * @api stable
   */
  deactivate() {
    // this.template.remove();
    this.getImpl().removeSelectInteraction();
    this.selection_ = 'layer';
    this.managementControl_.getFeatureSelection().clear();
  }

  /**
   * This function compares controls
   *
   * @public
   * @function
   * @param {IDEE.Control} control to compare
   * @api stable
   */
  equals(control) {
    // eslint-disable-next-line no-undef
    return control instanceof SelectionControl;
  }
}
