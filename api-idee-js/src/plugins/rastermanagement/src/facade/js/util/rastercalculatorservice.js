/**
 * Servicio WPS de calculadora ráster.
 * @module IDEE/util/rastercalculatorservice
 */

/**
 * URL del proceso WPS rasterCalculator.
 * @constant
 * @type {string}
 */
export const RASTER_CALCULATOR_WPS_URL = 'https://mantenimiento-cnig-wps.desarrollo.guadaltel.es/processes/rasterCalculator/execution';

/**
 * Intervalo de sondeo del estado del job (ms). (cada 7 segundos)
 * @constant
 * @type {number}
 */
const POLL_INTERVAL_MS = 7000;

/**
 * Tiempo máximo de espera del job (ms). (15 minutos)
 * @constant
 * @type {number}
 */
const POLL_TIMEOUT_MS = 15 * 60 * 1000;

/**
 * Operaciones predefinidas de la calculadora ráster.
 * @constant
 * @type {Array<object>}
 */
export const PREDEFINED_OPERATIONS = [
  {
    id: 'ndvi',
    labelKey: 'ndvi',
    tooltipKey: 'ndviTooltip',
    expression: '(@nir - @red) / (@nir + @red)',
    params: [
      {
        id: 'nir',
        labelKey: 'bandNir',
        tooltipKey: 'bandNirTooltip',
        defaultBand: 4,
      },
      { id: 'red', labelKey: 'bandRed', defaultBand: 3 },
    ],
  },
  {
    id: 'ndwi',
    labelKey: 'ndwi',
    tooltipKey: 'ndwiTooltip',
    expression: '(@green - @nir) / (@green + @nir)',
    params: [
      { id: 'green', labelKey: 'bandGreen', defaultBand: 2 },
      {
        id: 'nir',
        labelKey: 'bandNir',
        tooltipKey: 'bandNirTooltip',
        defaultBand: 4,
      },
    ],
  },
  {
    id: 'nbr',
    labelKey: 'nbr',
    tooltipKey: 'nbrTooltip',
    expression: '(@nir - @swir) / (@nir + @swir)',
    params: [
      {
        id: 'nir',
        labelKey: 'bandNir',
        tooltipKey: 'bandNirTooltip',
        defaultBand: 4,
      },
      {
        id: 'swir',
        labelKey: 'bandSwir',
        tooltipKey: 'bandSwirTooltip',
        defaultBand: 6,
      },
    ],
  },
  {
    id: 'sum',
    labelKey: 'calcOpSum',
    expression: '@b1 + @b2',
    params: [
      { id: 'b1', labelKey: 'band', defaultBand: 1 },
      { id: 'b2', labelKey: 'band', defaultBand: 2 },
    ],
  },
  {
    id: 'diff',
    labelKey: 'calcOpDiff',
    expression: '@b1 - @b2',
    params: [
      { id: 'b1', labelKey: 'band', defaultBand: 1 },
      { id: 'b2', labelKey: 'band', defaultBand: 2 },
    ],
  },
  {
    id: 'product',
    labelKey: 'calcOpProduct',
    expression: '@b1 * @b2',
    params: [
      { id: 'b1', labelKey: 'band', defaultBand: 1 },
      { id: 'b2', labelKey: 'band', defaultBand: 2 },
    ],
  },
  {
    id: 'ratio',
    labelKey: 'calcOpRatio',
    expression: '@b1 / @b2',
    params: [
      { id: 'b1', labelKey: 'band', defaultBand: 1 },
      { id: 'b2', labelKey: 'band', defaultBand: 2 },
    ],
  },
  {
    id: 'mean3',
    labelKey: 'calcOpMean3',
    expression: '(@b1 + @b2 + @b3) / 3',
    params: [
      { id: 'b1', labelKey: 'band', defaultBand: 1 },
      { id: 'b2', labelKey: 'band', defaultBand: 2 },
      { id: 'b3', labelKey: 'band', defaultBand: 3 },
    ],
  },
];

/**
 * Sustituye roles de banda (@nir, @red…) por índices (@4, @3…).
 *
 * @param {string} expression Expresión con roles.
 * @param {Object<string, number>} bandMap Mapa rol → número de banda.
 * @returns {string}
 */
export function substituteBandRoles(expression, bandMap) {
  let result = expression;
  Object.keys(bandMap).forEach((role) => {
    const band = bandMap[role];
    const pattern = new RegExp(`@${role}\\b`, 'gi');
    result = result.replace(pattern, `@${band}`);
  });
  return result;
}

/**
 * Resuelve una operación predefinida sustituyendo parámetros de banda.
 *
 * @param {object} operation Operación predefinida.
 * @param {Object<string, number>} bandValues Valores de banda por parámetro.
 * @returns {string}
 */
export function resolvePredefinedExpression(operation, bandValues) {
  const bandMap = {};
  operation.params.forEach((param) => {
    let band = bandValues[param.id];
    if (!band || Number.isNaN(band)) {
      band = param.defaultBand;
    }
    bandMap[param.id] = band;
  });
  return substituteBandRoles(operation.expression, bandMap);
}

/**
 * Extrae un enlace de la respuesta del job por relación y/o tipo.
 *
 * @param {Array<object>} links Enlaces del job.
 * @param {string} rel Relación esperada.
 * @param {string} [type] Tipo MIME preferido.
 * @returns {string|null}
 */
function findLinkHref(links, rel, type) {
  if (!IDEE.utils.isArray(links)) {
    return null;
  }
  let fallback = null;
  for (let i = 0; i < links.length; i += 1) {
    const link = links[i];
    if (link && link.rel === rel && !IDEE.utils.isNullOrEmpty(link.href)) {
      if (!IDEE.utils.isNullOrEmpty(type) && link.type === type) {
        return link.href;
      }
      if (IDEE.utils.isNullOrEmpty(fallback)) {
        fallback = link.href;
      }
    }
  }
  return fallback;
}

/**
 * Parsea el cuerpo JSON de una respuesta IDEE.remote.
 *
 * @param {object} response Respuesta de IDEE.remote.
 * @returns {object}
 */
function parseJsonResponse(response) {
  if (response.code < 200 || response.code >= 300) {
    let message = `HTTP ${response.code}`;
    try {
      const errorBody = JSON.parse(response.text);
      if (errorBody && errorBody.message) {
        message = errorBody.message;
      } else if (errorBody && errorBody.description) {
        message = errorBody.description;
      }
    } catch (parseError) {
      // Respuesta no JSON: se mantiene el mensaje HTTP.
    }
    throw new Error(message);
  }
  return JSON.parse(response.text);
}

/**
 * Espera el tiempo indicado.
 *
 * @param {number} ms Milisegundos.
 * @returns {Promise<void>}
 */
function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Consulta el estado de un job WPS.
 *
 * @param {string} statusUrl URL de estado.
 * @returns {Promise<object>}
 */
function fetchJobStatus(statusUrl) {
  return IDEE.remote.get(statusUrl, null, {
    headers: {
      Accept: 'application/json',
    },
  }).then(parseJsonResponse);
}

/**
 * Actualiza las URLs de estado y resultados a partir de los links del job.
 *
 * @param {object} statusData Respuesta de estado.
 * @param {string} statusUrl URL de estado actual.
 * @param {string} resultsUrl URL de resultados actual.
 * @returns {{ statusUrl: string, resultsUrl: string }}
 */
function resolveJobUrls(statusData, statusUrl, resultsUrl) {
  let nextStatusUrl = statusUrl;
  let nextResultsUrl = resultsUrl;
  const statusFromLinks = findLinkHref(statusData.links, 'status', 'application/json');
  if (!IDEE.utils.isNullOrEmpty(statusFromLinks)) {
    nextStatusUrl = statusFromLinks;
  }
  const tiffFromLinks = findLinkHref(statusData.links, 'about', 'image/tiff');
  if (!IDEE.utils.isNullOrEmpty(tiffFromLinks)) {
    nextResultsUrl = tiffFromLinks;
  } else {
    const aboutUrl = findLinkHref(statusData.links, 'about');
    if (!IDEE.utils.isNullOrEmpty(aboutUrl) && aboutUrl.indexOf('/results') !== -1) {
      nextResultsUrl = aboutUrl.split('?')[0];
    }
  }
  return {
    statusUrl: nextStatusUrl,
    resultsUrl: nextResultsUrl,
  };
}

/**
 * Espera a que el job termine con éxito y devuelve la URL del GeoTIFF.
 *
 * @param {string} statusUrl URL de estado del job.
 * @param {string} resultsUrl URL de resultados.
 * @param {{ cancelled: boolean }} cancelToken Token de cancelación.
 * @param {number} startedAt Marca de tiempo de inicio.
 * @returns {Promise<string>}
 */
function waitForJobResult(statusUrl, resultsUrl, cancelToken, startedAt) {
  if (cancelToken.cancelled) {
    return Promise.reject(new Error('CANCELLED'));
  }
  if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
    return Promise.reject(new Error('JOB_TIMEOUT'));
  }

  return fetchJobStatus(statusUrl).then((statusData) => {
    const urls = resolveJobUrls(statusData, statusUrl, resultsUrl);
    const status = statusData.status;

    if (status === 'successful') {
      if (IDEE.utils.isNullOrEmpty(urls.resultsUrl)) {
        throw new Error('NO_RESULTS_URL');
      }
      return urls.resultsUrl;
    }
    if (status === 'failed' || status === 'dismissed') {
      let message = 'JOB_FAILED';
      if (!IDEE.utils.isNullOrEmpty(statusData.message)) {
        message = statusData.message;
      }
      throw new Error(message);
    }

    return delay(POLL_INTERVAL_MS).then(() => {
      return waitForJobResult(urls.statusUrl, urls.resultsUrl, cancelToken, startedAt);
    });
  });
}

/**
 * Lanza el cálculo ráster en el servicio WPS y espera el resultado.
 *
 * @param {string} urlRaster URL del GeoTIFF de entrada.
 * @param {string} formula Fórmula a aplicar (@1, @2…).
 * @param {string} [serviceUrl=RASTER_CALCULATOR_WPS_URL] URL del proceso WPS.
 * @returns {{ promise: Promise<{ resultsUrl: string, jobID: string }>, abort: Function }}
 */
export function createRasterCalculatorRequest(
  urlRaster,
  formula,
  serviceUrl = RASTER_CALCULATOR_WPS_URL,
) {
  let requestUrl = RASTER_CALCULATOR_WPS_URL;
  if (!IDEE.utils.isNullOrEmpty(serviceUrl)) {
    requestUrl = serviceUrl;
  }

  const cancelToken = { cancelled: false };
  const body = {
    inputs: {
      urlRaster,
      formula,
    },
  };

  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  const promise = IDEE.remote.post(requestUrl, body, { headers })
    .then(parseJsonResponse)
    .then((executionData) => {
      if (cancelToken.cancelled) {
        throw new Error('CANCELLED');
      }

      const jobID = executionData.jobID;
      let statusUrl = findLinkHref(executionData.links, 'status', 'application/json');
      let resultsUrl = findLinkHref(executionData.links, 'about');

      if (IDEE.utils.isNullOrEmpty(statusUrl) && !IDEE.utils.isNullOrEmpty(jobID)) {
        const base = requestUrl.replace(/\/processes\/.*$/, '');
        statusUrl = `${base}/jobs/${jobID}`;
      }
      if (IDEE.utils.isNullOrEmpty(resultsUrl) && !IDEE.utils.isNullOrEmpty(jobID)) {
        const base = requestUrl.replace(/\/processes\/.*$/, '');
        resultsUrl = `${base}/jobs/${jobID}/results`;
      }

      if (executionData.status === 'successful') {
        if (IDEE.utils.isNullOrEmpty(resultsUrl)) {
          throw new Error('NO_RESULTS_URL');
        }
        return { resultsUrl, jobID };
      }

      if (IDEE.utils.isNullOrEmpty(statusUrl)) {
        throw new Error('NO_STATUS_URL');
      }

      return waitForJobResult(statusUrl, resultsUrl, cancelToken, Date.now())
        .then((finalResultsUrl) => {
          return {
            resultsUrl: finalResultsUrl,
            jobID,
          };
        });
    });

  return {
    promise,
    abort() {
      cancelToken.cancelled = true;
    },
  };
}
