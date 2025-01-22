/**
 * @module IDEE/impl/Control
 */

/**
 * @classdesc
 * Es la clase de la que heredan todos los controles de la implementación,
 * crea el "CesiumControl".
 * @api
 */
class Control {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @api stable
   */
  constructor() {
    /**
     * @private
     * @type {string}
     * @expose
     */
    this.facadeMap_ = null;
  }

  /**
   * Este método añade el control al mapa.
   *
   * @public
   * @function
   * @param {IDEE.Map} map Mapa.
   * @param {function} template Plantilla del control.
   * @api stable
   * @export
   */
  addTo(map, element) {
    this.facadeMap_ = map;
    this.element = element;
  }

  /**
   * Este método destruye este control, limpiando el HTML
   * y anulando el registro de todos los eventos.
   *
   * @public
   * @function
   * @api stable
   * @export
   */
  destroy() {
    this.facadeMap_ = null;
  }

  /**
   * Este método retorna los elementos.
   *
   * @public
   * @function
   * @returns {HTMLElement} Elementos.
   * @api stable
   * @export
   */
  getElement() {
    return this.element;
  }
}

export default Control;
