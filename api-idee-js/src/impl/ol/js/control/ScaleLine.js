/**
 * @module IDEE/impl/control/ScaleLine
 */
import OLControlScaleLine from 'ol/control/ScaleLine';

/**
 * @type {string}
 */
const UNITS_PROP = 'units';

/**
 * @classdesc
 * Añadir escala gráfica.
 * @api
 */
class ScaleLine extends OLControlScaleLine {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {Object} vendorOptions Opciones de proveedor para la biblioteca base, estas opciones
   * se pasarán en formato objeto. Opciones disponibles:
   * - className: Nombre de la clase CSS.
   * El valor predeterminado es ol-scale-bar
   * cuando se configura con "bar" es verdadero.
   * De lo contrario, el valor predeterminado es ol-scale-line.
   * - minWidth: Ancho mínimo en píxeles en los dpi predeterminados de OGC.
   * El ancho se ajustará para que coincida con los dpi utilizados.
   * - render: Función llamada cuando se debe volver a
   * representar el control.
   * Esto se llama en una devolución de llamada de requestAnimationFrame.
   * - target: Especifique un objetivo si desea que
   * el control se represente fuera de la ventana gráfica del mapa.
   * - units: Unidades.
   * - bar: Representa barras de escala en lugar de una línea.
   * - steps: Número de pasos que debe usar la barra de escala.
   * Utilice números pares para obtener mejores resultados. Solo se aplica cuando
   * la barra es verdadera.
   * - text: Representa la escala de texto arriba de la barra de escala.
   * Solo se aplica cuando la barra es verdadera.
   * - dpi: dpi del dispositivo de salida, como una impresora.
   * Solo se aplica cuando la barra es verdadera.
   * Si no se define, se asumirá el tamaño de píxel de pantalla predeterminado de OGC de 0,28 mm.
   * @extends {ol.control.Control}
   * @api stable
   */
  constructor(vendorOptions) {
    super(vendorOptions);

    this.facadeMap_ = null;

    this.keyEvent_ = null;
  }

  /**
   * Este método añade el control al mapa.
   *
   * @public
   * @function
   * @param {IDEE.Map} map Mapa.
   * @param {function} template Plantilla del control.
   * @api stable
   */
  addTo(map, element) {
    this.facadeMap_ = map;
    this.removeChangeListener(UNITS_PROP, this.handleUnitsChanged);
    this.keyEvent_ = this.addChangeListener(UNITS_PROP, this.handleUnitsChanged);
    map.getMapImpl().addControl(this);
  }

  /**
   * Devuelve los elementos del control.
   *
   * @public
   * @function
   * @returns {HTMLElement} Retorna los elementos del control.
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

  /**
   * Actualiza los elementos del control.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @api stable
   */
  handleUnitsChanged_() {
    this.updateElement_();
  }
}

export default ScaleLine;
