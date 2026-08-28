/* eslint-disable no-console */
/**
 * @module M/impl/control/MagnifyControl
 */
import ZoomInteraction from 'impl/ZoomInteraction';

export default class MagnifyControl extends IDEE.impl.Control {
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
    this.map = map;
    this.olMap = map.getMapImpl();
    this.zoom = null;
    super.addTo(map, html);
  }

  effectSelected(layers, zoom) {
    this.zoom = zoom;
    this.zoomInteraction_ = new ZoomInteraction({
      projection: this.map.getImpl().getProjection().code,
      zoom, // layers son las capas a las que se le hará zoom cuando la lupa pase
      layers,
    });

    this.olMap.addOverlay(this.zoomInteraction_);
    this.zoomInteraction_.setActive(true);
  }

  setOptionZoom(zoom) {
    if (!IDEE.utils.isUndefined(this.zoomInteraction_)) {
      this.zoomInteraction_.setOptionZoom(zoom);
    } else {
      this.zoom = zoom;
    }
  }

  removeEffects() {
    if (this.zoomInteraction_ != null) {
      this.zoomInteraction_.setActive(false);
      this.olMap.removeOverlay(this.zoomInteraction_);
      this.zoomInteraction_ = null;
    }
  }
}
