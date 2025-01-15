/**
 * @module M/impl/format/GeoJSON
 */
import { isNullOrEmpty, generateRandom, isUndefined } from 'M/util/Utils';
import Feature from 'M/feature/Feature';
import {
  Cartographic,
  GeoJsonDataSource,
  PointGraphics,
  PolygonGraphics,
  PolylineGraphics,
  Math as CesiumMath,
  Color,
  BillboardGraphics,
  BoundingRectangle,
  HorizontalOrigin,
  VerticalOrigin,
  Cartesian2,
  HeightReference,
} from 'cesium';
import proj4 from 'proj4';
import ImplUtils from '../util/Utils';

/**
  * @classdesc
  * Implementación de la clase GeoJSON. GeoJSON es un formato para codificar una variedad
  * de estructuras de datos geográficos.
  *
  * @api
  */
class GeoJSON {
  /**
    * Constructor principal de la clase.
    * @constructor
    * @param {Object} options Opciones del GeoJSON.
    * - dataProjection: Proyección de datos predeterminada. Por defecto "EPSG:4326".
    * - featureProjection: Proyección de los objetos geográficos leídos o escritos por el formato.
    * - clampToGround: Define si el objeto geográfico se debe ajustar al suelo. Por defecto falso.
    *
    * @api
    */
  constructor(options = {}) {
    this.mapProj = options.featureProjection;
    this.clampToGround = options.clampToGround;
  }

  /**
    * Este método obtiene los objetos geográficos a partir de un objeto GeoJSON.
    *
    * @function
    * @param {Object} object Objeto GeoJSON.
    * @param {Object} options Opciones.
    * @returns {M.Feature} Objetos geográficos.
    * @public
    * @api
    */
  readFeatureFromObject(object, options) {
    let geoJSONFeature = object;
    const opts = options;
    if (typeof object === 'string') {
      const obj = JSON.parse(object);
      geoJSONFeature = obj;
    }

    // id
    if (isNullOrEmpty(geoJSONFeature.id)) {
      geoJSONFeature.id = generateRandom('geojson_');
    }

    const array = this.getDeepestArray(geoJSONFeature.geometry.coordinates);
    if (isUndefined(options.clampToGround) && array.length === 2) {
      opts.clampToGround = true;
    } else if (isUndefined(options.clampToGround) && array.length === 3) {
      opts.clampToGround = false;
    }

    const promise = new GeoJsonDataSource().process(geoJSONFeature, opts);
    return promise.then((dataSource) => {
      const features = dataSource.entities.values;
      const featuresResult = [];
      features.forEach((f) => {
        const feature = f;
        if (!isUndefined(feature.billboard) && !object.isKMLBillboard) {
          feature.billboard = undefined;
          const obj = {
            color: Color.WHITE,
            outlineColor: Color.BLACK,
            pixelSize: 5,
          };
          if (opts.clampToGround) {
            obj.heightReference = HeightReference.CLAMP_TO_GROUND;
          }
          feature.point = new PointGraphics(obj);
        }

        // click function
        if (geoJSONFeature.click) {
          feature.click = geoJSONFeature.click;
        }

        // vendor parameters
        if (geoJSONFeature.properties && geoJSONFeature.properties.vendor
          && geoJSONFeature.properties.vendor.api_idee) {
          // icons
          if (geoJSONFeature.properties.vendor.api_idee.icon) {
            GeoJSON.applyIcon(feature, geoJSONFeature.properties.vendor.api_idee.icon);
          }
        }
        featuresResult.push(feature);
      });
      return featuresResult;
    });
  }

  getDeepestArray(arr) {
    let deepest = null;
    const findDeepest = (current) => {
      if (Array.isArray(current)) {
        current.forEach((element) => findDeepest(element));
      } else {
        return;
      }
      if (current.every((element) => !Array.isArray(element))) {
        deepest = current;
      }
    };
    findDeepest(arr);
    return deepest;
  }

  /**
   * Este método convierte una geometría en un objeto.
   *
   * @function
   * @param {*} geometry Geometría del objeto geográfico de Cesium.
   * @returns {Object} Objecto GeoJSON
   * @public
   * @api
   */
  writeGeometryObject(geometry) {
    let object = {};

    if (geometry instanceof PointGraphics || geometry instanceof BillboardGraphics) {
      const cartographic = Cartographic.fromCartesian(geometry.coordinates);
      object = {
        type: 'Point',
        coordinates: [
          CesiumMath.toDegrees(cartographic.longitude),
          CesiumMath.toDegrees(cartographic.latitude),
          cartographic.height,
        ],
      };
    } else if (geometry instanceof PolygonGraphics) {
      const positions = geometry.hierarchy.getValue().positions;
      const coordinates = [];
      positions.forEach((pos) => {
        const cartographic = Cartographic.fromCartesian(pos);
        coordinates.push([
          CesiumMath.toDegrees(cartographic.longitude),
          CesiumMath.toDegrees(cartographic.latitude),
          cartographic.height,
        ]);
      });

      object = {
        type: 'Polygon',
        coordinates: [coordinates],
      };
    } else if (geometry instanceof PolylineGraphics) {
      const positions = geometry.positions.getValue();
      const coordinates = [];
      positions.forEach((pos) => {
        const cartographic = Cartographic.fromCartesian(pos);
        coordinates.push([
          CesiumMath.toDegrees(cartographic.longitude),
          CesiumMath.toDegrees(cartographic.latitude),
          cartographic.height,
        ]);
      });

      object = {
        type: 'LineString',
        coordinates,
      };
    }

    return object;
  }

  /**
    * Este método escribe un objeto geográfico en un objeto GeoJSON.
    *
    * @function
    * @param {M.Feature} feature Objeto geográfico a escribir.
    * @returns {Object} Objeto GeoJSON.
    * @public
    * @api
    */
  writeFeatureObject(feature) {
    const object = {
      type: 'Feature',
    };

    const id = feature.id;
    if (id) {
      object.id = id;
    }
    const geometry = ImplUtils.getGeometryEntity(feature);
    if (geometry) {
      object.geometry = this.writeGeometryObject(geometry);
    } else {
      object.geometry = null;
    }
    const properties = feature.properties;
    if (!isNullOrEmpty(properties)) {
      // eslint-disable-next-line no-return-assign
      object.properties = properties.propertyNames.reduce((acc, curr) =>
        // eslint-disable-next-line
        (acc[curr] = properties[curr].getValue(), acc), {});
    } else {
      object.properties = null;
    }

    if (!isNullOrEmpty(feature.click)) {
      object.click = feature.click;
    }

    return object;
  }

  /**
    * Este método obtiene la proyección a partir de un objeto GeoJSON.
    *
    * @function
    * @param {Object} object Objeto GeoJSON.
    * @returns {String} Proyección obtenida del objeto GeoJSON, si no
    * obtiene ninguna devuelve por defecto EPSG:4326.
    * @public
    * @api
    */
  static readProjectionFromObject(object) {
    let projection;
    const geoJSONObject = object;
    const crs = geoJSONObject.crs;
    if (crs) {
      if (crs.type === 'name') {
        const match = crs.properties.name.match(/EPSG::?(\d+)/);
        projection = match ? `EPSG:${match[1]}` : null;
      } else if (crs.type === 'EPSG') {
        // 'EPSG' is not part of the GeoJSON specification, but is generated by
        // GeoServer.
        // TODO: remove this when http://jira.codehaus.org/browse/GEOS-5996
        // is fixed and widely deployed.
        projection = `EPSG:${crs.properties.code}`;
      } else {
        projection = null;
        throw new Error(`Unknown crs.type: ${crs.type}`);
      }
    } else {
      projection = 'EPSG:4326';
    }
    return projection;
  }

  /**
    * Este método establece el estilo del icono de un objetos geográficos.
    *
    * @function
    * @param {M.Feature} feature Objetos geográficos.
    * @param {Object} icon Objeto con las opciones del icono.
    * @public
    * @api
    */
  static applyIcon(feature, icon) {
    const imgIcon = new Image();
    imgIcon.src = icon.url;
    imgIcon.crossOrigin = 'anonymous';

    let imgAnchor;
    if (icon.anchor && icon.anchor.x && icon.anchor.y) {
      imgAnchor = new Cartesian2(-icon.anchor.x, -icon.anchor.y);
    }

    imgIcon.onload = () => {
      const originalHeight = imgIcon.naturalHeight;
      const regionWidth = icon.width;
      const regionHeight = icon.height;
      const x = 0;
      const y = originalHeight - regionHeight;

      // eslint-disable-next-line no-param-reassign
      feature.billboard = new BillboardGraphics({
        image: imgIcon.src,
        imageSubRegion: new BoundingRectangle(x, y, regionWidth, regionHeight),
        width: regionWidth,
        height: regionHeight,
        horizontalOrigin: HorizontalOrigin.CENTER,
        verticalOrigin: VerticalOrigin.CENTER,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        pixelOffset: imgAnchor,
      });
    };
  }

  /**
    * Este método escribe una lista de objetos geográficos en objetos GeoJSON.
    *
    * @function
    * @param {Array<M.Feature>} features Lista de objetos geográficos.
    * @returns {Array<Object>} Lista de objetos GeoJSON.
    * @public
    * @api
    */
  write(features) {
    return features.map((feature) => this.writeFeatureObject(feature.getImpl().getFeature()));
  }

  /**
    * Este método lee objetos geográficos de una lista de objetos GeoJSON.
    *
    * @function
    * @param {Object} geojson Objeto GeoJSON.
    * @param {Array<Object>} geojsonFeatures Lista de objetos GeoJSON.
    * @param {M.Projection} projection Proyección.
    * @return {Array<M.Feature>} Lista de objetos geográficos.
    * @public
    * @api
    */
  read(geojson, geojsonFeatures, projection) {
    let features = [];
    let dstProj = projection.code;
    if (isNullOrEmpty(dstProj)) {
      if (!isNullOrEmpty(projection.featureProjection)) {
        dstProj = projection.featureProjection.code;
      } else {
        dstProj = projection.getCode();
      }
    }
    const srcProj = GeoJSON.readProjectionFromObject(geojson);

    features = geojsonFeatures.map((geojsonFeature) => {
      const id = geojsonFeature.id;
      const geometry = geojsonFeature.geometry;
      if (geometry && srcProj !== 'EPSG:4326') {
        if (geometry.type === 'Polygon') {
          geometry.coordinates = ImplUtils.transformCoordinatesPolygon(
            geometry.coordinates,
            srcProj,
            dstProj,
          );
        } else if (geometry.type === 'MultiPolygon') {
          geometry.coordinates = geometry.coordinates.map(
            (poligono) => ImplUtils.transformCoordinatesPolygon(
              poligono,
              srcProj,
              dstProj,
            ),
          );
        } else if (geometry.type === 'Point') {
          geometry.coordinates = proj4(
            srcProj,
            dstProj,
            geometry.coordinates,
          );
        } else if (geometry.type === 'MultiPoint') {
          geometry.coordinates = geometry.coordinates.map(
            (punto) => proj4(srcProj, dstProj, punto),
          );
        } else if (geometry.type === 'LineString') {
          geometry.coordinates = ImplUtils.transformCoordinatesLineString(
            geometry.coordinates,
            srcProj,
            dstProj,
          );
        } else if (geometry.type === 'MultiLineString') {
          geometry.coordinates = geometry.coordinates.map(
            (linea) => ImplUtils.transformCoordinatesLineString(
              linea,
              srcProj,
              dstProj,
            ),
          );
        }
      }
      // eslint-disable-next-line no-param-reassign
      geojsonFeature.clampToGround = this.clampToGround;
      const feature = new Feature(id, geojsonFeature);

      return feature;
    });
    return features;
  }
}

export default GeoJSON;
