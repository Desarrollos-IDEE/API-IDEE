/**
 * Carga de los núcleos de cada implementación (OpenLayers, Cesium) en la misma página.
 *
 * Cada núcleo es un bundle que define su propio `window.IDEE`. Se carga una sola vez y su
 * espacio de nombres queda registrado (ver ImplementationState.getRegistry), así que
 * activar de nuevo una implementación ya cargada no descarga nada. Lo usan
 * `IDEE.loadImplementation` (elegir la implementación al arrancar) y el control
 * ImplementationSwitcher (cambiar de implementación con el mapa ya creado).
 *
 * @module IDEE/util/ImplementationLoader
 */
import { getValue } from '../i18n/language';
import { isBoolean, isNullOrEmpty, isUndefined } from './Utils';
import { getRegistry, getNamespaceImplementation } from './ImplementationState';

/** Clave de la configuración con las implementaciones disponibles. */
const CONFIG_KEY = 'implementationswitcher';

/** Hojas de estilo de un núcleo o plugin según su sufijo: *.ol.min.css, *.cesium.min.css */
const STYLE_TYPE_REGEXP = /\.([a-z0-9]+)\.min\.css(?:[?#]|$)/i;

/**
 * URL absoluta de un recurso: las rutas relativas se resuelven contra API_IDEE_URL y las
 * que empiezan por "/" contra el origen de la página.
 */
const resolveUrl = (value) => {
  if (isNullOrEmpty(value)) return '';
  if (/^(?:[a-z]+:)?\/\//i.test(value)) return value;
  if (value.startsWith('/')) return new URL(value, window.location.href).href;
  const apiUrl = window.IDEE.config.API_IDEE_URL || '';
  const baseUrl = apiUrl && !apiUrl.endsWith('/') ? `${apiUrl}/` : apiUrl;
  try {
    return new URL(value, baseUrl || document.baseURI).href;
  } catch (error) {
    return `${baseUrl}${value}`;
  }
};

const loadScript = (url, registry) => new Promise((resolve, reject) => {
  if (registry.scripts.includes(url)) {
    resolve();
    return;
  }
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = url;
  script.onload = () => {
    registry.scripts.push(url);
    resolve();
  };
  script.onerror = () => reject(new Error(url));
  document.body.appendChild(script);
});

const registerStylesheet = (link, type, registry) => {
  // eslint-disable-next-line no-param-reassign
  registry.styles[type] = registry.styles[type] || [];
  if (!registry.styles[type].includes(link)) registry.styles[type].push(link);
};

/** Las hojas que ya cargó la página se asignan a su implementación por el sufijo. */
const classifyStylesheets = (registry) => {
  document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    const match = STYLE_TYPE_REGEXP.exec(link.href);
    if (match) registerStylesheet(link, match[1].toLowerCase(), registry);
  });
};

const addStylesheet = (url, type, registry) => {
  if (isNullOrEmpty(url)) return;
  const existing = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
    .find((link) => link.href === url);
  if (existing) {
    registerStylesheet(existing, type, registry);
    return;
  }
  const link = document.createElement('link');
  link.type = 'text/css';
  link.rel = 'stylesheet';
  link.href = url;
  document.head.appendChild(link);
  registerStylesheet(link, type, registry);
};

/**
 * Deja activas solo las hojas de estilo de una implementación.
 *
 * @function
 * @param {Object} registry Registro de implementaciones.
 * @param {String} activeType Implementación activa.
 * @public
 */
export const toggleStylesheets = (registry, activeType) => {
  Object.entries(registry.styles).forEach(([type, links]) => {
    links.forEach((link) => {
      // eslint-disable-next-line no-param-reassign
      link.disabled = type !== activeType;
    });
  });
};

/**
 * Lleva al núcleo de destino la configuración, el idioma y el proxy del de origen. Así no
 * hay que volver a ejecutar configuration.js y se conserva lo que la página cambió.
 *
 * @function
 * @param {Object} source Espacio de nombres IDEE de origen.
 * @param {Object} target Espacio de nombres IDEE de destino.
 * @public
 */
export const copyEnvironment = (source, target) => {
  Object.keys(source.config).forEach((key) => target.config(key, source.config[key]));
  try {
    target.language.setLang(source.language.getLang());
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(error);
  }
  if (isBoolean(source.useproxy)) target.proxy(source.useproxy);
};

/**
 * Deja activo el núcleo de una implementación: lo reutiliza si ya se cargó y, si no, lo
 * carga y comprueba que el bundle sea de esa implementación.
 *
 * @function
 * @param {Object} implementation Entrada de `IDEE.config.implementationswitcher`.
 * @returns {Promise<Object>} Espacio de nombres IDEE de la implementación.
 * @public
 */
export const activateImplementation = async (implementation) => {
  const registry = getRegistry();
  const source = window.IDEE;
  const current = getNamespaceImplementation(source);
  if (current) registry.namespaces[current] = source;
  classifyStylesheets(registry);

  let namespace = registry.namespaces[implementation.type];
  if (isNullOrEmpty(namespace)) {
    addStylesheet(resolveUrl(implementation.css), implementation.type, registry);
    try {
      await loadScript(resolveUrl(implementation.js), registry);
    } catch (error) {
      window.IDEE = source;
      toggleStylesheets(registry, current);
      throw error;
    }
    namespace = window.IDEE;
    const loaded = getNamespaceImplementation(namespace);
    if (namespace === source || loaded !== implementation.type) {
      window.IDEE = source;
      toggleStylesheets(registry, current);
      throw new Error(`${getValue('implementationswitcher').mismatch} ${implementation.type} (${loaded})`);
    }
    registry.namespaces[implementation.type] = namespace;
  }
  window.IDEE = namespace;
  // Alias heredado que fija configuration.js y usan algunos plugins al registrarse
  if (window.M === source) window.M = namespace;
  toggleStylesheets(registry, implementation.type);
  if (namespace !== source) copyEnvironment(source, namespace);
  return namespace;
};

/**
 * Carga en el núcleo activo los plugins que todavía no tiene. Sin ficheros indicados en
 * `implementation.plugins`, se usa la convención del despliegue:
 * `${API_IDEE_URL}plugins/<nombre>/<nombre>.<type>.min.js|css`.
 *
 * @function
 * @param {Object} implementation Entrada de `IDEE.config.implementationswitcher`.
 * @param {Array<Object>} plugins Plugins ({ name, key }: key es su clase en IDEE.plugin).
 * @returns {Promise} Se resuelve al terminar; un plugin que no carga solo se avisa.
 * @public
 */
export const loadPlugins = async (implementation, plugins) => {
  const registry = getRegistry();
  const namespace = window.IDEE;
  const missing = plugins
    .filter((plugin) => !plugin.key || isUndefined((namespace.plugin || {})[plugin.key]));
  // eslint-disable-next-line no-restricted-syntax
  for (const plugin of missing) {
    const files = (implementation.plugins || {})[plugin.name] || {
      js: `plugins/${plugin.name}/${plugin.name}.${implementation.type}.min.js`,
      css: `plugins/${plugin.name}/${plugin.name}.${implementation.type}.min.css`,
    };
    addStylesheet(resolveUrl(files.css), implementation.type, registry);
    try {
      // eslint-disable-next-line no-await-in-loop
      await loadScript(resolveUrl(files.js), registry);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(`${getValue('implementationswitcher').load_error} ${plugin.name}`, error);
    }
  }
  toggleStylesheets(registry, implementation.type);
};

/**
 * Implementaciones configuradas (`IDEE.config.implementationswitcher`).
 *
 * @function
 * @returns {Array<Object>} Entradas { id, type, title, js, css, plugins }.
 * @public
 */
export const getImplementations = () => window.IDEE.config[CONFIG_KEY] || [];

/**
 * Deja activa una implementación (carga su núcleo si hace falta) y, opcionalmente, los
 * plugins indicados.
 *
 * @function
 * @param {String} type Implementación: 'ol', 'cesium'...
 * @param {Object} options Opciones: plugins (Array<String>) nombres de plugins a cargar.
 * @returns {Promise<Object>} Espacio de nombres IDEE de la implementación.
 * @public
 */
export const loadImplementation = async (type, { plugins = [] } = {}) => {
  const implementation = getImplementations().find((entry) => entry.type === type);
  if (isNullOrEmpty(implementation)) {
    throw new Error(`${getValue('implementationswitcher').load_error} ${type}`);
  }
  const namespace = await activateImplementation(implementation);
  if (plugins.length > 0) {
    await loadPlugins(implementation, plugins.map((name) => ({ name })));
  }
  return namespace;
};
