/**
 * @module M/style/Proportional
 */
import StyleBase from './Style';
import StyleComposite from './Composite';
import StylePoint from './Point';
import StyleSimple from './Simple';
import StyleGeneric from './Generic';
import StyleChoropleth from './Choropleth';
import {
  isNullOrEmpty, extendsObj, stringifyFunctions, defineFunctionFromString, isArray,
  isNull,
} from '../util/Utils';
import Exception from '../exception/exception';
import { getValue } from '../i18n/language';

/**
 * Este método devuelve el valos mínimo y máximo de un objeto geográfico.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 * @function
 * @public
 * @param {Array<M.Feature>} features Matriz de objetos geográficos.
 * @param {String} attributeName Nombre de los atributos con estilos.
 * @api
 */
export const getMinMaxValues = (features, attributeName) => {
  let [minValue, maxValue] = [undefined, undefined];
  const filteredFeatures = features.filter((feature) => {
    return ![NaN, undefined, null].includes(feature.getAttribute(attributeName));
  }).map((f) => parseInt(f.getAttribute(attributeName), 10));
  let index = 1;
  if (!isNullOrEmpty(filteredFeatures)) {
    minValue = filteredFeatures[0];
    maxValue = filteredFeatures[0];
    while (index < filteredFeatures.length - 1) {
      const posteriorValue = filteredFeatures[index + 1];
      minValue = (minValue < posteriorValue) ? minValue : posteriorValue;
      maxValue = (maxValue < posteriorValue) ? posteriorValue : maxValue;
      index += 1;
    }
  }
  return [minValue, maxValue];
};

/**
 * Función de "Flannery".
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 * @public
 * @param {String} value Valor.
 * @param {String} minValue Valor mínimo.
 * @param {String} maxValue Valor máximo.
 * @param {String} minRadius Radio mínimo.
 * @param {String} maxRadius Radio máximo.
 * @returns {Number} Valor de la escala tras realizar la función "flannery".
 * @api
 */
const flanneryScalingFunction = ((value, minValue, maxValue, minRadius, maxRadius) => {
  const logaritmos = Math.log(value);
  const prod = logaritmos * 0.57;
  const antilog = Math.exp(prod);
  const vu = Math.exp((Math.log(maxValue) * 0.57)) / maxRadius;
  return antilog / vu;
});

/**
 * Función proporcional por defecto.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 * @public
 * @param {String} value Valor.
 * @param {String} minValue Valor mínimo.
 * @param {String} maxValue Valor máximo.
 * @param {String} minRadius Radio mínimo.
 * @param {String} maxRadius Radio máximo.
 * @returns {Number} Valor proporcional.
 * @api
 */
const defaultProportionalFunction = ((value, minValue, maxValue, minRadius, maxRadius) => {
  return (((value - minValue) * (maxRadius - minRadius)) / (maxValue - minValue)) + minRadius;
});

/**
 * @classdesc
 * Constructor principal de la clase. Crea un estilo Proporcional
 * con parámetros especificados por el usuario.
 *
 * @property {String} attributeName_ Nombre del atributo.
 *
 * @api
 * @extends {M.Style}
 */
class Proportional extends StyleComposite {
  /**
   * Constructor principal.
   * @constructor
   *
   * @param {String} attributeName Nombre del atributo.
   * @param {number} minRadius Radio mínimo.
   * @param {number} maxRadius Radio máximo.
   * @param {StylePoint} style Estilos.
   * @param {object} proportionalFunction Valor proporcional.
   * @param {object} options Estas opciones se mandarán a la implementación.
   * - icon: Valores del icono, como puede ser el src.
   * - flannery: Valor del "flannery".
   * - minRadius: Radio mínimo.
   * - maxRadius: Radio máximo.
   * - minValue: Valor mínimo.
   * - maxValue: Valor máximo.
   * @api
   */
  constructor(attributeName, minRadius, maxRadius, style, proportionalFunction, options = {}) {
    super(options, {});

    if (isNullOrEmpty(attributeName)) {
      Exception(getValue('exception').no_attr_name);
    }

    /**
     * Nombre del atributo.
     * @public
     * @type {String}
     * @api
     * @expose
     */
    this.attributeName_ = attributeName;

    /**
     * El radio mínimo de la proporcionalidad.
     * @private
     * @type {number}
     * @api
     * @expose
     */
    this.minRadius_ = parseInt(minRadius, 10) || 5;

    /**
     * El radio máximo de la proporcionalidad.
     * @private
     * @type {number}
     * @api
     * @expose
     */
    this.maxRadius_ = parseInt(maxRadius, 10) || 15;

    /**
     * El punto de estilo definido por el usuario..
     * @private
     * @type {M.Style}
     * @api
     * @expose
     */
    this.style_ = style;

    /**
     * La función de proporcionalidad.
     * @private
     * @type {function}
     * @api
     * @expose
     */
    this.proportionalFunction_ = proportionalFunction || (this.options_.flannery === true
      ? flanneryScalingFunction
      : defaultProportionalFunction);

    if (this.maxRadius_ < this.minRadius_) {
      this.minRadius_ = maxRadius;
      this.maxRadius_ = minRadius;
    }

    if (!isNullOrEmpty(this.style_)) {
      this.styles_.push(this.style_);
    }
  }

  /**
   * Este método aplica el estilo a la capa especificada.
   * @function
   * @public
   * @param {M.Layer.Vector} layer Capa donde aplicar el estilo de coropletas.
   * @api
   */
  applyInternal(layer) {
    this.layer_ = layer;
    this.update_();
  }

  /**
   * Este método aplica el estilo a los objetos geográficos especificados.
   * @function
   * @public
   * @param {M.Layer.Vector} feature Objeto geográfico.
   * @api
   */
  applyToFeature(feature, resolution) {
    let style = this.style_;
    if (isNullOrEmpty(style)) {
      style = feature.getStyle() ? feature.getStyle() : this.layer_.getStyle();
    }
    if (!isNullOrEmpty(style)) {
      const options = style.getOptions();
      const vendorOptions = style.getImpl().vendorOptions;
      if (style instanceof StyleGeneric) {
        style = new StylePoint(options.point, vendorOptions);
      } else if (!(style instanceof StylePoint) && style instanceof StyleSimple) {
        style = new StylePoint(options, vendorOptions);
      } else if (style instanceof StyleChoropleth) {
        style = new StylePoint(options);
      } else if (style instanceof StyleComposite) {
        style = new StylePoint(style.getOldStyle().getOptions());
      }
      const newStyle = this.calculateStyle_(feature, {
        minRadius: this.minRadius_,
        maxRadius: this.maxRadius_,
        minValue: this.minValue_,
        maxValue: this.maxValue_,
      }, style);
      feature.setStyle(newStyle);
    }
  }

  /**
   * Actualiza los estilos.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @function
   * @public
   * @api
   */
  update_() {
    if (!isNullOrEmpty(this.layer_)) {
      if (!isNullOrEmpty(this.style_)) {
        this.layer_.setStyle(this.style_, true);
      }
      if (this.layer_.getStyle() instanceof StyleChoropleth) {
        this.oldStyle_ = this.layer_.getStyle();
      } else if (this.layer_.getStyle() instanceof StyleComposite) {
        this.oldStyle_ = this.layer_.getStyle().getOldStyle();
      } else {
        this.oldStyle_ = this.layer_.getStyle();
      }
      // this.oldStyle_ = this.layer_.getStyle() instanceof StyleComposite ? this.layer_.getStyle()
      //   .getOldStyle() : this.layer_.getStyle();
      const minMaxValues = getMinMaxValues(this.layer_.getFeatures(), this.attributeName_);
      [this.minValue_, this.maxValue_] = minMaxValues;
      this.layer_.getFeatures().forEach((feature) => this.applyToFeature(feature, 1));
      const newStyle = this.oldStyle_.clone();
      if (newStyle instanceof StyleSimple) {
        newStyle.set('zindex', (feature) => (this.maxValue_ - parseFloat(feature.getAttribute(this.attributeName_))));
        newStyle.set(Proportional.getSizeAttribute(newStyle), (feature) => {
          const weigh = Proportional.SCALE_PROPORTION;
          const value = feature.getAttribute(this.attributeName_);
          const args = [value, this.minValue_, this.maxValue_, this.minRadius_, this.maxRadius_];
          let radius = this.proportionalFunction_(...args);
          if (Proportional.getSizeAttribute(this.oldStyle_) === 'icon.scale') {
            const weighMinRadius = this.minRadius_ / weigh;
            const weighMaxRadius = this.maxRadius_ / weigh;
            const args2 = [value, this.minValue_, this.maxValue_, weighMinRadius, weighMaxRadius];
            radius = this.proportionalFunction_(...args2);
          }
          return radius;
        });
        this.updateCanvas();
      }
    }
  }

  /**
   * Este método devuelve el nombre de los atributos.
   * @function
   * @public
   * @return {String} Atributos.
   * @api
   */
  getAttributeName() {
    return this.attributeName_;
  }

  /**
   * Este método define los atributos.
   * @function
   * @public
   * @param {String} attributeName Atributos.
   * @api
   */
  setAttributeName(attributeName) {
    this.attributeName_ = attributeName;
    this.update_();
    return this;
  }

  /**
   * Esta función devuelve el punto de estilo definido por el usuario.
   * @function
   * @public
   * @return {StylePoint} Punto de estilo de cada objeto geográfico.
   * @deprecated
   */

  /* eslint no-console: ["error", {allow: ["warn", "error"]}] */

  getStyle() {
    console.warn('Deprecated function: Use getStyles instead.');
    return this.style_;
  }

  /**
   * Este método establece el estilo definido por el usuario.
   * @function
   * @public
   * @param {StylePoint} style Estilos.
   * @api
   */
  setStyle(style) {
    this.style_ = style;
    this.update_();
    return this;
  }

  /**
   * Este método obtiene el radio mínimo del punto de estilo.
   * @function
   * @public
   * @return {number} Radio mínimo.
   * @api
   */
  getMinRadius() {
    return this.minRadius_;
  }

  /**
   * Este método establece la función proporcional.
   * @function
   * @public
   * @param {function} proportionalFunction Función proporcional.
   * @api
   */
  setProportionalFunction(proportionalFunction) {
    this.proportionalFunction_ = proportionalFunction;
    this.update_();
  }

  /**
   * Este método obtiene una función proporcional.
   * @function
   * @public
   * @return {number} Radio mínimo del punto de estilo.
   * @api
   */
  getProportionalFunction() {
    return this.proportionalFunction_;
  }

  /**
   * Este método establece el radio mínimo del punto de estilo.
   * @function
   * @public
   * @param {number} minRadius Radio mínimo del punto de estilo.
   * @return {Object} Devuelve el valor de "this".
   * @api
   */
  setMinRadius(minRadius) {
    this.minRadius_ = parseInt(minRadius, 10);
    if (minRadius >= this.maxRadius_) {
      // this.maxRadius_ = minRadius + 10;
      Exception(getValue('exception').min_gt_max);
    }
    this.update_();
    return this;
  }

  /**
   * Esta función obtiene el radio máximo del punto de estilo.
   * @function
   * @public
   * @return {number} Radio máximo.
   * @api
   */
  getMaxRadius() {
    return this.maxRadius_;
  }

  /**
   * Este método establece el radio máximo del punto.
   * @function
   * @public
   * @param {number} maxRadius Radio máximo del punto.
   * @api
   */
  setMaxRadius(maxRadius) {
    this.maxRadius_ = parseInt(maxRadius, 10);
    if (maxRadius <= this.minRadius_) {
      // this.minRadius_ = maxRadius - 10;
      Exception(getValue('exception').max_lt_min);
    }
    this.update_();
    return this;
  }

  isValidVendorOptions(vendorOptions) {
    let valid = false;
    if (!isNull(vendorOptions)) {
      let opts = vendorOptions;
      if (isArray(vendorOptions)) {
        opts = vendorOptions[0];
      }
      valid = Object.keys(opts).length > 0;
    }
    return valid;
  }

  /**
   * Esta función actualiza el "canvas" de estilo.
   *
   * @function
   * @public
   * @api
   */
  updateCanvas() {
    this.updateCanvasPromise_ = new Promise((success, fail) => {
      if (!isNullOrEmpty(this.layer_)) {
        const styleSimple = this.styles_.find((style) => style instanceof StyleSimple);
        let style = !isNullOrEmpty(styleSimple) ? styleSimple : this.layer_.getStyle();
        style = !isNullOrEmpty(style) ? style : this.style_;

        if (style instanceof StyleSimple) {
          let featureStyle = style.clone();
          const options = featureStyle.getOptions();
          const vendorOptions = featureStyle.getImpl().vendorOptions;
          if ((featureStyle instanceof StyleGeneric)) {
            featureStyle = new StylePoint(options.point, vendorOptions);
          } else if (!(featureStyle instanceof StylePoint)) {
            featureStyle = new StylePoint(options, vendorOptions);
          }
          const sizeAttribute = Proportional.getSizeAttribute(featureStyle);

          const styleMax = featureStyle.clone();
          const styleMin = featureStyle.clone();
          const maxRadius = this.getMaxRadius();
          const minRadius = this.getMinRadius();
          let imageMax;
          let imageMin;
          if (this.isValidVendorOptions(vendorOptions)) {
            const olStylesMax = styleMax.getImpl().olStyleFn();
            const olStylesMin = styleMin.getImpl().olStyleFn();
            if (isArray(olStylesMax)) {
              olStylesMax.forEach((s) => this.setRadiusOlStyle(s, maxRadius));
              imageMax = styleMax.getImpl().olStyleFn()[0].getImage().getImage()
                .toDataURL();
            } else {
              this.setRadiusOlStyle(olStylesMax, maxRadius);
              imageMax = styleMax.getImpl().olStyleFn().getImage().getImage()
                .toDataURL();
            }
            if (isArray(olStylesMin)) {
              olStylesMin.forEach((s) => this.setRadiusOlStyle(s, minRadius));
              imageMin = styleMin.getImpl().olStyleFn()[0].getImage().getImage()
                .toDataURL();
            } else {
              this.setRadiusOlStyle(olStylesMin, minRadius);
              imageMin = styleMin.getImpl().olStyleFn().getImage().getImage()
                .toDataURL();
            }
          } else if (!isNullOrEmpty(options) && Object.keys(options).length > 0) {
            styleMax.set(sizeAttribute, maxRadius);
            imageMax = styleMax.toImage();
            styleMin.set(sizeAttribute, minRadius);
            imageMin = styleMin.toImage();
          }

          this.loadCanvasImage(maxRadius, imageMax, (canvasImageMax) => {
            this.loadCanvasImage(minRadius, imageMin, (canvasImageMin) => {
              this.drawGeometryToCanvas(canvasImageMax, canvasImageMin, success);
            });
          });
        } else if (!isNullOrEmpty(style)) {
          this.canvas_ = style.canvas;
          success();
        }
      }
    });
  }

  /**
   * Crea el canvas por medio de una imagen.
   *
   * @function
   * @public
   * @param {Object} value Estilo del canvas.
   * @param {String} url Ruta de la imagen.
   * @param {Function} callbackFn "callbackFn".
   */
  loadCanvasImage(value, url, callbackFn) {
    const image = new Image();
    image.crossOrigin = 'Anonymous';
    image.onload = () => {
      callbackFn({
        image,
        value,
      });
    };
    image.onerror = () => {
      callbackFn({
        value,
      });
    };
    image.src = url;
  }

  /**
   * Dibuja la geometría en el canvas.
   *
   * @function
   * @public
   * @param {CanvasRenderingContext2D} canvasImageMax Tamaño máximo del canvas.
   * @param {CanvasRenderingContext2D} canvasImageMin Tamaño mínimo del canvas.
   * @param {CanvasRenderingContext2D} callbackFn "callbackFn".
   * @api
   */

  drawGeometryToCanvas(canvasImageMax, canvasImageMin, callbackFn) {
    const maxImage = canvasImageMax.image;
    const minImage = canvasImageMin.image;

    this.canvas_.height = maxImage.height + 5 + minImage.height + 5;
    const vectorContext = this.canvas_.getContext('2d');
    vectorContext.textBaseline = 'middle';

    // MAX VALUE

    let coordXText = 0;
    let coordYText = 0;
    if (!isNullOrEmpty(maxImage)) {
      coordXText = maxImage.width + 5;
      coordYText = maxImage.height / 2;
      if (/^https?:\/\//i.test(maxImage.src)) {
        this.canvas_.height = 80 + 40 + 10;
        vectorContext.fillText(`  max: ${this.maxValue_}`, 85, 40);
        vectorContext.drawImage(maxImage, 0, 0, 80, 80);
      } else {
        vectorContext.fillText(`  max: ${this.maxValue_}`, coordXText, coordYText);
        vectorContext.drawImage(maxImage, 0, 0);
      }
    }

    // MIN VALUE

    if (!isNullOrEmpty(minImage)) {
      let coordinateX = 0;
      if (!isNullOrEmpty(maxImage)) {
        coordinateX = (maxImage.width / 2) - (minImage.width / 2);
      }
      const coordinateY = maxImage.height + 5;
      coordYText = coordinateY + (minImage.height / 2);
      if (/^https?:\/\//i.test(minImage.src)) {
        vectorContext.fillText(`  min: ${this.minValue_}`, 85, 105);
        vectorContext.drawImage(minImage, 20, 85, 40, 40);
      } else {
        vectorContext.fillText(`  min: ${this.minValue_}`, coordXText, coordYText);
        vectorContext.drawImage(minImage, coordinateX, coordinateY);
      }
    }
    callbackFn();
  }

  /**
   * Devuelve si es valor del atributo es "scale" o "radius".
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @function
   * @public
   * @return {string} Devuelve "icon.scale" o "icon.radius".
   * @api
   */
  static getSizeAttribute(style) {
    let sizeAttribute = 'radius';
    if (!isNullOrEmpty(style.get('icon'))) {
      if (!isNullOrEmpty(style.get('icon.src'))) {
        sizeAttribute = 'icon.scale';
      } else {
        sizeAttribute = 'icon.radius';
      }
    }
    return sizeAttribute;
  }

  /**
   * Este método devuelve el estilo proporcional del objeto geográfico.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @function
   * @public
   * @param {M.Feature} feature Objeto geográfico.
   * @param {object} options Valores: "minRadius", "maxRadius", "minValue" y "maxValue"
   * @param {StylePoint} styleVar Estilo.
   * @return {StyleSimple} Devuelve el objeto geográfico con el estilo.
   * @api
   */
  calculateStyle_(feature, options, styleVar) {
    const propFun = this.proportionalFunction_;
    let style = styleVar;
    if (!isNullOrEmpty(style)) {
      style = style.clone();
      let [minRadius, maxRadius] = [options.minRadius, options.maxRadius];
      if (!isNullOrEmpty(style.get('icon.src'))) {
        minRadius = options.minRadius / Proportional.SCALE_PROPORTION;
        maxRadius = options.maxRadius / Proportional.SCALE_PROPORTION;
      }
      const value = feature.getAttribute(this.attributeName_);
      if (value == null) {
        console.warn(`Warning: ${this.attributeName_} value is null or empty.`);
      }
      const radius = propFun(value, options.minValue, options.maxValue, minRadius, maxRadius);
      const zindex = options.maxValue - parseFloat(feature.getAttribute(this.attributeName_));
      const styleOptions = style.getOptions();
      const styleVendorOptions = style.getImpl().vendorOptions;
      if (this.isValidVendorOptions(styleVendorOptions)) {
        const olStyles = style.getImpl().olStyleFn();
        if (isArray(olStyles)) {
          olStyles.forEach((s) => this.setRadiusOlStyle(s, radius));
        } else {
          this.setRadiusOlStyle(olStyles, radius);
        }
      } else if (!isNullOrEmpty(styleOptions) && Object.keys(styleOptions).length > 0) {
        style.set(`${Proportional.getSizeAttribute(style)}`, radius);
        style.set('zindex', zindex);
      }
    }
    return style;
  }

  setRadiusOlStyle(olStyle, radius) {
    if (olStyle.getImage) {
      olStyle.getImage().setRadius(radius);
    }
  }

  /**
   * Este método define el orden del estilo.
   * @public
   * @returns {Number} Valor de 3.
   * @api
   */
  get ORDER() {
    return 3;
  }

  /**
   * Este método implementa los mecanismos para generar
   * el estilo en forma de JSON.
   *
   * @public
   * @return {object} JSON.
   * @function
   * @api
   */
  toJSON() {
    const attributeName = this.getAttributeName();
    const minRadius = this.getMinRadius();
    const maxRadius = this.getMaxRadius();
    const styles = this.getStyles().map((style) => style.serialize());
    const proportionalFunction = stringifyFunctions(this.getProportionalFunction());
    let options = extendsObj({}, this.getOptions());
    options = stringifyFunctions(options);
    const parameters = [attributeName, minRadius, maxRadius, styles, proportionalFunction, options];
    const deserializedMethod = 'M.style.Proportional.deserialize';
    return { parameters, deserializedMethod };
  }

  /**
   * Este método de la clase devuelve la deserialización del estilo.
   * @function
   * @public
   * @param {Array} parametrers Parámetros para deserializar:
   * - serializedAttributeName
   * - serializedMinRadius
   * - serializedMaxRadius
   * - serializedStyles
   * - serializedProportionalFunction
   * - serializedOptions
   * @return {M.style.Proportional}
   */
  static deserialize([serializedAttributeName, serializedMinRadius, serializedMaxRadius,
    serializedStyles, serializedProportionalFunction, serializedOptions,
  ]) {
    const attributeName = serializedAttributeName;
    const minRadius = serializedMinRadius;
    const maxRadius = serializedMaxRadius;
    const proportionalFunction = defineFunctionFromString(serializedProportionalFunction);
    const options = defineFunctionFromString(serializedOptions);

    /* eslint-disable */
    const styleFn = new Function(['attributeName', 'minRadius', 'maxRadius', 'style',
      'proportionalFunction', 'options'
    ], `return new M.style.Proportional(attributeName,
    minRadius, maxRadius, style, proportionalFunction, options)`);
    const deserializedStyle = styleFn(attributeName, minRadius, maxRadius, undefined, proportionalFunction, options);
    /* eslint-enable */

    const styles = serializedStyles.map((serializedStyle) => StyleBase
      .deserialize(serializedStyle));
    deserializedStyle.add(styles);

    return deserializedStyle;
  }
}

/**
 * Esta constante define la proporción de escala para iconstyle en Proporcional.
 * @constant
 * @public
 * @api
 */
Proportional.SCALE_PROPORTION = 20;

export default Proportional;
