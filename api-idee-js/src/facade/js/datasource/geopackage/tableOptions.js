/**
 * Opciones de la capa de cada tabla de un GeoPackage.
 *
 * @module IDEE/datasource/geopackage/tableOptions
 */
import { copyOptions } from './parameters';

/**
 * Combina las opciones comunes y las de una tabla sin modificar ninguna de las dos,
 * y resuelve el nombre y la leyenda por defecto de la capa hija.
 *
 * @param {String} tableName Nombre original de la tabla.
 * @param {Object} context Opciones normalizadas del paquete.
 * @param {Object} context.common Opciones comunes.
 * @param {Object} context.tables Opciones por tabla.
 * @param {Boolean} context.legacy Firma histórica.
 * @param {String} context.packageName Nombre del paquete.
 * @param {Boolean} [raster=false] Indica si se trata de una tabla de teselas.
 * @returns {Object} Opciones independientes para la capa hija.
 */
const resolveTableOptions = (tableName, {
  common, tables, legacy, packageName,
}, raster = false) => {
  const options = copyOptions({
    ...common,
    ...(Object.prototype.hasOwnProperty.call(tables, tableName) ? tables[tableName] : {}),
  });
  if (options.name === undefined) {
    options.name = legacy ? tableName : `${packageName}:${tableName}`;
  }
  if (options.legend === undefined && (raster || !legacy)) {
    options.legend = tableName;
  }
  return options;
};

export default resolveTableOptions;
