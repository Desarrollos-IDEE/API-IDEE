export default class BufferLayerImpl extends IDEE.impl.Layer {
  /**
   * @classdesc
   * Main constructor of the class. Creates a KML layer
   * with parameters specified by the user
   *
   * @constructor
   * @implements {IDEE.impl.Layer}
   * @param {Mx.parameters.LayerOptions} options custom options for this layer
   * @api stable
   */
  constructor(layerOL) {
    super();

    this.layerOL = layerOL;
  }

  /**
   * This function sets the map object of the layer
   *
   * @public
   * @function
   * @param {IDEE.impl.Map} map
   * @api stable
   */
  addTo(map) {
    this.map = map;
  }

  destroy() {
    const olMap = this.map.getMapImpl();

    if (!IDEE.utils.isNullOrEmpty(this.layerOL)) {
      olMap.removeLayer(this.layerOL);
      this.layerOL = null;
    }
    this.map = null;
  }
}
