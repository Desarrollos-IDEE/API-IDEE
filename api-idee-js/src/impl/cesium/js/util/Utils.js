/**
 * @module IDEE/impl/utils
 */
import Feature from 'IDEE/feature/Feature';
import {
  isNullOrEmpty,
  isUndefined,
  isString,
  isArray,
  generateRandom,
} from 'IDEE/util/Utils';
import {
  Cartographic,
  PolygonGraphics,
  PolylineGraphics,
  Math as CesiumMath,
  Cartesian3,
  Rectangle,
  PointGraphics,
  Ellipsoid,
  SceneTransforms,
  Cartesian2,
} from 'cesium';
import proj4 from 'proj4';

/**
  * Este método obtiene la cantidad de unidades por
  * metros de esta proyección.
  *
  * @function
  * @param {String} projectionCode Código de proyección.
  * @param {Number} meter Metros.
  * @return {Number} Unidades por metro.
  * @public
  * @api
  */
// ! TO-DO CUANDO SE USE ELIMINAR COMENTARIO ESLINT
// eslint-disable-next-line no-unused-vars
const getUnitsPerMeter = (projectionCode, meter) => {
  return meter / ((2 * Math.PI * 6370997) / 360);
};

/**
  * Sustituye las coordenadas x, y en el conjunto de
  * coordenadas (x, y, altitud...).
  *
  * @function
  * @param {Array} oldCoordinates Antiguas coordenadas.
  * @param {Array<Number>} newXY Nuevas coordenadas [x,y].
  * @return {Array<Number>} Nuevas coordenadas.
  * @public
  * @api
  */
// ! TO-DO CUANDO SE USE ELIMINAR COMENTARIO ESLINT
// eslint-disable-next-line no-unused-vars
const getFullCoordinates = (oldCoordinates, newXY) => {
  const newCoordinates = oldCoordinates;
  newCoordinates[0] = newXY[0];
  newCoordinates[1] = newXY[1];
  return newCoordinates;
};

/**
  * Dado un conjunto de coordenadas (x, y, altitud), devuelve [x,y].
  *
  * @function
  * @param {Array<Number>} coordinatesSet Conjunto de coordenadas (x, y, altitud).
  * @return {Array<Number>} Coordenadas [x,y].
  * @public
  * @api
  */
// ! TO-DO CUANDO SE USE ELIMINAR COMENTARIO ESLINT
// eslint-disable-next-line no-unused-vars
const getXY = (coordinatesSet) => {
  const coordinateCopy = [];
  for (let i = 0; i < coordinatesSet.length; i += 1) coordinateCopy.push(coordinatesSet[i]);
  while (coordinateCopy.length > 2) coordinateCopy.pop();
  return coordinateCopy;
};

/**
  * Transforma las coordenadas x, y a EPSG:4326 en la matriz de coordenadas.
  *
  * @function
  * @param {String} codeProjection Código de proyección actual.
  * @param {Array<Number>} oldCoordinates Coordenadas.
  * @return {Array<Number>} Coordenadas transformadas a EPSG:4326.
  * @public
  * @api
  */
// ! TO-DO CUANDO SE USE ELIMINAR COMENTARIO ESLINT
// eslint-disable-next-line no-unused-vars
const getTransformedCoordinates = (codeProjection, oldCoordinates) => {
  const transformFunction = (coords) => proj4(codeProjection, 'EPSG:4326', coords);
  return getFullCoordinates(
    oldCoordinates,
    transformFunction(getXY(oldCoordinates)),
  );
};

/**
  * Crea un objeto geográfico de una capa GeoJSON a partir de un objeto geográfico anterior y
  * un nuevo conjunto de coordenadas.
  *
  * @function
  * @param {Cesium.Entity} previousFeature Objeto geográfico anterior.
  * @param {Array<Number>} coordinates Nuevo conjunto de coordenadas.
  * @return {Cesium.Entity} Nuevo objeto geográfico.
  * @public
  * @api
  */
// ! TO-DO CUANDO SE USE ELIMINAR COMENTARIO ESLINT
// eslint-disable-next-line no-unused-vars
const createGeoJSONFeature = (previousFeature, coordinates) => {
  return {
    ...previousFeature,
    geometry: {
      type: previousFeature.geometry.type,
      coordinates,
    },
  };
};

/**
  * Este método transforma coordenadas de objetos geográficos como GeoJSON a EPSG:4326.
  *
  * @function
  * @param {Object} featuresAsJSON Objetos geográficos definidos
  * mediante la especificación GeoJSON.
  * @param {String} codeProjection Código de proyección actual.
  * @return {Cesium.Entity} Objetos geográficos.
  * @public
  * @api
  */
export const geojsonTo4326 = (featuresAsJSON, codeProjection) => {
  const jsonResult = [];
  featuresAsJSON.forEach((featureAsJSON) => {
    const coordinates = featureAsJSON.geometry.coordinates;
    let newCoordinates = [];
    switch (featureAsJSON.geometry.type) {
      case 'Point':
        newCoordinates = getTransformedCoordinates(codeProjection, coordinates);
        break;
      case 'LineString':
        for (let i = 0; i < coordinates.length; i += 1) {
          const newDot = getTransformedCoordinates(
            codeProjection,
            coordinates[i],
          );
          newCoordinates.push(newDot);
        }
        break;
      case 'Polygon':
        for (let i = 0; i < coordinates.length; i += 1) {
          const newPoly = [];
          for (let j = 0; j < coordinates[i].length; j += 1) {
            const newDot = getTransformedCoordinates(codeProjection, coordinates[i][j]);
            newPoly.push(newDot);
          }
          newCoordinates.push(newPoly);
        }
        break;
      default:
    }
    const jsonFeature = createGeoJSONFeature(featureAsJSON, newCoordinates);
    jsonResult.push(jsonFeature);
  });
  return jsonResult;
};

/**
 * Este método obtiene la extensión de los objetos geográficos de Cesium.
 *
 * @function
 * @param {Cesium.Entity} feature Objeto geográfico de Cesium.
 * @return {Array<number>} Extensión.
 * @public
 * @api
 */
const getBoundingExtentFromFeature = (feature) => {
  let rectangle = Rectangle.fromDegrees(180, 90, -180, -90);
  let positions = null;

  if (feature.polygon) {
    positions = feature.polygon.hierarchy.getValue().positions;
  } else if (feature.polyline) {
    positions = feature.polyline.positions.getValue();
  } else if (feature.point || feature.billboard) {
    // eslint-disable-next-line no-underscore-dangle
    positions = [feature.position._value];
  }

  if (!isNullOrEmpty(positions)) {
    rectangle = Rectangle.fromCartesianArray(positions);
  }

  return [
    CesiumMath.toDegrees(rectangle.west),
    CesiumMath.toDegrees(rectangle.south),
    CesiumMath.toDegrees(rectangle.east),
    CesiumMath.toDegrees(rectangle.north),
  ];
};

/**
 * Este método modifica una extensión para incluir otra extensión.
 *
 * @param {Number} extent1 La extensión a modificar.
 * @param {Number} extent2 La extensión que se incluirá.
 * @return {Number} Devuelve la extensión modificada con la nueva
 * extensión.
 * @api
 */
const extend = (extent1, extent2) => {
  if (extent2[0] < extent1[0]) {
    // eslint-disable-next-line no-param-reassign
    extent1[0] = extent2[0];
  }
  if (extent2[2] > extent1[2]) {
    // eslint-disable-next-line no-param-reassign
    extent1[2] = extent2[2];
  }
  if (extent2[1] < extent1[1]) {
    // eslint-disable-next-line no-param-reassign
    extent1[1] = extent2[1];
  }
  if (extent2[3] > extent1[3]) {
    // eslint-disable-next-line no-param-reassign
    extent1[3] = extent2[3];
  }
  return extent1;
};

/**
  * @classdesc
  * Implementación de la clase estática Utils.
  *
  * @api
  */
class Utils {
  /**
    * Este método calcula las resoluciones.
    * No disponible para Cesium.
    *
    * @function
    * @public
    * @api
    */
  static generateResolutions() {}

  /**
    * Este método añade una imagen al 'popup'.
    *
    * @function
    * @param {Object} overlayImage 'Popup'.
    * @param {Map} map Mapa
    * @param {KmlDataSource} cesiumLayer Capa Cesium.
    * @return {Object} Elemento HTML de imagen.
    * @public
    * @api
    */
  static addOverlayImage(overlayImage, map, cesiumLayer) {
    // eslint-disable-next-line no-underscore-dangle
    const mapSize = [map.getMapImpl()._lastWidth, map.getMapImpl()._lastHeight];
    const screenXY = overlayImage.screenXY;
    const screenXUnits = overlayImage.screenXUnits;
    const screenYUnits = overlayImage.screenYUnits;
    const overlayXY = overlayImage.overlayXY;
    const overlayXUnits = overlayImage.overlayXUnits;
    const overlayYUnits = overlayImage.overlayYUnits;
    const size = overlayImage.size;
    const src = overlayImage.src;
    // src
    const img = document.createElement('img');
    img.src = src;
    // size
    img.style.width = `${size[0]}px`;
    img.style.height = `${size[1]}px`;
    // position
    let offsetX = overlayXY[0];
    if (overlayXUnits === 'fraction') {
      offsetX *= size[0];
    }
    let offsetY = overlayXY[1];
    if (overlayYUnits === 'fraction') {
      offsetY = (size[1] - (offsetY * size[1]));
    }
    img.style.position = 'absolute';
    let left = screenXY[0];
    if (screenXUnits === 'fraction') {
      left = (left * mapSize[0]) - offsetX;
    }
    let top = screenXY[1];
    if (screenYUnits === 'fraction') {
      top = (mapSize[1] - (top * mapSize[1])) - offsetY;
    }
    img.style.top = `${top}px`;
    img.style.left = `${left}px`;
    // parent
    // eslint-disable-next-line no-underscore-dangle
    const container = cesiumLayer._screenOverlays;
    container.push(img);
    return img;
  }

  static addFacadeName(facadeName, cesiumLayer) {
    const layer = cesiumLayer;
    if (isNullOrEmpty(facadeName) && !isNullOrEmpty(layer.imageryProvider)
      && !isNullOrEmpty(layer.imageryProvider.layers)) {
      return layer.imageryProvider.layers;
    }
    if (isNullOrEmpty(facadeName) && !isNullOrEmpty(layer.imageryProvider)
      // eslint-disable-next-line no-underscore-dangle
      && !isNullOrEmpty(layer.imageryProvider._layer)) {
      // eslint-disable-next-line no-underscore-dangle
      return layer.imageryProvider._layer;
    }
    if (isNullOrEmpty(facadeName) && !isNullOrEmpty(layer.imageryProvider)
      && !isNullOrEmpty(layer.imageryProvider.url) && typeof layer.imageryProvider.url !== 'function') {
      const url = layer.imageryProvider.url;
      let result = null;
      const typeName = url.split('&typeName=')[1];
      if (!isNullOrEmpty(typeName)) {
        result = typeName.split('&')[0].split(':');
      }
      if (!isNullOrEmpty(result)) {
        return result[1];
        // facadeLayer.namespace = result[0];
      }
      return generateRandom('layer_');
    }
    if (isNullOrEmpty(facadeName)) {
      return generateRandom('layer_');
    }
    return facadeName;
  }

  static addFacadeLegend(cesiumLayer) {
    const layer = cesiumLayer;
    if (layer.legend) {
      return layer.legend;
    }
    return null;
  }

  /**
    * Este método obtiene la altura de una extensión.
    *
    * @function
    * @param {Array<Number>} extent Extensión.
    * @return {number} Altura.
    * @public
    * @api
    */
  static getExtentHeight(extent) {
    return extent[3] - extent[1];
  }

  /**
    * Este método obtiene el ancho de una extensión.
    *
    * @function
    * @param {Array<Number>} extent Extensión.
    * @return {number} Ancho.
    * @public
    * @api
    */
  static getExtentWidth(extent) {
    return extent[2] - extent[0];
  }

  /**
    * Calcula el centro de la geometría.
    *
    * @function
    * @param {Object} geometry Geometría.
    * @return {Array<number>} Coordenadas del centro.
    * @public
    * @api
    */
  static getCentroid(geometry) {
    let centroid;
    let medianIdx;
    if (isNullOrEmpty(geometry)) {
      centroid = null;
    } else {
      switch (true) {
        case geometry instanceof PolylineGraphics:
          const coordinates = geometry.positions.getValue();
          medianIdx = Math.floor(coordinates.length / 2);
          centroid = coordinates[medianIdx];
          break;
        case geometry instanceof PolygonGraphics:
          const positions = geometry.hierarchy.getValue().positions;
          let Cx = 0;
          let Cy = 0;
          let Cz = 0;
          let totalArea = 0;

          for (let i = 1; i < positions.length - 1; i += 1) {
            const a = positions[0];
            const b = positions[i];
            const c = positions[i + 1];

            const v1 = Cartesian3.subtract(b, a, new Cartesian3());
            const v2 = Cartesian3.subtract(c, a, new Cartesian3());
            const cross = Cartesian3.cross(v1, v2, new Cartesian3());
            const Ai = Cartesian3.magnitude(cross);
            const x = (a.x + b.x + c.x) / 3;
            const y = (a.y + b.y + c.y) / 3;
            const z = (a.z + b.z + c.z) / 3;
            const Ri = new Cartesian3(x, y, z);

            Cx += Ai * Ri.x;
            Cy += Ai * Ri.y;
            Cz += Ai * Ri.z;
            totalArea += Ai;
          }
          centroid = new Cartesian3(Cx / totalArea, Cy / totalArea, Cz / totalArea);
          break;
        default:
          return null;
      }
    }
    return centroid;
  }

  /**
    * Este método obtiene las extensiones de los objetos geográficos especificados
    *
    * @function
    * @param {Array<Cesium.Entity>} features Objetos geográficos.
    * @param {String} projectionCode Código de proyección
    * @returns {Array<number>} Extensiones de los objetos geográficos.
    * @public
    * @api
    */
  static getFeaturesExtent(features, projectionCode) {
    const cesiumFeatures = features.map((f) => (f instanceof Feature
      ? f.getImpl().getFeature() : f));
    let extents = [];
    cesiumFeatures.forEach((feature) => {
      const geometry = this.getGeometryEntity(feature);
      if (!isNullOrEmpty(geometry)) {
        extents.push(getBoundingExtentFromFeature(feature));
      }
    });
    if (extents.length === 1) {
      const geometry = this.getGeometryEntity(cesiumFeatures[0]);
      if (geometry instanceof PointGraphics) {
        const units = getUnitsPerMeter(projectionCode, 1000);
        // eslint-disable-next-line no-underscore-dangle
        const coords = Cartographic.fromCartesian(cesiumFeatures[0].position._value);
        const coordX = CesiumMath.toDegrees(coords.longitude);
        const coordY = CesiumMath.toDegrees(coords.latitude);
        extents = [
          [
            coordX - units,
            coordY - units,
            coordX + units,
            coordY + units,
          ],
        ];
      }
    }
    return extents.length === 0 ? null : extents.reduce((ext1, ext2) => extend(ext1, ext2));
  }

  /**
    * Este método obtiene las coordenadas del centroide.
    *
    * @function
    * @param {*} geometry Geometría.
    * @return {Array<Number>} Centroide.
    * @public
    * @api
    */
  static getCentroidCoordinate(geometry) {}

  /**
    * Este método transforma la extensión. Si la extensión es
    * la misma que la extensión de la proyección de origen, se
    * devolverá la extensión de la proyección de destino.
    *
    * @function
    * @param {Array<*>} extent Extensión a transformar.
    * @param {String} srcProj Proyección de origen.
    * @param {String} tgtProj Proyección de destino.
    * @return {Array<*>} Extensión transformada.
    * @public
    * @api
    */
  static transformExtent(extent, srcProj, tgtProj) {
    let transformedExtent;
    const cesiumSrcProj = isString(srcProj) ? srcProj : srcProj?.code;
    const cesiumTgtProj = isString(tgtProj) ? tgtProj : tgtProj?.code;

    if (cesiumSrcProj && cesiumTgtProj) {
      try {
        const lowerLeft = proj4(cesiumSrcProj, cesiumTgtProj, [extent[0], extent[1]]);
        const upperRight = proj4(cesiumSrcProj, cesiumTgtProj, [extent[2], extent[3]]);

        transformedExtent = [lowerLeft[0], lowerLeft[1], upperRight[0], upperRight[1]];
      // eslint-disable-next-line no-empty
      } catch {}
    }
    return transformedExtent;
  }

  /**
    * Este método transforma un 'RenderFeature' en un objetos geográficos estándar.
    * No disponible para Cesium.
    *
    * @function
    * @public
    * @api
    */
  static olRenderFeature2olFeature() {}

  /**
    * Este método copia un 'RenderFeature'.
    *
    * @function
    * @param {RenderFeature} olRenderFeature 'RenderFeature' a copiar.
    * @return { RenderFeature } Copia del 'RenderFeature' dado como parámetro.
    * @public
    * @api
    */
  static cloneOLRenderFeature(olRenderFeature) {}

  /**
    * Este método crea una geometría OL a partir de un 'RenderFeature'.
    * No disponible para Cesium.
    *
    * @function
    * @public
    * @api
    */
  static getGeometryFromRenderFeature() {}

  /**
    * Este método obtiene la escala de las capas WMTS.
    *
    * @function
    * @param {Map} map Mapa.
    * @param {Boolean} exact Indica si el resultado debe ser exacto.
    * @return {Number} Escala.
    * @public
    * @api
    */
  static getWMTSScale(map, exact) {}

  /**
   * Método que convierte una extensión de Cesium a una extensión
   * de la API.
   *
   * @param {Rectangle} extent Extensión de Cesium
   * @returns {Array<number>} Extensión
   */
  static convertRectangleToExtent(rectangle) {
    let extent;

    if (!isNullOrEmpty(rectangle) && !isUndefined(rectangle)) {
      extent = [
        CesiumMath.toDegrees(rectangle.west),
        CesiumMath.toDegrees(rectangle.south),
        CesiumMath.toDegrees(rectangle.east),
        CesiumMath.toDegrees(rectangle.north),
      ];
    }

    return extent;
  }

  /**
   * Método que convierte una extensión de la API a una extensión
   * de Cesium.
   *
   * @param {Array<number>} extent Extensión
   * @returns {Rectangle} Extensión de Cesium
   */
  static convertExtentToRectangle(extent) {
    let rectangle;
    if (!isNullOrEmpty(extent) && !isUndefined(extent)) {
      rectangle = Rectangle.fromDegrees(extent[0], extent[1], extent[2], extent[3]);
    } else {
      rectangle = Rectangle.MAX_VALUE;
    }

    return rectangle;
  }

  /**
   * Este método convierte coordenadas a píxeles.
   *
   * @function
   * @param {IDEE.impl.Map} map - Mapa
   * @param {Array<Number>} coord - Coordenadas
   * @public
   * @api
   */
  static getPixelFromCoordinate(map, coord) {
    let pixel = null;
    let coordinates = coord;
    if (!isArray(coord)) {
      coordinates = [coord.x, coord.y];
    }
    if (!isNullOrEmpty(coordinates)) {
      const cartesian = Cartesian3.fromDegrees(coordinates[0], coordinates[1]);
      const screenPosition = SceneTransforms.wgs84ToWindowCoordinates(map.scene, cartesian);
      // const canvasCoordinates = map.scene.cartesianToCanvasCoordinates(cartesian);
      pixel = [screenPosition.x, screenPosition.y];
    }
    return pixel;
  }

  /**
   * Este método convierte píxeles a coordenadas.
   *
   * @function
   * @param {IDEE.impl.Map} map - Mapa
   * @param {Array<Number>} pixel - Pixe
   * @public
   * @api
   */
  static getCoordinateFromPixel(map, pixel) {
    let p = pixel;
    let coordinates;
    if (!isArray(p)) {
      p = [pixel.x, pixel.y];
    }
    if (!isNullOrEmpty(p)) {
      const pixelPosition = new Cartesian2(p[0], p[1]);
      const cartesian = map.camera.pickEllipsoid(pixelPosition, map.scene.globe.ellipsoid);
      if (cartesian) {
        const cartographic = Cartographic.fromCartesian(cartesian, map.scene.globe.ellipsoid);
        coordinates = [
          CesiumMath.toDegrees(cartographic.longitude),
          CesiumMath.toDegrees(cartographic.latitude),
        ];
      }
    }
    return coordinates;
  }

  /**
   * Genera opciones de origen a partir de un objeto de "capabilities".
   *
   * @param {Object} wmtsCap Un objeto que representa el documento de "capabilities".
   * @param {Object} config Propiedades de configuración para la capa. Valores predeterminados para
   * la capa se aplicará si no se proporciona.
   *
   * @return {Options} Objeto de opciones de fuente WMTS o "null" si no se encontró la capa.
   * @api
   */
  static optionsFromCapabilities(wmtsCap, config) {
    const layers = wmtsCap.Contents.Layer;
    const l = layers.find((elt) => {
      return elt.Identifier === config.layer;
    });
    if (l === null) {
      return null;
    }
    const tileMatrixSets = wmtsCap.Contents.TileMatrixSet;
    let idx;
    if (l.TileMatrixSetLink.length > 1) {
      if ('projection' in config) {
        idx = l.TileMatrixSetLink.findIndex((elt, index, array) => {
          const tileMatrixSet = tileMatrixSets.find((el) => {
            return el.Identifier === elt.TileMatrixSet;
          });
          const supportedCRS = tileMatrixSet.SupportedCRS;
          const proj1 = proj4(supportedCRS.replace(/urn:ogc:def:crs:(\w+):(.*:)?(\w+)$/, '$1:$3'))
            || proj4(supportedCRS);
          const proj2 = proj4(config.projection);
          if (proj1 && proj2) {
            return JSON.stringify(proj1) === JSON.stringify(proj2);
          }
          return supportedCRS === config.projection;
        });
      } else {
        idx = l.TileMatrixSetLink.findIndex((elt, index, array) => {
          return elt.TileMatrixSet === config.matrixSet;
        });
      }
    } else {
      idx = 0;
    }
    if (idx < 0) {
      idx = 0;
    }
    const matrixSet = l.TileMatrixSetLink[idx].TileMatrixSet;
    const matrixLimits = l.TileMatrixSetLink[idx].TileMatrixSetLimits;
    const matrixLimitsLabels = matrixLimits.map((m) => m.TileMatrix);

    let format = l.Format[0];
    if ('format' in config) {
      format = config.format;
    }
    idx = l.Style.findIndex((elt) => {
      if ('style' in config) {
        return elt.Title === config.style;
      }
      return elt.isDefault;
    });
    if (idx < 0) {
      idx = 0;
    }
    const style = l.Style[idx].Identifier;

    const dimensions = {};
    if ('Dimension' in l) {
      l.Dimension.forEach((elt, index, array) => {
        const key = elt.Identifier;
        let value = elt.Default;
        if (value === undefined) {
          value = elt.Value[0];
        }
        dimensions[key] = value;
      });
    }

    const matrixSets = wmtsCap.Contents.TileMatrixSet;
    const matrixSetObj = matrixSets.find((elt) => {
      return elt.Identifier === matrixSet;
    });

    let projection;
    let projectionCode;
    const code = matrixSetObj.SupportedCRS;
    if (code) {
      projection = proj4(code.replace(/urn:ogc:def:crs:(\w+):(.*:)?(\w+)$/, '$1:$3'))
        || proj4(code);
      projectionCode = code;
    }
    if ('projection' in config) {
      const projConfig = proj4(config.projection);
      projectionCode = config.projection;
      if (projConfig) {
        if (!projection || JSON.stringify(projConfig) === JSON.stringify(projection)) {
          projection = projConfig;
        }
      }
    }

    const wgs84BoundingBox = l.WGS84BoundingBox;
    let extent;
    let wrapX;
    // PATCH init ------------------
    if (config.extent) {
      extent = config.extent;
    } else if (wgs84BoundingBox !== undefined) { // PATCH end ------------------
      const wgs84ProjectionExtent = [-180, -90, 180, 90];
      wrapX = (wgs84BoundingBox[0] === wgs84ProjectionExtent[0]
        && wgs84BoundingBox[2] === wgs84ProjectionExtent[2]);
      extent = this.transformExtent(wgs84BoundingBox, 'EPSG:4326', projectionCode);
      const projectionExtent = wgs84ProjectionExtent
        .map((coord) => proj4('EPSG:4326', projectionCode, coord));
      if (projectionExtent) {
        // If possible, do a sanity check on the extent - it should never be
        // bigger than the validity extent of the projection of a matrix set.
        const [minXA, minYA, maxXA, maxYA] = projectionExtent;
        const [minXB, minYB, maxXB, maxYB] = extent;

        if (!((minXA >= minXB) && (minYA >= minYB) && (maxXA <= maxXB) && (maxYA <= maxYB))) {
          extent = undefined;
        }
      }
    }

    const urls = [];
    let requestEncoding = config.requestEncoding;
    requestEncoding = requestEncoding !== undefined ? requestEncoding : '';

    if ('OperationsMetadata' in wmtsCap && 'GetTile' in wmtsCap.OperationsMetadata) {
      const gets = wmtsCap.OperationsMetadata.GetTile.DCP.HTTP.Get;

      for (let i = 0, ii = gets.length; i < ii; i += 1) {
        if (gets[i].Constraint) {
          const constraint = gets[i].Constraint.find((element) => {
            return element.name === 'GetEncoding';
          });
          const encodings = constraint.AllowedValues.Value;

          if (requestEncoding === '') {
            // requestEncoding not provided, use the first encoding from the list
            requestEncoding = encodings[0];
          }
          if (requestEncoding === 'KVP') {
            if (encodings.includes('KVP')) {
              urls.push(gets[i].href);
            }
          } else {
            break;
          }
        } else if (gets[i].href) {
          requestEncoding = 'KVP';
          urls.push(gets[i].href);
        }
      }
    }
    if (urls.length === 0) {
      requestEncoding = 'REST';
      l.ResourceURL.forEach((element) => {
        if (element.resourceType === 'tile') {
          format = element.format;
          urls.push(element.template);
        }
      });
    }

    return {
      urls,
      layer: config.layer,
      tileMatrixSetID: matrixSet,
      tileMatrixLabels: matrixLimitsLabels,
      format,
      projection,
      requestEncoding,
      // tileGrid: tileGrid,
      style,
      dimensions,
      wrapX,
      crossOrigin: config.crossOrigin,
    };
  }

  /**
    * Este método obtiene la geometría de un objeto
    * geográfico de Cesium.
    *
    * @param {Entity} cesiumFeature Objeto geográfico de Cesium.
    * @returns {Object} Geometría del objeto geográfico
    * de Cesium.
    * @api
    */
  static getGeometryEntity(cesiumFeature) {
    let geometry = null;
    if (!isNullOrEmpty(cesiumFeature.polygon)) {
      geometry = cesiumFeature.polygon;
    } else if (!isNullOrEmpty(cesiumFeature.polyline)) {
      geometry = cesiumFeature.polyline;
    } else if (!isNullOrEmpty(cesiumFeature.point)) {
      geometry = cesiumFeature.point;
      // eslint-disable-next-line no-underscore-dangle
      geometry.coordinates = cesiumFeature.position._value;
    } else if (!isNullOrEmpty(cesiumFeature.billboard)) {
      geometry = cesiumFeature.billboard;
      // eslint-disable-next-line no-underscore-dangle
      geometry.coordinates = cesiumFeature.position._value;
    }
    return geometry;
  }

  /**
   * Este método obtiene la extensión de los objetos geográficos de Cesium.
   *
   * @param {Cesium.Entity} feature Objeto geográfico de Cesium.
   */
  static getBoundingExtentFromFeature(feature) {
    const rectangle = Rectangle.fromDegrees(180, 90, -180, -90);
    let positions = null;

    if (feature.polygon) {
      positions = feature.polygon.hierarchy.getValue().positions;
    } else if (feature.polyline) {
      positions = feature.polyline.positions.getValue();
    } else if (feature.point) {
      positions = [feature.position.getValue()];
    }

    if (!isNullOrEmpty(positions)) {
      for (let j = 0; j < positions.length; j += 1) {
        const cartographic = Ellipsoid.WGS84.cartesianToCartographic(positions[j]);
        Rectangle.expand(rectangle, Rectangle.fromCartographic(cartographic), rectangle);
      }
    }

    return [
      CesiumMath.toDegrees(rectangle.west),
      CesiumMath.toDegrees(rectangle.south),
      CesiumMath.toDegrees(rectangle.east),
      CesiumMath.toDegrees(rectangle.north),
    ];
  }

  /**
   * Este método obtiene el tipo de geometría de un objeto geográfico
   * de Cesium.
   *
   * @param {Cesium.Entity} feature Objeto geográfico de Cesium.
   * @returns {String} Devuelve el tipo de geometría.
   * @api
   */
  static getGeometryType(feature) {
    let type;

    if (!isNullOrEmpty(feature.polygon)) {
      type = 'Polygon';
    } else if (!isNullOrEmpty(feature.point) || !isNullOrEmpty(feature.billboard)) {
      type = 'Point';
    } else if (!isNullOrEmpty(feature.polyline)) {
      type = 'LineString';
    }
    return type;
  }

  /**
   * Este método transforma las coordenadas de una geometría Polygon.
   *
   * @param {Array<Array<Array<Number>>>} coordinates Coordenadas
   * de la geometría.
   * @param {String} srcProj Código de la proyección origen.
   * @param {String} dstProj Código de la proyección destino.
   * @returns {Array<Array<Array<Number>>>} Devuelve las coordenadas
   * transformadas.
   */
  static transformCoordinatesPolygon(coordinates, srcProj, dstProj) {
    return coordinates.map(
      (coord) => coord.map((c) => proj4(srcProj, dstProj, c)),
    );
  }

  /**
   * Este método transforma las coordenadas de una geometría LineString.
   *
   * @param {Array<Array<Number>>} coordinates Coordenadas
   * de la geometría.
   * @param {String} srcProj Código de la proyección origen.
   * @param {String} dstProj Código de la proyección destino.
   * @returns {Array<Array<Array<Number>>>} Devuelve las coordenadas
   * transformadas.
   */
  static transformCoordinatesLineString(coordinates, srcProj, dstProj) {
    return coordinates.map((coord) => proj4(srcProj, dstProj, coordinates));
  }

  /**
   * Este método obtiene el punto central de una geometría.
   *
   * @param {Object} geometry Geometría de Cesium.
   * @returns Coordenada central de la geometría.
   */
  static getCenter(geometry) {
    let center;
    if (geometry instanceof PolylineGraphics) {
      let totalLength = 0;
      const segmentLengths = [];

      // Calcular longitudes de cada segmento
      for (let i = 0; i < geometry.positions.getValue().length - 1; i += 1) {
        const distance = Cartesian3.distance(
          geometry.positions.getValue()[i],
          geometry.positions.getValue()[i + 1],
        );
        segmentLengths.push(distance);
        totalLength += distance;
      }

      const halfLength = totalLength / 2;
      let accumulatedLength = 0;

      // Encontrar el segmento donde se encuentra el punto medio
      for (let i = 0; i < segmentLengths.length; i += 1) {
        accumulatedLength += segmentLengths[i];
        if (accumulatedLength >= halfLength) {
          const overshoot = accumulatedLength - halfLength;
          const ratio = (segmentLengths[i] - overshoot) / segmentLengths[i];

          // Interpolación lineal entre los puntos
          return Cartesian3.lerp(
            geometry.positions.getValue()[i],
            geometry.positions.getValue()[i + 1],
            ratio,
            new Cartesian3(),
          );
        }
      }
    } else if (geometry instanceof PolygonGraphics) {
      const positions = geometry.hierarchy.getValue().positions;
      let Cx = 0;
      let Cy = 0;
      let Cz = 0;
      let totalArea = 0;

      for (let i = 1; i < positions.length - 1; i += 1) {
        const a = positions[0];
        const b = positions[i];
        const c = positions[i + 1];

        const v1 = Cartesian3.subtract(b, a, new Cartesian3());
        const v2 = Cartesian3.subtract(c, a, new Cartesian3());
        const cross = Cartesian3.cross(v1, v2, new Cartesian3());
        const Ai = Cartesian3.magnitude(cross);
        const x = (a.x + b.x + c.x) / 3;
        const y = (a.y + b.y + c.y) / 3;
        const z = (a.z + b.z + c.z) / 3;
        const Ri = new Cartesian3(x, y, z);

        Cx += Ai * Ri.x;
        Cy += Ai * Ri.y;
        Cz += Ai * Ri.z;
        totalArea += Ai;
      }
      return new Cartesian3(Cx / totalArea, Cy / totalArea, Cz / totalArea);
    }
    return center;
  }

  /**
   * Este método obtiene el las coordenadas de un objeto geográfico.
   *
   * @param {Cesium.Entity} feature Objeto geográfico de Cesium.
   * @param {Boolean} is2D Indica si las coordenadas del objeto
   * geográfico están en 2D.
   * @returns Coordenadas del objeto geográfico.
   */
  static getCoordinateEntity(feature, is2D = false) {
    let coord;
    if (!isUndefined(feature.polygon)) {
      const positions = feature.polygon.hierarchy.getValue().positions;
      const coordinates = [];
      positions.forEach((pos) => {
        const cartographic = Cartographic.fromCartesian(pos);
        if (is2D) {
          coordinates.push([
            CesiumMath.toDegrees(cartographic.longitude),
            CesiumMath.toDegrees(cartographic.latitude),
          ]);
        } else {
          coordinates.push([
            CesiumMath.toDegrees(cartographic.longitude),
            CesiumMath.toDegrees(cartographic.latitude),
            cartographic.height,
          ]);
        }
      });
      coord = [coordinates];
    } else if (!isUndefined(feature.point) || !isUndefined(feature.billboard)) {
      // eslint-disable-next-line no-underscore-dangle
      const cartographic = Cartographic.fromCartesian(feature.position._value);
      if (is2D) {
        coord = [
          CesiumMath.toDegrees(cartographic.longitude),
          CesiumMath.toDegrees(cartographic.latitude),
        ];
      } else {
        coord = [
          CesiumMath.toDegrees(cartographic.longitude),
          CesiumMath.toDegrees(cartographic.latitude),
          cartographic.height,
        ];
      }
    } else if (!isUndefined(feature.polyline)) {
      const positions = feature.polyline.positions.getValue();
      const coordinates = [];
      positions.forEach((pos) => {
        const cartographic = Cartographic.fromCartesian(pos);
        if (is2D) {
          coordinates.push([
            CesiumMath.toDegrees(cartographic.longitude),
            CesiumMath.toDegrees(cartographic.latitude),
          ]);
        } else {
          coordinates.push([
            CesiumMath.toDegrees(cartographic.longitude),
            CesiumMath.toDegrees(cartographic.latitude),
            cartographic.height,
          ]);
        }
      });
      coord = coordinates;
    }
    return coord;
  }

  /**
   * Este método obtiene la primera coordenada de una geometría.
   *
   * @param {Array<Number>} coordinates Coordenadas.
   * @returns Primeras coordenadas.
   */
  static getFirstCoordinates(coordinates) {
    const coord = null;
    if (!isNullOrEmpty(coordinates)) {
      if (typeof coordinates[0] === 'number') {
        return coordinates;
      }
      if (isArray(coordinates)) {
        for (let i = 0; i < coordinates.length; i += 1) {
          const found = this.getFirstCoordinates(coordinates[i]);
          if (found) {
            return found;
          }
        }
      }
    }
    return coord;
  }
}

export default Utils;
