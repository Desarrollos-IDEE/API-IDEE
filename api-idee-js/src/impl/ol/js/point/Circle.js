/**
 * @module M/impl/point/Circle
 */

import OLStyleCircle from 'ol/style/Circle';

/**
 * @classdesc
 * Estilo gráfico para objetos geográficos vectoriales.
 * @api
 * @extends {OLStyleCircle}
 */
class Circle extends OLStyleCircle {
  /**
   * @constructor
   * @param {object} options Opciones de los estilos.
   * - fill: Relleno.
   * - radius: Radio.
   * - snapToPixel: Si se utilizan verdaderos números enteros de píxeles como coordenadas de
   * píxeles X e Y al dibujar el círculo en el "canva" de salida.
   * Si se pueden utilizar números fraccionarios falso.
   * - stroke: Borde del circulo.
   * - atlasManager: Gestiona la creación de atlas de imágenes.
   * @api stable
   */
  constructor(options = {}) {
    // super call
    super({
      points: Infinity,
      fill: options.fill,
      radius: options.radius,
      snapToPixel: options.snapToPixel,
      stroke: options.stroke,
      atlasManager: options.atlasManager,
    });
  }

  /**
   * Clona el estilo.
   * @public
   * @functio
   * @returns {Object} Retorna "new Circle"
   */
  clone() {
    const style = new Circle({
      fill: this.getFill() ? this.getFill().clone() : undefined,
      stroke: this.getStroke() ? this.getStroke().clone() : undefined,
      radius: this.getRadius(),
      atlasManager: this.atlasManager_,
    });
    style.setOpacity(this.getOpacity());
    style.setScale(this.getScale());
    return style;
  }
}

export default Circle;
