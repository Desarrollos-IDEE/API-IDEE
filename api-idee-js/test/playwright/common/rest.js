import { existsSync, readdirSync, readFileSync } from 'fs';
import path from 'path';

/*
 * API REST de api-idee simulada (el servidor de pruebas solo sirve ficheros):
 * - api/actions/controls: controles disponibles (propiedad "controls" de
 *   api-idee-parent/src/main/filters/local.properties, como ActionsWS).
 * - api/actions/plugins: nombres de los plugins (directorios de src/plugins).
 * - plugins/<nombre>/<fichero>: ficheros del plugin compilado (src/plugins/<nombre>/dist).
 */
const PLUGINS_DIR = path.join(__dirname, '..', '..', '..', 'src', 'plugins');
const PROPERTIES = path.join(__dirname, '..', '..', '..', '..', 'api-idee-parent', 'src', 'main', 'filters', 'local.properties');

const CONTENT_TYPES = {
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

/** Controles disponibles según la configuración local de la API REST. */
export const availableControls = () => {
  const line = readFileSync(PROPERTIES, 'utf8').split(/\r?\n/).find((l) => l.startsWith('controls='));
  return line.substring('controls='.length).split(',').filter((name) => name.length > 0);
};

/** Plugins disponibles (los que tienen código fuente en src/plugins). */
export const availablePlugins = () => readdirSync(PLUGINS_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(path.join(PLUGINS_DIR, entry.name, 'src')))
  .map((entry) => entry.name);

/**
 * Simula la API REST en la página.
 * @param {Page} page Página de Playwright.
 * @param {String} baseUrl IDEE.config.API_IDEE_URL del servidor de pruebas.
 */
export const mockRest = async (page, baseUrl = 'http://localhost:8081/') => {
  const base = new URL(baseUrl);
  const isRest = (url) => url.origin === base.origin
    && (url.pathname.startsWith(`${base.pathname}api/actions/`)
      || /^\/plugins\/[^/]+\/.+$/.test(url.pathname.substring(base.pathname.length - 1)));
  await page.route(isRest, (route) => {
    const url = new URL(route.request().url());
    const relative = url.pathname.substring(base.pathname.length);
    if (relative === 'api/actions/controls') return route.fulfill({ json: availableControls() });
    if (relative === 'api/actions/plugins') return route.fulfill({ json: availablePlugins() });
    const [, name, ...file] = relative.split('/');
    const filePath = path.join(PLUGINS_DIR, name, 'dist', ...file);
    if (!filePath.startsWith(PLUGINS_DIR) || !existsSync(filePath)) {
      return route.fulfill({ status: 404, body: 'Not found' });
    }
    return route.fulfill({
      path: filePath,
      contentType: CONTENT_TYPES[path.extname(filePath)] || 'application/octet-stream',
    });
  });
};

export default mockRest;
