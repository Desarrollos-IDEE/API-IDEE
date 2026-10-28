/**
 * Lectura de la caducidad de los tokens JWT. El JWT no está cifrado: su carga
 * útil se decodifica (base64url) para leer "exp".
 */
import { jwtDecode } from 'jwt-decode';

// Margen para refrescar antes de la caducidad real.
export const EXPIRATION_MARGIN = 30 * 1000;

/**
 * @param {String} token Token JWT.
 * @returns {Number|undefined} Fecha de caducidad (ms) o undefined si el token
 * no es un JWT o no tiene "exp".
 */
export const getExpiration = (token) => {
  try {
    const { exp } = jwtDecode(token);
    return Number.isFinite(exp) ? exp * 1000 : undefined;
  } catch (err) {
    return undefined;
  }
};

/**
 * Comprueba un token introducido por el usuario: debe ser un JWT y no haber caducado.
 * @param {String} token Token.
 * @returns {Object} { valid, reason, expiresAt }: reason es 'format' (no es un JWT) o
 * 'expired' (caducado); expiresAt es la caducidad en ms, si el token la indica.
 */
export const checkToken = (token) => {
  let payload;
  try {
    payload = jwtDecode(token);
  } catch (err) {
    return { valid: false, reason: 'format' };
  }
  const expiresAt = Number.isFinite(payload?.exp) ? payload.exp * 1000 : undefined;
  if (Number.isFinite(expiresAt) && expiresAt <= Date.now()) {
    return { valid: false, reason: 'expired', expiresAt };
  }
  return { valid: true, expiresAt };
};

/**
 * Fecha de caducidad de una sesión: la del JWT o, para tokens opacos, la
 * calculada con "expires_in" al iniciar sesión.
 * @param {Object} session Sesión { accessToken, expiresAt }.
 * @returns {Number|undefined} Fecha de caducidad (ms).
 */
export const getSessionExpiration = (session) => getExpiration(session?.accessToken)
  ?? session?.expiresAt;

/**
 * @param {Object} session Sesión { accessToken, expiresAt }.
 * @param {Number} margin Margen en milisegundos.
 * @returns {Boolean} Verdadero si la sesión ha caducado (o caduca dentro del margen).
 * Una sesión sin fecha de caducidad conocida no se considera caducada.
 */
export const isSessionExpired = (session, margin = EXPIRATION_MARGIN) => {
  const expiration = getSessionExpiration(session);
  return Number.isFinite(expiration) && expiration - margin <= Date.now();
};
