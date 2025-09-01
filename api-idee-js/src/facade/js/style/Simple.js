/**
 * @module IDEE/style/Simple
 */
import { defineFunctionFromString, isDynamic, drawDynamicStyle } from '../util/Utils';
import StyleFeature from './Feature';
import { getValue } from '../i18n/language';

/**
 * @classdesc
 * Esta clase genera estilos simples.
 * @api
 * @extends {IDEE.style.feature}
 */
class Simple extends StyleFeature {
  /**
   * Este método aplica los estilos a los objetos geográficos.
   * @function
   * @public
   *
   * @param {Object} layer Capa.
   * @param {Boolean} applyToFeature Define si se aplicará a
   * los objetos geográficos.
   * @param {Boolean} isNullStyle Si es estilo es null.
   * @api
   */
  apply(layer, applyToFeature, isNullStyle) {
    // eslint-disable-next-line no-console
    console.warn(getValue('exception').simple_deprecated);

    this.layer_ = layer;
    this.getImpl().applyToLayer(layer);
    if (applyToFeature === true) {
      if (isNullStyle) {
        layer.getFeatures().forEach((featureVar) => {
          const feature = featureVar;
          feature.style = null;
        });
      } else {
        layer.getFeatures().forEach((featureVar) => {
          const feature = featureVar;
          feature.setStyle(this.clone());
        });
      }
    }
    this.updateCanvas();
  }

  /**
   * Este método devuelve un canvas generado
   * con datos pasados por url.
   *
   * @function
   * @public
   * @returns {String} Canvas.
   * @api
   */
  toImage() {
    let styleImgB64 = super.toImage();
    const options = {
      fill: this.options_.fill,
      stroke: this.options_.stroke,
    };
    if (isDynamic(options) === true) {
      styleImgB64 = drawDynamicStyle(this.canvas_);
    }

    return styleImgB64;
  }

  /**
   * Este método devuelve el orden del estilo.
   * @constant
   * @public
   * @returns {IDEE.style.Simple} Devuelve el orden.
   * @api
   */
  get ORDER() {
    return 1;
  }

  /**
   * Este método devuelve la desesialización de una instancia serializada.
   * @function
   * @public
   * @param {string} serializedStyle Estilo serializado.
   * @param {string} className Nombre de clase con estilo.
   * @returns {IDEE.style.Simple} Devuelve la desesialización.
   *
   * @api
   */
  static deserialize(serializedParams, className) {
    const parameters = defineFunctionFromString(serializedParams);
    const parameterArgs = parameters.map((p, i) => `arg${i}`);
    const parameterArgsString = parameterArgs.reduce((acc, param) => acc.concat(', ').concat(param));
    /* eslint-disable */
    const styleFn = new Function(parameterArgs, `return new ${className}(${parameterArgsString})`);
    /* eslint-enable */
    return styleFn(...parameters);
  }
}

export default Simple;
