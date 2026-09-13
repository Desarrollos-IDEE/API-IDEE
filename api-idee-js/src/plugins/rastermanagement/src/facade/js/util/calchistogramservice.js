/**
 * URL del proceso WPS calcHistogram.
 * @constant
 * @type {string}
 */
export const CALC_HISTOGRAM_WPS_URL = 'https://mantenimiento-cnig-wps.desarrollo.guadaltel.es/processes/calcHistogram/execution';

/**
 * Parsea la respuesta del servicio calcHistogram.
 *
 * @param {object} response Respuesta de IDEE.remote.post.
 * @returns {Array<object>} Histogramas por banda.
 */
function parseCalcHistogramResponse(response) {
  if (response.code !== 200) {
    let message = `HTTP ${response.code}`;
    try {
      const errorBody = JSON.parse(response.text);
      if (errorBody && errorBody.message) {
        message = errorBody.message;
      }
    } catch (parseError) {
      // Respuesta no JSON: se mantiene el mensaje HTTP.
    }
    throw new Error(message);
  }

  const data = JSON.parse(response.text);
  if (IDEE.utils.isArray(data.value)) {
    return data.value;
  }
  if (IDEE.utils.isArray(data)) {
    return data;
  }
  throw new Error('Unexpected histogram response');
}

/**
 * Solicita el histograma de un ráster al servicio WPS calcHistogram.
 *
 * @param {string} urlRaster URL del GeoTIFF.
 * @param {string} [serviceUrl=CALC_HISTOGRAM_WPS_URL] URL del proceso WPS.
 * @param {object} [options] Opciones adicionales de la petición.
 * @param {object} [options.geom] GeoJSON Geometry, Feature o FeatureCollection.
 * @param {number} [options.distance] Distancia de muestreo en metros
 * para perfiles lineales.
 * @returns {{ promise: Promise<Array<object>>, abort: Function }}
 */
export function createCalcHistogramRequest(
  urlRaster,
  serviceUrl = CALC_HISTOGRAM_WPS_URL,
  options = {},
) {
  let requestUrl = CALC_HISTOGRAM_WPS_URL;
  if (!IDEE.utils.isNullOrEmpty(serviceUrl)) {
    requestUrl = serviceUrl;
  }

  const body = {
    inputs: {
      urlRaster,
    },
  };

  if (!IDEE.utils.isNullOrEmpty(options.geom)) {
    body.inputs.geom = options.geom;
  }
  if (IDEE.utils.isNumber(options.distance) && options.distance > 0) {
    body.inputs.distance = options.distance;
  }

  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  const promise = IDEE.remote.post(requestUrl, body, {
    headers,
  }).then(parseCalcHistogramResponse);

  return {
    promise,
    abort() {
      // IDEE.remote.post no expone abort; la cancelación se gestiona por requestId.
    },
  };
}

/**
 * Obtiene los centros de los buckets del histograma.
 *
 * @param {object} bandHistogram Datos de histograma.
 * @returns {{ centers: Array<number>, pixels: number }}
 */
function getHistogramCenters(bandHistogram) {
  const {
    min, max, buckets, counts,
  } = bandHistogram;
  const width = (max - min) / buckets;
  const centers = [];
  for (let i = 0; i < buckets; i += 1) {
    centers.push(min + (i + 0.5) * width);
  }

  let pixels = 0;
  for (let i = 0; i < counts.length; i += 1) {
    pixels += counts[i];
  }

  return { centers, pixels };
}

/**
 * Obtiene los centros y conteos del histograma para representar la gráfica.
 *
 * @param {object} bandHistogram Datos de histograma.
 * @returns {{ labels: Array<number>, counts: Array<number> }|null}
 */
export function getHistogramChartSeries(bandHistogram) {
  if (!bandHistogram || !IDEE.utils.isArray(bandHistogram.counts)) {
    return null;
  }
  const { centers } = getHistogramCenters(bandHistogram);
  return {
    labels: centers,
    counts: bandHistogram.counts,
  };
}

/**
 * Calcula el mínimo y máximo a partir de los buckets con datos.
 *
 * @param {Array<number>} centers Centros de bucket.
 * @param {Array<number>} counts Conteos por bucket.
 * @returns {{ min: number|null, max: number|null }}
 */
function getMinMaxFromHistogram(centers, counts) {
  let minValue = null;
  let maxValue = null;
  for (let i = 0; i < counts.length; i += 1) {
    if (counts[i] > 0) {
      if (minValue === null) {
        minValue = centers[i];
      }
      maxValue = centers[i];
    }
  }
  return { min: minValue, max: maxValue };
}

/**
 * Calcula un percentil a partir del histograma acumulado.
 *
 * @param {Array<number>} centers Centros de bucket.
 * @param {Array<number>} counts Conteos por bucket.
 * @param {number} pixels Total de píxeles.
 * @param {number} percentile Percentil a calcular (0-100).
 * @returns {number|null}
 */
function getPercentileFromHistogram(centers, counts, pixels, percentile) {
  const target = (pixels * percentile) / 100;
  let cumulative = 0;
  for (let i = 0; i < counts.length; i += 1) {
    cumulative += counts[i];
    if (cumulative >= target) {
      return centers[i];
    }
  }
  if (centers.length === 0) {
    return null;
  }
  return centers[centers.length - 1];
}

/**
 * Obtiene un valor numérico del histograma probando varios nombres de campo.
 *
 * @param {object} bandHistogram Datos de histograma.
 * @param {Array<string>} fieldNames Nombres posibles del campo.
 * @returns {number|null}
 */
function getNumericField(bandHistogram, fieldNames) {
  for (let i = 0; i < fieldNames.length; i += 1) {
    const fieldName = fieldNames[i];
    const value = bandHistogram[fieldName];
    if (IDEE.utils.isNumber(value) && !Number.isNaN(value)) {
      return value;
    }
  }
  return null;
}

/**
 * Extrae estadísticas descriptivas de la respuesta del servicio.
 * Usa los valores calculados por el WPS cuando están disponibles
 * y solo deriva del histograma lo que el servicio no proporciona.
 *
 * @param {object} bandHistogram Datos de histograma devueltos por calcHistogram.
 * @returns {object|null} Estadísticas o null si no hay píxeles.
 */
export function computeBandStats(bandHistogram) {
  const { centers, pixels: pixelsFromCounts } = getHistogramCenters(bandHistogram);
  const pixels = getNumericField(bandHistogram, ['pixelCount', 'pixels']) || pixelsFromCounts;

  if (pixels === 0) {
    return null;
  }

  const { counts } = bandHistogram;
  const { min, max } = getMinMaxFromHistogram(centers, counts);

  let mean = getNumericField(bandHistogram, ['mean']);
  let median = getNumericField(bandHistogram, ['median']);
  let stdDev = getNumericField(bandHistogram, ['std', 'stdDev', 'stddev']);

  let percentile25 = getNumericField(bandHistogram, ['percentile25', 'p25', 'q1']);
  let percentile75 = getNumericField(bandHistogram, ['percentile75', 'p75', 'q3']);

  if (mean === null) {
    let sum = 0;
    for (let i = 0; i < counts.length; i += 1) {
      sum += counts[i] * centers[i];
    }
    mean = sum / pixels;
  }

  if (median === null) {
    median = getPercentileFromHistogram(centers, counts, pixels, 50);
  }

  if (stdDev === null) {
    let varianceSum = 0;
    for (let i = 0; i < counts.length; i += 1) {
      const diff = centers[i] - mean;
      varianceSum += counts[i] * diff * diff;
    }
    stdDev = Math.sqrt(varianceSum / pixels);
  }

  if (percentile25 === null) {
    percentile25 = getPercentileFromHistogram(centers, counts, pixels, 25);
  }

  if (percentile75 === null) {
    percentile75 = getPercentileFromHistogram(centers, counts, pixels, 75);
  }

  return {
    pixels,
    min,
    max,
    mean,
    median,
    stdDev,
    percentile25,
    percentile75,
  };
}
