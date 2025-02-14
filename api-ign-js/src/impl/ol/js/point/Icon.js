/**
 * @module M/impl/point/Icon
 */

import OLStyleIcon from 'ol/style/Icon';

class Icon extends OLStyleIcon {
  /**
   * @classdesc
   * Estilos gráficos para los vectores.
   * @extends {OLStyleIcon}
   *
   * @constructor
   * @param {object} options Opciones del estilo "PointIcon".
   * - anchor: Ancla. El valor predeterminado es el centro del icono, por defecto [0.5, 0.5].
   * - anchorOrigin: Origin of the anchor: bottom-left, bottom-right, top-left or top-right.
   * Por defecto: 'top-left'.
   * - anchorXUnits: Unidades en las que se especifica el valor ancla x. Un valor de 'fracción'
   * indica que el valor de x es una fracción del icono.
   * Un valor de 'píxeles' indica el valor x en píxeles.
   * Por defecto: fraction.
   * - anchorYUnits: Unidades en las que se especifica el valor ancla y. Un valor de 'fracción'
   * indica que el valor y es una fracción del icono.
   * Un valor de 'píxeles' indica el valor y en píxeles.
   * Por defecto: fraction.
   * - color: Color para matizar el icono. Si no se especifica, el icono se dejará como está.
   * - offset: Offset que, junto con size y offsetOrigin, define el subrectángulo
   * que se usará de la imagen original (sprite).
   * - offsetOrigin: Origen del desplazamiento:
   * "bottom-left", "bottom-right", "top-left" or "top-right".
   * - size: Tamaño del icono en píxeles. Se usa junto con el desplazamiento para
   * definir el subrectángulo que se usará de la imagen original (sprite).
   *
   * @api stable
   */
  constructor(options = {}) {
    // super call
    super({
      anchor: !options.anchor ? undefined : options.anchor.slice(),
      anchorOrigin: options.anchorOrigin,
      anchorXUnits: options.anchorXUnits,
      anchorYUnits: options.anchorYUnits,
      crossOrigin: options.crossOrigin || null,
      color: (options.color && options.color.slice)
        ? options.color.slice()
        : options.color || undefined,
      src: options.src,
      offset: !options.offset ? undefined : options.offset.slice(),
      offsetOrigin: options.offsetOrigin,
      size: !options.size ? undefined : options.size.slice(),
      // imgSize: options.imgSize,
      opacity: options.opacity,
      scale: options.scale,
      // snapToPixel: options.snapToPixel,
      rotation: options.rotation,
      rotateWithView: options.rotateWithView,
    });
  }

  /**
   * Clona el estilo.
   * @public
   * @function
   * @returns {Icon} Devuelve un "new Icon".
   */
  clone() {
    return new Icon({
      anchor: this.anchor_.slice(),
      anchorOrigin: this.anchorOrigin_,
      anchorXUnits: this.anchorXUnits_,
      anchorYUnits: this.anchorYUnits_,
      crossOrigin: this.crossOrigin_,
      color: (this.color_ && this.color_.slice) ? this.color_.slice() : this.color_ || undefined,
      src: this.getSrc(),
      offset: this.offset_.slice(),
      offsetOrigin: this.offsetOrigin_,
      size: this.size_ !== null ? this.size_.slice() : undefined,
      opacity: this.getOpacity(),
      scale: this.getScale(),
      // snapToPixel: this.getSnapToPixel(),
      rotation: this.getRotation(),
      rotateWithView: this.getRotateWithView(),
    });
  }

  /**
   * Sobrescribe el tamaño.
   * @public
   * @function
   * @param {Array} value Array con los tamaños.
   */
  set size(value) {
    this.size_ = Array.isArray(value) ? value : null;
  }

  /**
   * Sobrescribe la propiedad "anchor".
   * @public
   * @function
   * @param {Array} value Array con los tamaños.
   */
  set anchor(value) {
    this.anchor_ = Array.isArray(value) ? value : null;
  }

  /**
   * Sobrescribe el origen.
   * @public
   * @function
   * @param {Array} value Array con los tamaños.
   */
  set origin(value) {
    this.origin_ = Array.isArray(value) ? value : null;
  }
}

export default Icon;
