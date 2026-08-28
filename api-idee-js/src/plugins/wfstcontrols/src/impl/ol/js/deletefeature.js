/**
 * @module IDEE/impl/control/DeleteFeature
 */
export default class DeleteFeature extends IDEE.impl.Control {
  /**
   * @classdesc
   * Main constructor of the class. Creates a DeleteFeature
   * control
   *
   * @constructor
   * @param {IDEE.layer.WFS} layer - Layer for use in control
   * @extends {ol.control.Control}
   * @api stable
   */
  constructor(layer) {
    super(layer);

    /**
     * Layer for use in control
     * @private
     * @type {ol.Feature}
     */
    this.layer_ = layer;

    /**
     * Store modified features
     * @public
     * @type {array}
     * @api stable
     */
    this.modifiedFeatures = [];
  }

  /**
   * This function active control
   *
   * @public
   * @function
   * @api stable
   */
  activate() {
    this.layer_.on(IDEE.evt.SELECT_FEATURES, this.removeFeature_, this);
  }

  /**
   * This function deactivate control
   *
   * @public
   * @function
   * @api stable
   */
  deactivate() {
    this.layer_.un(IDEE.evt.SELECT_FEATURES, this.removeFeature_, this);
  }

  /**
   * This function remove a specific feature
   *
   * @private
   * @function
   * @param {ol.Feature} features - Feature to remove
   * @param {array} evt - Select event
   */
  removeFeature_(features, evt) {
    const feature = features[0].getImpl().getOLFeature();
    const olLayer = this.layer_.getImpl().getLayer();
    olLayer.getSource().removeFeature(feature);
    this.layer_.removeFeatures(features[0]);

    feature.toDelete = true;

    // prevents saving new features
    if (!IDEE.utils.isNullOrEmpty(feature.getId())) {
      this.modifiedFeatures.push(feature);
    } else {
      // removes the created feature from the drawfeature control
      const drawfeatureCtrl = this.facadeMap_.getControls('drawfeature')[0];
      if (!IDEE.utils.isNullOrEmpty(drawfeatureCtrl)) {
        const drawnFeatures = drawfeatureCtrl.getImpl().modifiedFeatures;
        const idx = drawnFeatures.indexOf(feature);
        drawnFeatures.splice(idx, 1);
      }
    }
  }

  /**
   * @public
   * @function
   * @api stable
   */
  setLayer(layer) {
    this.layer_ = layer;
  }
}
