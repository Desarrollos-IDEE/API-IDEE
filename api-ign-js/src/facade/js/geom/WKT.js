/**
 * Enumeración de tipos de geometrías WKT.
 * @module M/geom/wkt/type
 * @example import * as WKTType from 'M/geom/wkt/type';
 */

/**
 * Geometría WKT.
 * @const
 * @public
 * @type {string}
 * @api
 */
export const GEOMETRY = 'Geometry';

/**
 * Geometría WKT líneas.
 * @const
 * @public
 * @type {string}
 * @api
 */
export const LINE_STRING = 'LineString';

/**
 * Geometría WKT polígonos.
 * @const
 * @public
 * @type {string}
 * @api
 */
export const POLYGON = 'Polygon';

/**
 * Geometría WKT múltiples puntos.
 * @const
 * @public
 * @type {string}
 * @api
 */
export const MULTI_POINT = 'MultiPoint';

/**
 * Geometría WKT múltiples líneas.
 * @const
 * @public
 * @type {string}
 * @api
 */
export const MULTI_LINE_STRING = 'MultiLineString';

/**
 * Geometría WKT múltiples polígonos.
 * @const
 * @public
 * @type {string}
 * @api
 */
export const MULTI_POLYGON = 'MultiPolygon';

/**
 * Geometría WKT línea tipo "ring".
 * @const
 * @public
 * @type {string}
 * @api
 */
export const LINEAR_RING = 'LinearRing';

/**
 * Geometría WKT punto.
 * @const
 * @public
 * @type {string}
 * @api
 */
export const POINT = 'Point';

/**
 * Geometría WKT colección de geometrías.
 * @const
 * @public
 * @type {string}
 * @api
 */
export const GEOMETRY_COLLECTION = 'GeometryCollection';

/**
 * Geometría WKT círculo.
 * @const
 * @public
 * @type {string}
 * @api
 */
export const CIRCLE = 'Circle';

/**
 * Este comentario no se verá, es necesario incluir
 * una exportación por defecto para que el compilador
 * muestre las funciones.
 *
 * Esto se produce por al archivo normaliza-exports.js
 * @api stable
 */
export default {};
