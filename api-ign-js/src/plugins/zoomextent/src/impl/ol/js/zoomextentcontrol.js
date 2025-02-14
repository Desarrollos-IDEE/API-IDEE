/**
 * @module M/impl/control/ZoomExtentControl
 */
export default class ZoomExtentControl extends M.impl.Control {
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
    this.dragZoom = new ol.interaction.DragZoom({
      condition: () => true,
    });
    this.dragZoom.setActive(false);
    map.getMapImpl().addInteraction(this.dragZoom);
  }

  /**
   * This function is called on the control activation
   *
   * @public
   * @function
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
   * @api
   */
  deactivateClick(map) {
    this.dragZoom.setActive(false);
  }
}
