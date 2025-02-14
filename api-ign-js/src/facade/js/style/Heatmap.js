/**
 * @module M/style/Heatmap
 */
import HeatmapImpl from 'impl/style/Heatmap';
import Style from './Style';
import {
  isArray, isNullOrEmpty, isFunction, isString, inverseColor, generateIntervals,
  defineFunctionFromString,
} from '../util/Utils';
import Exception from '../exception/exception';
import { getValue } from '../i18n/language';

/**
 * @classdesc
 * Crea un mapa de calor de estilo
 * con parámetros especificados por el usuario.
 * @api
 * @extends {M.style}
 */
class Heatmap extends Style {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {string|function} attribute El atributo del objetos geográficos a utilizar
   * (entre 0 y 1).
   * @param {Mx.HeatmapStyleOptions} optionsParam Opciones del estilo.
   * - gradient. Degradado.
   * - blur. Difuminar.
   * - radius. Radio
   * - opacity. Opacidad.
   * - weight. Peso.
   * @param {object} vendorOptionsParam Opciones de la librería base.
   * - opacity: Opacidad.
   * @api
   */
  constructor(attribute, optionsParam = {}, vendorOptionsParam = {}) {
    const options = optionsParam;
    const vendorOptions = vendorOptionsParam;

    if (attribute && !(isString(attribute) || isFunction(attribute))) {
      Exception(getValue('exception').no_empty);
    }

    // extendsObj(options, Heatmap.DEFAULT_OPTIONS);

    if (!isNullOrEmpty(options.gradient) && !isArray(options.gradient)) {
      options.gradient = [options.gradient];
    }

    options.gradient = options.gradient || Heatmap.DEFAULT_OPTIONS.gradient;

    if (options.gradient.length < 2) {
      const inverseColorParam = inverseColor(options.gradient[0]);
      options.gradient.push(inverseColorParam);
    }

    options.blur = isNullOrEmpty(options.blur)
      ? Heatmap.DEFAULT_OPTIONS.blur
      : parseFloat(options.blur);
    options.radius = isNullOrEmpty(options.radius)
      ? Heatmap.DEFAULT_OPTIONS.radius
      : parseFloat(options.radius);
    options.weight = attribute;
    vendorOptions.opacity = Number.isNaN(parseFloat(vendorOptions.opacity))
      ? 1
      : parseFloat(vendorOptions.opacity);

    const impl = new HeatmapImpl(attribute, options, vendorOptions);

    // calls the super constructor
    super(options, impl);

    /**
     * @public
     * @type {string|function}
     * @api
     */
    this.attribute_ = attribute;

    /**
     * @private
     * @type {Mx.HeatmapStyleOptions}
     */
    this.options_ = options;

    /**
     * @private
     * @type {object}
     */
    this.vendorOptions_ = vendorOptions;
  }

  /**
   * Este método elimina los estilos.
   * @function
   * @public
   * @param {M.Layer.Vector} layer Capa.
   * @api
   */
  unapply(layer) {
    this.layer_ = null;
    this.getImpl().unapply(layer);
  }

  /**
   * Este método devuelve los atributos.
   * @function
   * @public
   * @return {string|function} Atributos
   * @api
   */
  getAttributeName() {
    return this.attribute_;
  }

  /**
   * Este método establece el atributo del mapa de calor.
   * @function
   * @public
   * @param {string|function} attribute Atributos.
   * @api
   */
  setAttributeName(attribute) {
    this.attribute_ = attribute;
    this.options_.weight = this.attribute_;
    this.update_();
  }

  /**
   * Este método devuelve el degradado.
   * @function
   * @public
   * @return {Array<string>} Degradado.
   * @api
   */
  getGradient() {
    return this.options_.gradient;
  }

  /**
   * Este método establece del degradado al mapa de calor.
   * @function
   * @public
   * @param {Array<string>} gradient Degradado.
   * @api
   */
  setGradient(gradientParam) {
    let gradient = gradientParam;
    if (!isArray(gradient)) {
      gradient = [gradient];
    }
    if (gradient.length < 2) {
      const inverseColorParam = inverseColor(gradient[0]);
      gradient.push(inverseColorParam);
    }
    this.options_.gradient = gradient;
    this.update_();
  }

  /**
   * Este método devuelve el radio del mapa de calor.
   * @function
   * @public
   * @return {number}
   * @api
   */
  getRadius() {
    return this.options_.radius;
  }

  /**
   * Este método establece el radio del mapa de calor.
   * @function
   * @public
   * @param {number} radius
   * @api
   */
  setRadius(radius) {
    this.options_.radius = radius;
    this.update_();
  }

  /**
   * Este método devuelve el "blur" del mapa de calor.
   * @function
   * @public
   * @return {number}
   * @api
   */
  getBlurSize() {
    return this.options_.blur;
  }

  /**
   * Este método establece el "blur" del mapa de calor.
   * @function
   * @public
   * @param {number} blur
   * @api
   */
  setBlurSize(blur) {
    this.options_.blur = blur;
    this.update_();
  }

  /**
   * Este método actualiza el mapa de calor.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @api
   */
  update_() {
    const styleImpl = this.getImpl();
    styleImpl.unapply(this.layer_);
    styleImpl.setOptions(this.options_, this.vendorOptions_);
    styleImpl.applyToLayer(this.layer_);
  }

  /**
   * Este método dibuja el estilo en el "canvas".
   *
   * @function
   * @public
   * @param {CanvasRenderingContext2D} vectorContext "Canvas".
   * @api
   */
  drawGeometryToCanvas() {
    const [minWeight, maxWeight] = [this.getImpl().getMinWeight(), this.getImpl().getMaxWeight()];
    const ctx = this.canvas_.getContext('2d');
    const gradient = ctx.createLinearGradient(0.000, 150.000, 200.000, 150.000);
    const intervals = generateIntervals([0, 1], this.options_.gradient.length);
    this.options_.gradient.forEach((color, i) => gradient.addColorStop(intervals[i], color));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 20, 200.000, 30.000);
    ctx.fillStyle = '#000';
    ctx.font = '10px sans-serif';
    ctx.fillText(minWeight, 0, 60);
    ctx.fillText(maxWeight, 199, 60);
  }

  /**
   * Este método actualiza el "canvas".
   *
   * @function
   * @public
   * @api
   */
  updateCanvas() {
    this.drawGeometryToCanvas();
  }

  /**
   * Esta función implementa el mecanismo para
   * generar el JSON de esta instancia.
   *
   * @public
   * @return {object} Devuelve el JSON.
   * @function
   * @api
   */
  toJSON() {
    const attribute = this.getAttributeName();
    const options = this.getOptions();
    const serializedOptions = {
      gradient: [...options.gradient],
      blur: options.blur,
      radius: options.radius,
      weight: options.weight,
    };
    const vendorOptions = this.vendorOptions_;
    const parameters = [attribute, serializedOptions, vendorOptions];
    const deserializedMethod = 'M.style.Heatmap.deserialize';
    return { parameters, deserializedMethod };
  }

  /**
   * Este método de la clase deserializa el estilo.
   * @function
   * @public
   * @param {Array} parametrers Parámetros ("serializedAttribute",
   * "serializedOptions" y "serializedVendorOptions").
   * @return {M.style.Heatmap} Devuelve el estilo deserializado.
   */
  static deserialize([serializedAttribute, serializedOptions, serializedVendorOptions]) {
    const attribute = serializedAttribute;
    const options = defineFunctionFromString(serializedOptions);
    const vendorOptions = defineFunctionFromString(serializedVendorOptions);

    /* eslint-disable */
    const styleFn = new Function(['attribute', 'options', 'vendorOptions'], `return new M.style.Heatmap(attribute, options, vendorOptions)`);
    /* eslint-enable */
    return styleFn(attribute, options, vendorOptions);
  }
}

/**
 * Opciones por defecto del mapa de calor.
 * @constant
 * @public
 * @param {object} Opciones por defecto (gradient, blur y radius).
 * @api
 */
Heatmap.DEFAULT_OPTIONS = {
  gradient: ['#00f', '#0ff', '#0f0', '#ff0', '#f00'],
  blur: 15,
  radius: 10,
};

export default Heatmap;
