/* eslint-disable no-console */
/**
 * @module M/impl/control/TransparencyControl
 */
import TransparentInteraction from 'impl/transparentInteraction';

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
    this.freezePosition = false;
    // super.addTo(map, html);
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
  effectSelected(layers, radius, freeze) {
    layers.setVisible(true);
    // layers.setZIndex(5000);
    this.transparentInteraction_ = new TransparentInteraction({
      radius,
      freeze,
      freezeInPosition: this.freezePosition,
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
   * Set freexe
   *
   * @public
   * @function
   * @param { boolean } value value to assign
   * @api stable
   */
  setFreeze(value) {
    this.freezePosition = this.transparentInteraction_.pos;
    if (this.transparentInteraction_ !== undefined) this.transparentInteraction_.setFreeze(value);
  }

  /**
   * Toogle Freeze mode
   *
   * @public
   * @function
   * @api stable
   */
  toogleFreeze() {
    this.freezePosition = this.transparentInteraction_.pos;
    if (this.transparentInteraction_ !== undefined) this.transparentInteraction_.toogleFreeze();
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
    this.transparentInteraction_.addLayer(layer);
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
