/**
 * @module M/impl/Feature
 */
import FacadeFeature from 'M/feature/Feature';
import { isNullOrEmpty, generateRandom, isString } from 'M/util/Utils';
import {
  Cartesian3,
  Entity,
  PointGraphics,
  PolygonGraphics,
  PolylineGraphics,
  Color,
  BillboardGraphics,
  PolylineOutlineMaterialProperty,
  ImageMaterialProperty,
} from 'cesium';
import {
  getValue,
} from 'M/i18n/language';
import FormatGeoJSON from '../format/GeoJSON';
import ImplUtils from '../util/Utils';

/**
 * @classdesc
 * Crea un objeto geográfico.
 */
class Feature {
  /**
   * Contructor para generar un objeto geográfico de Cesium.
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

    this.referenceFacadeLayer = null;

    this.hasPropertyIcon_ = false;

    if (!isNullOrEmpty(geojson)) {
      if (isNullOrEmpty(geojson.type)) {
        geojsonVariable.type = 'Feature';
      }

      if (!isNullOrEmpty(geojson.geometry)) {
        this.coordinates_ = geojson.geometry.coordinates;
      }

      this.clampToGround_ = geojsonVariable.clampToGround;

      this.isLoadCesiumFeature_ = this.formatter_
        .readFeatureFromObject(
          geojsonVariable,
          { clampToGround: this.clampToGround_ },
        ).then((feature) => {
          this.cesiumFeature_ = feature[0];
          if (!isNullOrEmpty(id)) {
            // eslint-disable-next-line no-underscore-dangle
            this.cesiumFeature_._id = id;
          } else if (isNullOrEmpty(this.cesiumFeature_.id)) {
            // eslint-disable-next-line no-underscore-dangle
            this.cesiumFeature_._id = generateRandom('apiIdee_feature_');
          }
          if (feature.length > 1) {
            feature.shift();
            this.othersEntities = feature;
          }
          this.isLoadCesiumF_ = true;
          return this.cesiumFeature_;
        });
    } else {
      this.cesiumFeature_ = new Entity();
    }
  }

  /**
   * Este método devuelve el objeto openlayers del objeto geográfico.
   * @public
   * @function
   * @return {Entity} Devuelve el objeto openlayers del objeto geográfico.
   * @api stable
   */
  getFeature() {
    return this.cesiumFeature_;
  }

  /**
   * Este método sobrescribe el objeto geográfico de Cesium.
   * @public
   * @param {Entity} cesiumFeature Nuevo objeto geográfico.
   * @param {Boolean} canBeModified Define si puede ser modificable, genera un nuevo id.
   * @function
   * @api stable
   */
  setFeature(cesiumFeature, canBeModified) {
    if (!isNullOrEmpty(cesiumFeature)) {
      this.cesiumFeature_ = cesiumFeature;
      if (canBeModified !== false && isNullOrEmpty(this.cesiumFeature_.id)) {
        // eslint-disable-next-line no-underscore-dangle
        this.cesiumFeature_._id = generateRandom('apiIdee_feature_');
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
    const properties = this.cesiumFeature_.properties;
    if (properties) {
      // eslint-disable-next-line no-return-assign
      const res = properties.propertyNames.reduce((acc, curr) => {
        if (properties[curr]) {
          const value = properties[curr].getValue();
          acc[curr] = value;
        }
        return acc;
      }, {});
      return res;
    }

    return {};
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
    return this.cesiumFeature_.id;
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
    // eslint-disable-next-line no-underscore-dangle
    this.cesiumFeature_._id = id;
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
    this.cesiumFeature_.properties = attributes;
  }

  /**
   * Este método de la clase transforma "Entity" (Objeto geográfico de Cesium)
   * a "M.Feature" (Objeto geográfico de API-IDEE).
   *
   * @public
   * @function
   * @param {Entity} cesiumFeature "Entity".
   * @param {boolean} canBeModified Define si puede ser modificado.
   * @return {M.Feature} Retorna "M.Feature" modificado.
   * @api stable
   */
  static feature2Facade(cesiumFeature, canBeModified) {
    let facadeFeature = null;
    if (!isNullOrEmpty(cesiumFeature)) {
      facadeFeature = new FacadeFeature();
      facadeFeature.getImpl().setFeature(cesiumFeature, canBeModified);
      // eslint-disable-next-line no-underscore-dangle
      facadeFeature.getImpl().isLoadCesiumFeature_ = new Promise((resolve) => {
        resolve(true);
      });
    }
    return facadeFeature;
  }

  /**
   * Este método de la clase transforma "RenderFeature"
   * a "M.Feature" (Objeto geográfico de API-IDEE).
   * No disponible para Cesium.
   *
   * @public
   * @function
   * @return {String} Retorna nulo.
   * @api stable
   */
  static RenderFeature2Facade() {
    console.warn(getValue('exception').no_renderFeature); // eslint-disable-line
    return null;
  }

  /**
   * Este método de la clase transforma "M.Feature" (Objeto geográfico de API-IDEE)
   * a "Entity" (Objeto geográfico de Cesium).
   *
   * @public
   * @function
   * @param {M.Feature} feature "M.Feature".
   * @return {Entity} Retorna "Entity".
   * @api stable
   */
  static facade2Feature(feature) {
    return feature.getImpl().getFeature();
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
    if (this.cesiumFeature_.properties && this.cesiumFeature_.properties.hasProperty(attribute)) {
      return this.cesiumFeature_.properties[attribute].getValue();
    }
    return undefined;
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
    if (this.cesiumFeature_.properties.hasProperty(attribute)) {
      return this.cesiumFeature_.properties[attribute].setValue(value);
    }
    return this.cesiumFeature_.properties.addProperty(attribute, value);
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
    const type = geojson.geometry.type.toLowerCase();
    if (type === 'linestring') {
      let coordinates = [];
      let positions;
      geojson.geometry.coordinates.forEach((coord) => {
        coordinates = coordinates.concat(coord);
        coordinates = coordinates.flat();
      });

      if (coordinates.length % 2 === 0) {
        positions = Cartesian3.fromDegreesArray(coordinates);
      } else {
        positions = Cartesian3.fromDegreesArrayHeights(coordinates);
      }

      geometry = new PolylineGraphics({
        positions,
      });
    } else if (type === 'multilinestring') {
      geometry = [];
      geojson.geometry.coordinates.forEach((linea) => {
        let coordinates = [];
        let positions;
        linea.forEach((coord) => {
          coordinates = coordinates.concat(coord);
          coordinates = coordinates.flat();
        });

        if (coordinates.length % 2 === 0) {
          positions = Cartesian3.fromDegreesArray(coordinates);
        } else {
          positions = Cartesian3.fromDegreesArrayHeights(coordinates);
        }

        geometry.push(new PolylineGraphics({
          positions,
        }));
      });
    } else if (type === 'multipoint') {
      geometry = [];
      // eslint-disable-next-line no-console
      console.warn(getValue('exception').geometry_point);
      geojson.geometry.coordinates.forEach(
        () => geometry.push(new PointGraphics()),
      );
    } else if (type === 'multipolygon') {
      geometry = [];
      geojson.geometry.coordinates.forEach((poligono) => {
        let coordinates = [];
        let positions;
        poligono.forEach((coord) => {
          coordinates = coordinates.concat(coord);
          coordinates = coordinates.flat();
        });

        if (coordinates.length % 2 === 0) {
          positions = Cartesian3.fromDegreesArray(coordinates);
        } else {
          positions = Cartesian3.fromDegreesArrayHeights(coordinates);
        }

        geometry.push(new PolygonGraphics({
          hierarchy: positions,
        }));
      });
    } else if (type === 'point') {
      // eslint-disable-next-line no-console
      console.warn(getValue('exception').geometry_point);
      geometry = new PointGraphics();
    } else if (type === 'polygon') {
      let coordinates = [];
      let positions;
      geojson.geometry.coordinates.forEach((coord) => {
        coordinates = coordinates.concat(coord);
        coordinates = coordinates.flat();
      });

      if (coordinates.length % 2 === 0) {
        positions = Cartesian3.fromDegreesArray(coordinates);
      } else {
        positions = Cartesian3.fromDegreesArrayHeights(coordinates);
      }

      geometry = new PolygonGraphics({
        hierarchy: positions,
      });
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
    if (type === 'linestring') {
      let coordinates = [];
      geometry.coordinates.forEach((coord) => {
        coordinates = coordinates.concat(coord);
        coordinates = coordinates.flat();
      });
      if (coordinates.length % 2 === 0) {
        this.cesiumFeature_.polyline.positions = Cartesian3.fromDegreesArray(coordinates);
      } else {
        this.cesiumFeature_.polyline.positions = Cartesian3.fromDegreesArrayHeights(coordinates);
      }
    } else if (type === 'point') {
      if (geometry.coordinates.length % 2 === 0) {
        this.cesiumFeature_.position = Cartesian3.fromDegreesArray(geometry.coordinates)[0];
      } else {
        this.cesiumFeature_.position = Cartesian3.fromDegreesArrayHeights(geometry.coordinates)[0];
      }
    } else if (type === 'polygon') {
      let coordinates = [];
      geometry.coordinates.forEach((coord) => {
        coordinates = coordinates.concat(coord);
        coordinates = coordinates.flat();
      });
      if (coordinates.length % 2 === 0) {
        this.cesiumFeature_.polygon.hierarchy = Cartesian3.fromDegreesArray(coordinates);
      } else {
        this.cesiumFeature_.polygon.hierarchy = Cartesian3.fromDegreesArrayHeights(coordinates);
      }
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
    let cesiumCentroid;
    const cesiumFeature = this.getFeature();
    const geometry = ImplUtils.getGeometryEntity(cesiumFeature);
    const center = geometry instanceof PointGraphics
      ? cesiumFeature.position
      : ImplUtils.getCentroid(geometry);
    if (!isNullOrEmpty(center)) {
      const geom = new PointGraphics();
      cesiumCentroid = new Entity({
        point: geom,
        name: 'centroid',
        position: center,
      });
    }

    if (!isNullOrEmpty(cesiumCentroid)) {
      cesiumCentroid = Feature.feature2Facade(cesiumCentroid);
    }

    return cesiumCentroid;
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
    if (!isNullOrEmpty(this.referenceFacadeLayer)) {
      if (this.cesiumFeature_.billboard && !this.cesiumFeature_.point) {
        this.cesiumFeature_.billboard = undefined;
        this.cesiumFeature_.point = new PointGraphics({
          color: Color.WHITE,
          outlineColor: Color.BLACK,
          pixelSize: 5,
        });
      }
      const style = this.referenceFacadeLayer.getStyle();
      if (!isNullOrEmpty(style)) {
        this.facadeFeature_.setStyle(this.referenceFacadeLayer.getStyle());
      }
    }
  }

  /**
   * Este método modifica la altura del objeto geográfico según el valor de la
   * propiedad dada por el usuario.
   * Sólo disponible para geometrías poligonales.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   *
   * @param {Number|String} height Altura
   * @public
   * @function
   * @api
   */
  setHeightGeometry(height) {
    let h;

    if (isString(height) && this.cesiumFeature_.properties.hasProperty(height)) {
      h = this.cesiumFeature_.properties[height];
    } else if (!isString(height)) {
      h = height;
    }

    if (!isNullOrEmpty(h)) {
      if (this.cesiumFeature_.polygon) {
        this.cesiumFeature_.polygon.height = h;
      }
    }
  }

  /**
   * Este método devuelve la opacidad del feature.
   *
   * @public
   * @function
   * @return {Number} Opacidad
   * @api
   */
  getFeatureOpacity() {
    let opacity;
    if (this.cesiumFeature_) {
      const geometry = ImplUtils.getGeometryEntity(this.cesiumFeature_);
      if (geometry instanceof PointGraphics) {
        if (geometry.color) {
          opacity = geometry.color.getValue().alpha;
        } else if (geometry.outlineColor) {
          opacity = geometry.outlineColor.getValue().alpha;
        } else if (this.cesiumFeature_.billboard) {
          opacity = this.cesiumFeature_.billboard.color.getValue().alpha;
        }
      } else if (geometry instanceof BillboardGraphics) {
        if (geometry.color) {
          opacity = geometry.color.getValue().alpha;
        }
      } else if (geometry instanceof PolylineGraphics || geometry instanceof PolygonGraphics) {
        if (geometry.material) {
          // PolylineOutline
          if (geometry.material instanceof PolylineOutlineMaterialProperty) {
            if (geometry.material.color) {
              // fill
              opacity = geometry.material.color.getValue().alpha;
            } else if (geometry.material.outlineColor) {
              // stroke
              opacity = geometry.material.outlineColor.getValue().alpha;
            }
          } else if (geometry.material instanceof ImageMaterialProperty) {
            if (geometry.material.color) {
              // fill
              opacity = geometry.material.color.getValue().alpha;
            }
          } else {
            opacity = geometry.material.color.getValue().alpha;
          }
        } else if (geometry instanceof PolygonGraphics && geometry.outlineColor) {
          // stroke
          opacity = geometry.outlineColor.getValue().alpha;
        }
      }
    }
    return opacity;
  }
}
export default Feature;
