import { Aggregate } from '../turftypes';
import { FIELD_POLICIES, sourceLayers } from './fieldpolicies';

/**
 * Nombres que no pueden usarse en la salida: OpenLayers interpreta la
 * propiedad geometry como la geometría del elemento.
 * @const
 * @type {Array<String>}
 */
const RESERVED_NAMES = Object.freeze(['geometry']);

/**
 * Columna de la capa de salida.
 * @typedef {Object} SchemaColumn
 * @property {String} name Nombre en la salida.
 * @property {InputRole} role Papel del que procede el valor.
 * @property {String} [field] Campo de origen (columnas de campos).
 * @property {Aggregate} [aggregate] Agregado (columnas que resumen los elementos).
 * @property {Boolean} renamed Indica si el nombre ha cambiado por un conflicto.
 */

/**
 * Campos de un papel que se copian a la salida. Si el papel tiene varias
 * capas, los campos con el mismo nombre comparten columna.
 * @typedef {Object} RoleFields
 * @property {InputRole} role Papel.
 * @property {Array<String>} fields Campos elegidos, en orden.
 * @property {String} [prefix=''] Prefijo de sus columnas.
 */

/**
 * Devuelve el nombre indicado o, si ya está ocupado, el primero libre con
 * sufijo _2, _3...
 *
 * @param {String} base Nombre deseado.
 * @param {Set<String>} used Nombres ocupados.
 * @returns {String} Nombre libre.
 */
const freeName = (base, used) => {
  if (!used.has(base)) return base;
  let suffix = 2;
  while (used.has(`${base}_${suffix}`)) suffix += 1;
  return `${base}_${suffix}`;
};

/**
 * @classdesc
 * Esquema de atributos de una capa de salida: qué columnas tiene, de qué
 * papel y campo procede cada una y cómo se calculan sus valores a partir de
 * la procedencia de cada resultado. Los conflictos de nombres se resuelven
 * siempre igual: en el orden de los papeles y, dentro de cada papel, en el
 * de sus campos; el orden de los elementos no influye.
 */
export default class AttributeSchema {
  /**
   * @constructor
   * @param {Array<SchemaColumn>} columns Columnas.
   * @param {FieldPolicy} [fieldPolicy] Combinación de los valores de un campo
   * cuando un resultado procede de varios elementos de un papel.
   */
  constructor(columns, fieldPolicy) {
    this.columns = Object.freeze(columns.map((column) => Object.freeze({ ...column })));
    this.fieldPolicy = fieldPolicy;
  }

  /**
   * Construye el esquema con los campos elegidos de cada papel.
   *
   * @param {Array<RoleFields>} roleFields Campos por papel, en orden de prioridad.
   * @param {Array<AggregateSpec>} [aggregates] Columnas agregadas.
   * @param {FieldPolicy} [fieldPolicy] Combinación de valores de varios elementos.
   * @returns {AttributeSchema} Esquema.
   */
  static build(roleFields, aggregates = [], fieldPolicy = undefined) {
    const used = new Set(RESERVED_NAMES);
    const add = (base, column) => {
      const name = freeName(base, used);
      used.add(name);
      return { ...column, name, renamed: name !== base };
    };
    const fieldColumns = roleFields.flatMap(({ role, fields, prefix = '' }) => fields
      .map((field) => add(`${prefix}${field}`, { role, field })));
    const aggregateColumns = aggregates
      .map(({ role, aggregate, name }) => add(name, { role, aggregate }));
    return new AttributeSchema([...fieldColumns, ...aggregateColumns], fieldPolicy);
  }

  /**
   * Calcula las propiedades de un resultado a partir de sus elementos de
   * origen. Los valores ausentes son null.
   *
   * @param {Object<InputRole, Array<InputFeature>>} sources Elementos por papel.
   * @returns {Object} Propiedades.
   */
  project(sources) {
    return this.columns.reduce((properties, column) => ({
      ...properties,
      [column.name]: this.valueOf_(column, sources[column.role] || []),
    }), {});
  }

  /**
   * Valor de una columna para los elementos de origen de su papel.
   *
   * @private
   * @param {SchemaColumn} column Columna.
   * @param {Array<InputFeature>} sources Elementos de origen.
   * @returns {*} Valor; null si los elementos no aportan el campo.
   */
  valueOf_(column, sources) {
    if (column.aggregate === Aggregate.COUNT) return sources.length;
    if (column.aggregate === Aggregate.LAYERS) return sourceLayers(sources);
    const values = sources.map((source) => {
      const value = source.properties[column.field];
      return value === undefined ? null : value;
    });
    if (values.length <= 1) return values.length === 1 ? values[0] : null;
    const policy = FIELD_POLICIES[this.fieldPolicy];
    if (!policy) {
      throw new Error(`La columna ${column.name} no tiene forma de combinar varios elementos`);
    }
    return policy.combine(values);
  }
}
