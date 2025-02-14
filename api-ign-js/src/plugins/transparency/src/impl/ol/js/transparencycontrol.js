/* eslint-disable no-console */
/**
 * @module M/impl/control/TransparencyControl
 */
import TransparentInteraction from 'impl/TransparentInteraction';

export default class TransparencyControl extends M.impl.Control {
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
    // super addTo - don't delete
    this.map = map;
    this.olMap = map.getMapImpl();

    super.addTo(map, html);
  }

  /**
   * Effects on the layer
   *
   * @public
   * @function
   * @param { M.Layer } layer layer to which to assign an effect
   * @param { Number } radius radius to assign
   * @api stable
   */
  effectSelected(layers, radius) {
    layers.setVisible(true);
    layers.setZIndex(90000);
    this.transparentInteraction_ = new TransparentInteraction({
      radius,
      layers,
    });

    this.olMap.addInteraction(this.transparentInteraction_);
  }

  /**
   * Set radius
   *
   * @public
   * @function
   * @param { Number } radius radius to assign
   * @api stable
   */
  setRadius(radius) {
    if (this.transparentInteraction_ !== undefined) this.transparentInteraction_.setRadius(radius);
  }

  /**
   * Set layer
   *
   * @public
   * @function
   * @param { M.layer } layer layer to assign effect
   * @api stable
   */
  addLayer(layer) {
    this.transparentInteraction_.addLayer(layer.getImpl().getOL3Layer());
  }

  /**
   * Remove effects
   *
   * @public
   * @function
   * @api stable
   */
  removeEffects() {
    this.olMap.removeInteraction(this.transparentInteraction_);
  }

  /**
   * Remove layer
   *
   * @public
   * @function
   * @param { M.layer } layer to remove
   * @api stable
   */
  removeLayer(layer) {
    this.transparentInteraction_.removeLayer(layer.getImpl().getOL3Layer());
  }
}
