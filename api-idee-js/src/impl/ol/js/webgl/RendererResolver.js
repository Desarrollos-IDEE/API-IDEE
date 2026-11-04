/**
 * @module IDEE/impl/webgl/RendererResolver
 */
import { isNullOrEmpty } from 'IDEE/util/Utils';
import { getValue } from 'IDEE/i18n/language';
import * as RendererType from './RendererType';
import { isWebGLSupported } from './WebGLSupport';

/**
 * Normaliza un valor de renderer a uno de los valores de IDEE.impl.webgl.RendererType.
 *
 * @param {string|boolean} value Valor indicado por el usuario o la configuración.
 * @returns {string|null} Renderer normalizado o nulo si no se ha indicado.
 */
const normalize = (value) => {
  if (value === true || String(value).toLowerCase() === 'true') {
    return RendererType.WEBGL;
  }
  if (isNullOrEmpty(value) || value === false || String(value).toLowerCase() === 'false') {
    return null;
  }
  const renderer = String(value).toLowerCase();
  return [RendererType.CANVAS, RendererType.WEBGL].includes(renderer) ? renderer : null;
};

/**
 * Resuelve el renderer de una capa de OpenLayers a partir de la
 * configuración de la API y del navegador.
 *
 * @function
 * @public
 * @param {Object} options Opciones.
 * - renderer: Renderer solicitado para la capa ('canvas' | 'webgl').
 * - crossOrigin: Valor crossOrigin de la fuente, si aplica.
 * @returns {string} RendererType.CANVAS o RendererType.WEBGL.
 * @api
 */
export const resolveRenderer = ({ renderer, crossOrigin } = {}) => {
  const requested = normalize(renderer) || normalize(IDEE.config.WEBGL) || RendererType.CANVAS;
  if (requested !== RendererType.WEBGL) {
    return RendererType.CANVAS;
  }
  if (!isWebGLSupported()) {
    // eslint-disable-next-line no-console
    console.warn(getValue('exception').webgl_not_supported);
    return RendererType.CANVAS;
  }
  if (crossOrigin === false || crossOrigin === null) {
    // eslint-disable-next-line no-console
    console.warn(getValue('exception').webgl_fallback_cors);
    return RendererType.CANVAS;
  }
  return RendererType.WEBGL;
};

export default resolveRenderer;
