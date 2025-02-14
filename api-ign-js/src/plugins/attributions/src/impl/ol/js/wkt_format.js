/**
 * @classdesc
 * @api
 */
class WKT extends ol.format.WKT {
  /**
   * @classdesc
   * Feature format for reading and writing data in the GeoJSON format.
   *
   * @constructor
   * @extends {ol.format.JSONFeature}
   * @param {olx.format.GeoJSONOptions=} opt_options Options.
   * @api stable
   */
  constructor(options = {}) {
    super(options);
    this.gjFormat_ = new M.impl.format.GeoJSON();
  }

  /**
   * @inheritDoc
   */
  write(geometry) {
    const olGeometry = this.gjFormat_.readGeometryFromObject(geometry);
    if (olGeometry.getType().toLowerCase() === 'point') {
      const pointCoord = olGeometry.getCoordinates();
      olGeometry.setCoordinates([pointCoord[0], pointCoord[1]]);
    }
    const wktGeom = this.writeGeometryText(olGeometry);
    return wktGeom;
  }
}

export default WKT;
