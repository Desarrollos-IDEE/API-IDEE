import DrawRegular from 'ol-ext/interaction/DrawRegular';
import SnapManager from './snapmanager';
import { cloneFeature, extentFeature } from './featureutils';

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

    /**
     * Snap manager for draw interactions
     * @private
     * @type {SnapManager}
     */
    this.snapManager_ = new SnapManager(map);
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
   * This function sets the layer where features are drawn
   *
   * @public
   * @function
   * @param {IDEE.layer.Vector} layer layer selected for management
   * @api stable
   */
  setLayer(layer) {
    this.vectorSource_ = layer.getImpl().getLayer().getSource();
  }

  /**
   * Removes all features of the drawing vector source
   *
   * @public
   * @function
   * @api stable
   */
  clearVectorSource() {
    this.vectorSource_.clear(true);
  }

  /**
   * This function adds draw interaction to map.
   * @public
   * @function
   * @param {String} geometry type of geometry ['Point', 'LineString', 'Polygon']
   * @param {Object} snapOptions snap options
   * @api
   */
  addDrawInteraction(geometry, snapOptions) {
    const olMap = this.facadeMap_.getMapImpl();
    this.draw = this.newDrawInteraction(this.vectorSource_, geometry);
    this.addDrawEvent();
    olMap.addInteraction(this.draw);
    this.snapManager_.enable(this.draw, () => this.facadeControl.getLayer(), snapOptions);
  }

  /**
   * Defines function to be executed on click on draw interaction.
   * Notifies the drawn feature to the facade control.
   * @public
   * @function
   * @api
   */
  addDrawEvent() {
    this.draw.on('drawend', (event) => {
      this.facadeControl.onDraw({ feature: IDEE.impl.Feature.feature2Facade(event.feature) });
    });
  }

  /**
   * This function adds figure interaction to map.
   * @public
   * @function
   * @param {Object} snapOptions snap options
   * @api
   */
  addFigureInteraction(snapOptions) {
    const olMap = this.facadeMap_.getMapImpl();
    this.drawRegular = this.newDrawFigureInteraction(this.vectorSource_);
    this.addDrawFigureEvent();
    olMap.addInteraction(this.drawRegular);
    this.snapManager_.enable(this.drawRegular, () => this.facadeControl.getLayer(), snapOptions);
  }

  /**
   * This function updates snap options of active interaction.
   * @public
   * @function
   * @param {Object} snapOptions snap options
   * @api
   */
  updateSnap(snapOptions) {
    this.snapManager_.update(snapOptions);
  }

  /**
   * Defines function to be executed on click on figure interaction.
   * @public
   * @function
   * @api
   */
  addDrawFigureEvent() {
    this.drawRegular.on('drawend', (event) => {
      this.facadeControl.onDrawFigure({ feature: this.convertToMFeatures(event.feature) });
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
    this.snapManager_.disable();
    this.facadeMap_.getMapImpl().removeInteraction(this.drawRegular);
  }

  /**
   * Removes draw interaction from map.
   * @public
   * @function
   * @api
   */
  removeDrawInteraction() {
    this.snapManager_.disable();
    this.facadeMap_.getMapImpl().removeInteraction(this.draw);
  }

  /**
   * Creates new OpenLayers draw interaction
   * @public
   * @function
   * @api
   * @param {OLVectorSource} vectorSource -
   * @param {String} geometry type of geometry ['Point', 'LineString', 'Polygon']
   */
  newDrawInteraction(vectorSource, geometry) {
    return new ol.interaction.Draw({
      source: vectorSource,
      type: geometry,
    });
  }

  /**
   * Creates point feature from coordinates.
   * @public
   * @function
   * @api
   * @param {Array} coordinates
   * @param {String} srs coordinates projection
   * @returns {IDEE.Feature} point in map projection
   */
  createPointFeature(coordinates, srs) {
    const mapSRS = this.facadeMap_.getProjection().code;
    const finalCoordinates = ol.proj.transform(coordinates, srs, mapSRS);
    const feature = new ol.Feature({ geometry: new ol.geom.Point(finalCoordinates) });
    return this.convertToMFeatures(feature);
  }

  /**
   * Creates a multiple geometry feature from the coordinates of its parts.
   * @public
   * @function
   * @api
   * @param {String} type MultiPoint, MultiLineString or MultiPolygon
   * @param {Array} coordinates coordinates of the parts
   * @returns {IDEE.Feature} multiple geometry feature
   */
  createMultiGeometryFeature(type, coordinates) {
    const geometryConstructors = {
      MultiPoint: ol.geom.MultiPoint,
      MultiLineString: ol.geom.MultiLineString,
      MultiPolygon: ol.geom.MultiPolygon,
    };
    const Geometry = geometryConstructors[type];
    const geometry = new Geometry(coordinates);
    return IDEE.impl.Feature.feature2Facade(new ol.Feature({ geometry }));
  }

  /**
   * Gets coordinates of a feature.
   * @public
   * @function
   * @api
   * @param {IDEE.Feature} feature
   * @returns {Array} coordinates in map projection
   */
  getFeatureCoordinates(feature) {
    return feature.getImpl().getFeature().getGeometry().getCoordinates();
  }

  /**
   * Creates feature clone.
   * @public
   * @function
   * @api
   * @param {IDEE.Feature} feature
   * @returns {IDEE.Feature} clone
   */
  getApiIdeeFeatureClone(feature) {
    return cloneFeature(feature);
  }

  /**
   * Creates polygon feature from the extent of a feature.
   * @public
   * @function
   * @api
   * @param {IDEE.Feature} feature
   * @returns {IDEE.Feature} extent polygon
   */
  getExtentFeature(feature) {
    return extentFeature(feature);
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
