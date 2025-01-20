/**
 * @module M/impl/control/IGNSearchLocatorControl
 */
export default class IGNSearchLocatorControl extends M.impl.Control {
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
    this.map = map;
    super.addTo(map, html);
  }

  /**
   * This function sets a new scale to the map.
   * Developed for WGS 84 / Pseudo - Mercator 3857 projection.
   * @private
   * @function
   */
  setScale(scale) {
    const wmts3857scales = [
      559082264.0287178,
      279541132.0143589,
      139770566.0071794,
      69885283.00358972,
      34942641.50179486,
      17471320.75089743,
      8735660.375448715,
      4367830.187724357,
      2183915.093862179,
      1091957.546931089,
      545978.7734655447,
      272989.3867327723,
      136494.6933663862,
      68247.34668319309,
      34123.67334159654,
      17061.83667079827,
      8530.918335399136,
      4265.459167699568,
      2132.729583849784,
    ];
    const wmts3857resolutions = [
      156543.0339280410,
      78271.51696402048,
      39135.75848201023,
      19567.87924100512,
      9783.939620502561,
      4891.969810251280,
      2445.984905125640,
      1222.992452562820,
      611.4962262814100,
      305.7481131407048,
      152.8740565703525,
      76.43702828517624,
      38.21851414258813,
      19.10925707129406,
      9.554628535647032,
      4.777314267823516,
      2.388657133911758,
      1.194328566955879,
      0.5971642834779395,
    ];
    // Finds closest standard scale
    const newScale = wmts3857scales.reduce((prev, curr) => {
      return (Math.abs(curr - scale) < Math.abs(prev - scale) ? curr : prev);
    });
    const newResolution = wmts3857resolutions[wmts3857scales.indexOf(newScale)];
    const olMap = this.facadeMap_.getMapImpl();
    const olView = olMap.getView();
    olView.setResolution(newResolution);
  }

  /**
   * This function reprojects map on selected SRS.
   *
   * @function
   * @param {string} origin - EPSG:25830, EPSG:4326, ..., etc
   * @param {array<number>} coordinates
   * @api
   */
  reproject(origin, coordinates) {
    const originProj = ol.proj.get(origin);
    const destProj = ol.proj.get(this.map.getProjection().code);
    let coordinatesTransform = ol.proj.transform(coordinates, originProj, destProj);
    coordinatesTransform = [this.normalizeNumber(coordinates[0], coordinatesTransform[0]),
      this.normalizeNumber(coordinates[1], coordinatesTransform[1]),
    ];
    return coordinatesTransform;
  }

  /**
   * This function reprojects given coordinates to given projection.
   * @private
   * @function
   * @param { Array <number> } coordinates - [x,y]
   * @param { string } source - 'EPSG:4326'
   * @param { string } destiny - 'EPSG:4326'
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
   * @param {array<number>} coordinates
   * @api
   */
  reprojectXY(origin, coordinates) {
    const originProj = ol.proj.get(origin);
    const destProj = ol.proj.get(this.map.getProjection().code);
    let coordinatesTransform = ol.proj.transform(coordinates, originProj, destProj);
    coordinatesTransform = [this.normalizeNumber(coordinates[0], coordinatesTransform[0]),
      this.normalizeNumber(coordinates[1], coordinatesTransform[1]),
    ];
    return coordinatesTransform;
  }

  readFromWKT(wkt, propertiesString) {
    const format = new ol.format.WKT();
    const feature = format.readFeature(wkt, {
      dataProjection: 'EPSG:4326',
      featureProjection: this.map.getProjection().code,
    });

    const properties = JSON.parse(propertiesString);
    delete properties.geom;
    feature.setId(`f${new Date().getTime()}`);
    feature.setProperties(properties);
    this.wrapComplexFeature(feature);
    return feature;
  }

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

  normalizeNumber(origin, calculated) {
    let res = origin;
    if (origin !== 0) {
      res = parseFloat(calculated.toFixed(9));
    }

    return res;
  }
}
