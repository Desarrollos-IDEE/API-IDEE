/**
 * @module M/window
 */

/**
 * @classdesc
 * Esta clase gestiona el objeto "window".
 * @api
 */
class MWindow {
  /**
   * Método de la clase, lanza el evento "resize" en "window"
   * para cambiar o adaptar el tamaño de la pantalla.
   * @function
   * @api
   */
  static listen() {
    MWindow.WIDTH = window.innerWidth;
    MWindow.HEIGHT = window.innerHeight;
    window.addEventListener('resize', (e) => {
      MWindow.WIDTH = e.target.innerWidth;
      MWindow.HEIGHT = e.target.innerHeight;
    });
  }
}

/**
 * Devuelve el ancho de "window".
 * @public
 * @type {Number}
 * @property {Number} innerWidth Valor del ancho de la pantalla.
 * @api
 */
MWindow.WIDTH = window.innerWidth;

/**
 * Devuelve el alto de "window".
 * @public
 * @type {Number}
 * @property {Number} innerHeight Valor del alto de la pantalla.
 * @api
 */
MWindow.HEIGHT = window.innerHeight;

// Ejecuta el método.
MWindow.listen();

export default MWindow;
