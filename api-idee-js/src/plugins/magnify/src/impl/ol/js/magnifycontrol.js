/**
 * @module IDEE/impl/control/MagnifyControl
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
    this.facadeMap_ = map;
    this.element = html;
    this.map = map;
    this.olMap = map.getMapImpl();
    this.zoom = null;
    super.addTo(map, html);
  }

  /**
   * Activa el efecto lupa sobre las capas indicadas
   *
   * @public
   * @function
   * @api
   */
  effectSelected(layers, zoom) {
    this.zoom = zoom;
    this.zoomInteraction_ = new ZoomInteraction({
      projection: this.map.getImpl().getProjection().code,
      zoom,
      layers,
    });

    this.olMap.addOverlay(this.zoomInteraction_);
    this.zoomInteraction_.setActive(true);
  }

  /**
   * Actualiza el zoom del efecto lupa
   *
   * @public
   * @function
   * @api
   */
  setOptionZoom(zoom) {
    if (!IDEE.utils.isUndefined(this.zoomInteraction_) && this.zoomInteraction_ !== null) {
      this.zoomInteraction_.setOptionZoom(zoom);
    } else {
      this.zoom = zoom;
    }
  }

  /**
   * Elimina el efecto lupa
   *
   * @public
   * @function
   * @api
   */
  removeEffects() {
    if (this.zoomInteraction_ != null) {
      this.zoomInteraction_.setActive(false);
      this.olMap.removeOverlay(this.zoomInteraction_);
      this.zoomInteraction_ = null;
    }
  }

  /**
   * Destruye la implementación
   *
   * @public
   * @function
   * @api
   */
  destroy() {
    this.removeEffects();
    this.facadeMap_ = null;
    this.map = null;
    this.olMap = null;
  }
}
