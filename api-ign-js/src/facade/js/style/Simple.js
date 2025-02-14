/**
 * @module M/style/Simple
 */
import { defineFunctionFromString, isDynamic, drawDynamicStyle } from '../util/Utils';
import StyleFeature from './Feature';

/**
 * @classdesc
 * Esta clase genera estilos simples.
 * @api
 * @extends {M.style.feature}
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
   * @returns {M.style.Simple} Devuelve el orden.
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
   * @returns {M.style.Simple} Devuelve la desesialización.
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
