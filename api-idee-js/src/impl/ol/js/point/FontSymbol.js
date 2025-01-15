/**
 * @module M/impl/point/FontSymbol
 */

import OLFontSymbol from '../ext/OLStyleFontSymbol';

class FontSymbol extends OLFontSymbol {
  /**
   * @classdesc
   * Estilo gráfico para objetos geográficos vectoriales.
   * @extends {ol.style.FontSymbol}
   *
   * @constructor
   * @param {object} options Opciones de estilo.
   * - glyph: Símbolo.
   * - color: Color.
   * - fontSize: Tamaño de fuente.
   * - stroke: Borde.
   * - fill: Relleno.
   * - radius: Radio.
   * - form: Forma.
   * - gradient: Gradiente.
   * - offsetX: Desplazamiento en x.
   * - offsetY: Desplazamiento en y.
   * - opacity: Opacidad.
   * - rotation: Rotación.
   * - rotateWithView: Rotación con la vista.
   *
   * @api stable
   */
  constructor(options = {}) {
    // super call
    const optionsC = options;
    if (!options.offset) {
      optionsC.offset = [];
    }
    super({
      glyph: options.glyph,
      color: options.color,
      fontSize: options.fontSize,
      stroke: options.stroke,
      fill: options.fill,
      radius: options.radius,
      form: options.form,
      gradient: options.gradient,
      offsetX: options.offset[0],
      offsetY: options.offset[1],
      opacity: options.opacity,
      rotation: options.rotation,
      rotateWithView: options.rotateWithView,
    });
  }
}

export default FontSymbol;
