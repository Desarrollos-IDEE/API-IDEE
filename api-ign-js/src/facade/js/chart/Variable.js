/**
 * @module M/style/chart/Variable
 */

/**
 * @classdesc
 * Variables para el gráfico.
 * @api
 */
class Variable {
  /**
   * Contructor principal de la clase.
   *
   * @constructor
   * @param {Mx.ChartVariableOptions} options.
   *  - attribute: El nombre de la propiedad del objeto geográfico
   *    donde se almacenan los datos.
   *  - label: Opciones mostradas en la etiqueta de datos.
   *    - text: etiqueta de datos mostrada. Si esta propiedad es una
    *   función los argumentos pasados serán:  "currentVal", "values", "feature".
   *    - stroke. Borde.
   *      - color: el color del trazo de la etiqueta de datos.
   *      - width: el ancho del trazo de la etiqueta de datos.
   *    - radiusIncrement: distancia entre el origen de la posición del texto y
   *                               radio del gráfico.
   *    - fill: el color de la etiqueta de datos.
   *    - font: la familia de fuentes de la etiqueta de datos.
   *    - scale: la escala de la etiqueta de datos. No podemos usar un tamaño de
   *          fuente, así que lienzo volverá a escalar el texto.
   *   - fill: el color del relleno de la representación del
   *    gráfico (si el tipo de gráfico = 'barra') esta propiedad establece el
   *    color de relleno de la barra.
   *  - legend: la etiqueta de leyenda del conmutador de capas.
   *
   * [ADVERTENCIA] Tenga en cuenta que la propiedad de la etiqueta solo se aplicará
   * si la geometría es no es del tipo 'multipolígono' y el
   * tipo de gráfico es distinto del tipo 'barra'.
   *
   * @api
   */
  constructor(options = {}) {
    /**
     * Nombre de la propiedad del objeto greográfico donde se almacenan los datos.
     * @private
     * @type {string}
     */
    this.attributeName_ = options.attribute || null;

    /**
     * Opciones mostradas en la etiqueta de datos.
     * @private
     * @type {object}
     */
    this.label_ = options.label || null;

    /**
     * Color del gráfico de datos.
     * @private
     * @type {string}
     */
    this.fillColor_ = options.fill || null;

    /**
     * Leyenda.
     * @private
     * @type {string}
     */
    this.legend_ = options.legend || null;
  }

  /**
   * Retorna el nombre de la propiedad del objeto greográfico
   * donde se almacenan los datos.
   *
   * @public
   * @function
   * @returns {string} Nombre de la propiedad.
   * @api
   */
  get attribute() {
    return this.attributeName_;
  }

  /**
   * Modifica el nombre de la propiedad del objeto greográfico
   * donde se almacenan los datos.
   *
   * @public
   * @function
   * @param {string} attribute Nuevo nombre de la propiedad.
   * @api
   */
  set attribute(attribute) {
    this.attributeName_ = attribute;
  }

  /**
   * Retorna la etiqueta de datos.
   *
   * @public
   * @function
   * @returns {string} Nombre de la etiqueta.
   * @api
   */
  get label() {
    return this.label_;
  }

  /**
   * Modifica la etiqueta de datos.
   *
   * @public
   * @function
   * @param {string} label Nueva etiqueta de datos.
   * @api
   */
  set label(label) {
    this.label_ = label;
  }

  /**
   * Retorna el color del gráfico de datos.
   *
   * @public
   * @function
   * @returns {string} Color del gráfico de datos.
   * @api
   */
  get fillColor() {
    return this.fillColor_;
  }

  /**
   * Modifica el color del gráfico de datos.
   *
   * @public
   * @function
   * @param {string} fillColor Nuevo Color del gráfico de datos.
   * @api
   */
  set fillColor(fillColor) {
    this.fillColor_ = fillColor;
  }

  /**
   * Retorna la leyenda.
   *
   * @public
   * @function
   * @returns {string} Leyenda.
   * @api
   */
  get legend() {
    return this.legend_;
  }

  /**
   * Modifica la leyenda.
   *
   * @public
   * @function
   * @param {string} legend leyenda.
   * @api
   */
  set legend(legend) {
    this.legend_ = legend;
  }
}

export default Variable;
