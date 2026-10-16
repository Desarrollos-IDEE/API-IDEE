/**
 * @module IDEE/impl/control/SaveFeature
 * Stub Cesium.
 */
export default class SaveFeature extends IDEE.impl.Control {
  constructor(layer, proxy = {}) {
    super();
    this.layer_ = layer;
    this.proxy_ = proxy;
  }

  addTo(map, element) {
    this.facadeMap_ = map;
    this.element = element;
    super.addTo(map, element);
  }

  saveFeature() {}

  setLayer(layer) {
    this.layer_ = layer;
  }
}
