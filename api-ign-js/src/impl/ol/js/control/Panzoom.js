/**
 * @module M/impl/control/Panzoom
 */
import OLControlZoom from 'ol/control/Zoom';

/**
 * @classdesc
 * Agregue los botones '+' y '-' para acercar y alejar el mapa.
 * @api
 */
class Panzoom extends OLControlZoom {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @extends {ol.control.Control}
   * @param {Object} vendorOptions Opciones de proveedor para la biblioteca base, estas opciones
   * se pasarán en formato objeto. Opciones disponibles:
   * - duration: Duración de la animación en milisegundos.
   * - className: Nombre de la clase CSS.
   * - zoomInClassName: Nombre de clase de CSS para el botón de acercamiento.
   * - zoomOutClassName: Nombre de clase de CSS para el botón de alejamiento.
   * - zoomInLabel: Etiqueta de texto que se usará para el botón de acercamiento.
   * - zoomOutLabel: Etiqueta de texto que se usará para el botón de alejamiento.
   * - zoomInTipLabel: Etiqueta de texto que se usará para la sugerencia del botón,
   * cuando se hace zoom.
   * - zoomOutTipLabel: Etiqueta de texto que se usará para la sugerencia del botón,
   * cuando se deshace el zoom.
   * - delta: El delta de zoom aplicado en cada clic.
   * - target: Especifique un objetivo si desea que el control se represente
   * fuera de la ventana gráfica del mapa.
   * @api stable
   */
  constructor(vendorOptions) {
    super(vendorOptions);
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
   * Retorna la plantilla del control.
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

export default Panzoom;
