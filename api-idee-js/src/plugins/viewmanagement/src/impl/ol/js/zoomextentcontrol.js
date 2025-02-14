/**
 * @module IDEE/impl/control/ZoomExtentControl
 */

export default class ZoomExtentControl extends IDEE.impl.Control {
  /**
   * This function create DragZoom interaction
   *
   * @public
   * @function
   * @param {IDEE.Map} map Map
   * @api
   */
  createInteraction(map) {
    this.facadeMap_ = map;
    this.dragZoom = new ol.interaction.DragZoom({
      condition: () => true,
    });
    this.dragZoom.setActive(false);
    this.facadeMap_.getMapImpl().addInteraction(this.dragZoom);
  }

  /**
   * This function is called on the control activation
   *
   * @public
   * @function
   * @param {IDEE.Map} map Map
   * @api
   */
  activateClick(map) {
    this.dragZoom.setActive(true);
  }

  /**
   * This function is called on the control deactivation
   *
   * @public
   * @function
   * @param {IDEE.Map} map Map
   * @api
   */
  deactivateClick(map) {
    this.dragZoom.setActive(false);
  }

  /**
   * This function remove interaction of the control
   *
   * @public
   * @function
   * @api
   */
  removeInteraction() {
    this.facadeMap_.getMapImpl().removeEventListener('keydown');
    this.facadeMap_.getMapImpl().removeInteraction(this.dragZoom);
  }
}
