/**
 * @classdesc
 */
class Attributions extends M.Object {
  /**
   * @constructor
   */
  constructor(map) {
    super();

    /**
     * Map of the plugin
     * @private
     * @type {M.Map}
     */
    this.map_ = map;
  }

  /**
   * Register events in ol.Map of M.Map
   * @public
   * @function
   */
  registerEvent(type, callback) {
    const olMap = this.map_.getMapImpl();

    olMap.on(type, callback);
  }
}

export default Attributions;
