/**
 * Cliente HTTP de autenticación de servicios OGC API Features DataIDEE.
 *
 * Contratos admitidos, detectados por servicio (el primero que responde):
 * - API de autenticación de DataIDEE ("auth-api"):
 *   - GET  {root}/auth-api/auth/me       sin token responde 401: hay login
 *   - POST {root}/auth-api/auth/login    { username, password } → { token, userId }
 *   - GET  {root}/auth-api/auth/refresh  + Authorization: Bearer <token actual> → { token }
 *   - POST {root}/auth-api/auth/logout   + Authorization: Bearer <token actual>
 *   - GET  {root}/auth-api/auth/me       + Authorization: Bearer <token>: comprueba un token
 * - Contrato anterior:
 *   - POST {root}/auth/login    { username, password }
 *   - POST {root}/auth/refresh  { refresh_token } + Authorization: Bearer <token actual>
 *
 * Respuestas tolerantes con los nombres de los campos: { access_token | accessToken |
 * token, refresh_token | refreshToken, expires_in | expiresIn } (también dentro de "data").
 *
 * Las peticiones van siempre directas al servicio (sin proxy), para que las
 * credenciales no pasen por terceros. El servicio debe permitir CORS.
 */

const CONTRACTS = [
  {
    // Un 401 sin token (o un 200) indica que la API de autenticación existe
    detect: { path: 'auth-api/auth/me', isAvailable: (code) => code === 200 || code === 401 },
    login: 'auth-api/auth/login',
    refresh: { path: 'auth-api/auth/refresh', method: 'get' },
    logout: 'auth-api/auth/logout',
    // Comprobación de un token introducido por el usuario
    verify: 'auth-api/auth/me',
  },
  {
    // Cualquier respuesta salvo 404 (405, 400, 401...) indica que el endpoint existe
    detect: { path: 'auth/login', isAvailable: (code) => code !== 404 },
    login: 'auth/login',
    refresh: { path: 'auth/refresh', method: 'post' },
    logout: null,
    verify: null,
  },
];
const ACCESS_TOKEN_KEYS = ['access_token', 'accessToken', 'token', 'jwt'];
const REFRESH_TOKEN_KEYS = ['refresh_token', 'refreshToken'];
const EXPIRES_IN_KEYS = ['expires_in', 'expiresIn'];
const JSON_HEADERS = { 'Content-Type': 'application/json', Accept: 'application/json' };
const DIRECT = { useProxy: false, jsonp: false };

/**
 * Error de autenticación con el código HTTP de la respuesta.
 */
export class AuthError extends Error {
  constructor(code) {
    super(`Authentication failed (HTTP ${code})`);
    this.name = 'AuthError';
    this.code = code;
  }
}

const pick = (source, keys) => keys.map((key) => source?.[key])
  .find((value) => !IDEE.utils.isNullOrEmpty(value));

/**
 * Convierte la respuesta de login o refresh en una sesión.
 * @param {String} text Cuerpo de la respuesta.
 * @param {Object} previous Sesión anterior (conserva el refresh token si no llega uno nuevo).
 * @returns {Object} Sesión { accessToken, refreshToken, expiresAt }.
 */
export const parseTokenResponse = (text, previous = {}) => {
  let json;
  try {
    json = JSON.parse(text);
  } catch (err) {
    json = null;
  }
  const sources = [json, json?.data];
  const accessToken = sources.map((s) => pick(s, ACCESS_TOKEN_KEYS)).find(Boolean);
  if (typeof accessToken !== 'string') {
    throw new AuthError('invalid_response');
  }
  const refreshToken = sources.map((s) => pick(s, REFRESH_TOKEN_KEYS)).find(Boolean)
    || previous.refreshToken;
  const expiresIn = Number(sources.map((s) => pick(s, EXPIRES_IN_KEYS)).find(Boolean));
  const session = { accessToken };
  if (refreshToken) session.refreshToken = refreshToken;
  if (Number.isFinite(expiresIn)) session.expiresAt = Date.now() + (expiresIn * 1000);
  return session;
};

const isSuccess = (response) => response.code >= 200 && response.code < 300;

const bearer = (session) => ({ ...JSON_HEADERS, Authorization: `Bearer ${session.accessToken}` });

export default class AuthClient {
  constructor() {
    // Contrato de autenticación de cada servicio (promesa), detectado una sola vez
    this.contracts_ = {};
  }

  /**
   * Contrato de autenticación del servicio: el primero cuya petición de prueba
   * indica que existe. Un 404, un error de red o de CORS indican que no lo tiene.
   * @param {String} root Raíz del servicio.
   * @returns {Promise<Object|null>} Contrato o null si el servicio no tiene login.
   */
  getContract(root) {
    if (!(root in this.contracts_)) {
      this.contracts_[root] = CONTRACTS.reduce((previous, contract) => previous
        .then((found) => found || IDEE.remote.get(`${root}/${contract.detect.path}`, null, DIRECT)
          .then((response) => (response.code !== 0 && contract.detect.isAvailable(response.code)
            ? contract : null))
          .catch(() => null)), Promise.resolve(null));
    }
    return this.contracts_[root];
  }

  /**
   * @param {String} root Raíz del servicio.
   * @returns {Promise<Boolean>} Verdadero si hay login.
   */
  isLoginAvailable(root) {
    return this.getContract(root).then((contract) => contract !== null);
  }

  /**
   * @param {String} root Raíz del servicio.
   * @param {String} username Usuario.
   * @param {String} password Contraseña.
   * @returns {Promise<Object>} Sesión.
   */
  async login(root, username, password) {
    const contract = await this.getContract(root);
    if (contract === null) throw new AuthError(404);
    const response = await IDEE.remote.post(`${root}/${contract.login}`, { username, password }, {
      ...DIRECT,
      headers: JSON_HEADERS,
    });
    if (!isSuccess(response)) throw new AuthError(response.code);
    return parseTokenResponse(response.text);
  }

  /**
   * Comprueba con el servicio un token introducido por el usuario. La API de
   * autenticación de DataIDEE lo valida con GET /auth-api/auth/me; el contrato
   * anterior no tiene comprobación y se acepta (su formato y caducidad ya se han
   * comprobado en el formulario).
   * @param {String} root Raíz del servicio.
   * @param {String} token Token de acceso.
   * @returns {Promise} Se resuelve si el servicio acepta el token.
   */
  async verifyToken(root, token) {
    const contract = await this.getContract(root);
    if (contract === null) throw new AuthError(404);
    if (!contract.verify) return;
    const response = await IDEE.remote.get(`${root}/${contract.verify}`, null, {
      ...DIRECT, headers: bearer({ accessToken: token }),
    });
    if (!isSuccess(response)) throw new AuthError(response.code);
  }

  /**
   * Renueva el token con el actual: por GET en la API de autenticación de DataIDEE
   * y por POST, con el refresh token si lo hay, en el contrato anterior.
   * @param {String} root Raíz del servicio.
   * @param {Object} session Sesión actual.
   * @returns {Promise<Object>} Nueva sesión.
   */
  async refresh(root, session) {
    const contract = await this.getContract(root);
    if (contract === null) throw new AuthError(404);
    const url = `${root}/${contract.refresh.path}`;
    const options = { ...DIRECT, headers: bearer(session) };
    let response;
    if (contract.refresh.method === 'get') {
      response = await IDEE.remote.get(url, null, options);
    } else {
      const body = session.refreshToken ? { refresh_token: session.refreshToken } : {};
      response = await IDEE.remote.post(url, body, options);
    }
    if (!isSuccess(response)) throw new AuthError(response.code);
    return parseTokenResponse(response.text, session);
  }

  /**
   * Cierra la sesión en el servicio si su contrato lo permite. No falla: la sesión
   * local se borra igualmente.
   * @param {String} root Raíz del servicio.
   * @param {Object} session Sesión que se cierra.
   * @returns {Promise} Se resuelve al terminar.
   */
  async logout(root, session) {
    const contract = await this.getContract(root);
    if (contract === null || !contract.logout || !session?.accessToken) return;
    await IDEE.remote.post(`${root}/${contract.logout}`, {}, { ...DIRECT, headers: bearer(session) })
      .catch(() => {});
  }
}
