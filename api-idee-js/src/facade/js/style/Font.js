/**
 * @module M/style/Font
 */
import OLFontSymbol from 'impl/ext/OLStyleFontSymbol';

/**
 * @classdesc
 * Clase que gestiona la fuente de la implementación (OLStyleFontSymbol).
 * @api
 */
class Font {
  /**
   * Este método de la clase agrega definiciones de fuentes personalizadas.
   *
   * @param {object} font Fuente
   * @param {object} glyphs Gráfico.
   * @public
   * @static
   * @api
   */
  static addSymbol(font, glyphs) {
    return OLFontSymbol.addDefs(font, glyphs);
  }
}

export default Font;
