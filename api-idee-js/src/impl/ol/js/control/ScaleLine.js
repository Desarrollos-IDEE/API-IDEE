/**
 * @module IDEE/impl/control/ScaleLine
 */
import OLControlScaleLine from 'ol/control/ScaleLine';

/**
 * @typedef {Object} module:IDEE/impl/control/ScaleLine~Options
 * @api
 * @property {String} [className='ol-scale-line'] Nombre de la clase CSS.
 * @property {Number} [minWidth=64] Ancho mínimo en píxeles.
 * @property {Function} [render] Función de renderizado personalizada.
 * @property {HTMLElement|String} [target] Elemento objetivo donde se renderiza el control.
 * @property {String} [units='metric'] Unidades de medida:
 * 'degrees', 'imperial', 'nautical', 'metric', 'us'.
 * @property {Boolean} [bar=false] Si es verdadero representa barras de escala
 * en lugar de una línea.
 * @property {Number} [steps=4] Número de pasos para la barra de escala.
 * @property {Boolean} [text=false] Si es verdadero representa texto encima de la barra.
 * @property {Number} [dpi] DPI del dispositivo de salida.
 *
 * @see {@link https://openlayers.org/en/latest/apidoc/module-ol_control_ScaleLine-ScaleLine.html|OpenLayers ScaleLine}
 */

/**
 * @type {string}
 */
const UNITS_PROP = 'units';

/**
 * @classdesc
 * Implementación del control de escala gráfica que extiende
 * {@link https://openlayers.org/en/latest/apidoc/module-ol_control_ScaleLine-ScaleLine.html|ol.control.ScaleLine}.
 * Muestra la escala del mapa en la unidad de medida especificada.
 *
 * @api
 * @extends {ol.control.ScaleLine}
 */
class ScaleLine extends OLControlScaleLine {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {module:IDEE/impl/control/ScaleLine~Options} options Opciones del control.
   * @api
   */
  constructor(options) {
    super(options);

    this.facadeMap_ = null;

    this.keyEvent_ = null;
  }

  /**
   * Este método añade el control al mapa.
   * (Como este no extiende directamente de open layers debemos tener en cuenta )
   *
   * @public
   * @function
   * @param {IDEE.Map} map Mapa.
   * @param {HTMLElement} template Plantilla del control.
   * @api stable
   */
  addTo(map, template) {
    this.facadeMap_ = map;
    this.panel = template;
    this.removeChangeListener(UNITS_PROP, this.handleUnitsChanged);
    this.keyEvent_ = this.addChangeListener(UNITS_PROP, this.handleUnitsChanged);
    map.getMapImpl().addControl(this);
  }

  /**
   * Devuelve la vista de implementación
   *
   * @public
   * @function
   * @return {HTMLElement} vista de implementación
   * @api stable
   */
  getView() {
    return this.element;
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
