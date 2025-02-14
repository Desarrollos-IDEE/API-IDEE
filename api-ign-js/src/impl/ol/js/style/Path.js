/**
 * @module M/impl/style/Path
 */
import OLStyleText from 'ol/style/Text';

/**
 * @classdesc
 *  De esta clase heredan los estilo de tipo "Text".
 * @api
 * @namespace M.impl.style.TextPath
 */

class Path extends OLStyleText {
  /**
   * @classdesc
   * Constructor principal de la clase.
   *
   * @extends OLStyleText
   * @constructor
   * @param {Object} options - style options
   * - font: Fuente.
   * - maxAngle: Ángulo máximo
   * - offsetX: Desplazamiento del eje x.
   * - offsetY: Desplazamiento del eje y.
   * - overflow: Desbordamiento del texto.
   * - placement: Colocación.
   * - scale: Escala.
   * - rotateWithView: Rotación a lo ancho.
   * - rotation: Rotación.
   * - text: Texto.
   * - textAlign: Alineación del texto.
   * - textBaseline: Línea de base de texto.
   * - fill: Relleno.
   * - stroke: Borde.
   * - backgroundFill: Fondo del relleno.
   * - backgroundStroke: Fondo del borde.
   * - padding: Añadir relleno.
   * @api stable
   */

  constructor(options = {}) {
    // super constructor call
    super(options);

    /**
     * La propiedad de estilo textOverflow.
     * TextOverflow fuerza cambios en el texto en la fase de representación
     * cuando el tamaño del texto
     * es más grande que el tamaño de la geometría de la característica.
     * @private
     * @type {string}
     */
    this.textOverflow_ = typeof options.textOverflow !== 'undefined' ? options.textOverflow : '';

    /**
     * La propiedad de estilo minWidth
     * esta propiedad omite la representación del
     * texto cuando el ancho de la geometría característica es menor que este número
     * @private
     * @type {number}
     */
    this.minWidth_ = options.minWidth || 0;
  }

  /**
   * Devuelve el valor de la propiedad "TextOverflow".
   * @public
   * @function
   * @return {number} Valor de la propiedad "textOverflow".
   * @api stable
   */
  getTextOverflow() {
    return this.textOverflow_;
  }

  /**
   * Devuelve el tamaño mínimo.
   * @public
   * @function
   * @return {number} Valor de la propiedad "minWidth".
   * @api stable
   */
  getMinWidth() {
    return this.minWidth_;
  }
}

export default Path;
