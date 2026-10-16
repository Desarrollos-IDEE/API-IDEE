/**
 * @module IDEE/impl/control/ClearFeature
 * Stub Cesium.
 */
export default class ClearFeature extends IDEE.impl.Control {
  constructor(layer) {
    super();
    this.layer_ = layer;
  }

  addTo(map, element) {
    this.facadeMap_ = map;
    this.element = element;
    super.addTo(map, element);
  }

  clear() {}

  setLayer(layer) {
    this.layer_ = layer;
  }
}
