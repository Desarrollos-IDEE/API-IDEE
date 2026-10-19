/**
 * Gestor de sesiones de servicios OGC API Features DataIDEE.
 * Orquesta el almacén de tokens, el cliente de autenticación y las capas
 * DataIDEE del mapa que usan cada servicio.
 */
import AuthClient from './authclient';
import { isSessionExpired, getSessionExpiration, EXPIRATION_MARGIN } from './jwt';
import { parseOGCAPIUrl } from '../ogcapi/ogcapiurl';

export const AUTH_HIDDEN = 'hidden';
export const AUTH_UNLOCKED = 'unlocked';
export const AUTH_PENDING = 'pending';
export const AUTH_LOCKED = 'locked';

// Evita bucles de refresco cuando el servidor rechaza un token recién emitido.
const REFRESH_COOLDOWN = 60 * 1000;
// Máximo retardo admitido por setTimeout.
const MAX_TIMEOUT = 2147483647;

export default class DataIDEEAuthManager {
  /**
   * @param {IDEE.Map} map Mapa.
   * @param {TokenStore} store Almacén de sesiones.
   * @param {AuthClient} client Cliente de autenticación.
   */
  constructor(map, store, client = new AuthClient()) {
    this.map_ = map;
    this.store_ = store;
    this.client_ = client;
    // Copia en memoria por si el navegador no permite almacenamiento.
    this.sessions_ = {};
    this.timers_ = {};
    this.refreshing_ = {};
    this.lastRefresh_ = {};
    this.loginAvailable_ = {};
    this.listeners_ = [];
  }

  /**
   * Registra una función que se llama al cambiar la sesión de un servicio.
   * @param {Function} listener Recibe (root, token).
   */
  onSessionChange(listener) {
    this.listeners_.push(listener);
  }

  /**
   * @param {String} root Raíz del servicio.
   * @returns {Object|undefined} Sesión.
   */
  getSession(root) {
    return this.store_.getSession(root) || this.sessions_[root];
  }

  /**
   * @param {String} root Raíz del servicio.
   * @returns {String|undefined} Token de acceso.
   */
  getToken(root) {
    return this.getSession(root)?.accessToken;
  }

  /**
   * Calcula el estado de autenticación del servicio. Si hay un token caducado
   * intenta refrescarlo; si no hay token, comprueba si existe /auth/login.
   * @param {String} root Raíz del servicio.
   * @returns {Promise<String>} AUTH_HIDDEN, AUTH_UNLOCKED o AUTH_LOCKED.
   */
  async resolve(root) {
    const session = this.getSession(root);
    if (session?.accessToken) {
      if (!isSessionExpired(session)) {
        this.schedule_(root);
        return AUTH_LOCKED;
      }
      return (await this.refresh(root)) ? AUTH_LOCKED : AUTH_UNLOCKED;
    }
    return (await this.isLoginAvailable(root)) ? AUTH_UNLOCKED : AUTH_HIDDEN;
  }

  /**
   * @param {String} root Raíz del servicio.
   * @returns {Promise<Boolean>} Verdadero si el servicio tiene /auth/login.
   */
  isLoginAvailable(root) {
    if (!(root in this.loginAvailable_)) {
      this.loginAvailable_[root] = this.client_.isLoginAvailable(root);
    }
    return this.loginAvailable_[root];
  }

  /**
   * Inicia sesión y guarda el token.
   * @param {String} root Raíz del servicio.
   * @param {String} username Usuario.
   * @param {String} password Contraseña.
   * @returns {Promise<Object>} Sesión.
   */
  async login(root, username, password) {
    const session = await this.client_.login(root, username, password);
    this.setSession_(root, session);
    return session;
  }

  /**
   * Cierra la sesión del servicio y retira el token de sus capas.
   * @param {String} root Raíz del servicio.
   */
  logout(root) {
    this.clearTimer_(root);
    delete this.sessions_[root];
    this.store_.removeSession(root);
    this.notify_(root, undefined);
  }

  /**
   * Refresca el token del servicio. Si falla, cierra la sesión.
   * Las llamadas simultáneas comparten la misma petición.
   * @param {String} root Raíz del servicio.
   * @returns {Promise<Boolean>} Verdadero si se ha obtenido un token nuevo.
   */
  refresh(root) {
    const session = this.getSession(root);
    if (!session?.accessToken) return Promise.resolve(false);
    if (!this.refreshing_[root]) {
      this.refreshing_[root] = this.client_.refresh(root, session)
        .then((newSession) => {
          this.lastRefresh_[root] = Date.now();
          this.setSession_(root, newSession);
          return true;
        })
        .catch(() => {
          this.logout(root);
          return false;
        })
        .finally(() => {
          delete this.refreshing_[root];
        });
    }
    return this.refreshing_[root];
  }

  /**
   * Reacciona a una respuesta 401/403 del servicio (capas o colecciones): si
   * tiene sesión y no se ha refrescado hace poco, intenta refrescar el token.
   * @param {String} root Raíz del servicio.
   * @returns {Promise<Boolean>} Verdadero si se ha refrescado el token.
   */
  handleUnauthorized(root) {
    const recentlyRefreshed = Date.now() - (this.lastRefresh_[root] || 0) < REFRESH_COOLDOWN;
    if (!this.getSession(root) || recentlyRefreshed) return Promise.resolve(false);
    return this.refresh(root);
  }

  /**
   * Cancela los refrescos programados.
   */
  destroy() {
    Object.keys(this.timers_).forEach((root) => this.clearTimer_(root));
    this.listeners_ = [];
  }

  setSession_(root, session) {
    this.sessions_[root] = session;
    this.store_.setSession(root, session);
    this.schedule_(root);
    this.notify_(root, session.accessToken);
  }

  /**
   * Programa el refresco del token antes de que caduque.
   * @param {String} root Raíz del servicio.
   */
  schedule_(root) {
    this.clearTimer_(root);
    const expiration = getSessionExpiration(this.getSession(root));
    if (!Number.isFinite(expiration)) return;
    const delay = Math.max(expiration - EXPIRATION_MARGIN - Date.now(), 0);
    this.timers_[root] = setTimeout(() => this.refresh(root), Math.min(delay, MAX_TIMEOUT));
  }

  clearTimer_(root) {
    clearTimeout(this.timers_[root]);
    delete this.timers_[root];
  }

  /**
   * Actualiza el token de las capas DataIDEE del servicio y avisa a los oyentes.
   * @param {String} root Raíz del servicio.
   * @param {String} token Nuevo token o undefined.
   */
  notify_(root, token) {
    this.getServiceLayers_(root)
      .filter((layer) => typeof layer.setToken === 'function')
      .forEach((layer) => layer.setToken(token));
    this.listeners_.forEach((listener) => listener(root, token));
  }

  /**
   * @param {String} root Raíz del servicio.
   * @returns {Array<IDEE.layer.DataIDEE>} Capas DataIDEE del mapa que usan el servicio.
   */
  getServiceLayers_(root) {
    if (!this.map_) return [];
    const groupLayers = this.map_.getImpl().getAllLayerInGroup?.() || [];
    return this.map_.getLayers().concat(groupLayers)
      .filter((layer) => layer.type === 'DataIDEE' && parseOGCAPIUrl(layer.url).root === root);
  }
}
