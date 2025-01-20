/**
 * @module M/impl/control/Panzoombar
 */
import { extend } from 'M/util/Utils';

import OLControlZoomSlider from 'ol/control/ZoomSlider';

/**
 * @classdesc
 * Añade una barra de desplazamiento para acercar/alejar el mapa.
 * @api
 */
class Panzoombar extends OLControlZoomSlider {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {Object} vendorOptions Opciones de proveedor para la biblioteca base, estas opciones
   * se pasarán en formato objeto. Opciones disponibles:
   * - className: Nombre de la clase CSS.
   * - duration: Duración de la animación en milisegundos.
   * - render: Función llamada cuando se debe volver
   * a representar el control.
   * Esto se llama en una devolución de llamada de "requestAnimationFrame".
   * @extends {ol.control.Control}
   * @api stable
   */
  constructor(vendorOptions) {
    super(extend({}, vendorOptions, true));
    this.facadeMap_ = null;
  }

  /**
   * Este método añade el control al mapa.
   *
   * @public
   * @function
   * @param {M.Map} map Mapa.
   * @param {function} template Plantilla del control.
   * @api stable
   */
  addTo(map, element) {
    this.facadeMap_ = map;
    map.getMapImpl().addControl(this);
  }

  /**
   * Devuelve los elementos de la plantilla.
   *
   * @public
   * @function
   * @returns {HTMLElement} Elementos del control.
   * @api stable
   * @export
   */
  getElement() {
    return this.element;
  }

  /**
   * Esta función destruye este control, limpiando el HTML y anula el registro de todos los eventos.
   *
   * @public
   * @function
   * @api stable
   * @export
   */
  destroy() {
    this.facadeMap_.getMapImpl().removeControl(this);
    this.facadeMap_ = null;
  }
}

export default Panzoombar;
