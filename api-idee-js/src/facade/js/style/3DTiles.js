/**
 * @module IDEE/style/3DTiles
 */
import Tiles3DStyleImpl from 'impl/style/3DTiles';
import Style from './Style';

/**
 * @classdesc
 * Estilo para capas 3D Tiles.
 * @api
 * @extends {IDEE.style}
 */
class Tiles3DStyle extends Style {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {Mx.Tiles3DStyleOptions} optionsParam Opciones del estilo.
   * - color: Nombre del color (p. ej. 'red'), expresión 3D Tiles
   *   (p. ej. '(${Temperature} > 90) ? color("red") : color("white")')
   *   u objeto con conditions (p. ej. { conditions: [['${height} > 2', 'color("cyan")'], ['true', 'color("blue")']] }).
   * - show: Indica si se muestra el contenido del tileset.
   * @param {Object} vendorOptionsParam Opciones de la biblioteca base.
   * @api
   */
  constructor(optionsParam = {}, vendorOptionsParam = {}) {
    const options = { ...optionsParam };
    const vendorOptions = vendorOptionsParam;

    const impl = new Tiles3DStyleImpl(options, vendorOptions);
    super(options, impl);

    /**
     * @private
     * @type {Mx.Tiles3DStyleOptions}
     */
    this.options_ = options;

    /**
     * @private
     * @type {Object}
     */
    this.vendorOptions_ = vendorOptions;
  }

  /**
   * Este método devuelve el color del estilo.
   *
   * @function
   * @public
   * @returns {String|Mx.Tiles3DStyleColorConditions|undefined} Color del estilo.
   * @api
   */
  getColor() {
    return this.options_.color;
  }

  /**
   * Este método establece el color del estilo.
   *
   * @function
   * @public
   * @param {String|Mx.Tiles3DStyleColorConditions} color Color del estilo.
   * @api
   */
  setColor(color) {
    this.options_.color = color;
    this.getImpl().setOptions(this.options_, this.vendorOptions_);
  }

  /**
   * Este método devuelve si el tileset es visible según el estilo.
   *
   * @function
   * @public
   * @returns {Boolean|undefined} Valor de show.
   * @api
   */
  getShow() {
    return this.options_.show;
  }

  /**
   * Este método establece la visibilidad del contenido del tileset.
   *
   * @function
   * @public
   * @param {Boolean} show Verdadero para mostrar.
   * @api
   */
  setShow(show) {
    this.options_.show = show;
    this.getImpl().setOptions(this.options_, this.vendorOptions_);
  }

  /**
   * Devuelve las opciones del estilo.
   *
   * @function
   * @public
   * @returns {Mx.Tiles3DStyleOptions} Opciones del estilo.
   * @api
   */
  getOptions() {
    return { ...this.options_ };
  }
}

export default Tiles3DStyle;
