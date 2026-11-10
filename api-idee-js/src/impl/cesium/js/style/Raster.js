/**
 * @module IDEE/impl/style/Raster
 */
import chroma from 'chroma-js';
import {
  isNullOrEmpty, extendsObj, generateIntervals, isArray,
} from 'IDEE/util/Utils';
import Style from './Style';

const INDEX_FORMULAS = ['ndvi', 'ndwi', 'nbr'];

const LUMINANCE = [0.2126, 0.7152, 0.0722];

const clamp01 = (value) => Math.min(1, Math.max(0, value));

const toBand = (value) => {
  const band = parseInt(value, 10);
  return Number.isNaN(band) ? 0 : band;
};

const hasValue = (value) => !isNullOrEmpty(value) || value === 0;

const isActive = (value, neutral) => !isNullOrEmpty(value) && value !== neutral;

const segmentRatio = (value, stop1, stop2, base) => {
  if (stop2 === stop1) return value >= stop2 ? 1 : 0;
  const ratio = base === 1
    ? (value - stop1) / (stop2 - stop1)
    : (base ** (value - stop1) - 1) / (base ** (stop2 - stop1) - 1);
  return Number.isNaN(ratio) ? 0 : clamp01(ratio);
};

const interpolateColor = (value, stops, colors, base) => {
  let result = colors[0];
  for (let i = 0; i < stops.length - 1; i += 1) {
    const ratio = segmentRatio(value, stops[i], stops[i + 1], base);
    const target = colors[i + 1];
    result = [
      result[0] + (target[0] - result[0]) * ratio,
      result[1] + (target[1] - result[1]) * ratio,
      result[2] + (target[2] - result[2]) * ratio,
    ];
  }
  return result;
};

const passthroughChannels = (bands) => {
  if (!isArray(bands)) {
    const channel = toBand(bands);
    return [channel, channel, channel];
  }
  if (bands.length >= 3) return [toBand(bands[0]), toBand(bands[1]), toBand(bands[2])];
  if (bands.length === 2) return [toBand(bands[0]), toBand(bands[1]), toBand(bands[1])];
  const channel = toBand(bands[0]);
  return [channel, channel, channel];
};

const createFilters = ({
  contrast, exposure, saturation, gamma, brightness,
}) => {
  const filters = [];
  if (isActive(contrast, 0)) {
    filters.push((rgb) => rgb.map((c) => clamp01((contrast + 1) * c - contrast / 2)));
  }
  if (isActive(exposure, 0)) {
    filters.push((rgb) => rgb.map((c) => clamp01((exposure + 1) * c)));
  }
  if (isActive(saturation, 0)) {
    const s = saturation + 1;
    const [lr, lg, lb] = LUMINANCE.map((l) => (1 - s) * l);
    filters.push(([r, g, b]) => [
      clamp01((lr + s) * r + lg * g + lb * b),
      clamp01(lr * r + (lg + s) * g + lb * b),
      clamp01(lr * r + lg * g + (lb + s) * b),
    ]);
  }
  if (isActive(gamma, 1)) {
    filters.push((rgb) => rgb.map((c) => c ** (1 / gamma)));
  }
  if (isActive(brightness, 0)) {
    filters.push((rgb) => rgb.map((c) => clamp01(c + brightness)));
  }
  return filters;
};

/**
 * @classdesc
 * Implementación para Cesium del estilo ráster: las teselas del GeoTIFF se pintan
 * en el navegador aplicando a cada píxel la rampa de colores, las fórmulas, el
 * valor sin datos y los filtros de color con los mismos cálculos que OpenLayers.
 * @api
 */
class Raster extends Style {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {Object} options Opciones del estilo.
   * @param {Object} vendorOptions Opciones de la librería base.
   * @api stable
   */
  constructor(options, vendorOptions) {
    super(options);
    this.options_ = extendsObj(options, vendorOptions);
  }

  /**
   * Este método crea la función que pinta cada píxel del GeoTIFF de una capa.
   *
   * @function
   * @public
   * @param {IDEE.impl.layer.GeoTIFF} layerImpl Implementación de la capa.
   * @returns {Object} Bandas que necesita (desde 1) y función de pintado.
   * @api stable
   */
  createRenderer(layerImpl) {
    const options = this.options_;
    const normalize = layerImpl?.normalize !== false;
    // eslint-disable-next-line no-underscore-dangle
    const layerBands = isArray(layerImpl?.bands_) ? layerImpl.bands_ : [];
    const toSourceBand = (band) => toBand(layerBands.length > 0 ? layerBands[band - 1] : band);
    const hasRamp = isArray(options.ramp) && options.ramp.length >= 2;
    const hasNodata = hasValue(options.nodata);

    let styleBands = [];
    let nodataBand = null;
    let colorOf = null;

    if (hasRamp) {
      styleBands = (isArray(options.bands) ? options.bands : [options.bands]).map(toBand);
      const isIndex = INDEX_FORMULAS.includes(options.formula);
      let rangeMin = options.min;
      let rangeMax = options.max;
      if (normalize && !isIndex) {
        rangeMin = 0;
        rangeMax = 1;
      }
      let stops = generateIntervals([rangeMin, rangeMax], options.ramp.length);
      if (isArray(options.stops) && options.stops.length === options.ramp.length) {
        if (rangeMin === options.min && rangeMax === options.max) {
          stops = [...options.stops];
        } else if (options.max !== options.min) {
          stops = options.stops.map((stop) => rangeMin
            + (((stop - options.min) / (options.max - options.min)) * (rangeMax - rangeMin)));
        }
      }
      let base = 1;
      if (options.interpolation === 'exponential') {
        base = options.interpolationBase > 0 ? options.interpolationBase : 2;
      }
      const colors = options.ramp.map((color) => chroma(color).rgb().map((c) => c / 255));
      let valueOf;
      if (isIndex) {
        valueOf = (read) => {
          const first = read(styleBands[0]);
          const second = read(styleBands[1]);
          const sum = first + second;
          return sum === 0 ? 0 : (first - second) / sum;
        };
      } else if (styleBands.length === 1) {
        valueOf = (read) => read(styleBands[0]);
      } else {
        valueOf = (read) => styleBands.reduce((sum, band) => sum + read(band), 0)
          / styleBands.length;
      }
      colorOf = (read) => interpolateColor(valueOf(read), stops, colors, base);
      [nodataBand] = styleBands;
    } else if (hasNodata || hasValue(options.bands)) {
      const channels = passthroughChannels(options.bands);
      styleBands = channels.filter((band) => band > 0);
      colorOf = (read) => channels.map((band) => {
        if (band <= 0) return 0;
        const value = read(band);
        return clamp01(normalize ? value : value / 255);
      });
      nodataBand = styleBands[0] || 1;
    }

    if (hasNodata && nodataBand !== null && !styleBands.includes(nodataBand)) {
      styleBands.push(nodataBand);
    }
    const bands = [...new Set(styleBands.map(toSourceBand).filter((band) => band > 0))];
    const positions = new Map(styleBands.map((band) => [band, bands.indexOf(toSourceBand(band))]));
    const filters = createFilters(options);

    return {
      bands,
      normalize,
      writePixel(out, offset, raw, values) {
        const data = out;
        if (colorOf === null) return false;
        if (hasNodata && raw[positions.get(nodataBand)] === options.nodata) return true;
        const read = (band) => values[positions.get(band)];
        let rgb = colorOf(read);
        filters.forEach((filter) => {
          rgb = filter(rgb);
        });
        data[offset] = Math.round(rgb[0] * 255);
        data[offset + 1] = Math.round(rgb[1] * 255);
        data[offset + 2] = Math.round(rgb[2] * 255);
        data[offset + 3] = 255;
        return true;
      },
    };
  }

  /**
   * Este método aplica el estilo a la capa especificada.
   *
   * @function
   * @public
   * @param {IDEE.layer.GeoTIFF} layer Capa.
   * @api stable
   */
  applyToLayer(layer) {
    this.layer_ = layer;
    const layerImpl = layer?.getImpl?.();
    if (layerImpl && typeof layerImpl.setRasterStyle === 'function') {
      layerImpl.setRasterStyle(this.createRenderer(layerImpl));
    }
  }

  /**
   * Este método elimina el estilo de la capa.
   *
   * @function
   * @public
   * @param {IDEE.layer} layer Capa.
   * @api stable
   */
  unapply(layer) {
    const layerImpl = layer?.getImpl?.();
    if (layerImpl && typeof layerImpl.setRasterStyle === 'function') {
      layerImpl.setRasterStyle(null);
    }
    this.layer_ = null;
  }

  /**
   * Este método modifica las opciones del estilo.
   *
   * @public
   * @param {object} options Opciones.
   * @param {object} vendorOptions Opciones de la librería base.
   * @function
   * @api stable
   */
  setOptions(options, vendorOptions) {
    this.options_ = extendsObj(options, vendorOptions);
  }
}

export default Raster;
