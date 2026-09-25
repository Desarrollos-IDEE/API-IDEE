/**
 * Base URL de imágenes de ayuda del plugin.
 * Prioriza la carpeta `images/` junto al script del plugin (dist local o despliegue)
 * y, en desarrollo con webpack, la ruta estática del repositorio.
 *
 * @returns {string}
 */
export default function getRasterManagementHelpImagesUrl() {
  if (typeof document !== 'undefined') {
    const scripts = document.querySelectorAll('script[src]');
    for (let i = 0; i < scripts.length; i += 1) {
      const src = scripts[i].getAttribute('src') || '';
      if (/rastermanagement[^/]*\.min\.js/i.test(src)) {
        const absolute = new URL(src, document.baseURI || window.location.href).href;
        return absolute.replace(/[^/]+$/, 'images/');
      }
    }
  }

  if (typeof window !== 'undefined' && window.location) {
    const { hostname, origin } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${origin}/src/facade/assets/images/`;
    }
  }

  return `${IDEE.config.API_IDEE_URL}plugins/rastermanagement/images/`;
}
