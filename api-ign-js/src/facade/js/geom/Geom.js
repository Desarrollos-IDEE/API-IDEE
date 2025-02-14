/**
 * El objeto Geom contiene funciones para la gestión de geometrías.
 * @module M/geom
 * @example import * as Geom from 'M/geom/Geom';
 */
import { normalize } from '../util/Utils';
import * as WKT from './WKT';
import * as WFS from './WFS';

/**
 * Transforma la geometría.
 * @public
 * @function
 * @param {string} rawType Tipo de geometría a la que se quiere transformar.
 * @return {Array} Geometría.
 * @api
 */
export const parse = (rawGeom) => {
  const parsedGeom = normalize(rawGeom, true);
  return WFS[parsedGeom];
};

/**
 * Transforma la geometría WFS.
 * @public
 * @function
 * @param {string} rawType Tipo de geometría a la que se quiere transformar.
 * @return {Array} Geometría.
 * @api
 */
export const parseWFS = (wfsType) => {
  let parsedWFS;
  if (wfsType === WFS.POINT) {
    parsedWFS = WKT.POINT;
  } else if (wfsType === WFS.LINE) {
    parsedWFS = WKT.LINE_STRING;
  } else if (wfsType === WFS.POLYGON) {
    parsedWFS = WKT.POLYGON;
  } else if (wfsType === WFS.MPOINT) {
    parsedWFS = WKT.MULTI_POINT;
  } else if (wfsType === WFS.MLINE) {
    parsedWFS = WKT.MULTI_LINE_STRING;
  } else if (wfsType === WFS.MPOLYGON) {
    parsedWFS = WKT.MULTI_POLYGON;
  }
  return parsedWFS;
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
