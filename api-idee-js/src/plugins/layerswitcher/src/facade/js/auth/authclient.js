/**
 * Cliente HTTP de autenticación de servicios OGC API Features DataIDEE.
 *
 * Contrato (tolerante con los nombres de los campos):
 * - POST {root}/auth/login    { username, password }
 * - POST {root}/auth/refresh  { refresh_token } + Authorization: Bearer <token actual>
 * - Respuesta: { access_token | accessToken | token, refresh_token | refreshToken,
 *   expires_in | expiresIn } (también dentro de "data").
 *
 * Las peticiones van siempre directas al servicio (sin proxy), para que las
 * credenciales no pasen por terceros. El servicio debe permitir CORS.
 */

const LOGIN_PATH = 'auth/login';
const REFRESH_PATH = 'auth/refresh';
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

export default class AuthClient {
  /**
   * Comprueba si el servicio ofrece login haciendo una petición de prueba a
   * /auth/login. Un 404, un error de red o de CORS indican que no hay login;
   * cualquier otra respuesta (405, 400, 401...) indica que el endpoint existe.
   * @param {String} root Raíz del servicio.
   * @returns {Promise<Boolean>} Verdadero si hay login.
   */
  // eslint-disable-next-line class-methods-use-this
  isLoginAvailable(root) {
    return IDEE.remote.get(`${root}/${LOGIN_PATH}`, null, DIRECT)
      .then((response) => response.code !== 0 && response.code !== 404)
      .catch(() => false);
  }

  /**
   * @param {String} root Raíz del servicio.
   * @param {String} username Usuario.
   * @param {String} password Contraseña.
   * @returns {Promise<Object>} Sesión.
   */
  // eslint-disable-next-line class-methods-use-this
  login(root, username, password) {
    return IDEE.remote.post(`${root}/${LOGIN_PATH}`, { username, password }, {
      ...DIRECT,
      headers: JSON_HEADERS,
    }).then((response) => {
      if (!isSuccess(response)) throw new AuthError(response.code);
      return parseTokenResponse(response.text);
    });
  }

  /**
   * @param {String} root Raíz del servicio.
   * @param {Object} session Sesión actual.
   * @returns {Promise<Object>} Nueva sesión.
   */
  // eslint-disable-next-line class-methods-use-this
  refresh(root, session) {
    const body = session.refreshToken ? { refresh_token: session.refreshToken } : {};
    return IDEE.remote.post(`${root}/${REFRESH_PATH}`, body, {
      ...DIRECT,
      headers: { ...JSON_HEADERS, Authorization: `Bearer ${session.accessToken}` },
    }).then((response) => {
      if (!isSuccess(response)) throw new AuthError(response.code);
      return parseTokenResponse(response.text, session);
    });
  }
}
