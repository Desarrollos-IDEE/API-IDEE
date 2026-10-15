/**
 * Detección de servicios OGC API Features a partir de una URL.
 */
import { parseOGCAPIUrl, getCollectionsUrl, getCollectionUrl } from './ogcapiurl';

const UNAUTHORIZED_CODES = [401, 403];

/**
 * El servicio no responde o el navegador bloquea la respuesta (red o CORS).
 */
export class ServiceUnreachableError extends Error {
  constructor(url) {
    super(`Service unreachable: ${url}`);
    this.name = 'ServiceUnreachableError';
  }
}

const parseJSON = (text) => {
  try {
    return JSON.parse(text);
  } catch (err) {
    return null;
  }
};

/**
 * Comprueba si la primera colección devuelve objetos geográficos.
 * Se usa cuando el servicio no declara "itemType".
 *
 * @param {String} root Raíz del servicio.
 * @param {Object} collection Colección.
 * @returns {Promise<Boolean>} Verdadero si /items devuelve un FeatureCollection.
 */
const hasFeatureItems = (root, collection) => {
  const itemsUrl = `${getCollectionUrl(root, collection.id)}/items?f=json&limit=1`;
  return IDEE.remote.get(itemsUrl)
    .then((response) => parseJSON(response.text)?.type === 'FeatureCollection')
    .catch(() => false);
};

/**
 * Detecta si la URL corresponde a un servicio OGC API Features.
 * Admite la raíz del servicio, /collections y /collections/{id}.
 *
 * @param {String} url URL introducida por el usuario.
 * @returns {Promise<Object|null>} { root, collectionId, isProtected } o null si no lo es.
 * isProtected indica que /collections exige autenticación (HTTP 401/403).
 * Se rechaza con ServiceUnreachableError si /collections no responde (red o CORS).
 */
const detectOGCAPIFeatures = (url) => {
  const { root, collectionId } = parseOGCAPIUrl(url);
  if (!IDEE.utils.isUrl(root)) return Promise.resolve(null);

  const collectionsUrl = `${getCollectionsUrl(root)}?f=json`;
  return IDEE.remote.get(collectionsUrl).catch(() => ({ code: 0 })).then((response) => {
    if (response.code === 0) throw new ServiceUnreachableError(collectionsUrl);
    if (UNAUTHORIZED_CODES.includes(response.code)) {
      return { root, collectionId, isProtected: true };
    }
    const json = parseJSON(response.text);
    if (!json || !Array.isArray(json.collections)) return null;

    const { collections } = json;
    if (collections.length === 0) {
      return Array.isArray(json.links) ? { root, collectionId, isProtected: false } : null;
    }
    if (collections.some((collection) => collection.itemType === 'feature')) {
      return { root, collectionId, isProtected: false };
    }
    return hasFeatureItems(root, collections[0])
      .then((isFeatures) => (isFeatures ? { root, collectionId, isProtected: false } : null));
  }).catch((err) => {
    if (err instanceof ServiceUnreachableError) throw err;
    return null;
  });
};

export default detectOGCAPIFeatures;
