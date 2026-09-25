/**
 * @module IDEE/stac/Catalog
 */
import { post, get } from '../util/Remote';
import Base from '../Base';
import { getValue, getLang } from '../i18n/language';
import { error as showError } from '../dialog';

/**
 * Lenguajes de filtrado soportados por el endpoint STAC `/search`.
 *
 * @constant
 * @type {Object}
 * @property {string} STAC_QUERY Formato de consulta `stac-query`.
 * @property {string} CQL_JSON Formato de filtro `cql-json`.
 * @property {string} CQL2_JSON Formato de filtro `cql2-json`.
 * @private
 */
const STAC_FILTER_LANG = {
  STAC_QUERY: 'stac-query',
  CQL_JSON: 'cql-json',
  CQL2_JSON: 'cql2-json',
};

/**
 * Relaciones de enlace de paginación STAC admitidas
 * (`self`, `next` y `previous`).
 *
 * @constant
 * @type {Array<string>}
 * @private
 */
const SUPPORTED_LINKS = ['self', 'next', 'previous'];

/**
 * @classdesc
 * Clase para gestionar catálogos STAC.
 *
 * Permite consultar colecciones, ítems y campos consultables de un catálogo STAC,
 * tanto en modo público como autenticado mediante token Bearer.
 *
 * @extends {IDEE.Base}
 * @property {string} url URL del catálogo STAC.
 * @property {boolean} public Indica si el catálogo es público (sin autenticación).
 * @property {string} authUrl URL del servicio de autenticación y autorización.
 * @property {string} collectionsUrl URL del servicio de colecciones autorizadas
 * (requerida para catálogos privados o cuando se requiera un endpoint distinto del STAC).
 * @property {string} title Título descriptivo del catálogo.
 * @property {string|null} token Token de acceso obtenido tras autenticarse.
 * @property {string|null} refreshToken Token de refresco utilizado para renovar
 * el token de acceso cuando expira.
 * @api
 */
class Catalog extends Base {
  /**
   * Constructor principal de la clase. Crea una instancia de catálogo STAC
   * con los parámetros especificados por el usuario.
   *
   * @constructor
   * @param {Object} userParameters Parámetros proporcionados por el usuario.
   * - url: URL del catálogo STAC.
   * - authUrl: URL del servicio de autenticación (requerida si el catálogo es privado).
   * - public: Verdadero si el catálogo es público y no requiere autenticación.
   * - collectionsUrl: URL del servicio de colecciones autorizadas (opcional; si se
   *   omite en catálogos públicos, se consulta `{url}/collections`).
   * - title: Título descriptivo del catálogo (opcional).
   * @throws {Error} Si no se indica la URL del catálogo, o si el catálogo es
   * privado y no se indica `authUrl`.
   * @api
   */
  constructor(userParameters) {
    super(null);

    const url = userParameters.url;
    const publicValue = userParameters.public !== false;
    if (!url) {
      const noCatalogMsg = getValue('exception').no_catalog_url;
      showError(noCatalogMsg);
      throw new Error(noCatalogMsg);
    }
    if (!publicValue && !userParameters.authUrl) {
      const noAuthUrlMsg = getValue('exception').no_catalog_auth_url;
      showError(noAuthUrlMsg);
      throw new Error(noAuthUrlMsg);
    }
    /**
     * URL del catálogo STAC.
     * @type {string}
     * @public
     * @api
     */
    this.url = url;
    /**
     * Indica si el catálogo es público (sin autenticación).
     * @type {boolean}
     * @public
     * @api
     */
    this.public = publicValue;
    /**
     * URL del servicio de autenticación y autorización.
     * @type {string}
     * @public
     * @api
     */
    this.authUrl = userParameters.authUrl;
    /**
     * URL del servicio de obtención colecciones autorizadas.
     * @type {string}
     * @public
     * @api
     */
    this.collectionsUrl = userParameters.collectionsUrl;
    /**
     * Título descriptivo del catálogo.
     * @type {string}
     * @public
     * @api
     */
    this.title = userParameters.title || new URL(url).hostname;
    /**
     * Token de acceso obtenido tras autenticarse.
     * @type {string|null}
     * @public
     * @api
     */
    this.token = null;
    /**
     * Token de refresco utilizado para renovar el token de acceso.
     * @type {string|null}
     * @public
     * @api
     */
    this.refreshToken = null;
  }

  /**
   * Autentica al usuario contra el servicio de autenticación y almacena
   * el token de acceso y el token de refresco para las peticiones posteriores.
   *
   * @function
   * @public
   * @param {string} username Nombre de usuario.
   * @param {string} password Contraseña del usuario.
   * @returns {Promise<boolean>|undefined} Promesa que se resuelve con verdadero si la
   * autenticación fue correcta, o indefinido si faltan credenciales.
   * @api
   */
  authenticate(username, password) {
    if (!username || !password) {
      const noUsernamePasswordMsg = getValue('exception').no_catalog_username_password;
      showError(noUsernamePasswordMsg);
      return;
    }
    return new Promise((success, fail) => {
      post(`${this.authUrl}`, {
        username,
        password,
      }, { headers: { 'Content-Type': 'application/json' } }).then((response) => {
        if (response.code === 401) {
          showError(getValue('exception').invalid_user_password);
          throw new Error(getValue('exception').invalid_user_password);
        } else if (response.code === 200) {
          const data = JSON.parse(response.text);
          if (data.access_token) {
            this.token = data.access_token;
            this.refreshToken = data.refresh_token;
            success(true);
          }
        } else {
          const data = JSON.parse(response.text || '{}');
          throw new Error(data.error);
        }
      }).catch((error) => {
        fail(new Error(`${getValue('exception').catalog_token_error}: ${error.message}`));
      });
    });
  }

  /**
   * Renueva el token de acceso utilizando el token de refresco almacenado.
   *
   * Construye la URL del endpoint `/refresh-token` a partir de `authUrl` y
   * actualiza `token` y `refreshToken` si la respuesta es correcta.
   *
   * @function
   * @public
   * @returns {Promise<boolean>} Promesa que se resuelve con verdadero si la
   * renovación del token fue correcta.
   * @api
   */
  refreshTokenAuth() {
    const url = `${this.authUrl.substring(0, this.authUrl.lastIndexOf('/'))}/refresh-token`;
    return new Promise((success, fail) => {
      post(url, {
        refreshToken: this.refreshToken,
      }, { headers: { 'Content-Type': 'application/json' } }).then((response) => {
        if (response.code === 401 || response.code === 403) {
          showError(getValue('exception').invalid_user_password);
          throw new Error(getValue('exception').invalid_user_password);
        } else if (response.code === 200) {
          const data = JSON.parse(response.text);
          if (data.access_token) {
            this.token = data.access_token;
            this.refreshToken = data.refresh_token;
            success(true);
          }
        } else {
          const data = JSON.parse(response.text || '{}');
          throw new Error(data.error);
        }
      }).catch((error) => {
        fail(new Error(`${getValue('exception').catalog_token_error}: ${error.message}`));
      });
    });
  }

  /**
   * Obtiene las colecciones disponibles en el catálogo STAC.
   *
   * Si el catálogo es público y no se indica `collectionsUrl`, consulta directamente
   * el endpoint `{url}/collections`. En caso contrario, obtiene las colecciones
   * autorizadas para el usuario autenticado a través del servicio de roles.
   * Si la respuesta es 401 o 403, intenta renovar el token y reintentar la petición.
   *
   * @function
   * @public
   * @returns {Promise<Array<Object>>} Promesa con el listado de colecciones.
   * @api
   */
  getCollections() {
    if (this.public && !this.collectionsUrl) {
      return new Promise((success, fail) => {
        get(`${this.url}/collections`).then((response) => {
          if (response.code !== 200) {
            fail(new Error(getValue('exception').catalog_collections_error));
            return;
          }
          const data = JSON.parse(response.text);
          success(data.collections);
        });
      });
    }
    return new Promise((success, fail) => {
      const body = { lang: getLang() };
      if (this.token) {
        body.accessToken = this.token;
      }
      post(`${this.collectionsUrl}`, body, { headers: { 'Content-Type': 'application/json' } }).then((response) => {
        if (response.code === 401 || response.code === 403) {
          this.refreshTokenAuth().then(() => {
            this.getCollections().then((collections) => success(collections));
          }).catch((error) => {
            fail(new Error(`${getValue('exception').catalog_collections_error}: ${error.message}`));
          });
        } else if (response.code === 200) {
          const data = JSON.parse(response.text);
          success(data.collections);
        } else {
          fail(new Error(getValue('exception').catalog_collections_error));
        }
      });
    });
  }

  /**
   * Obtiene los campos consultables de una colección STAC.
   *
   * Consulta el endpoint `/collections/{collectionId}/queryables` y devuelve
   * las propiedades disponibles para filtrar ítems.
   * Si la respuesta es 401, 403 o 503, intenta renovar el token y reintentar.
   *
   * @function
   * @public
   * @param {string} collectionId Identificador de la colección.
   * @returns {Promise<Object>|undefined} Promesa con el esquema de propiedades
   * consultables (`properties` del endpoint queryables), o indefinido si no
   * se indica el identificador de colección.
   * @api
   */
  getQueryableFields(collectionId) {
    if (!collectionId) {
      showError(getValue('exception').no_collection_id);
      return;
    }
    const headers = this.public || !this.token ? {} : { 'Authorization': `Bearer ${this.token}` };
    return new Promise((success, fail) => {
      get(`${this.url}/collections/${collectionId}/queryables`, null, { headers }).then((response) => {
        if (response.code === 401 || response.code === 403 || response.code === 503) {
          this.refreshTokenAuth().then(() => {
            this.getQueryableFields(collectionId).then((fields) => success(fields));
          }).catch((error) => {
            fail(new Error(`${getValue('exception').catalog_queryable_fields_error}: ${error.message}`));
          });
        } else if (response.code === 200) {
          const data = JSON.parse(response.text);
          success(data.properties || {});
        } else {
          fail(new Error(getValue('exception').catalog_queryable_fields_error));
        }
      });
    });
  }

  /**
   * Obtiene los ítems de una colección STAC.
   *
   * Realiza una petición GET al endpoint `/collections/{collectionId}/items`
   * con el límite de resultados indicado.
   *
   * @function
   * @public
   * @param {string} collectionId Identificador de la colección.
   * @param {number} [limit=10] Número máximo de ítems a devolver.
   * @returns {Promise<Object>|undefined} Promesa con la respuesta STAC
   * (FeatureCollection), o indefinido si los parámetros no son válidos.
   * @api
   */
  getItems(collectionId, limit = 10) {
    if (!collectionId) {
      showError(getValue('exception').no_collection_id);
      return;
    }
    if (limit < 1) {
      showError(getValue('exception').invalid_limit);
      return;
    }
    const url = `${this.url}/collections/${collectionId}/items?limit=${limit}`;
    return this.getItemsByUrl(url, null, getValue('exception').catalog_items_error);
  }

  /**
   * Obtiene ítems a partir de los enlaces de paginación de una respuesta STAC.
   *
   * Busca en el array de enlaces el href correspondiente a la relación indicada
   * (`self`, `next` o `previous`) y delega la petición en
   * {@link IDEE.stac.Catalog#getItemsByUrl}.
   *
   * @function
   * @public
   * @param {Array<Object>} links Enlaces de paginación de la respuesta STAC.
   * @param {string} rel Relación del enlace a seguir (`self`, `next` o `previous`).
   * @returns {Promise<Object>|undefined} Promesa con la respuesta STAC
   * (FeatureCollection) o indefinido si los parámetros no son válidos.
   * @api
   */
  getItemsByLinks(links, rel) {
    if (!rel || !SUPPORTED_LINKS.includes(rel)) {
      showError(getValue('exception').invalid_rel);
      return;
    }
    const url = links.find((link) => link.rel === rel)?.href;
    if (!url) {
      showError(getValue('exception').no_item_url);
      return;
    }
    return this.getItemsByUrl(url, null, getValue('exception').catalog_items_error);
  }

  /**
   * Realiza una petición GET para obtener ítems desde una URL concreta.
   *
   * Añade la cabecera `Authorization` con el token Bearer cuando el catálogo
   * es privado y existe un token de acceso.
   * Si la respuesta es 401, 403 o 503, intenta renovar el token y reintentar.
   *
   * @function
   * @public
   * @param {string} url URL del endpoint STAC.
   * @param {Object|null} params Parámetros de consulta de la petición GET.
   * @param {string} errorMessage Mensaje de error a utilizar si la petición falla.
   * @returns {Promise<Object>} Promesa con la respuesta STAC (FeatureCollection).
   * @api
   */
  getItemsByUrl(url, params, errorMessage) {
    const headers = this.public || !this.token ? {} : { 'Authorization': `Bearer ${this.token}` };
    return new Promise((success, fail) => {
      get(url, params, { headers }).then((response) => {
        if (response.code === 401 || response.code === 403 || response.code === 503) {
          this.refreshTokenAuth().then(() => {
            this.getItemsByUrl(url, params, errorMessage).then((data) => success(data));
          }).catch((error) => {
            fail(new Error(`${getValue('exception').catalog_items_error}: ${error.message}`));
          });
        } else if (response.code === 200) {
          const data = JSON.parse(response.text);
          success(data);
        } else {
          fail(new Error(errorMessage));
        }
      });
    });
  }

  /**
   * Obtiene un ítem concreto de una colección STAC.
   *
   * Si la respuesta es 401, 403 o 503, intenta renovar el token y reintentar.
   *
   * @function
   * @public
   * @param {string} collectionId Identificador de la colección.
   * @param {string} itemId Identificador del ítem.
   * @returns {Promise<Object>|undefined} Promesa con el ítem STAC (Feature),
   * o indefinido si faltan identificadores.
   * @api
   */
  getItem(collectionId, itemId) {
    if (!collectionId) {
      showError(getValue('exception').no_collection_id);
      return;
    }
    if (!itemId) {
      showError(getValue('exception').no_item_id);
      return;
    }
    const headers = this.public || !this.token ? {} : { 'Authorization': `Bearer ${this.token}` };
    return new Promise((success, fail) => {
      get(`${this.url}/collections/${collectionId}/items/${itemId}`, null, { headers }).then((response) => {
        if (response.code === 401 || response.code === 403 || response.code === 503) {
          this.refreshTokenAuth().then(() => {
            this.getItem(collectionId, itemId).then((data) => success(data));
          }).catch((error) => {
            fail(new Error(`${getValue('exception').catalog_item_error}: ${error.message}`));
          });
        } else if (response.code === 200) {
          const data = JSON.parse(response.text);
          success(data);
        } else {
          fail(new Error(getValue('exception').catalog_item_error));
        }
      });
    });
  }

  /**
   * Obtiene ítems de una o varias colecciones aplicando filtros mediante el endpoint `/search`.
   *
   * Los filtros se envían como parámetros de consulta (por ejemplo, `limit`, `bbox`,
   * `datetime`). El identificador de colección se añade automáticamente al parámetro
   * `collections`.
   *
   * @function
   * @public
   * @param {string|Array<string>} collectionId Identificador o array de identificadores
   * de la/s colección/es.
   * @param {Object} filters Parámetros de filtrado para la petición GET.
   * Filtros espaciales en EPSG:4326.
   * @returns {Promise<Object>|undefined} Promesa con la respuesta STAC filtrada
   * (FeatureCollection), o indefinido si no se indica el identificador de colección.
   * @api
   */
  getFilteredItems(collectionId, filters) {
    if (!collectionId) {
      showError(getValue('exception').no_collection_id);
      return;
    }
    const newFilters = filters;
    newFilters.collections = Array.isArray(collectionId) ? collectionId : [collectionId];
    const url = `${this.url}/search`;
    return this.getItemsByUrl(url, newFilters, getValue('exception').catalog_filtered_items_error);
  }

  /**
   * Obtiene ítems aplicando un filtro avanzado mediante el endpoint `/search`.
   *
   * Soporta los formatos de filtrado `stac-query`, `cql-json` y `cql2-json`.
   *
   * @function
   * @public
   * @param {string|Array<string>} collectionId Identificador o array de identificadores
   * de la/s colección/es.
   * @param {Object} filter Configuración del filtro avanzado.
   * - format: Formato del filtro (`stac-query`, `cql-json` o `cql2-json`).
   * - filter: Cuerpo del filtro según el formato indicado.
   * - limit: Número máximo de ítems a devolver (por defecto 10).
   * @param {Array<number>|null} [bbox=null] Extensión de la zona de búsqueda en EPSG:4326
   * (`[minX, minY, maxX, maxY]`).
   * @param {string|null} [datetime=null] Intervalo temporal de la búsqueda en RFC 3339.
   * @returns {Promise<Object>|undefined} Promesa con la respuesta STAC filtrada
   * (FeatureCollection), o indefinido si no se indica el identificador de colección.
   * @api
   */
  getFilteredItemsAdvanced(collectionId, filter, bbox = null, datetime = null) {
    if (!collectionId) {
      showError(getValue('exception').no_collection_id);
      return;
    }
    const data = this.getFilterData(collectionId, filter, bbox, datetime);
    const url = `${this.url}/search`;
    return this.getFilteredItemsAdvancedByUrl(url, data, getValue('exception').catalog_filtered_items_advanced_error);
  }

  /**
   * Obtiene ítems filtrados avanzados a partir de los enlaces de paginación.
   *
   * Resuelve la URL del enlace indicado (`self`, `next` o `previous`), toma el
   * cuerpo de la petición del propio enlace y delega en
   * {@link IDEE.stac.Catalog#getFilteredItemsAdvancedByUrl}.
   *
   * @function
   * @public
   * @param {Array<Object>} links Enlaces de paginación
   * de la respuesta STAC.
   * @param {string} rel Relación del enlace a seguir (`self`, `next` o `previous`).
   * @returns {Promise<Object>|undefined} Promesa con la respuesta STAC filtrada
   * (FeatureCollection) o indefinido si los parámetros no son válidos.
   * @api
   */
  getFilteredItemsAdvancedByLinks(links, rel) {
    if (!rel || !SUPPORTED_LINKS.includes(rel)) {
      showError(getValue('exception').invalid_rel);
      return;
    }
    const linkRel = links.find((link) => link.rel === rel);
    if (!linkRel) {
      showError(getValue('exception').no_item_url);
      return;
    }
    const data = linkRel.body;
    const url = linkRel.href;
    return this.getFilteredItemsAdvancedByUrl(url, data, getValue('exception').catalog_filtered_items_advanced_error);
  }

  /**
   * Realiza una petición POST al endpoint `/search` con un cuerpo de filtro.
   *
   * Envía el filtro como JSON y añade la cabecera `Authorization` con el token
   * Bearer cuando el catálogo es privado y existe un token de acceso.
   * Si la respuesta es 401, 403 o 503, intenta renovar el token y reintentar.
   *
   * @function
   * @public
   * @param {string} url URL del endpoint STAC `/search`.
   * @param {Object} body Cuerpo de la petición con la configuración del filtro.
   * @param {string} errorMessage Mensaje de error a utilizar si la petición falla.
   * @returns {Promise<Object>} Promesa con la respuesta STAC filtrada (FeatureCollection).
   * @api
   */
  getFilteredItemsAdvancedByUrl(url, body, errorMessage) {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (!this.public && this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    return new Promise((success, fail) => {
      post(url, body, { headers }).then((response) => {
        if (response.code === 401 || response.code === 403 || response.code === 503) {
          this.refreshTokenAuth().then(() => {
            this.getFilteredItemsAdvancedByUrl(url, body, errorMessage)
              .then((data) => success(data));
          }).catch((error) => {
            fail(new Error(`${errorMessage}: ${error.message}`));
          });
        } else if (response.code === 200) {
          const responseData = JSON.parse(response.text);
          success(responseData);
        } else {
          fail(new Error(errorMessage));
        }
      });
    });
  }

  /**
   * Construye el cuerpo de la petición POST para el endpoint `/search`
   * a partir de la configuración de filtro indicada.
   *
   * @function
   * @public
   * @param {string|Array<string>|null} collectionId Identificador o array de identificadores
   * de la/s colección/es. Si es nulo o vacío, la búsqueda no se restringe a una colección concreta.
   * @param {Object} filter Configuración del filtro avanzado.
   * - format: Formato del filtro (`stac-query`, `cql-json` o `cql2-json`).
   * - filter: Cuerpo del filtro según el formato indicado.
   * - limit: Número máximo de ítems a devolver (por defecto 10).
   * @param {Array<number>|null} [bbox=null] Extensión de la zona de búsqueda en EPSG:4326
   * (`[minX, minY, maxX, maxY]`).
   * @param {string|null} [datetime=null] Intervalo temporal de la búsqueda en RFC 3339.
   * @returns {Object|null} Objeto con el cuerpo de la petición o nulo si el
   * formato de filtro no es válido.
   * @api
   */
  getFilterData(collectionId, filter, bbox, datetime) {
    const data = {
      limit: filter.limit || 10,
    };
    if (collectionId) {
      data.collections = Array.isArray(collectionId) ? collectionId : [collectionId];
    }
    if (bbox) {
      data.bbox = bbox;
    }
    if (datetime) {
      data.datetime = datetime;
    }
    switch (filter.format) {
      case STAC_FILTER_LANG.STAC_QUERY:
        data.query = filter.filter;
        break;
      case STAC_FILTER_LANG.CQL_JSON:
        data.filter_lang = STAC_FILTER_LANG.CQL_JSON;
        data.filter = filter.filter;
        break;
      case STAC_FILTER_LANG.CQL2_JSON:
        data.filter_lang = STAC_FILTER_LANG.CQL2_JSON;
        data.filter = filter.filter;
        break;
      default:
        return null;
    }
    return data;
  }
}

export default Catalog;
