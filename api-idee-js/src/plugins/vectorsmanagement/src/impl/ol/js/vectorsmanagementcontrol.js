/**
 * @module IDEE/impl/control/VectorsManagementControl
 */
export default class VectorsManagementControl extends IDEE.impl.Control {
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
    // super addTo - don't delete
    super.addTo(map, html);
  }

  /**
   * Gets the extent of the current view
   *
   * @public
   * @function
   * @returns {Array<Number>} extent in EPSG:4326
   * @api
   */
  getViewExtent() {
    const olMap = this.facadeMap_.getMapImpl();
    const view = olMap.getView();
    return ol.proj.transformExtent(
      view.calculateExtent(olMap.getSize()),
      view.getProjection(),
      'EPSG:4326',
    );
  }

  /**
   * Shows the boundary of the fixed editing area
   *
   * @public
   * @function
   * @param {Array<Number>} bbox editing area in EPSG:4326
   * @api
   */
  addEditingBoundary(bbox) {
    const olMap = this.facadeMap_.getMapImpl();
    const extent = ol.proj.transformExtent(bbox, 'EPSG:4326', olMap.getView().getProjection());
    const feature = new ol.Feature(ol.geom.Polygon.fromExtent(extent));
    this.editingBoundary_ = new ol.layer.Vector({
      source: new ol.source.Vector({ features: [feature] }),
      style: new ol.style.Style({
        fill: new ol.style.Fill({ color: 'rgba(0, 0, 0, 0)' }),
        stroke: new ol.style.Stroke({
          color: '#e67e22',
          width: 2,
          lineDash: [8, 5],
        }),
      }),
    });
    this.editingBoundary_.setZIndex(20000);
    olMap.addLayer(this.editingBoundary_);
  }

  /**
   * Removes the boundary of the fixed editing area
   *
   * @public
   * @function
   * @api
   */
  removeEditingBoundary() {
    if (this.editingBoundary_) this.facadeMap_.getMapImpl().removeLayer(this.editingBoundary_);
    this.editingBoundary_ = null;
  }
}
