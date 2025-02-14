/**
 * @module M/filter/spatial
 */
import { GeoJSONReader } from 'jsts/org/locationtech/jts/io';
import RelateOp from 'jsts/org/locationtech/jts/operation/relate/RelateOp';
import Spatial from './Spatial';
import WKT from '../format/WKT';
import { isArray, isObject } from '../util/Utils';
import Vector from '../layer/Vector';
import Feature from '../feature/Feature';

/**
  * Transforma parámetros a geometrías.
  *
  * @function
  * @param {M.layer.Vector|M.Feature|object|Array<M.Feature|object>} paramParameter
  * Capa o geometría sobre la que se realiza la consulta.
  * @return {Array} Geometría.
  * @api
  */
export const parseParamToGeometries = (paramParameter) => {
  let param = paramParameter;
  let geometries = [];
  if (param instanceof Vector) {
    geometries = [...param.getFeatures().map((feature) => feature.getGeometry())];
  } else {
    if (!isArray(param)) {
      param = [param];
    }
    geometries = param.map((p) => {
      let geom;
      if (p instanceof Feature) {
        geom = p.getGeometry();
      } else if (isObject(p)) {
        geom = p;
      }
      return geom;
    });
  }

  return geometries;
};

/**
  * Transforma operación y geometrías a filtro CQL.
  *
  * @private
  * @function
  * @param {Array} geometries Geometría.
  * @param {String} operation Operación.
  * @return {String} Filtro.
  */
const toCQLFilter = (operation, geometries) => {
  let cqlFilter = '';
  const wktFormat = new WKT();
  geometries.forEach((value, index) => {
    if (index !== 0) {
      // es un OR porque se hace una interseccion completa con todas
      // las geometries
      cqlFilter += ' OR ';
    }
    const geometry = value;
    if (geometry.type.toLowerCase() === 'point') {
      geometry.coordinates.length = 2;
    }
    const formatedGeometry = wktFormat.writeFeature(geometry);
    cqlFilter += `${operation}({{geometryName}}, ${formatedGeometry})`;
  });
  return cqlFilter;
};

/**
  * Esta función crea un filtro espacial para saber qué entidades contienen otra entidad o capa.
  *
  * @function
  * @param {M.layer.Vector|object} param Capa o geometría sobre la que se realiza la consulta.
  * @return {Spatial} Filtro.
  * @api
  */
export const CONTAIN = (param) => {
  const geometries = parseParamToGeometries(param);
  return new Spatial((geometryToFilter, index) => {
    const geojsonParser = new GeoJSONReader();
    const jtsGeomToFilter = geojsonParser.read(geometryToFilter);
    return geometries.some((geom) => {
      const jtsGeom = geojsonParser.read(geom);
      return RelateOp.contains(jtsGeom, jtsGeomToFilter);
    });
  }, {
    cqlFilter: toCQLFilter('CONTAINS', geometries),
  });
};

/**
  * Esta función crea un filtro espacial para saber qué objetos geográficos
  * separan otros objetos geográficos o capa.
  *
  * @function
  * @param {M.layer.Vector|object} param Capa o geometría sobre la que se realiza la consulta.
  * @return {Spatial} Filtro.
  * @api
  */
export const DISJOINT = (param) => {
  const geometries = parseParamToGeometries(param);
  return new Spatial((geometryToFilter, index) => {
    const geojsonParser = new GeoJSONReader();
    const jtsGeomToFilter = geojsonParser.read(geometryToFilter);
    return geometries.some((geom) => {
      const jtsGeom = geojsonParser.read(geom);
      return !(RelateOp.intersects(jtsGeomToFilter, jtsGeom));
    });
  }, {
    cqlFilter: toCQLFilter('DISJOINT', geometries),
  });
};

/**
  * Esta función crea un filtro espacial para saber qué objetos
  * geográficos dentro de otros objetos geográficos o capa.
  *
  * @function
  * @param {M.layer.Vector|object} param Capa o geometría sobre la que se realiza la consulta.
  * @return {Spatial} Filtro.
  * @api
  */
export const WITHIN = (param) => {
  const geometries = parseParamToGeometries(param);
  return new Spatial((geometryToFilter, index) => {
    const geojsonParser = new GeoJSONReader();
    const jtsGeomToFilter = geojsonParser.read(geometryToFilter);
    return geometries.some((geom) => {
      const jtsGeom = geojsonParser.read(geom);
      return RelateOp.contains(jtsGeom, jtsGeomToFilter);
    });
  }, {
    cqlFilter: toCQLFilter('WITHIN', geometries),
  });
};

/**
  * Esta función crea un filtro espacial para saber qué objeto geográfico
  * se cruza con otra entidad o capa.
  *
  * @function
  * @param {M.layer.Vector|M.Feature|object|Array<M.Feature|object>} param
  * Capa o geometría sobre la que se realiza la consulta.
  * @return {Spatial} Filtro.
  * @api
  */
export const INTERSECT = (param) => {
  const geometries = parseParamToGeometries(param);
  return new Spatial((geometryToFilter, index) => {
    const geojsonParser = new GeoJSONReader();
    const jtsGeomToFilter = geojsonParser.read(geometryToFilter);
    return geometries.some((geom) => {
      const jtsGeom = geojsonParser.read(geom);
      return RelateOp.intersects(jtsGeomToFilter, jtsGeom);
    });
  }, {
    cqlFilter: toCQLFilter('INTERSECTS', geometries),
  });
};

/**
 * Este comentario no se verá, es necesario incluir
 * una exportación por defecto para que el compilador
 * muestre las funciones.
 *
 * Esto se produce por al archivo normaliza-exports.js
 * @api stable
 */
export default {};
