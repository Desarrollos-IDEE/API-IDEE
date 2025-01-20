/**
 * @module M/impl/control/IGNSearchLocatorscnControl
 */

export default class IGNSearchLocatorscnControl extends M.impl.Control {
  constructor(map) {
    super();

    /**
     * Map
     */
    this.facadeMap_ = map;
  }

  /**
   * This function read features from WKT
   *
   * @param {Object} propertiesJson - Properties
   * @returns {Feature} Feature from WKT
   */
  readFromWKT(propertiesJson) {
    const format = new ol.format.WKT();
    const feature = format.readFeature(propertiesJson.geom, {
      dataProjection: 'EPSG:4326',
      featureProjection: this.facadeMap_.getProjection().code,
    });

    const properties = propertiesJson;
    // delete properties.geom;
    feature.setId(`f${new Date().getTime()}`);
    feature.setProperties(properties);
    this.wrapComplexFeature(feature);
    return feature;
  }

  /**
   * This function wrap complex feature
   *
   * @function
   * @api
   * @param {Feature} feature - Feature
   */
  wrapComplexFeature(feature) {
    const featureGeom = feature.getGeometry();
    if ((featureGeom.getType() === M.geom.wkt.type.POLYGON)
      || (featureGeom.getType() === M.geom.wkt.type.MULTI_POLYGON)) {
      let centroid;
      if (featureGeom.getType() === M.geom.wkt.type.POLYGON) {
        centroid = featureGeom.getInteriorPoint();
      } else {
        centroid = featureGeom.getInteriorPoints();
      }

      const geometryCollection = new ol.geom.GeometryCollection([centroid, featureGeom]);
      feature.setGeometry(geometryCollection);
    }
  }

  /**
   * This function reprojects given coordinates to given projection.
   * @private
   * @function
   * @param {Array<number>} coordinates - [x,y]
   * @param {string} source - 'EPSG:4326'
   * @param {string} destiny - 'EPSG:4326'
   * @returns {Array<number>} - Coordinares reprojects
   */
  reprojectReverse(coordinates, source, destiny) {
    const transformFunc = ol.proj.getTransform(source, destiny);
    return transformFunc(coordinates);
  }

  /**
   * This function reprojects map on selected SRS.
   *
   * @function
   * @param {string} origin - EPSG:25830, EPSG:4326, ..., etc
   * @param {Array<number>} coordinates - Coordinares [x,y]
   * @returns {Array<number>} Coordinates transformed
   * @api
   */
  reproject(origin, coordinates) {
    const originProj = ol.proj.get(origin);
    const destProj = ol.proj.get(this.facadeMap_.getProjection().code);
    let coordinatesTransform = ol.proj.transform(coordinates, originProj, destProj);
    coordinatesTransform = [this.normalizeNumber(coordinates[0], coordinatesTransform[0]),
      this.normalizeNumber(coordinates[1], coordinatesTransform[1]),
    ];
    return coordinatesTransform;
  }

  /**
   * This functions normalize a number.
   *
   * @param {Number} origin
   * @param {Number} calculated
   * @returns {Number} Number normalized.
   */
  normalizeNumber(origin, calculated) {
    let res = origin;
    if (origin !== 0) {
      res = parseFloat(calculated.toFixed(9));
    }

    return res;
  }
}
