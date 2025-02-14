import DrawHole from 'ol-ext/interaction/DrawHole';
import Transform from 'ol-ext/interaction/Transform';
// import DrawRegular from 'ol-ext/interaction/DrawRegular';

/**
 * @module M/impl/control/Editioncontrol
 */

export default class Editioncontrol extends M.impl.Control {
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
      * @type {M.Map}
      */
    this.facadeMap_ = map;
  }

  /**
   * This function adds the control to the specified map
   *
   * @public
   * @function
   * @param {M.Map} map to add the plugin
   * @param {HTMLElement} html of the plugin
   * @api stable
   */
  addTo(map, html) {
    super.addTo(map, html);

    /**
     * Facade map
     * @private
     * @type {M.map}
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
   * @api
   */
  activateSelection(snap) {
    const olMap = this.facadeMap_.getMapImpl();
    const drawingLayer = this.facadeControl.getLayer().getImpl().getOL3Layer();

    // this.facadeControl.hideTextPoint();

    if (drawingLayer) {
      this.select = new ol.interaction.Select({
        wrapX: false,
        layers: [drawingLayer],
      });

      this.select.on('select', (e) => {
        if (e.target.getFeatures().getArray().length > 0) {
          this.facadeControl.onSelect(e);
        }
      });

      olMap.addInteraction(this.select);

      const { snapToPointer = true, pixelTolerance = 30 } = snap;

      this.edit = new ol.interaction.Modify({
        features: this.select.getFeatures(),
        snapToPointer,
        pixelTolerance,
      });
      this.edit.on('modifyend', (evt) => {
        this.facadeControl.onModify();
      });
      olMap.addInteraction(this.edit);
    }
  }

  /**
   * This function adds hole draw interaction to map.
   * @public
   * @function
   * @api
   */
  addHoleDrawInteraction() {
    const olMap = this.facadeMap_.getMapImpl();
    this.drawHole = new DrawHole({
      layers: [this.facadeControl.getLayer().getImpl().getOL3Layer()],
    });
    olMap.addInteraction(this.drawHole);
  }

  /**
   * This function adds rotate interaction to map.
   * @public
   * @function
   * @param {Array} olFeatures features to edit
   * @api
   */
  addRotateInteraction(olFeatures) {
    const olMap = this.facadeMap_.getMapImpl();
    const collection = new ol.Collection(olFeatures);
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
    this.rotate.on('rotateend', (evt) => {
      this.facadeControl.onModify();
    });
    olMap.addInteraction(this.rotate);
    this.rotate.setSelection(collection);
  }

  /**
   * This function update rotate interaction features .
   * @public
   * @function
   * @param {Array} olFeatures features to edit
   * @api
   */
  refreshRotateSelection(olFeatures) {
    const collection = new ol.Collection(olFeatures);
    this.rotate.setSelection(collection);
  }

  /**
   * This function adds move interaction to map.
   * @public
   * @function
   * @param {Array} olFeatures features to edit
   * @api
   */
  addMoveInteraction(olFeatures) {
    const olMap = this.facadeMap_.getMapImpl();
    const collection = new ol.Collection(olFeatures);
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
    this.move.on('translateend', (evt) => {
      this.facadeControl.onModify();
    });
    olMap.addInteraction(this.move);
    this.move.setSelection(collection);
  }

  /**
   * This function update move interaction features .
   * @public
   * @function
   * @param {Array} olFeatures features to edit
   * @api
   */
  refreshMoveSelection(olFeatures) {
    const collection = new ol.Collection(olFeatures);
    this.move.setSelection(collection);
  }

  /**
   * This function adds scale interaction to map.
   * @public
   * @function
   * @param {Array} olFeatures features to edit
   * @api
   */
  addScaleInteraction(olFeatures) {
    const olMap = this.facadeMap_.getMapImpl();
    const collection = new ol.Collection(olFeatures);
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
    this.scale.on('scaleend', (evt) => {
      this.facadeControl.onModify();
    });
    olMap.addInteraction(this.scale);
    this.scale.setSelection(collection);
  }

  /**
   * This function update scale interaction features .
   * @public
   * @function
   * @param {Array} olFeatures features to edit
   * @api
   */
  refreshScaleSelection(olFeatures) {
    const collection = new ol.Collection(olFeatures);
    this.scale.setSelection(collection);
  }

  /**
   * Removes hole interaction
   * @public
   * @api
   * @function
   */
  removeDrawHoleInteraction() {
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
   * @param {M.Featuer} mapeaFeature
   */
  getFeatureExtent(feature) {
    return feature.getImpl().getOLFeature().getGeometry().getExtent();
  }

  /**
   * Creates polygon feature from extent.
   * @public
   * @function
   * @api
   * @param {Array} extent - geometry extent
   */
  newPolygonFeature(extent) {
    return new ol.Feature({ geometry: ol.geom.Polygon.fromExtent(extent) });
  }

  /**
   * Creates current feature clone.
   * @public
   * @function
   * @api
   */
  getMapeaFeatureClone(feature) {
    // eslint-disable-next-line no-underscore-dangle
    const implFeatureClone = feature.getImpl().olFeature_.clone();
    const emphasis = M.impl.Feature.olFeature2Facade(implFeatureClone);
    return emphasis;
  }
}
