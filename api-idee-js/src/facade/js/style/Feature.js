import { modifySVG } from 'IDEE/util/Utils';

/**
 * @module IDEE/style/Feature
 */
import StyleBase from './Style';

/**
 * @classdesc
 * Esta clase se encarga de actualizar los objetos geográficos.
 * @api
 * @extends {IDEE.style}
 */
class Feature extends StyleBase {
  /**
   * Constructor principal de la clase.
   * @constructor
   * @param {Object} options Parámetros.
   * - icon
   *    - src: Ruta.
   *    - stroke: Borde exterior.
   *    - fill: Color de relleno.
   * @param {Object} impl Implementación.
   * @api
   */
  constructor(options, impl) {
    super(options, impl);

    /**
     * Objeto geográfico.
     * @private
     * @type {IDEE.Feature}
     */
    this.feature_ = null;
  }

  /**
   * Este método aplica los estilos a los objetos geográficos.
   *
   * @public
   * @param {IDEE.Feature} feature Objeto geográfico.
   * @function
   * @api
   */
  applyToFeature(feature) {
    this.feature_ = feature;
    const style = feature.getStyle() ? feature.getStyle() : this.layer_.getStyle();
    let options = style.getOptions();
    if (options.point) {
      options = options.point;
    }
    if (options.icon && (options.icon.fill || options.icon.stroke) && options.icon.src
      && typeof options.icon.src === 'string' && options.icon.src.endsWith('.svg')) {
      modifySVG(options.icon.src, options).then((resp) => {
        options.icon.src = resp;
        this.applyToFeature(this.feature_);
      });
    } else {
      this.getImpl().applyToFeature(feature);
    }
  }
}

export default Feature;
