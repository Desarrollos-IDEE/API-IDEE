/**
 * @module IDEE/impl/control/WFSTBase
 * Stub Cesium: edición WFST no implementada en esta plataforma.
 */
export default class WFSTBase extends IDEE.impl.Control {
  constructor(layer) {
    super();
    this.layer_ = layer;
  }

  addTo(map, element) {
    this.facadeMap_ = map;
    this.element = element;
    super.addTo(map, element);
  }

  setLayer(layer) {
    this.layer_ = layer;
  }

  activate() {}

  deactivate() {}
}
