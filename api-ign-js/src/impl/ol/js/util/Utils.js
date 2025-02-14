/**
 * @module M/impl/utils
 */
import Feature from 'M/feature/Feature';
import * as WKT from 'M/geom/WKT';
import { isNullOrEmpty, isString, generateRandom } from 'M/util/Utils';
import { extend, getWidth } from 'ol/extent';
import { get as getProj, getTransform, transformExtent } from 'ol/proj';
import OLFeature from 'ol/Feature';
import RenderFeature from 'ol/render/Feature';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import LinearRing from 'ol/geom/LinearRing';
import Polygon from 'ol/geom/Polygon';
import MultiPoint from 'ol/geom/MultiPoint';
import MultiLineString from 'ol/geom/MultiLineString';
import MultiPolygon from 'ol/geom/MultiPolygon';
import GeometryCollection from 'ol/geom/GeometryCollection';
import Circle from 'ol/geom/Circle';

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
const getUnitsPerMeter = (projectionCode, meter) => {
  const projection = getProj(projectionCode);
  const metersPerUnit = projection.getMetersPerUnit();
  return meter / metersPerUnit;
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
const getXY = (coordinatesSet) => {
  const copyCoord = [];
  const size = coordinatesSet.length > 2 ? 2 : coordinatesSet.length;
  for (let i = 0; i < size; i += 1) copyCoord.push(coordinatesSet[i]);
  return copyCoord;
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
const getTransformedCoordinates = (codeProjection, oldCoordinates) => {
  const transformFunction = getTransform(codeProjection, 'EPSG:4326');
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
  * @param {ol.Feature} previousFeature Objeto geográfico anterior.
  * @param {Array<Number>} coordinates Nuevo conjunto de coordenadas.
  * @return {ol.Feature} Nuevo objeto geográfico.
  * @public
  * @api
  */
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
  * Este método transforma coordenadas a EPSG:4326.
  *
  * @function
  * @param {String} type Tipo de geometría.
  * @param {Object} codeProjection Código de proyección actual.
  * @param {Number|Array} coordinates Coordenadas a transformar.
  * @return {Array} Coordenadas transformadas.
  * @public
  * @api
  */
const geometryTypeCoordTransform = (type, codeProjection, coordinates) => {
  const newCoordinates = [];
  switch (type) {
    case 'Point':
      return getTransformedCoordinates(codeProjection, coordinates);
    case 'MultiPoint':
    case 'LineString':
      for (let i = 0; i < coordinates.length; i += 1) {
        const newDot = getTransformedCoordinates(codeProjection, coordinates[i]);
        newCoordinates.push(newDot);
      }
      return newCoordinates;
    case 'MultiLineString':
    case 'Polygon':
      for (let i = 0; i < coordinates.length; i += 1) {
        const group = [];
        for (let j = 0; j < coordinates[i].length; j += 1) {
          const dot = getTransformedCoordinates(codeProjection, coordinates[i][j]);
          group.push(dot);
        }
        newCoordinates.push(group);
      }
      return newCoordinates;
    case 'MultiPolygon':
      for (let i = 0; i < coordinates.length; i += 1) {
        const newPolygon = [];
        for (let j = 0; j < coordinates[i].length; j += 1) {
          const newPolygonLine = [];
          const aux = coordinates[i][j];
          for (let k = 0; k < aux.length; k += 1) {
            const dot = getTransformedCoordinates(codeProjection, aux[k]);
            newPolygonLine.push(dot);
          }
          newPolygon.push(newPolygonLine);
        }
        newCoordinates.push(newPolygon);
      }
      return newCoordinates;
    default:
      return newCoordinates;
  }
};

/**
  * Este método transforma coordenadas de objetos geográficos como GeoJSON a EPSG:4326.
  *
  * @function
  * @param {Object} featuresAsJSON Objetos geográficos definidos
  * mediante la especificación GeoJSON.
  * @param {String} codeProjection Código de proyección actual.
  * @return {ol.Feature} Objetos geográficos.
  * @public
  * @api
  */
export const geojsonTo4326 = (featuresAsJSON, codeProjection) => {
  const jsonResult = [];
  featuresAsJSON.forEach((featureAsJSON) => {
    let jsonFeature;
    if (featureAsJSON.geometry.type !== 'GeometryCollection') {
      const newCoordinates = geometryTypeCoordTransform(
        featureAsJSON.geometry.type,
        codeProjection,
        featureAsJSON.geometry.coordinates,
      );
      jsonFeature = createGeoJSONFeature(featureAsJSON, newCoordinates);
    } else {
      const collection = featureAsJSON.geometry.geometries.map((g) => {
        return {
          type: g.type,
          coordinates: geometryTypeCoordTransform(g.type, codeProjection, g.coordinates),
        };
      });
      jsonFeature = { ...featureAsJSON, geometry: { type: 'GeometryCollection', geometries: collection } };
    }
    jsonResult.push(jsonFeature);
  });
  return jsonResult;
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
    *
    * @function
    * @param {ol.Projection} projection Proyección.
    * @param {ol.Extent} extent Extensión.
    * @param {Number} minZoom Nivel mínimo de zoom.
    * @param {Number} maxZoom Nivel máximo de zoom.
    * @return {Array<Number>} Resoluciones.
    * @public
    * @api
    */
  static generateResolutions(projection, extent, minZoom, maxZoom) {
    let newExtent;
    let newMinZoom;
    let newMaxZoom;
    const generatedResolutions = [];
    // extent
    if (isNullOrEmpty(extent)) {
      newExtent = projection.getExtent();
    }
    // size
    const size = getWidth(newExtent) / 256;
    if (isNullOrEmpty(minZoom)) {
      // ol.DEFAULT_MIN_ZOOM;
      newMinZoom = 0;
    }
    if (isNullOrEmpty(maxZoom)) {
      const defaultMaxZoom = 20;
      newMaxZoom = defaultMaxZoom;
    }
    const zoomLevels = newMaxZoom - newMinZoom;
    for (let i = 0; i < zoomLevels; i += 1) {
      generatedResolutions[i] = size / (2 ** i);
    }
    return generatedResolutions;
  }

  /**
    * Este método añade una imagen al 'popup'.
    *
    * @function
    * @param {Object} overlayImage 'Popup'.
    * @param {Map} map Mapa
    * @return {Object} Elemento HTML de imagen.
    * @public
    * @api
    */
  static addOverlayImage(overlayImage, map) {
    map.getMapImpl().updateSize();
    const mapSize = map.getMapImpl().getSize();
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
    const container = map.getMapImpl().getOverlayContainerStopEvent();
    container.appendChild(img);
    return img;
  }

  static addFacadeName(facadeName, olLayer) {
    const ol3layer = olLayer;
    if (isNullOrEmpty(facadeName) && !isNullOrEmpty(ol3layer.getSource())
      && !isNullOrEmpty(ol3layer.getSource().getParams)
      && !isNullOrEmpty(ol3layer.getSource().getParams().LAYERS)) {
      return ol3layer.getSource().getParams().LAYERS;
    }
    if (isNullOrEmpty(facadeName) && !isNullOrEmpty(ol3layer.getSource())
      && !isNullOrEmpty(ol3layer.getSource().getUrl)
      && !isNullOrEmpty(ol3layer.getSource().getUrl()) && typeof ol3layer.getSource().getUrl() !== 'function') {
      const url = ol3layer.getSource().getUrl();
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
    if (ol3layer.getSource().getLayer) {
      return ol3layer.getSource().getLayer();
    }
    if (isNullOrEmpty(facadeName)) {
      return generateRandom('layer_');
    }
    return facadeName;
  }

  static addFacadeLegend(olLayer) {
    const ol3layer = olLayer;
    if (ol3layer.getProperties() && ol3layer.getProperties().legend) {
      return ol3layer.getProperties().legend;
    }
    return null;
  }

  /**
    * Este método obtiene la altura de una extensión.
    *
    * @function
    * @param {ol.Extent} extent Extensión.
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
    * @param {ol.Extent} extent Extensión.
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
    * @param {ol.geom} geometry Geometría.
    * @return {Array<number>} Coordenadas del centro.
    * @public
    * @api
    */
  static getCentroid(geometry) {
    let centroid;
    let medianIdx;
    let points;
    if (isNullOrEmpty(geometry)) {
      centroid = null;
    } else if (geometry instanceof RenderFeature) {
      centroid = geometry;
    } else {
      switch (geometry.getType()) {
        case 'Point':
          centroid = geometry.getCoordinates();
          break;
        case 'LineString':
        case 'LinearRing':
          const coordinates = geometry.getCoordinates();
          medianIdx = Math.floor(coordinates.length / 2);
          centroid = coordinates[medianIdx];
          break;
        case 'Polygon':
          centroid = Utils.getCentroid(geometry.getInteriorPoint());
          break;
        case 'MultiPoint':
          points = geometry.getPoints();
          medianIdx = Math.floor(points.length / 2);
          centroid = Utils.getCentroid(points[medianIdx]);
          break;
        case 'MultiLineString':
          const lineStrings = geometry.getLineStrings();
          medianIdx = Math.floor(lineStrings.length / 2);
          centroid = Utils.getCentroid(lineStrings[medianIdx]);
          break;
        case 'MultiPolygon':
          points = geometry.getInteriorPoints();
          centroid = Utils.getCentroid(points);
          break;
        case 'Circle':
          centroid = geometry.getCenter();
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
    * @param {Array<ol.Feature>} features Objetos geográficos.
    * @param {String} projectionCode Código de proyección
    * @returns {Array<ol.Extent>} Extensiones de los objetos geográficos.
    * @public
    * @api
    */
  static getFeaturesExtent(features, projectionCode) {
    const olFeatures = features.map((f) => (f instanceof Feature ? f.getImpl().getOLFeature() : f));
    let extents = [];
    olFeatures.forEach((feature) => {
      if (feature.getGeometry()) {
        extents.push(feature.getGeometry().getExtent().slice(0));
      }
    });
    if (extents.length === 1) {
      const geometry = olFeatures[0].getGeometry();
      if (geometry.getType() === 'Point') {
        const units = getUnitsPerMeter(projectionCode, 1000);
        const auxCoord = geometry.getCoordinates();
        const coordX = auxCoord[0];
        const coordY = auxCoord[1];
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
    * @param {ol.geom} geometry Geometría.
    * @return {Array<Number>} Centroide.
    * @public
    * @api
    */
  static getCentroidCoordinate(geometry) {
    let centroid;
    let coordinates;
    let medianIdx;
    let points;
    // POINT
    if (geometry.getType() === WKT.POINT) {
      centroid = geometry.getCoordinates();
    } else if (geometry.getType() === WKT.LINE_STRING) {
      // LINE
      coordinates = geometry.getCoordinates();
      medianIdx = Math.floor(coordinates.length / 2);
      centroid = coordinates[medianIdx];
    } else if (geometry.getType() === WKT.LINEAR_RING) {
      coordinates = geometry.getCoordinates();
      medianIdx = Math.floor(coordinates.length / 2);
      centroid = coordinates[medianIdx];
    } else if (geometry.getType() === WKT.POLYGON) {
      // POLYGON
      centroid = Utils.getCentroidCoordinate(geometry.getInteriorPoint());
    } else if (geometry.getType() === WKT.MULTI_POINT) {
      // MULTI
      points = geometry.getPoints();
      medianIdx = Math.floor(points.length / 2);
      centroid = Utils.getCentroidCoordinate(points[medianIdx]);
    } else if (geometry.getType() === WKT.MULTI_LINE_STRING) {
      const lineStrings = geometry.getLineStrings();
      medianIdx = Math.floor(lineStrings.length / 2);
      centroid = Utils.getCentroidCoordinate(lineStrings[medianIdx]);
    } else if (geometry.getType() === WKT.MULTI_POLYGON) {
      points = geometry.getInteriorPoints();
      centroid = Utils.getCentroidCoordinate(points);
    } else if (geometry.getType() === WKT.CIRCLE) {
      centroid = geometry.getCenter();
    } else if (geometry.getType() === WKT.GEOMETRY_COLLECTION) {
      const geometries = geometry.getGeometries();
      medianIdx = Math.floor(geometries.length / 2);
      centroid = Utils.getCentroidCoordinate(geometries[medianIdx]);
    }
    return centroid;
  }

  /**
    * Este método transforma la extensión. Si la extensión es
    * la misma que la extensión de la proyección de origen, se
    * devolverá la extensión de la proyección de destino.
    *
    * @function
    * @param {ol.Extent} extent Extensión a transformar.
    * @param {String} srcProj Proyección de origen.
    * @param {String} tgtProj Proyección de destino.
    * @return {ol.Extent} Extensión transformada.
    * @public
    * @api
    */
  static transformExtent(extent, srcProj, tgtProj) {
    let transformedExtent;
    const olSrcProj = isString(srcProj) ? getProj(srcProj) : srcProj;
    const olTgtProj = isString(tgtProj) ? getProj(tgtProj) : tgtProj;
    // checks if the extent to transform is the same
    // than source projection extent
    const srcProjExtent = olSrcProj.getExtent();
    const sameSrcProjExtent = extent.every((coord, i) => {
      let isProjExtent = false;
      if (i < 2) {
        isProjExtent = (coord <= srcProjExtent[i]);
      } else {
        isProjExtent = (coord >= srcProjExtent[i]);
      }
      return isProjExtent;
    });
    if (sameSrcProjExtent) {
      transformedExtent = olTgtProj.getExtent();
    } else {
      transformedExtent = transformExtent(extent, olSrcProj, olTgtProj);
    }
    return transformedExtent;
  }

  /**
    * Este método transforma un 'RenderFeature' en un objetos geográficos estándar.
    *
    * @function
    * @param {RenderFeature} olRenderFeature 'RenderFeature' a transformar.
    * @param {ol.Projection} tileProjection Proyección de la tesela.
    * @param {ol.Projection} mapProjection Proyección del mapa.
    * @return {ol.Feature} Objetos geográficos.
    * @public
    * @api
    */
  static olRenderFeature2olFeature(olRenderFeature, tileProjection, mapProjection) {
    let olFeature;
    if (!isNullOrEmpty(olRenderFeature)) {
      const id = olRenderFeature.getId();
      const properties = olRenderFeature.getProperties();
      let geometry;
      if (isNullOrEmpty(tileProjection) && isNullOrEmpty(tileProjection)) {
        geometry = this.getGeometryFromRenderFeature(olRenderFeature.getGeometry());
      } else {
        const tileExtent = tileProjection.getExtent();
        const tileWorldExtent = tileProjection.getWorldExtent();
        if (!isNullOrEmpty(tileExtent) && !isNullOrEmpty(tileWorldExtent)) {
          const clonedOLRenderFeature = this.cloneOLRenderFeature(olRenderFeature);
          clonedOLRenderFeature.transform(tileProjection, mapProjection);
          geometry = this.getGeometryFromRenderFeature(clonedOLRenderFeature.getGeometry());
        }
      }
      olFeature = new OLFeature();
      if (!isNullOrEmpty(id)) {
        olFeature.setId(id);
      } else {
        olFeature.setId(generateRandom('mapea_feature_'));
      }
      olFeature.setProperties(properties, true);
      olFeature.setGeometry(geometry);
    }
    return olFeature;
  }

  /**
    * Este método copia un 'RenderFeature'.
    *
    * @function
    * @param {RenderFeature} olRenderFeature 'RenderFeature' a copiar.
    * @return { RenderFeature } Copia del 'RenderFeature' dado como parámetro.
    * @public
    * @api
    */
  static cloneOLRenderFeature(olRenderFeature) {
    const type = olRenderFeature.getType();
    const flatCoordinates = olRenderFeature.getFlatCoordinates();
    const ends = olRenderFeature.getEnds();
    const properties = olRenderFeature.getProperties();
    const id = olRenderFeature.getId();
    const clonedFlatCoordinates = [...flatCoordinates];
    const clonedProperties = Object.assign(properties);
    const clonedEnds = [...ends];
    const clonedOLRenderFeature = new RenderFeature(
      type,
      clonedFlatCoordinates,
      clonedEnds,
      clonedProperties,
      id,
    );
    return clonedOLRenderFeature;
  }

  /**
    * Este método crea una geometría OL a partir de un 'RenderFeature'.
    *
    * @function
    * @param {RenderFeature} olRenderFeature 'RenderFeature' que será utilizado.
    * para construir la geometría.
    * @return {ol.geom} Geometría del 'RenderFeature'.
    * @public
    * @api
    */
  static getGeometryFromRenderFeature(olRenderFeature) {
    let geometry;
    const coordinates = olRenderFeature.getFlatCoordinates();
    const type = olRenderFeature.getType();
    switch (type) {
      case 'Point':
        geometry = new Point(coordinates);
        break;
      case 'LineString':
        geometry = new LineString(coordinates);
        break;
      case 'LinearRing':
        geometry = new LinearRing(coordinates);
        break;
      case 'Polygon':
        geometry = new Polygon(coordinates);
        break;
      case 'MultiPoint':
        geometry = new MultiPoint(coordinates);
        break;
      case 'MultiLineString':
        const ends = olRenderFeature.getEnds();
        geometry = new MultiLineString(coordinates, undefined, ends);
        break;
      case 'MultiPolygon':
        const endss = olRenderFeature.getEndss();
        geometry = new MultiPolygon(coordinates, undefined, endss);
        break;
      case 'GeometryCollection':
        const geometries = olRenderFeature.getGeometries();
        geometry = new GeometryCollection(geometries);
        break;
      case 'Circle':
        const center = olRenderFeature.getFlatInteriorPoint();
        geometry = new Circle(center);
        break;
      default:
        geometry = null;
    }
    return geometry;
  }

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
  static getWMTSScale(map, exact) {
    const projection = map.getProjection().code;
    const olProj = getProj(projection);
    const mpu = olProj.getMetersPerUnit(); // meters per unit in depending on the CRS;
    const size = map.getMapImpl().getSize();
    const pix = size[0]; // Numero de pixeles en el mapa
    // Extension del mapa en grados (xmin, ymin, xmax, ymax)
    const pix2 = map.getMapImpl().getView().calculateExtent(size);
    // Extension angular del mapa (cuantos grados estan en el mapa)
    const ang = pix2[2] - pix2[0];
    // (numero de metros en el mapa / numero de pixeles) / metros por pixel
    let scale = (((mpu * ang) / pix) * 1000) / 0.28;
    if (!exact === true) {
      if (scale >= 1000 && scale <= 950000) {
        scale = Math.round(scale / 1000) * 1000;
      } else if (scale >= 950000) {
        scale = Math.round(scale / 1000000) * 1000000;
      } else {
        scale = Math.round(scale);
      }
    }
    return Math.trunc(scale);
  }
}
export default Utils;
