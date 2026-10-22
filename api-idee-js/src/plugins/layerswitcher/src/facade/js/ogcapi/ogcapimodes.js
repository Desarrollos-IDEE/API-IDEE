/**
 * Modos de carga de servicios OGC API Features (patrón estrategia).
 * Cada modo sabe cómo consultar el servicio y qué capa de la API crear.
 * Para añadir un modo basta con implementar la misma interfaz y registrarlo en
 * createOGCAPIModes.
 */
import { parseOGCAPIUrl, getCollectionsUrl, getCollectionUrl } from './ogcapiurl';

export const MODE_STANDARD = 'ogcapifeatures';
export const MODE_DATAIDEE = 'dataidee';

const UNAUTHORIZED_CODES = [401, 403];
const GEOJSON_TYPES = ['application/geo+json', 'application/json'];

const parseJSON = (text) => {
  try {
    return JSON.parse(text);
  } catch (err) {
    return null;
  }
};

/**
 * Convierte el bbox del formulario ("minx;miny;maxx;maxy") al formato OGC.
 * @param {String} bbox BBOX separado por ";".
 * @returns {String} BBOX separado por ",".
 */
const toOGCBbox = (bbox) => bbox.split(';').join(',');

/**
 * Lee la respuesta de /items y devuelve el número de objetos geográficos.
 * @param {Object} response Respuesta de IDEE.remote.
 * @returns {Number} Número de objetos geográficos.
 */
const countFromResponse = (response) => {
  const json = parseJSON(response.text);
  if (json === null) return 0;
  if (json.type === 'Feature') return 1;
  return Array.isArray(json.features) ? json.features.length : 0;
};

/**
 * Clase base de los modos. Define la interfaz común.
 */
class OGCAPIMode {
  /**
   * @param {String} key Identificador del modo.
   * @param {String} layerType Tipo de capa de la API que crea el modo.
   */
  constructor(key, layerType) {
    this.key = key;
    this.layerType = layerType;
  }

  /**
   * Opciones de IDEE.remote para las peticiones del servicio.
   * @returns {Object|undefined} Opciones.
   */
  // eslint-disable-next-line class-methods-use-this, no-unused-vars
  getRequestOptions(root) {
    return undefined;
  }

  /**
   * URL del listado de colecciones.
   * @param {String} root Raíz del servicio.
   * @returns {String} URL.
   */
  // eslint-disable-next-line class-methods-use-this
  getCollectionsUrl(root) {
    return getCollectionsUrl(root);
  }

  /**
   * Obtiene las colecciones del servicio.
   * @param {String} root Raíz del servicio.
   * @returns {Promise<{collections: Array, unauthorized: Boolean}>} Colecciones.
   */
  getCollections(root) {
    return IDEE.remote.get(this.getCollectionsUrl(root), null, this.getRequestOptions(root))
      .then((response) => {
        if (UNAUTHORIZED_CODES.includes(response.code)) {
          return { collections: [], unauthorized: true };
        }
        const json = parseJSON(response.text);
        if (!json || !Array.isArray(json.collections)) {
          throw new Error(`Invalid collections response: ${response.code}`);
        }
        return { collections: json.collections, unauthorized: false };
      });
  }

  /**
   * Obtiene los "queryables" de una colección.
   * @param {String} root Raíz del servicio.
   * @param {String} collectionId Colección.
   * @returns {Promise<Object|null>} JSON de queryables o null si la respuesta no es JSON.
   */
  getQueryables(root, collectionId) {
    const url = `${getCollectionUrl(root, collectionId)}/queryables`;
    return IDEE.remote.get(url, null, this.getRequestOptions(root))
      .then((response) => parseJSON(response.text));
  }

  /**
   * URL de /items con los filtros del formulario.
   * @param {String} root Raíz del servicio.
   * @param {Object} props Propiedades de la capa (name, id, limit, bbox, conditional).
   * @param {Object} params Parámetros adicionales (p. ej. f).
   * @returns {String} URL de /items.
   */
  // eslint-disable-next-line class-methods-use-this
  buildItemsUrl(root, props, params = {}) {
    let url = `${getCollectionUrl(root, props.name)}/items`;
    const query = { ...params };
    if (!IDEE.utils.isNullOrEmpty(props.id)) {
      url += `/${encodeURIComponent(props.id)}`;
    } else {
      if (!IDEE.utils.isNullOrEmpty(props.limit)) query.limit = props.limit;
      if (!IDEE.utils.isNullOrEmpty(props.bbox)) query.bbox = toOGCBbox(props.bbox);
      Object.assign(query, props.conditional);
    }
    return Object.keys(query).length > 0 ? IDEE.utils.addParameters(url, query) : url;
  }

  /**
   * Cuenta los objetos geográficos que devolvería la capa.
   * @param {String} root Raíz del servicio.
   * @param {Object} props Propiedades de la capa.
   * @param {Object} collection Colección seleccionada.
   * @returns {Promise<Number>} Número de objetos geográficos.
   */
  countFeatures(root, props, collection) {
    const url = this.getItemsUrl(root, props, collection);
    return IDEE.remote.get(url, null, this.getRequestOptions(root)).then(countFromResponse);
  }
}

/**
 * Modo estándar: crea capas IDEE.layer.OGCAPIFeatures.
 */
export class StandardMode extends OGCAPIMode {
  constructor() {
    super(MODE_STANDARD, 'OGCAPIFeatures');
  }

  // eslint-disable-next-line class-methods-use-this
  getCollectionsUrl(root) {
    return `${getCollectionsUrl(root)}?f=json`;
  }

  /**
   * Valor del parámetro "f" para GeoJSON según el enlace "items" que anuncia
   * el servicio. Si el enlace no usa "f", devuelve null para no enviarlo.
   * @param {String} root Raíz del servicio.
   * @param {Object} collection Colección.
   * @returns {String|null} Formato.
   */
  // eslint-disable-next-line class-methods-use-this
  getFormat(root, collection) {
    const link = (collection?.links || [])
      .find((l) => l.rel === 'items' && GEOJSON_TYPES.includes(l.type));
    if (!link) return 'json';
    try {
      return new URL(link.href, `${root}/`).searchParams.get('f');
    } catch (err) {
      return 'json';
    }
  }

  getItemsUrl(root, props, collection) {
    const format = this.getFormat(root, collection);
    return this.buildItemsUrl(root, props, format ? { f: format } : {});
  }

  createLayer(root, props, collection) {
    return new IDEE.layer.OGCAPIFeatures({
      ...props,
      url: `${getCollectionsUrl(root)}/`,
      format: this.getFormat(root, collection),
    });
  }

  // eslint-disable-next-line class-methods-use-this
  getLayerInfoRequest(layer) {
    return {
      url: `${layer.url}${layer.name}?f=json`,
      htmlUrl: `${layer.url}${layer.name}?f=html`,
    };
  }
}

/**
 * Modo DataIDEE: crea capas IDEE.layer.DataIDEE con el token de la sesión y consulta
 * el servicio (colecciones, queryables, recuento e información). El token va siempre
 * en la cabecera "Authorization: Bearer" (también en las capas: es lo predeterminado
 * de IDEE.layer.DataIDEE). No usa el parámetro "f".
 */
export class DataIDEEMode extends OGCAPIMode {
  /**
   * @param {Object} authManager Gestor de sesiones (getToken(root)).
   */
  constructor(authManager) {
    super(MODE_DATAIDEE, 'DataIDEE');
    this.authManager_ = authManager;
  }

  getRequestOptions(root) {
    const token = this.authManager_.getToken(root);
    return token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
  }

  getItemsUrl(root, props) {
    return this.buildItemsUrl(root, props);
  }

  createLayer(root, props) {
    const token = this.authManager_.getToken(root);
    return new IDEE.layer.DataIDEE(
      { ...props, url: root },
      {},
      token ? { getFeature: { token } } : {},
    );
  }

  // eslint-disable-next-line class-methods-use-this
  getLayerInfoRequest(layer) {
    const token = typeof layer.getToken === 'function' ? layer.getToken() : undefined;
    return {
      url: getCollectionUrl(parseOGCAPIUrl(layer.url).root, layer.name),
      options: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
    };
  }
}

/**
 * Crea el registro de modos disponibles.
 * @param {Object} authManager Gestor de sesiones DataIDEE.
 * @returns {Object} Modos indexados por clave.
 */
export const createOGCAPIModes = (authManager) => ({
  [MODE_STANDARD]: new StandardMode(),
  [MODE_DATAIDEE]: new DataIDEEMode(authManager),
});

/**
 * Busca el modo que crea capas del tipo indicado.
 * @param {Object} modes Registro de modos.
 * @param {String} layerType Tipo de capa (OGCAPIFeatures, DataIDEE).
 * @returns {Object|undefined} Modo.
 */
export const getModeByLayerType = (modes, layerType) => Object.values(modes)
  .find((mode) => mode.layerType === layerType);
