/**
 * @module IDEE/util/ConfigAccessor
 */

/**
 * Nombres que no pueden usarse como llave de primer nivel de la configuración:
 * los métodos añadidos y las propiedades de solo lectura de las funciones.
 * @const
 * @type {Array<String>}
 */
const RESERVED_KEYS = ['get', 'set', 'name', 'length', 'prototype'];

const isPlainObject = (value) => value !== null && typeof value === 'object'
  && Object.getPrototypeOf(value) === Object.prototype;

const toPath = (path) => (Array.isArray(path) ? path : String(path).split('.'));

const checkReserved = (key) => {
  if (RESERVED_KEYS.includes(key)) {
    throw new Error(`IDEE.config: "${key}" es un nombre reservado`);
  }
};

// Combina en profundidad source sobre target; las hojas se reemplazan
const deepMerge = (targetParam, source) => {
  const target = targetParam;
  Object.keys(source).forEach((key) => {
    if (isPlainObject(target[key]) && isPlainObject(source[key])) {
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  });
  return target;
};

/**
 * Añade a la función de configuración los métodos "get" y "set".
 * - get(path): devuelve el valor de la ruta o undefined.
 * - set(path, value): reemplaza el valor de la ruta, creando los objetos intermedios.
 * - set(object): combina en profundidad el objeto con la configuración.
 *
 * @function
 * @param {Function} configFn Función de configuración (IDEE.config).
 * @returns {Function} La misma función con los métodos añadidos.
 */
export const addConfigAccessors = (configFn) => {
  Object.defineProperties(configFn, {
    get: {
      value: (path) => {
        const keys = toPath(path);
        if (RESERVED_KEYS.includes(keys[0])) {
          return undefined;
        }
        return keys.reduce((obj, key) => (obj == null ? undefined : obj[key]), configFn);
      },
    },
    set: {
      value: (pathOrObject, value) => {
        if (isPlainObject(pathOrObject)) {
          Object.keys(pathOrObject).forEach(checkReserved);
          deepMerge(configFn, pathOrObject);
        } else {
          const keys = toPath(pathOrObject);
          checkReserved(keys[0]);
          const last = keys.pop();
          const target = keys.reduce((obj, key) => {
            const parent = obj;
            if (parent[key] === null || typeof parent[key] !== 'object') {
              parent[key] = {};
            }
            return parent[key];
          }, configFn);
          target[last] = value;
        }
        return configFn;
      },
    },
  });
  return configFn;
};

export default addConfigAccessors;
