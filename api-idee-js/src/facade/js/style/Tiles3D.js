/**
 * @module IDEE/style/Tiles3D
 */
import Tiles3DImpl from 'impl/style/Tiles3D';
import Style from './Style';

/**
 * @classdesc
 * Estilo para capas 3D Tiles.
 * @api
 * @extends {IDEE.style}
 */
class Tiles3D extends Style {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {Mx.Tiles3DStyleOptions} optionsParam Opciones del estilo.
   * - color: Nombre del color (p. ej. 'red'), expresión 3D Tiles
   *   (p. ej. '(${Temperature} > 90) ? color("red") : color("white")')
   *   u objeto con conditions (p. ej.
   *   { conditions: [['${height} > 2', 'color("cyan")'], ['true', 'color("blue")']] }).
   * - show: Booleano, expresión 3D Tiles (p. ej. '${Height} > 0')
   *   u objeto con conditions (p. ej.
   *   { conditions: [['${height} > 2', 'false'], ['true', 'true']] }).
   * @param {Object} vendorOptionsParam Opciones de la biblioteca base.
   * @api
   */
  constructor(optionsParam = {}, vendorOptionsParam = {}) {
    const options = { ...optionsParam };
    const vendorOptions = vendorOptionsParam;

    const impl = new Tiles3DImpl(options, vendorOptions);
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

export default Tiles3D;
