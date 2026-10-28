/**
 * Utilidades para normalizar URLs de servicios OGC API Features.
 */

const COLLECTIONS_REGEX = /\/collections(?:\/([^/]+))?(?:\/items)?\/?$/i;

/**
 * Elimina la consulta, el fragmento y las barras finales de una URL.
 *
 * @param {String} url URL.
 * @returns {String} URL sin consulta ni barra final.
 */
const cleanUrl = (url) => url.trim().split(/[?#]/)[0].replace(/\/+$/, '');

/**
 * Indica si la URL apunta a /collections o a /collections/{id}.
 *
 * @param {String} url URL introducida por el usuario.
 * @returns {Boolean} Verdadero si contiene la ruta de colecciones.
 */
export const isCollectionsPath = (url) => COLLECTIONS_REGEX.test(cleanUrl(url));

/**
 * Obtiene la raíz del servicio y, si existe, la colección indicada en la URL.
 * Admite la raíz, /collections, /collections/{id} y /collections/{id}/items.
 *
 * @param {String} url URL introducida por el usuario.
 * @returns {{root: String, collectionId: (String|undefined)}} Raíz y colección.
 */
export const parseOGCAPIUrl = (url) => {
  const clean = cleanUrl(url || '');
  const match = clean.match(COLLECTIONS_REGEX);
  if (!match) {
    return { root: clean, collectionId: undefined };
  }
  return {
    root: clean.substring(0, match.index),
    collectionId: match[1] ? decodeURIComponent(match[1]) : undefined,
  };
};

/**
 * Devuelve la URL de colecciones del servicio.
 *
 * @param {String} root Raíz del servicio.
 * @returns {String} URL {root}/collections.
 */
export const getCollectionsUrl = (root) => `${root}/collections`;

/**
 * Devuelve la URL de una colección del servicio.
 *
 * @param {String} root Raíz del servicio.
 * @param {String} collectionId Identificador de la colección.
 * @returns {String} URL {root}/collections/{id}.
 */
export const getCollectionUrl = (root, collectionId) => `${getCollectionsUrl(root)}/${encodeURIComponent(collectionId)}`;

/**
 * Indica si dos URLs pertenecen al mismo servicio OGC API Features.
 *
 * @param {String} url1 URL.
 * @param {String} url2 URL.
 * @returns {Boolean} Verdadero si comparten raíz.
 */
export const isSameService = (url1, url2) => {
  if (!url1 || !url2) return false;
  return parseOGCAPIUrl(url1).root === parseOGCAPIUrl(url2).root;
};
