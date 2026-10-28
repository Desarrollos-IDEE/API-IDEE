/**
 * @module IDEE/impl/control/Turfcontrol
 */

/**
 * Proyección en la que trabaja Turf.js.
 * @const
 * @type {String}
 */
const TURF_PROJECTION = 'EPSG:4326';

export default class Turfcontrol extends IDEE.impl.Control {
  /**
   * @constructor
   * @param {IDEE.Map} map Mapa.
   * @api
   */
  constructor(map) {
    super();
    this.facadeMap_ = map;
    this.format_ = new ol.format.GeoJSON();
  }

  /**
   * Convierte los objetos geográficos en un FeatureCollection GeoJSON en
   * EPSG:4326.
   *
   * @public
   * @function
   * @param {Array<IDEE.Feature>} features Objetos geográficos.
   * @returns {Object} FeatureCollection GeoJSON.
   * @api
   */
  toGeoJSON(features) {
    const olFeatures = features.map((f) => f.getImpl().getFeature());
    return this.format_.writeFeaturesObject(olFeatures, {
      dataProjection: TURF_PROJECTION,
      featureProjection: this.facadeMap_.getProjection().code,
    });
  }

  /**
   * Convierte un GeoJSON en EPSG:4326 en objetos geográficos en la
   * proyección del mapa.
   *
   * @public
   * @function
   * @param {Object} geojson Feature o FeatureCollection GeoJSON.
   * @returns {Array<IDEE.Feature>} Objetos geográficos.
   * @api
   */
  fromGeoJSON(geojson) {
    const olFeatures = this.format_.readFeatures(geojson, {
      dataProjection: TURF_PROJECTION,
      featureProjection: this.facadeMap_.getProjection().code,
    });
    return olFeatures.map((olFeature) => IDEE.impl.Feature.feature2Facade(olFeature));
  }
}
