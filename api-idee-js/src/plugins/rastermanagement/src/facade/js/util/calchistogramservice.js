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
 * Obtiene los centros de los buckets del histograma para la gráfica.
 *
 * @param {object} bandHistogram Datos de histograma.
 * @returns {Array<number>}
 */
function getHistogramCenters(bandHistogram) {
  const {
    min, max, buckets,
  } = bandHistogram;
  const width = (max - min) / buckets;
  const centers = [];
  for (let i = 0; i < buckets; i += 1) {
    centers.push(min + (i + 0.5) * width);
  }
  return centers;
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
  return {
    labels: getHistogramCenters(bandHistogram),
    counts: bandHistogram.counts,
  };
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
 * Extrae las estadísticas descriptivas ya calculadas por el servicio calcHistogram.
 *
 * @param {object} bandHistogram Datos de histograma devueltos por calcHistogram.
 * @returns {object|null} Estadísticas o null si no hay píxeles.
 */
export function computeBandStats(bandHistogram) {
  if (!bandHistogram) {
    return null;
  }

  const pixels = getNumericField(bandHistogram, ['pixelCount', 'pixels']);
  if (pixels === null || pixels === 0) {
    return null;
  }

  return {
    pixels,
    min: getNumericField(bandHistogram, ['min']),
    max: getNumericField(bandHistogram, ['max']),
    mean: getNumericField(bandHistogram, ['mean']),
    median: getNumericField(bandHistogram, ['median']),
    stdDev: getNumericField(bandHistogram, ['std', 'stdDev', 'stddev']),
    percentile25: getNumericField(bandHistogram, [
      'percentile_25',
      'percentile25',
      'p25',
      'q1',
    ]),
    percentile75: getNumericField(bandHistogram, [
      'percentile_75',
      'percentile75',
      'p75',
      'q3',
    ]),
  };
}
