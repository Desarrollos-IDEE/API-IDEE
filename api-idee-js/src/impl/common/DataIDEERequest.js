import { addParameters, isNullOrEmpty } from 'IDEE/util/Utils';
import { get as getRemote } from 'IDEE/util/Remote';
import { getValue } from 'IDEE/i18n/language';
import { RequestCancelledError } from './RequestManager';

let refreshSequence = 0;

/** True when the service rejected the request credentials (HTTP 401/403). */
export function isUnauthorizedError(error) {
  return error?.status === 401 || error?.status === 403;
}

function validateGeoJSON(response) {
  if (!response || !Number.isInteger(response.code) || response.code < 200
    || response.code >= 300 || typeof response.text !== 'string') {
    const error = new Error(`DataIDEE request failed${response ? ` (HTTP ${response.code})` : '.'}`);
    error.status = response?.code;
    throw error;
  }
  if (isNullOrEmpty(response.text)) throw new Error(getValue('exception').no_service_response);
  const geoJSON = JSON.parse(response.text);
  const isFeature = geoJSON?.type === 'Feature' && geoJSON.geometry !== undefined;
  const isCollection = geoJSON?.type === 'FeatureCollection'
    && Array.isArray(geoJSON.features)
    && geoJSON.features.every((feature) => feature?.type === 'Feature');
  if (!isFeature && !isCollection) throw new Error('DataIDEE returned invalid GeoJSON.');
}

/**
 * Prepare a DataIDEE GET operation. Authentication and projection remain in each loader.
 * The exact URL/context are identified before adding the internal refresh parameter.
 * Validation (including asynchronous consumer validation) completes before caching text.
 */
export default function createDataIDEERequest({
  url, context, requestOptions, force = false, validateResponse, shouldExecute = () => true,
}) {
  return {
    key: JSON.stringify(['GET', url, context]),
    force,
    execute: async ({ force: fresh }) => {
      if (!shouldExecute()) throw new RequestCancelledError('obsolete viewport');
      let requestUrl = url;
      if (fresh) {
        refreshSequence += 1;
        requestUrl = addParameters(url, { _ideeRefresh: `${Date.now()}-${refreshSequence}` });
      }
      const response = await getRemote(requestUrl, null, requestOptions);
      validateGeoJSON(response);
      await validateResponse?.(response.text);
      const cacheControl = Object.entries(response.headers || {})
        .filter(([name]) => name.toLowerCase() === 'cache-control')
        .map(([, value]) => value).join(',');
      return {
        value: response.text,
        cacheable: !/\b(?:no-store|no-cache)\b/i.test(cacheControl),
        bytes: response.text.length * 2,
      };
    },
  };
}
