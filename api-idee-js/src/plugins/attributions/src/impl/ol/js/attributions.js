/**
 * @classdesc
 */
class Attributions extends IDEE.Object {
  /**
   * @constructor
   */
  constructor(map) {
    super();

    /**
     * Map of the plugin
     * @private
     * @type {IDEE.Map}
     */
    this.map_ = map;
  }

  /**
   * Register events in ol.Map of IDEE.Map
   * @public
   * @function
   */
  registerEvent(type, callback) {
    const olMap = this.map_.getMapImpl();

    olMap.on(type, callback);
  }
}

export default Attributions;
