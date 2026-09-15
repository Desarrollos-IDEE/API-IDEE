/**
 * Muestreo del viewport para estimar el rango de visualización de rampas.
 */

/**
 * Paso de rejilla por defecto (píxeles de pantalla entre muestras).
 * @constant
 * @type {number}
 */
const DEFAULT_SAMPLE_STEP = 16;

/**
 * Percentil inferior por defecto.
 * @constant
 * @type {number}
 */
const DEFAULT_LOW_PERCENTILE = 2;

/**
 * Percentil superior por defecto.
 * @constant
 * @type {number}
 */
const DEFAULT_HIGH_PERCENTILE = 98;

/**
 * Umbral para detectar valores fuera de 0–1.
 * @constant
 * @type {number}
 */
const NORMALIZED_EPSILON = 1.0001;

/**
 * Indica si un valor es numérico finito.
 *
 * @param {*} value Valor a comprobar.
 * @returns {boolean}
 */
function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Indica si el valor debe descartarse por nodata.
 *
 * @param {number} value Valor de banda.
 * @param {number|null} nodata Valor nodata opcional.
 * @returns {boolean}
 */
function isNodataValue(value, nodata) {
  if (!isFiniteNumber(nodata)) {
    return false;
  }
  return value === nodata;
}

/**
 * Limita un valor al intervalo [low, high].
 *
 * @param {number} value Valor.
 * @param {number} low Mínimo.
 * @param {number} high Máximo.
 * @returns {number}
 */
function clamp(value, low, high) {
  if (value < low) {
    return low;
  }
  if (value > high) {
    return high;
  }
  return value;
}

/**
 * Si la capa está normalizada pero getData devuelve ~0–255, escala a 0–1.
 *
 * @param {TypedArray|Array<number>} data Datos del píxel.
 * @param {boolean} normalize Si la capa usa normalize.
 * @returns {number} Factor divisor (1 o 255).
 */
function getNormalizedBandScale(data, normalize) {
  if (!normalize || !data || data.length === 0) {
    return 1;
  }
  for (let i = 0; i < data.length; i += 1) {
    const value = data[i];
    if (isFiniteNumber(value) && Math.abs(value) > NORMALIZED_EPSILON) {
      return 255;
    }
  }
  return 1;
}

/**
 * Obtiene el valor de una banda 1-based desde el array de getData.
 *
 * @param {TypedArray|Array<number>} data Datos del píxel.
 * @param {number} bandIndex Índice de banda (1-based).
 * @param {number} [scale=1] Factor para pasar a escala normalizada.
 * @returns {number|null}
 */
function getBandValue(data, bandIndex, scale = 1) {
  if (!data || bandIndex < 1 || bandIndex > data.length) {
    return null;
  }
  const value = data[bandIndex - 1];
  if (!isFiniteNumber(value)) {
    return null;
  }
  if (scale === 1) {
    return value;
  }
  return value / scale;
}

/**
 * Calcula un percentil sobre un array ya ordenado.
 *
 * @param {Array<number>} sorted Valores ordenados ascendentemente.
 * @param {number} percentile Percentil en [0, 100].
 * @returns {number|null}
 */
export function computePercentile(sorted, percentile) {
  if (!sorted || sorted.length === 0) {
    return null;
  }
  if (sorted.length === 1) {
    return sorted[0];
  }
  let p = percentile;
  if (p < 0) {
    p = 0;
  }
  if (p > 100) {
    p = 100;
  }
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) {
    return sorted[lower];
  }
  const weight = index - lower;
  return (sorted[lower] * (1 - weight)) + (sorted[upper] * weight);
}

/**
 * Obtiene el rango entre dos percentiles.
 *
 * @param {Array<number>} values Valores muestreados.
 * @param {number} [lowPercentile=2] Percentil inferior.
 * @param {number} [highPercentile=98] Percentil superior.
 * @returns {{ min: number, max: number, sampleCount: number }|null}
 */
export function computePercentileRange(
  values,
  lowPercentile = DEFAULT_LOW_PERCENTILE,
  highPercentile = DEFAULT_HIGH_PERCENTILE,
) {
  if (!values || values.length === 0) {
    return null;
  }
  const sorted = values.slice().sort((a, b) => a - b);
  const min = computePercentile(sorted, lowPercentile);
  const max = computePercentile(sorted, highPercentile);
  if (!isFiniteNumber(min) || !isFiniteNumber(max)) {
    return null;
  }
  if (min === max) {
    return {
      min,
      max,
      sampleCount: values.length,
    };
  }
  if (min > max) {
    return {
      min: max,
      max: min,
      sampleCount: values.length,
    };
  }
  return {
    min,
    max,
    sampleCount: values.length,
  };
}

/**
 * Índice normalizado (a - b) / (a + b).
 *
 * @param {number} a Primera banda.
 * @param {number} b Segunda banda.
 * @returns {number|null}
 */
export function computeNormalizedDifference(a, b) {
  if (!isFiniteNumber(a) || !isFiniteNumber(b)) {
    return null;
  }
  const sum = a + b;
  if (sum === 0) {
    return 0;
  }
  return (a - b) / sum;
}

/**
 * Extrae el valor a representar según el modo de rampa o índice.
 *
 * @param {TypedArray|Array<number>} data Datos del píxel.
 * @param {object} options Opciones de extracción.
 * @param {string} options.mode monoband | mean | ndvi | ndwi | nbr
 * @param {number|Array<number>} [options.bands] Banda o bandas 1-based.
 * @param {number|null} [options.nodata] Valor nodata.
 * @param {boolean} [options.normalize=false] Si la capa normaliza a 0–1.
 * @returns {number|null}
 */
export function extractSampleValue(data, options) {
  const {
    mode, bands, nodata, normalize = false,
  } = options;
  const scale = getNormalizedBandScale(data, normalize);

  if (mode === 'monoband') {
    const band = bands;
    const raw = getBandValue(data, band, 1);
    if (raw === null || isNodataValue(raw, nodata)) {
      return null;
    }
    const value = getBandValue(data, band, scale);
    if (normalize) {
      return clamp(value, 0, 1);
    }
    return value;
  }

  if (mode === 'mean') {
    if (!Array.isArray(bands) || bands.length === 0) {
      return null;
    }
    let sum = 0;
    let count = 0;
    for (let i = 0; i < bands.length; i += 1) {
      const bandIndex = bands[i];
      const raw = getBandValue(data, bandIndex, 1);
      if (raw === null || isNodataValue(raw, nodata)) {
        return null;
      }
      sum += getBandValue(data, bandIndex, scale);
      count += 1;
    }
    if (count === 0) {
      return null;
    }
    const mean = sum / count;
    if (normalize) {
      return clamp(mean, 0, 1);
    }
    return mean;
  }

  if (mode === 'ndvi' || mode === 'ndwi' || mode === 'nbr') {
    if (!Array.isArray(bands) || bands.length < 2) {
      return null;
    }
    const rawFirst = getBandValue(data, bands[0], 1);
    const rawSecond = getBandValue(data, bands[1], 1);
    if (rawFirst === null || rawSecond === null) {
      return null;
    }
    if (isNodataValue(rawFirst, nodata) || isNodataValue(rawSecond, nodata)) {
      return null;
    }
    const first = getBandValue(data, bands[0], scale);
    const second = getBandValue(data, bands[1], scale);
    const indexValue = computeNormalizedDifference(first, second);
    if (indexValue === null) {
      return null;
    }
    return clamp(indexValue, -1, 1);
  }

  return null;
}

/**
 * Ajusta el rango final según el modo y si la capa está normalizada.
 *
 * @param {{ min: number, max: number, sampleCount: number }} range Rango estimado.
 * @param {string} mode Modo de muestreo.
 * @param {boolean} normalize Si la capa normaliza.
 * @returns {{ min: number, max: number, sampleCount: number }}
 */
export function constrainRangeToMode(range, mode, normalize) {
  if (!range) {
    return null;
  }
  let { min, max } = range;
  const isIndex = mode === 'ndvi' || mode === 'ndwi' || mode === 'nbr';
  if (isIndex) {
    min = clamp(min, -1, 1);
    max = clamp(max, -1, 1);
  } else if (normalize) {
    min = clamp(min, 0, 1);
    max = clamp(max, 0, 1);
  }
  if (min > max) {
    return {
      min: max,
      max: min,
      sampleCount: range.sampleCount,
    };
  }
  return {
    min,
    max,
    sampleCount: range.sampleCount,
  };
}

/**
 * Muestrea el viewport del mapa y calcula el rango por percentiles.
 *
 * @param {object} params Parámetros.
 * @param {object} params.layer Capa con getData(pixel).
 * @param {object} params.olMap Mapa OpenLayers.
 * @param {string} params.mode Modo: monoband | mean | ndvi | ndwi | nbr.
 * @param {number|Array<number>} params.bands Banda(s) 1-based.
 * @param {number|null} [params.nodata] Valor nodata.
 * @param {boolean} [params.normalize=true] Si la capa normaliza a 0–1.
 * @param {number} [params.sampleStep] Paso de rejilla en píxeles.
 * @param {number} [params.lowPercentile] Percentil inferior.
 * @param {number} [params.highPercentile] Percentil superior.
 * @returns {{ min: number, max: number, sampleCount: number }|null}
 */
export function sampleViewportRange(params) {
  const {
    layer,
    olMap,
    mode,
    bands,
    nodata = null,
    normalize = true,
    sampleStep = DEFAULT_SAMPLE_STEP,
    lowPercentile = DEFAULT_LOW_PERCENTILE,
    highPercentile = DEFAULT_HIGH_PERCENTILE,
  } = params;

  if (!layer || typeof layer.getData !== 'function') {
    return null;
  }
  if (!olMap || typeof olMap.getSize !== 'function') {
    return null;
  }

  const size = olMap.getSize();
  if (!size || size.length < 2 || size[0] <= 0 || size[1] <= 0) {
    return null;
  }

  const width = size[0];
  const height = size[1];
  const step = Math.max(1, sampleStep);
  const values = [];

  for (let y = Math.floor(step / 2); y < height; y += step) {
    for (let x = Math.floor(step / 2); x < width; x += step) {
      const data = layer.getData([x, y]);
      if (data && data.length > 0) {
        const value = extractSampleValue(data, {
          mode, bands, nodata, normalize,
        });
        if (isFiniteNumber(value)) {
          values.push(value);
        }
      }
    }
  }

  const range = computePercentileRange(values, lowPercentile, highPercentile);
  return constrainRangeToMode(range, mode, normalize);
}
