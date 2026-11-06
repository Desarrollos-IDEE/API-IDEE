/**
 * @module IDEE/impl/webgl/WebGLSupport
 */

let supported;

/**
 * Indica si el navegador permite crear un contexto WebGL.
 * La detección se realiza una única vez y libera el contexto de prueba.
 *
 * @function
 * @public
 * @returns {boolean} Verdadero si WebGL está disponible.
 * @api
 */
export const isWebGLSupported = () => {
  if (supported === undefined) {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      supported = !!gl;
      if (gl) {
        gl.getExtension('WEBGL_lose_context')?.loseContext();
      }
    } catch (err) {
      supported = false;
    }
  }
  return supported;
};

export default isWebGLSupported;
