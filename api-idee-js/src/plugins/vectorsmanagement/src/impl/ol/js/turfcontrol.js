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
   * EPSG:4326, en el mismo orden. Los que no se pueden representar en
   * GeoJSON quedan con geometría null.
   *
   * @public
   * @function
   * @param {Array<IDEE.Feature>} features Objetos geográficos.
   * @returns {Object} FeatureCollection GeoJSON.
   * @api
   */
  toGeoJSON(features) {
    const options = {
      dataProjection: TURF_PROJECTION,
      featureProjection: this.facadeMap_.getProjection().code,
    };
    return {
      type: 'FeatureCollection',
      features: features.map((f) => {
        const olFeature = f.getImpl().getFeature();
        try {
          return this.format_.writeFeatureObject(olFeature, options);
        } catch (e) {
          return { type: 'Feature', geometry: null, properties: {} };
        }
      }),
    };
  }

  /**
   * Convierte un GeoJSON en objetos geográficos en la proyección del mapa.
   *
   * @public
   * @function
   * @param {Object} geojson Feature o FeatureCollection GeoJSON.
   * @param {String} [dataProjection='EPSG:4326'] Proyección del GeoJSON.
   * @returns {Array<IDEE.Feature>} Objetos geográficos.
   * @api
   */
  fromGeoJSON(geojson, dataProjection = TURF_PROJECTION) {
    const olFeatures = this.format_.readFeatures(geojson, {
      dataProjection,
      featureProjection: this.facadeMap_.getProjection().code,
    });
    return olFeatures.map((olFeature) => IDEE.impl.Feature.feature2Facade(olFeature));
  }
}
