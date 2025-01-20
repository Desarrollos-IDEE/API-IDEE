/**
 * Enumeración de tipos de geometrías GeoJSON.
 * @module M/geom/geojson/type
 * @example import * as GeoJSONType from 'M/geom/geojson/type';
 */

/**
 * GeoJSON punto.
 * @const
 * @public
 * @type {string}
 * @api
 */
export const POINT = 'Point';

/**
 * GeoJSON multiples puntos.
 * @const
 * @public
 * @type {string}
 * @api
 */
export const MULTI_POINT = 'MultiPoint';

/**
 * GeoJSON línea.
 * @const
 * @public
 * @type {string}
 * @api
 */
export const LINE_STRING = 'LineString';

/**
 * GeoJSON multiples líneas.
 * @const
 * @public
 * @type {string}
 * @api
 */
export const MULTI_LINE_STRING = 'MultiLineString';

/**
 * GeoJSON polígono.
 * @const
 * @public
 * @type {string}
 * @api
 */
export const POLYGON = 'Polygon';

/**
 * GeoJSON multiples polígonos.
 * @const
 * @public
 * @type {string}
 * @api
 */
export const MULTI_POLYGON = 'MultiPolygon';

/**
 * GeoJSON colección de geometrías.
 * @const
 * @public
 * @type {string}
 * @api
 */
export const GEOMETRY_COLLECTION = 'GeometryCollection';

/**
 * Este comentario no se verá, es necesario incluir
 * una exportación por defecto para que el compilador
 * muestre las funciones.
 *
 * Esto se produce por al archivo normaliza-exports.js
 * @api stable
 */
export default {};
