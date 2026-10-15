/**
 * Almacén en el navegador (localStorage) de las sesiones y del modo de carga
 * por servicio OGC API Features. Cada servicio se identifica por la URL raíz.
 */

const STORAGE_KEY = 'idee.layerswitcher.ogcapi';

export default class TokenStore {
  /**
   * Lee todos los registros. Devuelve un objeto vacío si el almacenamiento
   * no está disponible (modo privado, cookies bloqueadas...).
   * @returns {Object} Registros por raíz de servicio.
   */
  read_() {
    try {
      return JSON.parse(window.localStorage.getItem(STORAGE_KEY)) || {};
    } catch (err) {
      return {};
    }
  }

  /**
   * Modifica el registro de un servicio.
   * @param {String} root Raíz del servicio.
   * @param {Function} update Recibe el registro actual y devuelve el nuevo.
   */
  update_(root, update) {
    const records = this.read_();
    const record = update({ ...records[root] });
    if (Object.keys(record).length === 0) {
      delete records[root];
    } else {
      records[root] = record;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (err) {
      /* Sin almacenamiento disponible: la sesión solo dura en memoria */
    }
  }

  /**
   * @param {String} root Raíz del servicio.
   * @returns {Object|undefined} Sesión { accessToken, refreshToken, expiresAt }.
   */
  getSession(root) {
    return this.read_()[root]?.session;
  }

  /**
   * @param {String} root Raíz del servicio.
   * @param {Object} session Sesión { accessToken, refreshToken, expiresAt }.
   */
  setSession(root, session) {
    this.update_(root, (record) => ({ ...record, session }));
  }

  /**
   * @param {String} root Raíz del servicio.
   */
  removeSession(root) {
    this.update_(root, ({ session, ...record }) => record);
  }

  /**
   * @param {String} root Raíz del servicio.
   * @returns {String|undefined} Último modo de carga usado con el servicio.
   */
  getMode(root) {
    return this.read_()[root]?.mode;
  }

  /**
   * @param {String} root Raíz del servicio.
   * @param {String} mode Modo de carga.
   */
  setMode(root, mode) {
    this.update_(root, (record) => ({ ...record, mode }));
  }
}
