/**
 * Enumeración de tipos de geometrías WFS.
 * @module M/geom/wfs/type
 * @example import * as WFSType from 'M/geom/wfs/type';
 */

/**
 * Geometría WFS punto.
 * @const
 * @public
 * @type {string}
 * @api
 */
export const POINT = 'POINT';

/**
 * Geometría WFS línea.
 * @const
 * @public
 * @type {string}
 * @api
 */
export const LINE = 'LINE';

/**
 * Geometría WFS polígono.
 * @const
 * @public
 * @type {string}
 * @api
 */
export const POLYGON = 'POLYGON';

/**
 * Geometría WFS múltiples puntos.
 * @const
 * @public
 * @type {string}
 * @api
 */
export const MPOINT = 'MPOINT';

/**
 * Geometría WFS múltiples líneas.
 * @const
 * @public
 * @type {string}
 * @api
 */
export const MLINE = 'MLINE';

/**
 * Geometría WFS múltiples polígonos.
 * @const
 * @public
 * @type {string}
 * @api
 */
export const MPOLYGON = 'MPOLYGON';

/**
 * Este comentario no se verá, es necesario incluir
 * una exportación por defecto para que el compilador
 * muestre las funciones.
 *
 * Esto se produce por al archivo normaliza-exports.js
 * @api stable
 */
export default {};
