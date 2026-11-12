/**
 * Normalización de los parámetros de construcción de un GeoPackage.
 * Funciones puras: no modifican los objetos del llamador.
 *
 * @module IDEE/datasource/geopackage/parameters
 */

/**
 * Propiedades del primer argumento que describen el paquete y no son opciones de capa.
 * @const
 * @type {Array<String>}
 */
const PACKAGE_PROPERTIES = [
  'type', 'source', 'url', 'name', 'legend', 'metadata', 'properties', 'options',
];

/**
 * Indica si un valor es un registro de configuración (objeto literal o sin prototipo).
 * @param {*} value Valor.
 * @returns {Boolean} Verdadero si es un registro.
 */
export const isPlainRecord = (value) => !!value
  && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);

/**
 * Copia registros y arrays de configuración, conservando instancias de estilos y fuentes.
 * @param {*} value Valor de configuración.
 * @returns {*} Copia del valor o la instancia original si no es un registro/array.
 */
export const copyOptions = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => copyOptions(item));
  }
  if (isPlainRecord(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, copyOptions(item)]));
  }
  return value;
};

/**
 * Normaliza la firma histórica (fichero, opcionesPorTabla) y la nueva
 * ({ url | source, name, legend, ...opciones }, opciones).
 *
 * @param {Response|File|ArrayBuffer|Uint8Array|Object} data Fichero o parámetros.
 * @param {Object} [options] Opciones del segundo argumento.
 * @returns {{
 *   legacy: Boolean, source: *, url: String, name: String, legend: String,
 *   metadata: Object|null, properties: Object|null, options: Object,
 *   common: Object, tables: Object, providerOptions: Object, tableNames: Array<String>|null,
 *   loadStrategy: String|undefined, rangeBlockSize: Number|undefined
 * }} Parámetros normalizados e independientes de los del llamador.
 */
export const normalizeParameters = (data, options) => {
  const receivedOptions = options || {};
  const legacy = !data || Object.getPrototypeOf(data) !== Object.prototype;
  const parameters = legacy ? { source: data } : { ...data };
  const {
    source, url, name, legend, metadata, properties, options: nestedOptions = {},
  } = parameters;
  const flatOptions = { ...parameters };
  PACKAGE_PROPERTIES.forEach((property) => delete flatOptions[property]);
  const normalizedOptions = copyOptions(legacy ? receivedOptions : {
    ...flatOptions,
    ...nestedOptions,
    ...receivedOptions,
  });
  const {
    tables = {}, tile, vector, tableNames, loadStrategy, rangeBlockSize, ...commonOptions
  } = normalizedOptions;
  return {
    legacy,
    source,
    url,
    name,
    legend,
    metadata: metadata ? copyOptions(metadata) : null,
    properties: properties ? copyOptions(properties) : null,
    options: normalizedOptions,
    common: legacy ? {} : commonOptions,
    tables: legacy ? normalizedOptions : tables,
    providerOptions: { tile, vector },
    tableNames: !legacy && Array.isArray(tableNames) ? tableNames : null,
    loadStrategy: legacy ? undefined : loadStrategy,
    rangeBlockSize: legacy ? undefined : rangeBlockSize,
  };
};
