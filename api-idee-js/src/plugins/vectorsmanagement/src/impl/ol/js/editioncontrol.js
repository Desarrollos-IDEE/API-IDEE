import DrawHole from 'ol-ext/interaction/DrawHole';
import Transform from 'ol-ext/interaction/Transform';
import SnapManager from './snapmanager';
import { toFacadeFeatures } from './featureutils';
// import DrawRegular from 'ol-ext/interaction/DrawRegular';

/**
 * @module IDEE/impl/control/Editioncontrol
 */

/**
 * Creates an OL collection with the OL features of api-idee features.
 * @param {Array<IDEE.Feature>} features api-idee features
 * @return {ol.Collection} OL features collection
 */
const toCollection = (features) => new ol.Collection(features.map((f) => f.getImpl().getFeature()));

export default class Editioncontrol extends IDEE.impl.Control {
  /**
  * @classdesc
  * Main constructor of the measure conrol.
  *
  * @constructor
  * @extends {ol.control.Control}
  * @api stable
  */
  constructor(map) {
    super();
    /**
      * Facade of the map
      * @private
      * @type {IDEE.Map}
      */
    this.facadeMap_ = map;

    /**
     * Snap manager for edit and hole interactions
     * @private
     * @type {SnapManager}
     */
    this.snapManager_ = new SnapManager(map);
  }

  /**
   * This function adds the control to the specified map
   *
   * @public
   * @function
   * @param {IDEE.Map} map to add the plugin
   * @param {HTMLElement} html of the plugin
   * @api stable
   */
  addTo(map, html) {
    super.addTo(map, html);

    /**
     * Facade map
     * @private
     * @type {IDEE.map}
     */
    this.facadeMap_ = map;

    /**
     * OL vector source for draw interactions.
     * @private
     * @type {*} - OpenLayers vector source
     */
    this.vectorSource_ = undefined;
  }

  /**
   * Activates selection mode.
   * @public
   * @function
   * @param {Object} snapOptions snap options
   * @api
   */
  activateSelection(snapOptions) {
    const olMap = this.facadeMap_.getMapImpl();
    const drawingLayer = this.facadeControl.getLayer().getImpl().getLayer();

    // this.facadeControl.hideTextPoint();

    if (drawingLayer) {
      this.select = new ol.interaction.Select({
        wrapX: false,
        layers: [drawingLayer],
      });

      this.select.on('select', (e) => {
        const olFeatures = e.target.getFeatures().getArray();
        if (olFeatures.length > 0) {
          this.facadeControl.onSelect({
            features: toFacadeFeatures(this.facadeControl.getLayer(), olFeatures),
          });
        }
      });

      olMap.addInteraction(this.select);
      this.addModifyInteraction_(snapOptions);
    }
  }

  /**
   * Creates the modify interaction over the selected features and enables snap.
   * @private
   * @function
   * @param {Object} snapOptions snap options
   */
  addModifyInteraction_(snapOptions) {
    this.modifyTolerance_ = snapOptions.pixelTolerance;
    this.edit = new ol.interaction.Modify({
      features: this.select.getFeatures(),
      pixelTolerance: snapOptions.pixelTolerance,
    });
    this.edit.on('modifyend', (e) => this.notifyModify_(e.features));
    this.facadeMap_.getMapImpl().addInteraction(this.edit);
    this.snapManager_.enable(this.edit, () => this.facadeControl.getLayer(), snapOptions);
  }

  /**
   * Notifies the modified features to the facade control.
   * @private
   * @function
   * @param {Array<ol.Feature>|ol.Collection} olFeatures modified OL features
   */
  notifyModify_(olFeatures) {
    this.facadeControl.onModify({
      features: toFacadeFeatures(
        this.facadeControl.getLayer(),
        Array.isArray(olFeatures) ? olFeatures : olFeatures.getArray(),
      ),
    });
  }

  /**
   * This function updates snap options of active interaction.
   * @public
   * @function
   * @param {Object} snapOptions snap options
   * @api
   */
  updateSnap(snapOptions) {
    const toleranceChanged = this.modifyTolerance_ !== snapOptions.pixelTolerance;
    if (this.edit && this.edit.getMap() && toleranceChanged) {
      this.removeEditInteraction();
      this.addModifyInteraction_(snapOptions);
    } else {
      this.snapManager_.update(snapOptions);
    }
  }

  /**
   * This function adds hole draw interaction to map.
   * @public
   * @function
   * @param {Object} snapOptions snap options
   */
  addHoleDrawInteraction(snapOptions) {
    const olMap = this.facadeMap_.getMapImpl();
    this.drawHole = new DrawHole({
      layers: [this.facadeControl.getLayer().getImpl().getLayer()],
    });
    this.drawHole.on('modifyend', (e) => this.notifyModify_(e.features));
    olMap.addInteraction(this.drawHole);
    this.snapManager_.enable(this.drawHole, () => this.facadeControl.getLayer(), snapOptions);
  }

  /**
   * This function adds rotate interaction to map.
   * @public
   * @function
   * @param {Array<IDEE.Feature>} features features to edit
   * @api
   */
  addRotateInteraction(features) {
    const olMap = this.facadeMap_.getMapImpl();
    const collection = toCollection(features);
    this.rotate = new Transform({
      enableRotatedTransform: false,
      hitTolerance: 2,
      translateFeature: false,
      scale: false,
      rotate: true,
      keepAspectRatio: undefined,
      keepRectangle: false,
      translate: false,
      stretch: false,
      selection: false,
    });
    this.rotate.on('rotateend', (e) => this.notifyModify_(e.features));
    olMap.addInteraction(this.rotate);
    this.rotate.setSelection(collection);
  }

  /**
   * This function update rotate interaction features .
   * @public
   * @function
   * @param {Array<IDEE.Feature>} features features to edit
   * @api
   */
  refreshRotateSelection(features) {
    this.rotate.setSelection(toCollection(features));
  }

  /**
   * This function adds move interaction to map.
   * @public
   * @function
   * @param {Array<IDEE.Feature>} features features to edit
   * @api
   */
  addMoveInteraction(features) {
    const olMap = this.facadeMap_.getMapImpl();
    const collection = toCollection(features);
    this.move = new Transform({
      enableRotatedTransform: true,
      hitTolerance: 2,
      translateFeature: true,
      scale: false,
      rotate: false,
      keepAspectRatio: undefined,
      keepRectangle: false,
      translate: true,
      stretch: false,
      selection: false,
    });
    this.move.on('translateend', (e) => this.notifyModify_(e.features));
    olMap.addInteraction(this.move);
    this.move.setSelection(collection);
  }

  /**
   * This function update move interaction features .
   * @public
   * @function
   * @param {Array<IDEE.Feature>} features features to edit
   * @api
   */
  refreshMoveSelection(features) {
    this.move.setSelection(toCollection(features));
  }

  /**
   * This function adds scale interaction to map.
   * @public
   * @function
   * @param {Array<IDEE.Feature>} features features to edit
   * @api
   */
  addScaleInteraction(features) {
    const olMap = this.facadeMap_.getMapImpl();
    const collection = toCollection(features);
    this.scale = new Transform({
      enableRotatedTransform: false,
      hitTolerance: 2,
      translateFeature: false,
      scale: true,
      rotate: false,
      keepAspectRatio: undefined,
      keepRectangle: false,
      translate: false,
      stretch: false,
      selection: false,
    });
    this.scale.on('scaleend', (e) => this.notifyModify_(e.features));
    olMap.addInteraction(this.scale);
    this.scale.setSelection(collection);
  }

  /**
   * This function update scale interaction features .
   * @public
   * @function
   * @param {Array<IDEE.Feature>} features features to edit
   * @api
   */
  refreshScaleSelection(features) {
    this.scale.setSelection(toCollection(features));
  }

  /**
   * Removes hole interaction
   * @public
   * @api
   * @function
   */
  removeDrawHoleInteraction() {
    this.snapManager_.disable();
    this.facadeMap_.getMapImpl().removeInteraction(this.drawHole);
  }

  /**
   * Removes rotate interaction
   * @public
   * @api
   * @function
   */
  removeRotateInteraction() {
    this.facadeMap_.getMapImpl().removeInteraction(this.rotate);
  }

  /**
   * Removes move interaction
   * @public
   * @api
   * @function
   */
  removeMoveInteraction() {
    this.facadeMap_.getMapImpl().removeInteraction(this.move);
  }

  /**
   * Removes scale interaction
   * @public
   * @api
   * @function
   */
  removeScaleInteraction() {
    this.facadeMap_.getMapImpl().removeInteraction(this.scale);
  }

  /**
   * Removes edit interaction
   * @public
   * @api
   * @function
   */
  removeEditInteraction() {
    this.snapManager_.disable();
    this.facadeMap_.getMapImpl().removeInteraction(this.edit);
  }

  /**
   * Removes select interaction
   * @public
   * @function
   * @api
   */
  removeSelectInteraction() {
    this.facadeMap_.getMapImpl().removeInteraction(this.select);
  }

  /**
   * Gets extent of feature
   * @public
   * @function
   * @api
   * @param {IDEE.Feature} feature
   * @returns {Array<Number>} extent in map projection
   */
  getFeatureExtent(feature) {
    return feature.getImpl().getFeature().getGeometry().getExtent();
  }

  /**
   * Removes an attribute from a feature.
   * @public
   * @function
   * @api
   * @param {IDEE.Feature} feature
   * @param {String} name attribute name
   */
  unsetAttribute(feature, name) {
    feature.getImpl().getFeature().unset(name);
  }
}
