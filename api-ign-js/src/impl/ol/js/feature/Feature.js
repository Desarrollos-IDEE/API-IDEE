import FacadeFeature from 'M/feature/Feature';
import { isNullOrEmpty, generateRandom } from 'M/util/Utils';
import OLGeomGeometry from 'ol/geom/Geometry';
import OLGeomPoint from 'ol/geom/Point';
import OLGeomCircle from 'ol/geom/Circle';
import OLGeomMultiPoint from 'ol/geom/MultiPoint';
import OLGeomLineString from 'ol/geom/LineString';
import OLGeomPolygon from 'ol/geom/Polygon';
import OLGeomMultiLineString from 'ol/geom/MultiLineString';
import OLGeomMultiPolygon from 'ol/geom/MultiPolygon';
import OLFeature from 'ol/Feature';
import FormatGeoJSON from '../format/GeoJSON';
import ImplUtils from '../util/Utils';

/**
 * @module M/impl/Feature
 */

/**
 * @classdesc
 * Crea un objeto geográfico.
 */
class Feature {
  /**
   * Contructor para generar un objeto geográfico de Openlayers.
   * @constructor
   * @implements {M.impl.Layer}
   * @param {String} id Identificador del objeto geográfico.
   * @param {Object} geojson GeoJSON con objetos geográficos.
   * @param {Object} style Estilo de los objetos geográficos.
   * @api stable
   */
  constructor(id, geojson, style) {
    const geojsonVariable = geojson;
    this.facadeFeature_ = null;

    this.formatter_ = new FormatGeoJSON();

    if (!isNullOrEmpty(geojson)) {
      if (isNullOrEmpty(geojson.type)) {
        geojsonVariable.type = 'Feature';
      }
      this.olFeature_ = this.formatter_.readFeature(geojsonVariable);
    } else {
      this.olFeature_ = new OLFeature();
    }
    if (!isNullOrEmpty(id)) {
      this.olFeature_.setId(id);
    } else if (isNullOrEmpty(this.olFeature_.getId())) {
      this.olFeature_.setId(generateRandom('mapea_feature_'));
    }
  }

  /**
   * Este método devuelve el objeto openlayers del objeto geográfico.
   * @public
   * @function
   * @return {OLFeature} Devuelve el objeto openlayers del objeto geográfico.
   * @api stable
   */
  getOLFeature() {
    return this.olFeature_;
  }

  /**
   * Este método sobrescribe el objeto geográfico de Openlayers.
   * @public
   * @param {OLFeature} olFeature Nuevo objeto geográfico.
   * @param {Boolean} canBeModified Define si puede ser modificable, genera un nuevo id.
   * @function
   * @api stable
   */
  setOLFeature(olFeature, canBeModified) {
    if (!isNullOrEmpty(olFeature)) {
      this.olFeature_ = olFeature;
      if (canBeModified !== false && isNullOrEmpty(this.olFeature_.getId())) {
        this.olFeature_.setId(generateRandom('mapea_feature_'));
      }
    }
  }

  /**
   * Este método retorna los atributos de un objeto geográfico.
   * @public
   * @return {Object} Atributos.
   * @function
   * @api stable
   */
  getAttributes() {
    const properties = this.olFeature_.getProperties();
    const geometry = properties.geometry;
    if (geometry instanceof OLGeomGeometry) {
      delete properties.geometry;
    }
    return properties;
  }

  /**
   * Este método retorna los atributos de un objeto geográfico.
   *
   * @public
   * @function
   * @return {string} Identificador del objeto geográfico.
   * @api stable
   */
  getId() {
    return this.olFeature_.getId();
  }

  /**
   * Este método modifica el identificador del objeto geográfico.
   *
   * @public
   * @function
   * @param {string} id Identificador del objeto geográfico.
   * @api stable
   */
  setId(id) {
    this.olFeature_.setId(id);
  }

  /**
   * Este método sobrescribe los atributos del objeto geográfico.
   *
   * @public
   * @function
   * @param {Object} attributes Nuevos atributos.
   * @api stable
   */
  setAttributes(attributes) {
    this.olFeature_.setProperties(attributes);
  }

  /**
   * Este método de la clase transforma "OLFeature" (Objeto geográfico de Openlayer)
   * a "M.Feature" (Objeto geográfico de API-CNIG).
   *
   * @public
   * @function
   * @param {OLFeature} olFeature  "OLFeature".
   * @param {boolean} canBeModified Define si puede ser modificado.
   * @return {M.Feature} Retorna "M.Feature" modificado.
   * @api stable
   */
  static olFeature2Facade(olFeature, canBeModified) {
    let facadeFeature = null;
    if (!isNullOrEmpty(olFeature)) {
      facadeFeature = new FacadeFeature();
      facadeFeature.getImpl().setOLFeature(olFeature, canBeModified);
    }
    return facadeFeature;
  }

  /**
   * Este método de la clase transforma "OLRenderFeature" (Objeto geográfico de Openlayer)
   * a "M.Feature" (Objeto geográfico de API-CNIG).
   *
   * @public
   * @function
   * @param { RenderFeature } olRenderFeature "OLFeature".
   * @param {ol.Projection} tileProjection Proyección de la tesela.
   * @param {ol.Projection} mapProjection Proyección del mapa.
   * @return {M.Feature} Retorna "M.Feature" modificado.
   * @api stable
   */
  static olRenderFeature2Facade(olRenderFeature, tileProjection, mapProjection) {
    const olFeature = ImplUtils
      .olRenderFeature2olFeature(olRenderFeature, tileProjection, mapProjection);
    return Feature.olFeature2Facade(olFeature);
  }

  /**
   * Este método de la clase transforma "M.Feature" (Objeto geográfico de API-CNIG)
   * a "OLFeature" (Objeto geográfico de Openlayer).
   *
   * @public
   * @function
   * @param {M.Feature} feature "M.Feature".
   * @return {OLFeature} Retorna "OLFeature".
   * @api stable
   */
  static facade2OLFeature(feature) {
    return feature.getImpl().getOLFeature();
  }

  /**
   * Este método retorna el valor del atributo.
   *
   * @public
   * @function
   * @param {string} attribute Nombre del atributo.
   * @return  {string|number|object} Retorna el valor del atributo.
   * @api stable
   */
  getAttribute(attribute) {
    return this.olFeature_.get(attribute);
  }

  /**
   * Este método sobrescribe el valor de un atributo del objeto geográfico.
   *
   * @public
   * @function
   * @param {string} attribute Nombre del atributo.
   * @return  {string|number|object} Retorna el valor del atributo modificado.
   * @api stable
   */
  setAttribute(attribute, value) {
    return this.olFeature_.set(attribute, value);
  }

  /**
   * Este método retorna la geometría del objeto geográfico.
   *
   * @public
   * @function
   * @param {object} geojson Objeto geográfico en formato GeoJSON.
   * @return {object} Geometría del objeto geográfico.
   * @api stable
   */
  static getGeometry(geojson) {
    let geometry;
    const type = geojson.geometry.type;
    if (type === 'circle') {
      geometry = new OLGeomCircle(geojson.geometry.coordinates);
    } else if (type === 'geometry') {
      geometry = new OLGeomGeometry(geojson.geometry.coordinates);
    } else if (type === 'linestring') {
      geometry = new OLGeomLineString(geojson.geometry.coordinates);
    } else if (type === 'multilinestring') {
      geometry = new OLGeomMultiLineString(geojson.geometry.coordinates);
    } else if (type === 'multipoint') {
      geometry = new OLGeomMultiPoint(geojson.geometry.coordinates);
    } else if (type === 'multipolygon') {
      geometry = new OLGeomMultiPolygon(geojson.geometry.coordinates);
    } else if (type === 'point') {
      geometry = new OLGeomPoint(geojson.geometry.coordinates);
    } else if (type === 'polygon') {
      geometry = new OLGeomPolygon(geojson.geometry.coordinates);
    }
    return geometry;
  }

  /**
   * Este método modifica la geometría del objeto geográfico.
   *
   * @public
   * @function
   * @param {object} Geometry Geometría del objeto geográfico.
   * @api stable
   */
  setGeometry(geometry) {
    const type = geometry.type.toLowerCase();
    if (type === 'circle') {
      this.olFeature_.setGeometry(new OLGeomCircle(geometry.coordinates));
    } else if (type === 'geometry') {
      this.olFeature_.setGeometry(new OLGeomGeometry(geometry.coordinates));
    } else if (type === 'linestring') {
      this.olFeature_.setGeometry(new OLGeomLineString(geometry.coordinates));
    } else if (type === 'multilinestring') {
      this.olFeature_.setGeometry(new OLGeomMultiLineString(geometry.coordinates));
    } else if (type === 'multipoint') {
      this.olFeature_.setGeometry(new OLGeomMultiPoint(geometry.coordinates));
    } else if (type === 'multipolygon') {
      this.olFeature_.setGeometry(new OLGeomMultiPolygon(geometry.coordinates));
    } else if (type === 'point') {
      this.olFeature_.setGeometry(new OLGeomPoint(geometry.coordinates));
    } else if (type === 'polygon') {
      this.olFeature_.setGeometry(new OLGeomPolygon(geometry.coordinates));
    }
  }

  /**
   * Este método establece el vector de la clase de la fachada.
   *
   * @function
   * @param {object} obj Vector de la fachada.
   * @api stable
   */
  setFacadeObj(obj) {
    this.facadeFeature_ = obj;
  }

  /**
   * Este método retorna el centroide del objeto geográfico.
   *
   * @public
   * @function
   * @return {Array<number>} Centroide.
   * @api stable
   */
  getCentroid() {
    let olCentroid;
    const olFeature = this.getOLFeature();
    const geometry = olFeature.getGeometry();
    const center = ImplUtils.getCentroid(geometry);
    if (!isNullOrEmpty(center)) {
      const geom = new OLGeomPoint();
      geom.setCoordinates(center);
      olCentroid = new OLFeature({
        geometry: geom,
        name: 'centroid',
      });
    }
    olCentroid = olCentroid || Feature.olFeature2Facade(olCentroid);
    return olCentroid;
  }

  /**
   * Este método elimina el estilo del objeto geográfico.
   *
   * @public
   * @function
   * @return {Array<number>}
   * @api stable
   */
  clearStyle() {
    this.olFeature_.setStyle(null);
  }
}
export default Feature;
