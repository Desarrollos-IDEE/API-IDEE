import DrawRegular from 'ol-ext/interaction/DrawRegular';

/**
 * @module IDEE/impl/control/Creationcontrol
 */

export default class Creationcontrol extends IDEE.impl.Control {
  /**
  * @classdesc
  * Main constructor of the measure conrol.
  *
  * @constructor
  * @extends {ol.control.Control}
  * @api stable
  */
  constructor(map) {
    super();
    /**
      * Facade of the map
      * @private
      * @type {IDEE.Map}
      */
    this.facadeMap_ = map;
  }

  /**
   * This function adds the control to the specified map
   *
   * @public
   * @function
   * @param {IDEE.Map} map to add the plugin
   * @param {HTMLElement} html of the plugin
   * @api stable
   */
  addTo(map, html) {
    super.addTo(map, html);

    /**
     * Facade map
     * @private
     * @type {IDEE.map}
     */
    this.facadeMap_ = map;

    /**
     * OL vector source for draw interactions.
     * @private
     * @type {*} - OpenLayers vector source
     */
    this.vectorSource_ = undefined;
  }

  /**
   * This function set ol vector source
   *
   * @public
   * @function
   * @param {*} source ol layer source
   * @api stable
   */
  setVectorSource(source) {
    this.vectorSource_ = source;
  }

  /**
   * Returns vector source
   *
   * @public
   * @function
   * @api stable
   */
  getVectorSource() {
    return this.vectorSource_;
  }

  /**
   * This function adds draw interaction to map.
   * @public
   * @function
   * @api
   */
  addDrawInteraction() {
    const olMap = this.facadeMap_.getMapImpl();
    this.draw = this.newDrawInteraction(this.vectorSource_, this.facadeControl.geometry);
    this.addDrawEvent();
    olMap.addInteraction(this.draw);
  }

  /**
   * Defines function to be executed on click on draw interaction.
   * Creates feature with drawing and adds it to map.
   * @public
   * @function
   * @api
   */
  addDrawEvent() {
    this.draw.on('drawend', (event) => {
      this.facadeControl.onDraw(event);
    });
  }

  /**
   * This function adds figure interaction to map.
   * @public
   * @function
   * @api
   */
  addFigureInteraction() {
    const olMap = this.facadeMap_.getMapImpl();
    this.drawRegular = this.newDrawFigureInteraction(this.vectorSource_);
    this.addDrawFigureEvent();
    olMap.addInteraction(this.drawRegular);
  }

  /**
   * Defines function to be executed on click on figure interaction.
   * @public
   * @function
   * @api
   */
  addDrawFigureEvent() {
    this.drawRegular.on('drawend', (event) => {
      this.facadeControl.onDrawFigure(event);
    });
  }

  /**
   * Creates new OpenLayers draw regular interaction
   * @public
   * @function
   * @api
   * @param {OLVectorSource} vectorSource -
   */
  newDrawFigureInteraction(vectorSource) {
    const active = () => {
      return !document.getElementById('m-vectorsmanagement-irregularFigure').checked;
    };
    return new DrawRegular({
      canRotate: true,
      sides: 4,
      source: vectorSource,
      squareCondition: active,
    });
  }

  /**
   * Change sides draw regular interaction
   * @public
   * @function
   * @api
   */
  changeFigure(e) {
    const value = e.target.value;
    this.drawRegular.setSides(parseInt(value, 10));
  }

  /**
   * Removes draw regular interaction from map.
   * @public
   * @function
   * @api
   */
  removeFigureDrawInteraction() {
    this.facadeMap_.getMapImpl().removeInteraction(this.drawRegular);
  }

  /**
   * Removes draw interaction from map.
   * @public
   * @function
   * @api
   */
  removeDrawInteraction() {
    this.facadeMap_.getMapImpl().removeInteraction(this.draw);
  }

  /**
   * Creates new OpenLayers draw interaction
   * @public
   * @function
   * @api
   * @param {OLVectorSource} vectorSource -
   * @param {String} geometry - type of geometry ['Point', 'LineString', 'Polygon']
   */
  newDrawInteraction(vectorSource, geometry) {
    return new ol.interaction.Draw({
      source: vectorSource,
      type: geometry,
    });
  }

  /**
   * Creates polygon feature from extent.
   * @public
   * @function
   * @api
   * @param {Array} extent - geometry extent
   */
  newPolygonFeature(extent) {
    return new ol.Feature({ geometry: ol.geom.Polygon.fromExtent(extent) });
  }

  /**
   * Creates point feature from coordinates.
   * @public
   * @function
   * @api
   * @param {Array} coordinates
   * @param {Integer} srs
   */
  drawPointFeature(coordinates, srs) {
    const mapSRS = this.facadeMap_.getProjection().code;
    const finalCoordinates = ol.proj.transform(coordinates, srs, mapSRS);
    const feature = new ol.Feature({ geometry: new ol.geom.Point(finalCoordinates) });
    const mfeature = this.convertToMFeatures(feature);
    this.facadeControl.getLayer().addFeatures([mfeature]);
    this.facadeMap_.setCenter(finalCoordinates);
    return mfeature;
  }

  /**
   * Creates current feature clone.
   * @public
   * @function
   * @api
   */
  getApiIdeeFeatureClone() {
    // eslint-disable-next-line no-underscore-dangle
    const implFeatureClone = this.facadeControl.feature.getImpl().olFeature_.clone();
    const emphasis = IDEE.impl.Feature.feature2Facade(implFeatureClone);
    return emphasis;
  }

  /**
   * Gets extent of feature
   * @public
   * @function
   * @api
   * @param {IDEE.Featuer} apiIdeeFeature
   */
  getFeatureExtent(feature) {
    return feature.getImpl().getFeature().getGeometry().getExtent();
  }

  /**
   * Convert olFeature to IDEE.Feature
   * @public
   * @function
   * @api
   */
  convertToMFeatures(olFeature) {
    const feature = new IDEE.Feature(olFeature.getId(), {
      geometry: {
        coordinates: olFeature.getGeometry().getCoordinates(),
        type: olFeature.getGeometry().getType(),
      },
    });

    return feature;
  }
}
