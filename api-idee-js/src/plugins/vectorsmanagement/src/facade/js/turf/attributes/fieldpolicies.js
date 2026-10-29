import { FieldPolicy } from '../turftypes';

/**
 * Columna con el número de elementos que forman un resultado combinado.
 * @const
 * @type {String}
 */
export const COUNT_FIELD = 'num_entidades';

/**
 * Columna con la capa (o capas) de origen de cada resultado.
 * @const
 * @type {String}
 */
export const SOURCE_LAYER_FIELD = 'capa_origen';

/**
 * Separador de los valores que se reúnen en una sola columna.
 * @const
 * @type {String}
 */
const SEPARATOR = ', ';

/**
 * Indica si un valor está vacío.
 *
 * @param {*} value Valor.
 * @returns {Boolean}
 */
const isEmpty = (value) => value === undefined || value === null || value === '';

/**
 * Valores distintos, en el orden en que aparecen.
 *
 * @param {Array<*>} values Valores.
 * @returns {Array<*>} Valores sin repetir.
 */
export const distinct = (values) => [...new Set(values)];

/**
 * Forma de combinar los valores de un campo de varios elementos de origen.
 * @typedef {Object} FieldPolicyStrategy
 * @property {function(Array<*>): *} combine Recibe los valores en el orden de
 * los elementos de origen (null si un elemento no tiene el campo) y devuelve
 * el valor de la columna.
 */

/**
 * Políticas de combinación de campos. Ninguna toma el valor del primer
 * elemento: el resultado no depende de cuál se procese antes.
 * @const
 * @type {Object<FieldPolicy, FieldPolicyStrategy>}
 */
export const FIELD_POLICIES = Object.freeze({
  // Los valores distintos no vacíos; si solo hay uno, conserva su tipo.
  [FieldPolicy.DISTINCT]: Object.freeze({
    combine: (values) => {
      const found = distinct(values.filter((value) => !isEmpty(value)));
      if (found.length === 0) return null;
      return found.length === 1 ? found[0] : found.join(SEPARATOR);
    },
  }),
  // El valor si todos los elementos lo comparten; si no, null.
  [FieldPolicy.COMMON]: Object.freeze({
    combine: (values) => {
      const found = distinct(values.map((value) => (value === undefined ? null : value)));
      return found.length === 1 ? found[0] : null;
    },
  }),
});

/**
 * Nombres de las capas de origen de unos elementos, sin repetir.
 *
 * @param {Array<InputFeature>} sources Elementos.
 * @returns {String|null} Nombres separados por comas o null si no hay elementos.
 */
export const sourceLayers = (sources) => (sources.length === 0
  ? null : distinct(sources.map((source) => source.layer.legend)).join(SEPARATOR));
