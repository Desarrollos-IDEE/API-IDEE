/**
 * Transformación de los tokens de diseño (IDEE.config.token) en variables CSS.
 * @module IDEE/theme/tokens
 */

/**
 * Grupos de tokens cuyas claves generan una variable CSS cada una:
 * `<prefix>-<clave en kebab-case>`.
 * @const
 * @type {Array<Object>}
 */
const TOKEN_GROUPS = [
  { path: ['color'], prefix: '--idee-color' },
  { path: ['typography', 'fontSize'], prefix: '--idee-font-size' },
  { path: ['typography', 'fontWeight'], prefix: '--idee-font-weight' },
  { path: ['shape'], prefix: '--idee-shape' },
];

/**
 * Tokens simples que generan una única variable CSS.
 * @const
 * @type {Array<Object>}
 */
const TOKEN_VALUES = [
  { path: ['typography', 'fontFamily'], name: '--idee-font-family' },
];

/**
 * Variables CSS definidas por defecto en la hoja de estilos de la API (idee.css).
 * @const
 * @type {Array<string>}
 */
export const DESIGN_TOKEN_CSS_VARIABLES = [
  '--idee-color-primary', '--idee-color-links', '--idee-color-primary-dark',
  '--idee-color-success', '--idee-color-danger', '--idee-color-warning',
  '--idee-color-neutral-05', '--idee-color-neutral-10', '--idee-color-neutral-20',
  '--idee-color-neutral-30', '--idee-color-neutral-40', '--idee-color-neutral-50',
  '--idee-color-neutral-60', '--idee-color-neutral-70', '--idee-color-neutral-80',
  '--idee-color-neutral-90', '--idee-color-white', '--idee-color-black',
  '--idee-font-family',
  '--idee-font-size-caption', '--idee-font-size-body-s', '--idee-font-size-body-m',
  '--idee-font-size-body-l', '--idee-font-size-heading-m', '--idee-font-size-heading-l',
  '--idee-font-weight-regular', '--idee-font-weight-bold',
  '--idee-shape-border', '--idee-shape-border-radius', '--idee-shape-box-shadow',
];

/**
 * Variables aplicadas por la última llamada a applyDesignTokenCssVariables.
 * @type {Set<string>}
 */
const appliedVariables = new Set();

/**
 * Convierte la clave de un token en el sufijo de su variable CSS:
 * `body_m` -> `body-m`, `borderRadius` -> `border-radius`.
 * @param {string} key Clave del token.
 * @returns {string} Sufijo en kebab-case.
 */
export const toCssVariableSuffix = (key) => String(key)
  .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
  .replace(/_/g, '-')
  .toLowerCase();

/**
 * Normaliza el valor de un token. Solo se admiten cadenas no vacías y números finitos.
 * @param {*} value Valor del token.
 * @returns {string|null} Valor CSS o null si no es válido.
 */
const normalizeTokenValue = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === 'string' && value.trim() !== '') {
    return value.trim();
  }
  return null;
};

const getPath = (object, path) => path.reduce((current, key) => {
  return current && typeof current === 'object' ? current[key] : undefined;
}, object);

/**
 * Obtiene las variables CSS que corresponden a un token de diseño.
 * Las claves sin valor válido se omiten para que actúen los valores por defecto.
 * @param {Object} token Token de diseño (IDEE.config.token[activeTOKEN]).
 * @returns {Object<string, string>} Variables CSS y sus valores.
 */
export const getDesignTokenCssVariables = (token) => {
  const variables = {};
  if (!token || typeof token !== 'object') {
    return variables;
  }

  TOKEN_VALUES.forEach(({ path, name }) => {
    const value = normalizeTokenValue(getPath(token, path));
    if (value !== null) {
      variables[name] = value;
    }
  });

  TOKEN_GROUPS.forEach(({ path, prefix }) => {
    const group = getPath(token, path);
    if (!group || typeof group !== 'object') {
      return;
    }
    Object.keys(group).forEach((key) => {
      const value = normalizeTokenValue(group[key]);
      if (value !== null) {
        variables[`${prefix}-${toCssVariableSuffix(key)}`] = value;
      }
    });
  });

  return variables;
};

/**
 * Lee los valores resueltos de las variables de diseño del documento,
 * por ejemplo para trasladarlas a otro documento (ventanas nuevas).
 * @param {Document} doc Documento del que se leen las variables.
 * @returns {Object<string, string>} Variables CSS y sus valores resueltos.
 */
export const readDesignTokenCssVariables = (doc = document) => {
  const root = doc.documentElement;
  const names = new Set(DESIGN_TOKEN_CSS_VARIABLES);
  Array.from(root.style).forEach((name) => {
    if (name.startsWith('--idee-')) {
      names.add(name);
    }
  });

  const computed = doc.defaultView.getComputedStyle(root);
  const variables = {};
  names.forEach((name) => {
    const value = computed.getPropertyValue(name).trim();
    if (value !== '') {
      variables[name] = value;
    }
  });
  return variables;
};

/**
 * Aplica el token activo (IDEE.config.activeTOKEN) como variables CSS en el elemento raíz.
 * Las variables del token aplicado anteriormente que no define el nuevo se eliminan.
 */
export default function applyDesignTokenCssVariables() {
  const IDEE = window.IDEE || window.M;
  const tokens = IDEE && IDEE.config ? IDEE.config.token : undefined;
  const activeTokenKey = (IDEE && IDEE.config && IDEE.config.activeTOKEN) || 'cnig';
  const variables = getDesignTokenCssVariables(tokens ? tokens[activeTokenKey] : undefined);

  const root = document.documentElement;
  appliedVariables.forEach((name) => {
    if (!Object.prototype.hasOwnProperty.call(variables, name)) {
      root.style.removeProperty(name);
      appliedVariables.delete(name);
    }
  });
  Object.keys(variables).forEach((name) => {
    root.style.setProperty(name, variables[name]);
    appliedVariables.add(name);
  });
}
