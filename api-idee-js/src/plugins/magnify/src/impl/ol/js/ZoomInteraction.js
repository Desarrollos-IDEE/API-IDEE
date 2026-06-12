/**
 * @module M/impl/control/ZoomInteraction
 */
export default class ZoomInteraction extends ol.Overlay {
  /**
   * @classdesc
   * The ZoomInteraction add a 'magnifying glass' effect to an OL3 map that displays
   * a portion of the map in a different zoom (and actually display different content).
   *
   * @constructor
   * @extends {ol.Overlay}
   * @param {olx.OverlayOptions} options Overlay options
   * @api stable
   */
  constructor(options) {
    const elt = document.createElement('div');
    elt.className = 'ol-magnify';
    super({
      positioning: options.positioning || 'center-center',
      element: elt,
      stopEvent: false,
    });
    this._elt = elt;

    const layers = options.layers.map((layer) => layer.getImpl().getLayer())
      .filter((layer) => layer != null);

    // Create magnify map
    this.mgmap_ = new ol.Map({
      controls: new ol.Collection(),
      interactions: new ol.Collection(),
      target: this._elt,
      view: new ol.View({ projection: options.projection }),
      layers,
    });
    this.mgview_ = this.mgmap_.getView();

    this.set('zoomOffset', options.zoom + 1);
    this.set('active', true);
    this.on('propertychange', this.setView_.bind(this));
  }

  /**
   * Set the map instance the overlay is associated with.
   * @param {ol.Map} map The map instance.
   */
  setMap(map) {
    if (this.getMap()) {
      this.getMap().getViewport().removeEventListener('mousemove', this.onMouseMove_);
    }
    if (this._listener) ol.Observable.unByKey(this._listener);
    this._listener = null;

    ol.Overlay.prototype.setMap.call(this, map);

    if (map) {
      map.getViewport().addEventListener('mousemove', this.onMouseMove_.bind(this));
      this._listener = map.getView().on('propertychange', this.setView_.bind(this));
      this.setView_();
    }
  }

  /** Get the magnifier map
   * @return {_ol.Map_}
   */
  getMagMap() {
    return this.mgmap_;
  }

  /** Magnify is active
   * @return {boolean}
   */
  getActive() {
    return this.get('active');
  }

  /** Activate or deactivate
   * @param {boolean} active
   */
  setActive(active) {
    return this.set('active', active);
  }

  /** Mouse move
   * @private
   */
  onMouseMove_(e) {
    if (!this.get('active')) {
      this.setPosition();
    } else {
      const px = this.getMap().getEventCoordinate(e);
      /* eslint-disable */
      this.setPosition(px);
      this.mgview_.setCenter(px);
      // if (this._elt.querySelector('div').querySelector('div').style.display === 'none') {
      this.mgmap_.updateSize();
      // }
      /* eslint-enable */
    }
  }

  /** View has changed
   * @private
   */
  setView_(e) {
    if (!this.get('active')) {
      this.setPosition();
      return;
    }

    if (!e) { // refresh all
      this.setView_({ key: 'rotation' });
      this.setView_({ key: 'resolution' });
      return;
    }

    // Set the view params
    switch (e.key) {
      case 'rotation':
        this.mgview_.setRotation(this.getMap().getView().getRotation());
        break;
        /* eslint-disable */
      case 'zoomOffset':
      case 'resolution': {
        const z = Math.max(0, this.getMap().getView().getZoom() + Number(this.get('zoomOffset')));
        this.mgview_.setZoom(z);
        break;
      }
      /* eslint-enable */
      default:
        break;
    }
  }

  setOptionZoom(zoom) {
    this.set('zoomOffset', zoom + 1);
  }
}
