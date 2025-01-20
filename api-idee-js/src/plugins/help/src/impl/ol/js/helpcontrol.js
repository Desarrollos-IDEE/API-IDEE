/**
 * @module M/impl/control/HelpControl
 */

export default class HelpControl extends M.impl.Control {
  constructor() {
    super({});
  }

  /**
   * Añade el control al mapa
   *
   *
   * @public
   * @function
   * @param {M.Map} map mapa donde añadir el plugin
   * @param {HTMLElement} html HTML del plugin
   * @api
   */
  addTo(map, html) {
    super.addTo(map, html);
  }

  /**
   * Esta función elimina el plugin del map
   *
   * @public
   * @function
   * @api
   * @export
   */
  destroy() {
    this.facadeMap_.getMapImpl().removeControl(this);
    this.facadeMap_ = null;
  }
}
