/**
 * @module IDEE/style/Raster
 */
import RasterImpl from 'impl/style/Raster';
import Style from './Style';
import {
  isArray, isNullOrEmpty, isObject, isUndefined, inverseColor,
  generateIntervals, defineFunctionFromString,
} from '../util/Utils';
import Exception from '../exception/exception';
import { getValue } from '../i18n/language';

/**
 * @classdesc
 * Crea un estilo ráster con rampa de colores opcional
 * y filtros WebGL (gamma, saturación, exposición, etc.).
 * @api
 * @extends {IDEE.style}
 */
class Raster extends Style {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {Mx.RasterStyleOptions} optionsParam Opciones del estilo.
   * - bands: Banda o bandas. Con rampa, nodata o passthrough RGB (array).
   *   Con formula 'ndvi': array [nir, red] (exactamente 2 bandas).
   *   Con formula 'ndwi': array [green, nir] (exactamente 2 bandas).
   *   Con formula 'nbr': array [nir, swir] (exactamente 2 bandas).
   *   Sin rampa (passthrough RGB): array [r, g, b]; 0 apaga el canal.
   * - formula: Fórmula del valor para la rampa ('ndvi', 'ndwi', 'nbr' o sin fórmula).
   * - min: Valor mínimo de la rampa (por defecto 0; con índices -1).
   * - max: Valor máximo de la rampa (por defecto 1).
   * - ramp: Rampa de colores (opcional).
   * - stops: Valores de parada de la rampa (opcional, misma longitud que ramp).
   * - nodata: Valor nodata para transparencia.
   * - interpolation: Tipo de interpolación ('linear' o 'exponential').
   * - interpolationBase: Base para interpolación exponencial (por defecto 2).
   * - gamma: Gamma de la capa (por defecto 1, rango: 0 a infinito).
   * - saturation: Saturación del color (rango: -1 a 1, por defecto 0).
   * - exposure: Exposición (rango: -1 a 1, por defecto 0).
   * - contrast: Contraste (rango: -1 a 1, por defecto 0).
   * - brightness: Brillo (rango: -1 a 1, por defecto 0).
   * @param {object} vendorOptionsParam Opciones de la librería base.
   * @api
   */
  constructor(optionsParam = {}, vendorOptionsParam = {}) {
    const options = Raster.normalizeOptions({ ...optionsParam }, false);
    const vendorOptions = vendorOptionsParam;

    if (isUndefined(RasterImpl) || (isObject(RasterImpl)
      && isNullOrEmpty(Object.keys(RasterImpl)))) {
      Exception(getValue('exception').raster_method);
    }

    const impl = new RasterImpl(options, vendorOptions);
    super(options, impl);

    /**
     * @private
     * @type {Mx.RasterStyleOptions}
     */
    this.options_ = options;

    /**
     * @private
     * @type {object}
     */
    this.vendorOptions_ = vendorOptions;
  }

  // #################################################
  // ############ MÉTODOS GETTER Y SETTER ############
  // #################################################

  /**
   * Este método devuelve el valor gamma del estilo ráster.
   *
   * @function
   * @public
   * @return {number} Gamma.
   * @api
   */
  getGamma() {
    return this.options_.gamma;
  }

  /**
   * Este método establece el valor gamma del estilo ráster.
   *
   * @function
   * @public
   * @param {number} gamma Gamma.
   * @api
   */
  setGamma(gamma) {
    this.options_.gamma = Raster.normalizeGamma(gamma);
    this.update_();
  }

  /**
   * Este método devuelve la saturación del estilo ráster.
   *
   * @function
   * @public
   * @return {number} Saturación.
   * @api
   */
  getSaturation() {
    return this.options_.saturation;
  }

  /**
   * Este método establece la saturación del estilo ráster.
   *
   * @function
   * @public
   * @param {number} saturation Saturación (-1 a 1).
   * @api
   */
  setSaturation(saturation) {
    this.options_.saturation = Raster.normalizeSignedUnitRange(
      saturation,
      Raster.DEFAULT_OPTIONS.saturation,
    );
    this.update_();
  }

  /**
   * Este método devuelve la exposición del estilo ráster.
   *
   * @function
   * @public
   * @return {number} Exposición.
   * @api
   */
  getExposure() {
    return this.options_.exposure;
  }

  /**
   * Este método establece la exposición del estilo ráster.
   *
   * @function
   * @public
   * @param {number} exposure Exposición (-1 a 1).
   * @api
   */
  setExposure(exposure) {
    this.options_.exposure = Raster.normalizeSignedUnitRange(
      exposure,
      Raster.DEFAULT_OPTIONS.exposure,
    );
    this.update_();
  }

  /**
   * Este método devuelve el contraste del estilo ráster.
   *
   * @function
   * @public
   * @return {number} Contraste.
   * @api
   */
  getContrast() {
    return this.options_.contrast;
  }

  /**
   * Este método establece el contraste del estilo ráster.
   *
   * @function
   * @public
   * @param {number} contrast Contraste (-1 a 1).
   * @api
   */
  setContrast(contrast) {
    this.options_.contrast = Raster.normalizeSignedUnitRange(
      contrast,
      Raster.DEFAULT_OPTIONS.contrast,
    );
    this.update_();
  }

  /**
   * Este método devuelve el brillo del estilo ráster.
   *
   * @function
   * @public
   * @return {number} Brillo.
   * @api
   */
  getBrightness() {
    return this.options_.brightness;
  }

  /**
   * Este método establece el brillo del estilo ráster.
   *
   * @function
   * @public
   * @param {number} brightness Brillo (-1 a 1).
   * @api
   */
  setBrightness(brightness) {
    this.options_.brightness = Raster.normalizeSignedUnitRange(
      brightness,
      Raster.DEFAULT_OPTIONS.brightness,
    );
    this.update_();
  }

  /**
   * Este método devuelve la base de interpolación exponencial.
   * Sólo es válido si el tipo de interpolación es 'exponential'.
   *
   * @function
   * @public
   * @return {number} Base de interpolación exponencial.
   * @api
   */
  getInterpolationBase() {
    return this.options_.interpolationBase;
  }

  /**
   * Este método establece la base de interpolación exponencial.
   * Sólo es válido si el tipo de interpolación es 'exponential'.
   *
   * @function
   * @public
   * @param {number} interpolationBase Base de interpolación exponencial.
   * @api
   */
  setInterpolationBase(interpolationBase) {
    if (!Raster.hasRamp(this.options_, true)) {
      return;
    }
    this.options_.interpolationBase = parseFloat(interpolationBase);
    this.update_();
  }

  /**
   * Este método devuelve la banda o bandas utilizadas.
   *
   * @function
   * @public
   * @return {number|Array<number>} Banda o bandas.
   * @api
   */
  getBands() {
    return this.options_.bands;
  }

  /**
   * Este método establece la banda o bandas del estilo ráster.
   *
   * @function
   * @public
   * @param {number|Array<number>} bands Banda o bandas.
   * @api
   */
  setBands(bands) {
    this.options_.bands = Raster.normalizeBands({
      bands,
      formula: this.options_.formula,
    });
    this.update_();
  }

  /**
   * Este método devuelve la fórmula del valor de la rampa.
   *
   * @function
   * @public
   * @return {string|undefined} Fórmula ('ndvi', 'ndwi', 'nbr') o undefined.
   * @api
   */
  getFormula() {
    return this.options_.formula;
  }

  /**
   * Este método establece la fórmula del valor de la rampa.
   * Solo aplica con rampa. Use 'ndvi', 'ndwi', 'nbr' o null/undefined para quitarla.
   *
   * @function
   * @public
   * @param {string|null|undefined} formula Fórmula ('ndvi', 'ndwi', 'nbr') o vacío.
   * @api
   */
  setFormula(formula) {
    if (!Raster.hasRamp(this.options_, true)) {
      return;
    }
    const normalizedFormula = Raster.normalizeFormula(formula);
    if (isNullOrEmpty(normalizedFormula)) {
      delete this.options_.formula;
      this.options_.bands = Raster.normalizeBands({ bands: this.options_.bands });
    } else {
      const formulaDefaults = Raster.getFormulaDefaults(normalizedFormula);
      this.options_.formula = normalizedFormula;
      this.options_.bands = Raster.normalizeBands({
        bands: this.options_.bands,
        formula: normalizedFormula,
      });
      this.options_.min = formulaDefaults.min;
      this.options_.max = formulaDefaults.max;
    }
    this.update_();
  }

  /**
   * Este método devuelve el valor nodata del estilo ráster.
   *
   * @function
   * @public
   * @return {number} Valor nodata.
   * @api
   */
  getNodata() {
    return this.options_.nodata;
  }

  /**
   * Este método establece el valor nodata del estilo ráster.
   *
   * @function
   * @public
   * @param {number} nodata Valor nodata.
   * @api
   */
  setNodata(nodata) {
    if (isNullOrEmpty(nodata) && nodata !== 0) {
      delete this.options_.nodata;
      if (!Raster.hasRamp(this.options_, true)
        && !Raster.hasMultiBandPassthrough(this.options_)) {
        delete this.options_.bands;
      }
    } else {
      this.options_.nodata = nodata;
      if (!Raster.hasRamp(this.options_, true) && isNullOrEmpty(this.options_.bands)) {
        this.options_.bands = Raster.DEFAULT_OPTIONS.bands;
      }
    }
    if (!Raster.optionsHaveEffect(this.options_, true)) {
      Exception(getValue('exception').invalid_raster_options);
    }
    this.update_();
  }

  /**
   * Este método devuelve el tipo de interpolación del estilo ráster.
   *
   * @function
   * @public
   * @return {string} Tipo de interpolación.
   * @api
   */
  getInterpolation() {
    return this.options_.interpolation;
  }

  /**
   * Este método establece el tipo de interpolación del estilo ráster.
   *
   * @function
   * @public
   * @param {string} interpolation Tipo de interpolación ('linear' o 'exponential').
   * @param {number} interpolationBase Base para interpolación exponencial.
   * @api
   */
  setInterpolation(interpolation, interpolationBase) {
    if (!Raster.hasRamp(this.options_, true)) {
      return;
    }
    this.options_.interpolation = interpolation || Raster.DEFAULT_OPTIONS.interpolation;
    if (!isNullOrEmpty(interpolationBase)) {
      this.options_.interpolationBase = parseFloat(interpolationBase);
    }
    this.update_();
  }

  /**
   * Este método devuelve el valor mínimo de la rampa.
   *
   * @function
   * @public
   * @return {number} Valor mínimo.
   * @api
   */
  getMin() {
    return this.options_.min;
  }

  /**
   * Este método establece el valor mínimo de la rampa.
   *
   * @function
   * @public
   * @param {number} min Valor mínimo.
   * @api
   */
  setMin(min) {
    if (!Raster.hasRamp(this.options_, true)) {
      return;
    }
    this.options_.min = parseFloat(min);
    if (isArray(this.options_.stops) && this.options_.stops.length > 0) {
      this.options_.stops[0] = this.options_.min;
    }
    this.update_();
  }

  /**
   * Este método devuelve el valor máximo de la rampa.
   *
   * @function
   * @public
   * @return {number} Valor máximo.
   * @api
   */
  getMax() {
    return this.options_.max;
  }

  /**
   * Este método establece el valor máximo de la rampa.
   *
   * @function
   * @public
   * @param {number} max Valor máximo.
   * @api
   */
  setMax(max) {
    if (!Raster.hasRamp(this.options_, true)) {
      return;
    }
    this.options_.max = parseFloat(max);
    if (isArray(this.options_.stops) && this.options_.stops.length > 0) {
      this.options_.stops[this.options_.stops.length - 1] = this.options_.max;
    }
    this.update_();
  }

  /**
   * Este método devuelve los valores de parada de la rampa.
   *
   * @function
   * @public
   * @return {Array<number>|null} Valores de parada o null.
   * @api
   */
  getStops() {
    if (isArray(this.options_.stops) && this.options_.stops.length > 0) {
      return [...this.options_.stops];
    }
    return null;
  }

  /**
   * Este método establece los valores de parada de la rampa.
   * Deben tener la misma longitud que la rampa y ser crecientes.
   * Actualiza min y max con el primer y último valor.
   *
   * @function
   * @public
   * @param {Array<number>|null} stopsParam Valores de parada o null para eliminarlos.
   * @api
   */
  setStops(stopsParam) {
    if (!Raster.hasRamp(this.options_, true)) {
      return;
    }
    if (isNullOrEmpty(stopsParam)) {
      delete this.options_.stops;
      this.update_();
      return;
    }
    const stops = Raster.normalizeStops(stopsParam, this.options_.ramp.length);
    if (isNullOrEmpty(stops)) {
      return;
    }
    this.options_.stops = stops;
    this.options_.min = stops[0];
    this.options_.max = stops[stops.length - 1];
    this.update_();
  }

  /**
   * Este método devuelve la rampa de colores.
   *
   * @function
   * @public
   * @return {Array<string>} Rampa de colores.
   * @api
   */
  getRamp() {
    return this.options_.ramp || null;
  }

  /**
   * Este método establece la rampa de colores.
   *
   * @function
   * @public
   * @param {Array<string>|null} rampParam Rampa de colores o null para eliminarla.
   * @api
   */
  setRamp(rampParam) {
    // Si ramp es null, se eliminan rampa, min, max, interpolación e interpolationBase.
    if (isNullOrEmpty(rampParam)) {
      const nextOptions = { ...this.options_ };
      delete nextOptions.ramp;
      delete nextOptions.min;
      delete nextOptions.max;
      delete nextOptions.stops;
      delete nextOptions.interpolation;
      delete nextOptions.interpolationBase;
      delete nextOptions.formula;
      if (isNullOrEmpty(nextOptions.nodata) && nextOptions.nodata !== 0
        && !Raster.hasMultiBandPassthrough(nextOptions)) {
        delete nextOptions.bands;
      }
      if (!Raster.optionsHaveEffect(nextOptions, true)) {
        Exception(getValue('exception').invalid_raster_options);
      }
      delete this.options_.ramp;
      delete this.options_.min;
      delete this.options_.max;
      delete this.options_.stops;
      delete this.options_.interpolation;
      delete this.options_.interpolationBase;
      delete this.options_.formula;
      if (isNullOrEmpty(this.options_.nodata) && this.options_.nodata !== 0
        && !Raster.hasMultiBandPassthrough(this.options_)) {
        delete this.options_.bands;
      }
      this.update_();
      return;
    }
    let ramp = rampParam;
    if (!isArray(ramp)) {
      ramp = [ramp];
    }
    if (ramp.length < 2) {
      const inverseColorParam = inverseColor(ramp[0]);
      ramp.push(inverseColorParam);
    }
    this.options_.ramp = ramp;
    if (isArray(this.options_.stops) && this.options_.stops.length !== ramp.length) {
      delete this.options_.stops;
    }
    if (isNullOrEmpty(this.options_.bands)) {
      this.options_.bands = Raster.DEFAULT_OPTIONS.bands;
    }
    if (isNullOrEmpty(this.options_.min)) {
      this.options_.min = Raster.DEFAULT_OPTIONS.min;
    }
    if (isNullOrEmpty(this.options_.max)) {
      this.options_.max = Raster.DEFAULT_OPTIONS.max;
    }
    if (isNullOrEmpty(this.options_.interpolation)) {
      this.options_.interpolation = Raster.DEFAULT_OPTIONS.interpolation;
    }
    if (isNullOrEmpty(this.options_.interpolationBase)) {
      this.options_.interpolationBase = Raster.DEFAULT_OPTIONS.interpolationBase;
    }
    this.update_();
  }

  // #################################################
  // ############ FIN MÉTODOS GETTER Y SETTER ############
  // #################################################

  /**
   * Normaliza y valida las opciones del estilo.
   *
   * @function
   * @private
   * @param {Object} options Opciones del estilo.
   * @param {boolean} validate Si es falso, no lanza error cuando las opciones no tienen efecto.
   * @return {Object} Opciones normalizadas.
   */
  static normalizeOptions(options, validate = true) {
    const normalized = { ...options };

    if (!isNullOrEmpty(normalized.ramp) && !isArray(normalized.ramp)) {
      normalized.ramp = [normalized.ramp];
    }

    if (isNullOrEmpty(normalized.ramp)) {
      delete normalized.ramp;
    } else if (normalized.ramp.length < 2) {
      const inverseColorParam = inverseColor(normalized.ramp[0]);
      normalized.ramp.push(inverseColorParam);
    }

    normalized.gamma = Raster.normalizeGamma(normalized.gamma);
    normalized.saturation = Raster.normalizeSignedUnitRange(
      normalized.saturation,
      Raster.DEFAULT_OPTIONS.saturation,
    );
    normalized.exposure = Raster.normalizeSignedUnitRange(
      normalized.exposure,
      Raster.DEFAULT_OPTIONS.exposure,
    );
    normalized.contrast = Raster.normalizeSignedUnitRange(
      normalized.contrast,
      Raster.DEFAULT_OPTIONS.contrast,
    );
    normalized.brightness = Raster.normalizeSignedUnitRange(
      normalized.brightness,
      Raster.DEFAULT_OPTIONS.brightness,
    );

    const formula = Raster.normalizeFormula(normalized.formula);
    if (!isNullOrEmpty(formula) && !Raster.hasRamp(normalized, true)) {
      if (validate) {
        Exception(getValue('exception').invalid_raster_options);
      }
      delete normalized.formula;
    } else if (!isNullOrEmpty(formula)) {
      normalized.formula = formula;
    } else {
      delete normalized.formula;
    }

    if (Raster.hasRamp(normalized, true)) {
      const formulaDefaults = Raster.getFormulaDefaults(normalized.formula);
      normalized.bands = Raster.normalizeBands(normalized);
      if (!isNullOrEmpty(formulaDefaults)) {
        normalized.min = isNullOrEmpty(normalized.min) && normalized.min !== 0
          ? formulaDefaults.min
          : parseFloat(normalized.min);
        normalized.max = isNullOrEmpty(normalized.max) && normalized.max !== 0
          ? formulaDefaults.max
          : parseFloat(normalized.max);
      } else {
        normalized.min = isNullOrEmpty(normalized.min)
          ? Raster.DEFAULT_OPTIONS.min
          : parseFloat(normalized.min);
        normalized.max = isNullOrEmpty(normalized.max)
          ? Raster.DEFAULT_OPTIONS.max
          : parseFloat(normalized.max);
      }
      const stops = Raster.normalizeStops(normalized.stops, normalized.ramp.length);
      if (!isNullOrEmpty(stops)) {
        normalized.stops = stops;
        normalized.min = stops[0];
        normalized.max = stops[stops.length - 1];
      } else {
        delete normalized.stops;
      }
      normalized.interpolation = normalized.interpolation || Raster.DEFAULT_OPTIONS.interpolation;
      normalized.interpolationBase = Number.isNaN(parseFloat(normalized.interpolationBase))
        ? Raster.DEFAULT_OPTIONS.interpolationBase
        : parseFloat(normalized.interpolationBase);
    } else if ((!isNullOrEmpty(normalized.nodata) || normalized.nodata === 0)
      || Raster.hasExplicitBands(normalized)) {
      delete normalized.formula;
      delete normalized.stops;
      delete normalized.min;
      delete normalized.max;
      delete normalized.interpolation;
      delete normalized.interpolationBase;
      normalized.bands = Raster.normalizeBands(normalized);
    } else {
      delete normalized.formula;
      delete normalized.bands;
      delete normalized.min;
      delete normalized.max;
      delete normalized.stops;
      delete normalized.interpolation;
      delete normalized.interpolationBase;
    }

    delete normalized.color;

    if (validate && !Raster.optionsHaveEffect(normalized, true)) {
      Exception(getValue('exception').invalid_raster_options);
    }

    return normalized;
  }

  /**
   * Normaliza el parámetro formula.
   *
   * @function
   * @private
   * @param {string|null|undefined} formula Fórmula.
   * @return {string|undefined} Fórmula normalizada.
   */
  static normalizeFormula(formula) {
    if (isNullOrEmpty(formula)) {
      return undefined;
    }
    const normalized = String(formula).trim().toLowerCase();
    if (normalized === Raster.FORMULA.NDVI) {
      return Raster.FORMULA.NDVI;
    }
    if (normalized === Raster.FORMULA.NDWI) {
      return Raster.FORMULA.NDWI;
    }
    if (normalized === Raster.FORMULA.NBR) {
      return Raster.FORMULA.NBR;
    }
    Exception(getValue('exception').invalid_raster_formula);
    return undefined;
  }

  /**
   * Normaliza los valores de parada de la rampa.
   *
   * @function
   * @private
   * @param {Array<number>|undefined} stopsParam Valores de parada.
   * @param {number} rampLength Longitud de la rampa.
   * @return {Array<number>|undefined} Paradas normalizadas o undefined.
   */
  static normalizeStops(stopsParam, rampLength) {
    if (isNullOrEmpty(stopsParam) || !isArray(stopsParam)) {
      return undefined;
    }
    if (stopsParam.length !== rampLength || rampLength < 2) {
      return undefined;
    }
    const stops = [];
    for (let i = 0; i < stopsParam.length; i += 1) {
      const value = parseFloat(stopsParam[i]);
      if (Number.isNaN(value)) {
        return undefined;
      }
      if (i > 0 && value < stops[i - 1]) {
        return undefined;
      }
      stops.push(value);
    }
    return stops;
  }

  /**
   * Lanza excepción por bandas inválidas para una fórmula de índice.
   *
   * @function
   * @private
   * @param {string} formula Fórmula.
   */
  static throwInvalidFormulaBands(formula) {
    if (formula === Raster.FORMULA.NDVI) {
      Exception(getValue('exception').invalid_raster_ndvi_bands);
    }
    if (formula === Raster.FORMULA.NDWI) {
      Exception(getValue('exception').invalid_raster_ndwi_bands);
    }
    if (formula === Raster.FORMULA.NBR) {
      Exception(getValue('exception').invalid_raster_nbr_bands);
    }
    Exception(getValue('exception').invalid_raster_formula);
  }

  /**
   * Indica si la fórmula es un índice espectral (NDVI, NDWI, NBR, etc.).
   *
   * @function
   * @public
   * @param {string|undefined} formula Fórmula.
   * @return {boolean} Verdadero si es un índice.
   * @api
   */
  static isIndexFormula(formula) {
    return formula === Raster.FORMULA.NDVI
      || formula === Raster.FORMULA.NDWI
      || formula === Raster.FORMULA.NBR;
  }

  /**
   * Devuelve los valores por defecto de una fórmula de índice.
   *
   * @function
   * @private
   * @param {string|undefined} formula Fórmula.
   * @return {Object|null} Defaults o null.
   */
  static getFormulaDefaults(formula) {
    if (formula === Raster.FORMULA.NDVI) {
      return Raster.DEFAULT_NDVI;
    }
    if (formula === Raster.FORMULA.NDWI) {
      return Raster.DEFAULT_NDWI;
    }
    if (formula === Raster.FORMULA.NBR) {
      return Raster.DEFAULT_NBR;
    }
    return null;
  }

  /**
   * Normaliza el parámetro bands (número o array).
   * Con fórmulas de índice exige exactamente dos bandas según la fórmula.
   *
   * @function
   * @private
   * @param {Object} options Opciones con bands (y formula opcional).
   * @return {number|Array<number>} Banda o bandas normalizadas.
   */
  static normalizeBands(options) {
    const { bands, formula } = options;
    const formulaDefaults = Raster.getFormulaDefaults(formula);

    if (!isNullOrEmpty(formulaDefaults)) {
      if (isNullOrEmpty(bands)) {
        return [...formulaDefaults.bands];
      }
      if (!isArray(bands) || bands.length !== 2) {
        Raster.throwInvalidFormulaBands(formula);
      }
      return bands.map((bandIndex) => parseInt(bandIndex, 10));
    }

    if (isNullOrEmpty(bands)) {
      return Raster.DEFAULT_OPTIONS.bands;
    }

    if (isArray(bands)) {
      if (bands.length === 0) {
        Exception(getValue('exception').no_empty);
      }
      const normalized = bands.map((bandIndex) => parseInt(bandIndex, 10));
      if (normalized.length === 1) {
        return normalized[0];
      }
      return normalized;
    }

    return parseInt(bands, 10);
  }

  /**
   * Normaliza el parámetro gamma según el rango (0 a infinito).
   *
   * @function
   * @private
   * @param {number|string} gamma Valor gamma.
   * @return {number} Gamma normalizado.
   */
  static normalizeGamma(gamma) {
    const value = parseFloat(gamma);
    if (Number.isNaN(value)) {
      return Raster.DEFAULT_OPTIONS.gamma;
    }
    if (value < 0) {
      Exception(getValue('exception').invalid_raster_gamma);
    }
    return value;
  }

  /**
   * Normaliza un parámetro en el rango [-1, 1].
   *
   * @function
   * @private
   * @param {number|string} valueParam Valor.
   * @param {number} defaultValue Valor por defecto si no es numérico.
   * @return {number} Valor normalizado.
   */
  static normalizeSignedUnitRange(valueParam, defaultValue) {
    const value = parseFloat(valueParam);
    if (Number.isNaN(value)) {
      return defaultValue;
    }
    if (value < -1) {
      return -1;
    }
    if (value > 1) {
      return 1;
    }
    return value;
  }

  /**
   * Indica si las opciones definen algún efecto aplicable
   * (rampa, nodata, passthrough de bandas o filtros).
   *
   * @function
   * @public
   * @param {Object} optionsParam Opciones del estilo.
   * @param {boolean} alreadyNormalized Si es true, optionsParam ya está normalizado.
   * @return {boolean} Verdadero si hay algo que aplicar.
   * @api
   */
  static optionsHaveEffect(optionsParam = {}, alreadyNormalized = false) {
    const options = alreadyNormalized
      ? optionsParam
      : Raster.normalizeOptions({ ...optionsParam }, false);

    if (Raster.hasRamp(options, true)) {
      return true;
    }
    if (!isNullOrEmpty(options.nodata) || options.nodata === 0) {
      return true;
    }
    if (Raster.hasPassthroughBands(options, true)) {
      return true;
    }
    const filterKeys = ['gamma', 'saturation', 'exposure', 'contrast', 'brightness'];
    return filterKeys.some((key) => {
      return !isNullOrEmpty(options[key])
        && options[key] !== Raster.DEFAULT_OPTIONS[key];
    });
  }

  /**
   * Indica si las opciones incluyen bandas explícitas.
   *
   * @function
   * @private
   * @param {Object} options Opciones del estilo.
   * @return {boolean} Verdadero si bands viene informado.
   */
  static hasExplicitBands(options = {}) {
    const { bands } = options;
    if (isNullOrEmpty(bands) && bands !== 0) {
      return false;
    }
    return true;
  }

  /**
   * Indica si hay passthrough multi-banda (p. ej. RGB [r,g,b]).
   *
   * @function
   * @private
   * @param {Object} options Opciones del estilo.
   * @return {boolean} Verdadero si bands es un array de al menos 2 elementos.
   */
  static hasMultiBandPassthrough(options = {}) {
    return isArray(options.bands) && options.bands.length >= 2;
  }

  /**
   * Indica si las opciones definen passthrough por bandas (sin rampa).
   *
   * @function
   * @public
   * @param {Object} optionsParam Opciones del estilo.
   * @param {boolean} alreadyNormalized Si es true, optionsParam ya está normalizado.
   * @return {boolean} Verdadero si hay bandas de passthrough.
   * @api
   */
  static hasPassthroughBands(optionsParam = {}, alreadyNormalized = false) {
    let options = optionsParam;
    if (!alreadyNormalized) {
      if (!Raster.hasExplicitBands(optionsParam)
        && isNullOrEmpty(optionsParam.nodata)
        && optionsParam.nodata !== 0) {
        return false;
      }
      options = Raster.normalizeOptions({ ...optionsParam }, false);
    }
    if (Raster.hasRamp(options, true)) {
      return false;
    }
    return Raster.hasExplicitBands(options);
  }

  /**
   * Indica si las opciones incluyen rampa de colores.
   *
   * @function
   * @public
   * @param {Object} optionsParam Opciones del estilo.
   * @param {boolean} alreadyNormalized Si es true, optionsParam ya está normalizado.
   * @return {boolean} Verdadero si hay rampa.
   * @api
   */
  static hasRamp(optionsParam = {}, alreadyNormalized = false) {
    const options = alreadyNormalized
      ? optionsParam
      : Raster.normalizeOptions({ ...optionsParam }, false);
    return !isNullOrEmpty(options.ramp)
      && isArray(options.ramp)
      && options.ramp.length >= 2;
  }

  /**
   * Este método actualiza el estilo ráster.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   *
   * @public
   * @function
   * @api
   */
  update_() {
    const styleImpl = this.getImpl();
    styleImpl.setOptions(this.options_, this.vendorOptions_);
    if (!isNullOrEmpty(this.layer_)) {
      styleImpl.applyToLayer(this.layer_);
    }
    this.updateCanvas();
  }

  /**
   * Este método elimina los estilos.
   *
   * @function
   * @public
   * @param {IDEE.layer} layer Capa.
   * @api
   */
  unapply(layer) {
    this.layer_ = null;
    this.getImpl().unapply(layer);
  }

  /**
   * Este método dibuja el estilo en el canvas.
   *
   * @function
   * @public
   * @api
   */
  drawGeometryToCanvas() {
    if (!Raster.hasRamp(this.options_, true)) {
      return;
    }

    const ctx = this.canvas_.getContext('2d');
    const barWidth = 200;
    const barHeight = 24;
    const paddingX = 2;
    const paddingTop = 4;
    const paddingBottom = 4;
    const labelGap = 4;
    const fontSize = 10;
    const font = `${fontSize}px sans-serif`;

    ctx.font = font;
    const minText = String(this.options_.min);
    const maxText = String(this.options_.max);
    const maxTextWidth = ctx.measureText(maxText).width;

    const contentWidth = Math.max(barWidth, Math.ceil(maxTextWidth));
    const canvasWidth = contentWidth + (paddingX * 2);
    const canvasHeight = paddingTop + barHeight + labelGap + fontSize + paddingBottom;

    this.canvas_.width = canvasWidth;
    this.canvas_.height = canvasHeight;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.font = font;

    const barX = paddingX;
    const barY = paddingTop;
    const gradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
    const rampLength = this.options_.ramp.length;
    let intervals = generateIntervals([0, 1], rampLength);
    const customStops = this.options_.stops;
    if (isArray(customStops) && customStops.length === rampLength) {
      const stopMin = customStops[0];
      const stopMax = customStops[customStops.length - 1];
      if (stopMax !== stopMin) {
        intervals = customStops.map((stop) => (stop - stopMin) / (stopMax - stopMin));
      }
    }
    this.options_.ramp.forEach((color, index) => {
      gradient.addColorStop(intervals[index], color);
    });

    ctx.fillStyle = gradient;
    ctx.fillRect(barX, barY, barWidth, barHeight);

    const labelY = barY + barHeight + labelGap + fontSize;
    ctx.fillStyle = '#000';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(minText, barX, labelY);
    ctx.fillText(maxText, barX + barWidth - maxTextWidth, labelY);
  }

  /**
   * Este método actualiza el canvas.
   *
   * @function
   * @public
   * @api
   */
  updateCanvas() {
    if (!Raster.hasRamp(this.options_, true)) {
      this.canvas_.width = 1;
      this.canvas_.height = 1;
      return;
    }
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
    const options = this.getOptions();
    const serializedOptions = {
      gamma: options.gamma,
      saturation: options.saturation,
      exposure: options.exposure,
      contrast: options.contrast,
      brightness: options.brightness,
    };
    if (!isNullOrEmpty(options.nodata) || options.nodata === 0) {
      serializedOptions.nodata = options.nodata;
    }
    if (Raster.hasRamp(options, true)) {
      const serializedBands = isArray(options.bands)
        ? [...options.bands]
        : options.bands;
      serializedOptions.bands = serializedBands;
      serializedOptions.min = options.min;
      serializedOptions.max = options.max;
      serializedOptions.ramp = [...options.ramp];
      if (isArray(options.stops) && options.stops.length === options.ramp.length) {
        serializedOptions.stops = [...options.stops];
      }
      serializedOptions.interpolation = options.interpolation;
      serializedOptions.interpolationBase = options.interpolationBase;
      if (!isNullOrEmpty(options.formula)) {
        serializedOptions.formula = options.formula;
      }
    } else if (!isNullOrEmpty(options.bands)) {
      const serializedBands = isArray(options.bands)
        ? [...options.bands]
        : options.bands;
      serializedOptions.bands = serializedBands;
    }
    const vendorOptions = this.vendorOptions_;
    const parameters = [serializedOptions, vendorOptions];
    const deserializedMethod = 'IDEE.style.Raster.deserialize';
    return { parameters, deserializedMethod };
  }

  /**
   * Este método de la clase deserializa el estilo.
   *
   * @function
   * @public
   * @param {Array} parametrers Parámetros.
   * @return {IDEE.style.Raster} Devuelve el estilo deserializado.
   */
  static deserialize([serializedOptions, serializedVendorOptions]) {
    const options = defineFunctionFromString(serializedOptions);
    const vendorOptions = defineFunctionFromString(serializedVendorOptions);

    /* eslint-disable */
    const styleFn = new Function(['options', 'vendorOptions'], 'return new IDEE.style.Raster(options, vendorOptions)');
    /* eslint-enable */
    return styleFn(options, vendorOptions);
  }
}

/**
 * Opciones por defecto del estilo ráster.
 * @constant
 * @public
 * @api
 */
Raster.DEFAULT_OPTIONS = {
  bands: 1,
  min: 0,
  max: 1,
  ramp: ['#000080', '#0000ff', '#00ff00', '#ffff00', '#ff0000'],
  gamma: 1,
  saturation: 0,
  exposure: 0,
  contrast: 0,
  brightness: 0,
  interpolation: 'linear',
  interpolationBase: 2,
};

/**
 * Valores por defecto al usar formula NDVI.
 * @constant
 * @public
 * @api
 */
Raster.DEFAULT_NDVI = {
  bands: [2, 1],
  min: -1,
  max: 1,
  ramp: ['#a6611a', '#dfc27d', '#f5f5f5', '#80cdc1', '#018571'],
};

/**
 * Valores por defecto al usar formula NDWI.
 * @constant
 * @public
 * @api
 */
Raster.DEFAULT_NDWI = {
  bands: [2, 3],
  min: -1,
  max: 1,
  ramp: ['#8c510a', '#d8b365', '#f5f5f5', '#5ab4ac', '#01665e'],
};

/**
 * Valores por defecto al usar formula NBR.
 * @constant
 * @public
 * @api
 */
Raster.DEFAULT_NBR = {
  bands: [1, 3],
  min: -1,
  max: 1,
  ramp: ['#d73027', '#fdae61', '#ffffbf', '#a6d96a', '#1a9850'],
};

/**
 * Fórmulas soportadas para el valor de la rampa.
 * @constant
 * @public
 * @api
 */
Raster.FORMULA = {
  NDVI: 'ndvi',
  NDWI: 'ndwi',
  NBR: 'nbr',
};

export default Raster;
