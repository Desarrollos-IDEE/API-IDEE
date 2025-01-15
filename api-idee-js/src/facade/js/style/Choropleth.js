/**
 * @module M/style/Choropleth
 */
import StyleBase from './Style';
import StyleComposite from './Composite';
import * as StyleQuantification from './Quantification';
import {
  isUndefined, isArray, isNullOrEmpty, isString, extendsObj, stringifyFunctions,
  defineFunctionFromString, generateColorScale,
} from '../util/Utils';
import Exception from '../exception/exception';
import * as Filter from '../filter/Filter';
import StyleCluster from './Cluster';
import StyleProportional from './Proportional';
import { getValue } from '../i18n/language';
import Generic from './Generic';

/**
 * Precisión de los números en el "canvas".
 * @constant
 * @api
 */
const ACCURACY_NUMBER_CANVAS = 2;

/**
 * Devuelve el cálculo de los números del "canva".
 * con una precisión dada.
 *  @function
 */
const calcCanvasNumber = (number) => {
  const powPrecision = 10 ** ACCURACY_NUMBER_CANVAS;
  return Math.round(number * powPrecision) / powPrecision;
};

/**
 * @classdesc
 * Crea una coropleta de estilo
 * con parámetros especificados por el usuario.
 *
 * @property {String} attributeName_ Nombre del atributo.
 * @property {M.quantification|function} quantification_ Cuantificación.
 * @property {Array<Number>} breakPoints_ Puntos de "puntos de ruptura".
 * @property {Array<Style.Simple>} choroplethStyles_ Estilos de coropletas.
 * @property {String} borderColor Color del borde.
 *
 * @api
 * @extends {M.style.Composite}
 */
class Choropleth extends StyleComposite {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {String} attributeName Nombre del atributo.
   * @param {Array<Style>} styles Estilos.
   * @param {Style.quantification} quantification Cuantificación.
   * @param {object} options Opciones.
   * @api
   */
  constructor(attributeName, styles, quantification = StyleQuantification.JENKS(), options = {}) {
    super(options, {});
    if (isNullOrEmpty(attributeName)) {
      Exception(getValue('exception').no_attr_name);
    }

    /**
     * Nombre del atributo.
     */
    this.attributeName_ = attributeName;

    /**
     * Estilos de coropletas.
     */
    this.choroplethStyles_ = styles;

    /**
     * Cuantificación.
     */
    this.quantification_ = quantification;

    /**
     * Puntos de "puntos de ruptura".
     */
    this.breakPoints_ = [];

    /**
     * Color del borde.
     */
    this.borderColor = options.borderColor;
  }

  /**
   * Este método aplica el estilo especificado a la capa.
   * @function
   * @public
   * @param {M.Layer.Vector} layer Capa.
   * @api
   */
  applyInternal(layer) {
    this.layer_ = layer;
    this.update_();
  }

  /**
   * Este método devuelve el nombre del atributo.
   * @function
   * @public
   * @return {String} Nombre del atributo.
   * @api
   */
  getAttributeName() {
    return this.attributeName_;
  }

  /**
   * Modifica el atributo.
   * @function
   * @public
   * @param {String} attributeName Nuevo nombre.
   * @api
   */
  setAttributeName(attributeName) {
    this.attributeName_ = attributeName;
    this.update_();
    this.refresh();
    return this;
  }

  /**
   * Devuelve la cuantificación.
   * @function
   * @public
   * @return {Style.quantification|function} Devuelve la cuantificación.
   * @api
   */
  getQuantification() {
    return this.quantification_;
  }

  /**
   * Modifica la cuantificación.
   * @function
   * @public
   * @param {Style.quantification|function} quantification Modifica la cuantificación.
   * @return {M.style.Choropleth} "this".
   * @api
   */
  setQuantification(quantification) {
    this.quantification_ = quantification;
    if (!this.choroplethStyles_.some((style) => isString(style))) {
      const dataValues = this.getValues();
      if (this.choroplethStyles_.length < this.quantification_(dataValues).length) {
        const [startStyle, endStyle] = this.choroplethStyles_;
        const geomType = this.layer_.getGeometryType().toLowerCase();
        let startColor = startStyle.get('fill.color') ? startStyle.get('fill.color') : startStyle.get(`${geomType}.fill.color`);
        let endColor = endStyle.get('fill.color') ? endStyle.get('fill.color') : endStyle.get(`${geomType}.fill.color`);
        if (isNullOrEmpty(startColor)) {
          startColor = startStyle.get('stroke.color');
        }
        if (isNullOrEmpty(endColor)) {
          endColor = endStyle.get('stroke.color');
        }
        this.choroplethStyles_ = [startColor, endColor];
      } else {
        this.choroplethStyles_ = this.choroplethStyles_
          .slice(0, this.quantification_(dataValues).length);
      }
      this.update_();
      this.refresh();
    }
    return this;
  }

  /**
   * Devuelve el estilos de coropletas.
   * @function
   * @public
   * @return {Array(Style)|null} Estilos de coropletas.
   * @api
   */
  getChoroplethStyles() {
    return this.choroplethStyles_;
  }

  /**
   * Modifica el estilo.
   * @function
   * @public
   * @param {Array<StylePoint>|Array<StyleLine>|Array<StylePolygon>} styles Estilo.
   * @return {M.style.Choropleth} "this".
   * @api
   */
  setStyles(stylesParam) {
    let styles = stylesParam;
    if (!isArray(styles)) {
      styles = [styles];
    }
    this.choroplethStyles_ = styles;
    this.update_();
    this.refresh();
    return this;
  }

  /**
   * Actualiza el canvas.
   * @public
   * @function
   * @api
   */
  updateCanvas() {
    if (!isNullOrEmpty(this.choroplethStyles_)) {
      if (this.breakPoints_.length > 0) {
        const canvasImages = [];
        this.updateCanvasPromise_ = new Promise((success, fail) => {
          this.loadCanvasImages_(0, canvasImages, success);
        });
      }
    }
  }

  /**
   * Genera el "canvas".
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @function
   * @public
   * @param {Number} currentIndex Índice.
   * @param {Array} canvasImages Imagen.
   * @param {Function} callbackFn Función "callbackFn".
   * @api
   */
  loadCanvasImages_(currentIndex, canvasImages, callbackFn) {
    // base case
    if (currentIndex === this.choroplethStyles_.length) {
      this.drawGeometryToCanvas(canvasImages, callbackFn);
    } else {
      // recursive case
      let startLimit = -1;
      if (currentIndex > 0) {
        startLimit = Number(this.breakPoints_[currentIndex - 1].toFixed(1));
      }
      const endLimit = Number(this.breakPoints_[currentIndex].toFixed(1));
      const image = new Image();
      image.crossOrigin = 'Anonymous';
      image.onload = () => {
        canvasImages.push({
          image,
          startLimit: calcCanvasNumber(startLimit),
          endLimit: calcCanvasNumber(endLimit),
        });
        this.loadCanvasImages_((currentIndex + 1), canvasImages, callbackFn);
      };
      image.onerror = () => {
        canvasImages.push({
          startLimit: calcCanvasNumber(startLimit),
          endLimit: calcCanvasNumber(endLimit),
        });
        this.loadCanvasImages_((currentIndex + 1), canvasImages, callbackFn);
      };
      this.choroplethStyles_[currentIndex].updateCanvas();
      const imageSrc = this.choroplethStyles_[currentIndex].toImage();
      if (isString(imageSrc)) {
        image.src = imageSrc;
      } else {
        imageSrc.then((src) => {
          image.src = src;
        });
      }
    }
  }

  /**
   * Dibuja la geometría en el "canvas".
   *
   * @function
   * @public
   * @param {HTMLCanvasElement} canvasImages "Canvas".
   * @param {Function} callbackFn Función "callbackFn".
   * @api
   */
  drawGeometryToCanvas(canvasImages, callbackFn) {
    const heights = canvasImages.map((canvasImage) => canvasImage.image.height);
    const widths = canvasImages.map((canvasImage) => canvasImage.image.width);

    const vectorContext = this.canvas_.getContext('2d');
    vectorContext.canvas.height = heights.reduce((acc, h) => acc + h + 5);
    vectorContext.textBaseline = 'middle';

    const maxWidth = Math.max.apply(widths, widths);

    canvasImages.forEach((canvasImage, index) => {
      const image = canvasImage.image;
      const startLimit = canvasImage.startLimit;
      const endLimit = canvasImage.endLimit;

      let coordinateY = 0;
      const prevHeights = heights.slice(0, index);
      if (!isNullOrEmpty(prevHeights)) {
        coordinateY = prevHeights.reduce((acc, h) => acc + h + 5);
        coordinateY += 5;
      }
      let imageHeight = 0;
      if (!isNullOrEmpty(image)) {
        imageHeight = image.height;
        vectorContext.drawImage(image, 0, coordinateY);
      }
      if (startLimit < 0) {
        vectorContext.fillText(` x  <=  ${endLimit}`, maxWidth + 5, coordinateY + (imageHeight / 2));
      } else if (this.quantification_.name === 'media_sigma' && endLimit === Number(Math.max(...this.getValues()).toFixed(1))) {
        vectorContext.fillText(`${startLimit} <= x`, maxWidth + 5, coordinateY + (imageHeight / 2));
      } else {
        vectorContext.fillText(`${startLimit} <  x  <=  ${endLimit}`, maxWidth + 5, coordinateY + (imageHeight / 2));
      }
    }, this);

    callbackFn();
  }

  /**
   * Este método obtiene los valores numéricos de los objetos geográficos de la capa cuyo atributo
   * es igual al atributo especificado por el usuario.
   * @function
   * @public
   * @return {Array<number>} Valores numéricos de las características de la capa.
   * @api
   */
  getValues() {
    const values = [];
    if (!isNullOrEmpty(this.layer_)) {
      this.layer_.getFeatures().forEach((f) => {
        try {
          const value = parseFloat(f.getAttribute(this.attributeName_));
          if (!Number.isNaN(value)) {
            values.push(value);
          }
        } catch (e) {
          // Exception('TODO el atributo no es un número válido');
        }
      }, this);
    }
    return values;
  }

  /**
   * Este método actualiza el estilo.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @function
   * @public
   * @api
   */
  update_() {
    if (!isNullOrEmpty(this.layer_)) {
      const features = this.layer_.getFeatures();
      if (!isNullOrEmpty(features)) {
        const dataValues = this.getValues();
        if (isNullOrEmpty(this.choroplethStyles_) || (!isNullOrEmpty(this.choroplethStyles_)
            && (isString(this.choroplethStyles_[0]) || isString(this.choroplethStyles_[1])))) {
          this.breakPoints_ = this.quantification_(dataValues);
          const colors = this.choroplethStyles_ || [];
          if (isUndefined(colors[0])) {
            colors.push(Choropleth.START_COLOR_DEFAULT);
          }
          if (isUndefined(colors[1])) {
            colors.push(Choropleth.END_COLOR_DEFAULT);
          }
          const numColors = this.breakPoints_.length;
          let scaleColor = generateColorScale(colors, numColors);
          if (!isArray(scaleColor)) {
            scaleColor = [scaleColor];
          }
          const generateStyle = (scale, defaultStyle) => (scale
            .map((c) => defaultStyle(c, this.borderColor)));
          this.choroplethStyles_ = generateStyle(scaleColor, Choropleth.DEFAULT_STYLE);
        } else {
          this.breakPoints_ = this.quantification_(dataValues, this.choroplethStyles_.length);
        }
      }
      for (let i = this.breakPoints_.length - 1; i > -1; i -= 1) {
        const filterLTE = new Filter.LTE(this.attributeName_, this.breakPoints_[i]);
        filterLTE.execute(features).forEach((f) => f.setStyle(this.choroplethStyles_[i]));
      }
      this.updateCanvas();
    }
  }

  /**
   * Este método devuelve un estilo de punto por defecto.
   * @function
   * @public
   * @param {String} c Color en formato hexadecimal.
   * @return {Style.Point} Estilo.
   * @api
   */
  static DEFAULT_STYLE(c, borderColor) {
    return new Generic({
      point: {
        fill: {
          color: c,
          opacity: 1,
        },
        stroke: {
          color: borderColor || 'black',
          width: 1,
        },
        radius: 5,
      },
      line: {
        fill: {
          color: c,
          opacity: 1,
        },
        stroke: {
          color: borderColor || 'black',
          width: 1,
        },
      },
      polygon: {
        fill: {
          color: c,
          opacity: 1,
        },
        stroke: {
          color: borderColor || 'black',
          width: 1,
        },
      },
    });
  }

  /**
   * Añade el estilo.
   * @function
   * @public
   * @param {Object} stylesParam Estilo.
   * @api
   */
  add(stylesParam) {
    let styles = stylesParam;
    if (!isArray(styles)) {
      styles = [styles];
    }
    styles = styles.filter((style) => {
      return style instanceof StyleCluster || style instanceof StyleProportional;
    });
    return super.add(styles);
  }

  /**
   * Este método devuelve el orden, 2.
   * @constant
   * @public
   * @returns {Number} Orden 2.
   * @api
   */
  get ORDER() {
    return 2;
  }

  /**
   * Este método implementa el mecanismo para
   * generar el JSON de esta instancia.
   *
   * @public
   * @return {object} Devuelve parámetros y el método para deserializar.
   * @function
   * @api
   */
  toJSON() {
    const attributeName = this.getAttributeName();
    const styles = this.getChoroplethStyles().map((style) => style.serialize());
    let quantification = this.getQuantification();
    if (isNullOrEmpty(quantification.name)) {
      quantification = stringifyFunctions(quantification);
    } else {
      quantification = quantification.name;
    }
    let options = extendsObj({}, this.getOptions());
    options = stringifyFunctions(options);
    const compStyles = this.getStyles().map((style) => style.serialize());

    const parameters = [attributeName, styles, quantification, options, compStyles];
    const deserializedMethod = 'M.style.Choropleth.deserialize';
    return { parameters, deserializedMethod };
  }

  /**
   * Esta método de la clase devuelve la instancia de estilo de la serialización.
   * @function
   * @public
   * @param {Array} parametrers Parámetros para deserializar
   * ("serializedAttributeName", "serializedStyles",
   * "serializedQuantification", "serializedOptions", "serializedCompStyles").
   * @return {M.style.Choropleth} Devuelve los estilos del objeto "Choropleth".
   */
  static deserialize([serializedAttributeName, serializedStyles,
    serializedQuantification, serializedOptions, serializedCompStyles,
  ]) {
    const attributeName = serializedAttributeName;
    const styles = serializedStyles.map((serializedStyle) => StyleBase
      .deserialize(serializedStyle));
    let quantification;
    if (serializedQuantification === 'jenks') {
      quantification = StyleQuantification.JENKS();
    } else if (serializedQuantification === 'quantile') {
      quantification = StyleQuantification.QUANTILE();
    } else if (serializedQuantification === 'equal_interval') {
      quantification = StyleQuantification.EQUAL_INTERVAL();
    } else if (serializedQuantification === 'geometric_progression') {
      quantification = StyleQuantification.GEOMETRIC_PROGRESSION();
    } else if (serializedQuantification === 'arithmetic_progression') {
      quantification = StyleQuantification.ARITHMETIC_PROGRESSION();
    } else if (serializedQuantification === 'media_sigma') {
      quantification = StyleQuantification.MEDIA_SIGMA();
    } else {
      quantification = defineFunctionFromString(serializedQuantification);
    }
    const options = defineFunctionFromString(serializedOptions);
    /* eslint-disable */
    const styleFn = new Function(['attributeName', 'styles', 'quantification', 'options'], `return new M.style.Choropleth(attributeName, styles, quantification, options)`);
    /* eslint-enable */
    const deserializedStyle = styleFn(attributeName, styles, quantification, options);

    const compStyles = serializedCompStyles.map((serializedStyle) => StyleBase
      .deserialize(serializedStyle));
    deserializedStyle.add(compStyles);

    return deserializedStyle;
  }
}

/** Colores por defecto, "start".
 * @constant
 * @api
 */
Choropleth.START_COLOR_DEFAULT = 'red';

/**
 * Colores por defecto, "end".
 * @constant
 * @api
 */
Choropleth.END_COLOR_DEFAULT = 'brown';

export default Choropleth;
