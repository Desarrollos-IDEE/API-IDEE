/**
 * @module M/impl/control/QueryAttributesControl
 */
export default class QueryAttributesControl extends M.impl.Control {
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
    super.addTo(map, html);
    this.facadeMap = map;
    /**
     * OL vector source for draw interactions.
     * @private
     * @type {*} - OpenLayers vector source
     */
    this.vectorSource = undefined;
  }

  setSource() {
    this.vectorSource = this.newVectorSource(false);
  }

  /**
     * Creates new OpenLayers vector source
     * @public
     * @function
     * @api
     * @param {Boolean} featuresIncluded - indicates if an OL collection of
     * features should be included in new source
     */
  newVectorSource(featuresIncluded) {
    return featuresIncluded
      ? new ol.source.Vector({ features: new ol.Collection([]) })
      : new ol.source.Vector();
  }

  // e2m: al pulsar en Buscar por área añadimos la interacción
  addDrawInteraction(callback) {
    this.removeDrawInteraction_();
    const drawLayer = this.facadeMap.getLayers().find((layer) => layer.name === '__draw__');
    drawLayer.clear();
    const draw = new ol.interaction.Draw({
      source: drawLayer.getImpl().getOL3Layer().getSource(),
      type: 'Polygon',
      stopClick: true,
      style: new ol.style.Style({
        image: new ol.style.Circle({
          fill: new ol.style.Fill({
            color: '#478ffe',
          }),
          stroke: new ol.style.Stroke({
            width: 3,
            color: '#ffffff',
          }),
          radius: 6,
        }),
        fill: new ol.style.Fill({
          color: 'rgba(255, 255, 255, 0.5)',
        }),
        stroke: new ol.style.Stroke({
          color: '#FFCC33',
          width: 2,
        }),
      }),
    });

    this.facadeMap.getMapImpl().addInteraction(draw);
    document.querySelector('div.m-mapea-container').style.cursor = 'crosshair';
    draw.once('drawend', (evt) => {
      setTimeout(() => {
        document.querySelector('div.m-mapea-container').style.cursor = 'default';
        callback();
        this.removeDrawInteraction_();
        drawLayer.clear();
      }, 100);
    });
  }

  getPolygonFromExtent(extent) {
    const geom = ol.geom.Polygon.fromExtent(extent);
    const feature = new M.Feature('featurebbox.1', {
      geometry: {
        coordinates: geom.getCoordinates(),
        type: geom.getType(),
      },
      properties: [],
    });

    return feature;
  }

  getPolygonFromDrawnFeature() {
    const drawLayer = this.facadeMap.getLayers().find((layer) => layer.name === '__draw__');
    const olFeature = drawLayer.getImpl().getOL3Layer().getSource().getFeatures()[0];
    const feature = new M.Feature('featuredraw.1', {
      geometry: {
        coordinates: olFeature.getGeometry().getCoordinates(),
        type: olFeature.getGeometry().getType(),
      },
      properties: [],
    });

    return feature;
  }

  getLayerExtent(layer) {
    return layer.getImpl().getOL3Layer().getSource().getExtent();
  }

  getGeomExtent(geom, coordinates) {
    let ext = null;
    if (geom === 'multipoint') {
      ext = new ol.geom.MultiPoint(coordinates).getExtent();
    } else if (geom === 'point') {
      ext = new ol.geom.Point(coordinates).getExtent();
    } else if (geom === 'multipolygon') {
      ext = new ol.geom.MultiPolygon(coordinates).getExtent();
    } else if (geom === 'polygon') {
      ext = new ol.geom.Polygon(coordinates).getExtent();
    } else if (geom === 'multilinestring') {
      ext = new ol.geom.MultiLineString(coordinates).getExtent();
    } else if (geom === 'linestring') {
      ext = new ol.geom.LineString(coordinates).getExtent();
    }

    return ext;
  }

  removeDrawInteraction_() {
    document.releaseEvents('keydown');
    const arrayInteractions = [].concat(this.facadeMap.getMapImpl().getInteractions().getArray());
    arrayInteractions.forEach((int) => {
      if (int instanceof ol.interaction.Draw || int instanceof ol.interaction.Modify) {
        this.facadeMap.getMapImpl().removeInteraction(int);
      }
    });
  }

  /**
   * Transforms x,y coordinates to 4326 on coordinates array.
   * @public
   * @function
   * @api
   * @param {String} codeProjection
   * @param {Array<Number>} oldCoordinates
   */
  getTransformedCoordinates(codeProjection, oldCoordinates) {
    const transformFunction = ol.proj.getTransform(codeProjection, 'EPSG:4326');
    return this.getFullCoordinates(
      oldCoordinates,
      transformFunction(this.getXY(oldCoordinates)),
    );
  }

  /**
   * Given a coordinate set (x, y, altitude?), returns [x,y].
   * @public
   * @function
   * @api
   * @param {Array<Number>} coordinatesSet
   */
  getXY(coordinatesSet) {
    const coordinateCopy = [];
    for (let i = 0; i < coordinatesSet.length; i += 1) coordinateCopy.push(coordinatesSet[i]);
    while (coordinateCopy.length > 2) coordinateCopy.pop();
    return coordinateCopy;
  }

  /**
   * Substitutes x, y coordinates on coordinate set (x, y, altitude...)
   * @public
   * @function
   * @api
   * @param {Array} oldCoordinates
   * @param {Array<Number>} newXY - [x,y]
   */
  getFullCoordinates(oldCoordinates, newXY) {
    const newCoordinates = oldCoordinates;
    newCoordinates[0] = newXY[0];
    newCoordinates[1] = newXY[1];
    return newCoordinates;
  }

  /**
   * Get OL layer
   *
   * @public
   * @function
   * @api
   * @param {M.layer} layer Layer
   * @returns {ol.layer} OL layer
   */
  getOL3Layer(layer) {
    return layer.getImpl().getOL3Layer();
  }
}
