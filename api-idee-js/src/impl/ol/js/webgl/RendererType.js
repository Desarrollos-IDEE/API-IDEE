/**
 * @module IDEE/impl/webgl/RendererType
 */

/**
 * Renderizado mediante Canvas 2D. Es el valor por defecto.
 * @const
 * @type {string}
 * @public
 * @api
 */
export const CANVAS = 'canvas';

/**
 * Renderizado mediante WebGL. Si el navegador, el origen de datos o el estilo
 * no lo permiten, la capa se renderiza con Canvas 2D.
 * @const
 * @type {string}
 * @public
 * @api
 */
export const WEBGL = 'webgl';
