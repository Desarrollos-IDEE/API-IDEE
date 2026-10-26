/*
 * Respuestas simuladas comunes a los specs: la cabecera CORS y una imagen PNG de
 * 1 píxel para los servicios de teselas o imágenes que el test no necesita descargar.
 */

/** Cabecera CORS que admite cualquier origen. */
export const CORS = { 'access-control-allow-origin': '*' };

/** Imagen PNG de 1 píxel. */
export const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

/**
 * Responde con la imagen PNG de 1 píxel a todas las peticiones que casan con el patrón.
 *
 * @param {Page} page Página de Playwright.
 * @param {String|RegExp} pattern Patrón de URL (como en page.route).
 * @returns {Promise} Se resuelve al registrar la ruta.
 */
export const routePng = (page, pattern) => page.route(pattern, (route) => route.fulfill({
  status: 200, headers: CORS, contentType: 'image/png', body: PNG_1PX,
}));
