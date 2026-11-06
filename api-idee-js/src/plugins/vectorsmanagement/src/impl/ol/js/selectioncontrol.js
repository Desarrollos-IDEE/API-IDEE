/**
 * @module IDEE/impl/control/Selectioncontrol
 */
import { cloneFeature, extentFeature, toFacadeFeatures } from './featureutils';

export default class Selectioncontrol extends IDEE.impl.Control {
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
   * Activates selection mode starting from the selected features.
   * @public
   * @function
   * @param {Array<IDEE.Feature>} features selected features
   * @api
   */
  activateSelection(features = []) {
    const olMap = this.facadeMap_.getMapImpl();
    const drawingLayer = this.facadeControl.getLayer().getImpl().getLayer();

    // this.facadeControl.hideTextPoint();

    if (drawingLayer) {
      this.select = new ol.interaction.Select({
        wrapX: false,
        layers: [drawingLayer],
        style: null,
        toggleCondition: ol.events.condition.platformModifierKeyOnly,
      });
      this.select.getFeatures().extend(features.map((f) => f.getImpl().getFeature()));

      this.select.on('select', (e) => {
        const olFeatures = e.target.getFeatures().getArray();
        if (olFeatures.length > 0) {
          this.facadeControl.onSelect({
            features: toFacadeFeatures(this.facadeControl.getLayer(), olFeatures),
          });
        }
      });

      olMap.addInteraction(this.select);
    }
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
   * Creates feature clone.
   * @public
   * @function
   * @api
   * @param {IDEE.Feature} feature
   * @returns {IDEE.Feature} clone
   */
  getApiIdeeFeatureClone(feature) {
    return cloneFeature(feature);
  }

  /**
   * Creates polygon feature from the extent of a feature.
   * @public
   * @function
   * @api
   * @param {IDEE.Feature} feature
   * @returns {IDEE.Feature} extent polygon
   */
  getExtentFeature(feature) {
    return extentFeature(feature);
  }
}
