/**
 * @module M/impl/control/ZoomPanelControl
 */

/**
 * @class
 */
class Properties {
  constructor(center, resolution) {
    this.center = center;
    this.resolution = resolution;
  }

  equals(properties) {
    let equals = false;
    if (properties instanceof Properties) {
      equals = properties.center[0] === this.center[0]
        && properties.center[1] === this.center[1]
        && properties.resolution === this.resolution;
    }
    return equals;
  }
}

export default class ZoomPanelControl extends M.impl.Control {
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

    /**
     * List of navigated views. { center: [lng, lat], resolution: x }
     * @private
     */
    this.history_ = [];

    /**
     * Counter for current view index on this.history_.
     * @private
     */
    this.historyNow_ = -1;

    /**
     * Checks if next view is already saved.
     * @private
     */
    this.clickBtn_ = false;
  }

  /**
   * This function registers view events on map.
   *
   * @function
   * @public
   * @api stable
   */
  registerViewEvents() {
    this.facadeMap_.getMapImpl().on('movestart', () => {
      setTimeout(() => {
        this.registerZoom_();
      }, 200);
    });
  }

  /**
   * This function registers zoom on history.
   *
   * @function
   * @private
   */
  registerZoom_() {
    if (this.clickBtn_) {
      this.clickBtn_ = false;
      return;
    }
    const properties = new Properties(
      this.facadeMap_.getMapImpl().getView().getCenter(),
      this.facadeMap_.getMapImpl().getView().getResolution(),
    );
    const previousProperties = this.history_[this.historyNow_];
    if (!properties.equals(previousProperties)) {
      this.history_ = this.history_.slice(0, this.historyNow_ + 1)
        .concat(properties)
        .concat(this.history_.slice(this.historyNow_ + 1));
      this.historyNow_ += 1;
    }
    this.clickBtn_ = false;
  }

  /**
   * This function shows the previous zoom change to the map.
   *
   * @public
   * @function
   * @api stable
   */
  previousStep() {
    if (this.historyNow_ > 0) {
      const previousCenter = this.history_[this.historyNow_ - 1].center;
      const previousResolution = this.history_[this.historyNow_ - 1].resolution;
      this.clickBtn_ = true;
      this.historyNow_ -= 1;
      this.facadeMap_.getMapImpl().getView().setCenter(previousCenter);
      this.facadeMap_.getMapImpl().getView().setResolution(previousResolution);
    }
  }

  /**
   * This function shows the next zoom change to the map
   *
   * @public
   * @function
   * @api stable
   */
  nextStep() {
    if (this.historyNow_ < this.history_.length - 1) {
      const nextCenter = this.history_[this.historyNow_ + 1].center;
      const nextResolution = this.history_[this.historyNow_ + 1].resolution;
      this.clickBtn_ = true;
      this.historyNow_ += 1;
      this.facadeMap_.getMapImpl().getView().setCenter(nextCenter);
      this.facadeMap_.getMapImpl().getView().setResolution(nextResolution);
    }
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
