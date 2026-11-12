/**
 * Serialización de un GeoPackage a configuración JSON y a cadena REST.
 *
 * @module IDEE/datasource/geopackage/Serializer
 */
import { LayerSerializer } from '../contracts';
import { copyOptions, isPlainRecord } from './parameters';

/**
 * Lee un valor de la capa sin propagar los errores de una implementación ausente.
 * @param {Function} getter Lectura.
 * @returns {*} Valor o undefined.
 */
const read = (getter) => {
  try {
    return getter();
  } catch (error) {
    return undefined;
  }
};

/**
 * Serializador de GeoPackage. Las dependencias de la fachada se inyectan para que el
 * módulo no dependa de estilos, utilidades ni implementaciones concretas.
 */
class GeoPackageSerializer extends LayerSerializer {
  /**
   * @param {Object} dependencies Dependencias.
   * @param {String} dependencies.type Tipo de capa REST.
   * @param {function(*): Boolean} dependencies.isStyle Indica si un valor es un estilo.
   * @param {function(String): Boolean} dependencies.isRemoteURL Indica si una URL es remota.
   * @param {function(String): String} dependencies.toRestURL URL absoluta para REST.
   * @param {function(Object): String} dependencies.serializeUrlParams Parámetros REST.
   */
  constructor({
    type, isStyle, isRemoteURL, toRestURL, serializeUrlParams,
  }) {
    super();
    this.type_ = type;
    this.isStyle_ = isStyle;
    this.isRemoteURL_ = isRemoteURL;
    this.toRestURL_ = toRestURL;
    this.serializeUrlParams_ = serializeUrlParams;
  }

  /**
   * Prepara opciones para que las instancias de estilo puedan reconstruirse desde JSON.
   * @param {*} value Valor de configuración.
   * @returns {*} Valor serializable y reutilizable por el constructor.
   */
  getSerializableOptions(value) {
    if (this.isStyle_(value)) {
      return value.serialize();
    }
    if (Array.isArray(value)) {
      return value.map((item) => this.getSerializableOptions(item));
    }
    if (isPlainRecord(value)) {
      return Object.fromEntries(Object.entries(value)
        .map(([key, item]) => [key, this.getSerializableOptions(item)]));
    }
    return value;
  }

  /**
   * Exporta una configuración que puede utilizarse para crear otra instancia.
   * @param {Object} pack Descripción del paquete.
   * @param {String} [pack.url] URL remota.
   * @param {*} [pack.source] Fuente binaria.
   * @param {String} pack.name Nombre.
   * @param {String} pack.legend Leyenda.
   * @param {Object} pack.options Opciones.
   * @param {Object} pack.metadata Metadatos.
   * @param {Object} pack.properties Propiedades.
   * @returns {Object} Configuración y metadatos del paquete.
   */
  toJSON({
    url, source, name, legend, options, metadata, properties,
  }) {
    return {
      type: this.type_,
      ...(url === undefined ? { source } : { url }),
      name,
      legend,
      options: this.getSerializableOptions(options),
      metadata,
      properties: copyOptions(properties),
    };
  }

  /**
   * Devuelve la cadena REST del paquete con el estado actual de sus tablas.
   * @param {Object} pack Descripción del paquete.
   * @param {Boolean} pack.legacy Firma histórica.
   * @param {String} [pack.url] URL remota.
   * @param {String} pack.name Nombre.
   * @param {String} pack.legend Leyenda.
   * @param {Object} pack.options Opciones.
   * @param {Object<String, Object>} pack.layers Capas hijas por tabla.
   * @param {Array<String>|null} pack.tableNames Tablas restringidas en la construcción.
   * @param {Array<String>} [tableNames] Tablas que se comparten; por defecto, todas.
   * @returns {String|null} Cadena REST; null si no es representable.
   */
  getRestLayer({
    legacy, url, name, legend, options, layers, tableNames: restrictedTables,
  }, tableNames) {
    if (legacy || !this.isRemoteURL_(url)) {
      return null;
    }
    const sharedTables = Array.isArray(tableNames)
      ? tableNames.filter((tableName) => layers[tableName] !== undefined)
      : Object.keys(layers);
    if (Array.isArray(tableNames) && sharedTables.length === 0) {
      return null;
    }
    const serializableOptions = this.getSerializableOptions(options);
    const tables = { ...serializableOptions.tables };
    delete serializableOptions.tables;
    sharedTables.forEach((tableName) => {
      const layer = layers[tableName];
      /* eslint-disable no-underscore-dangle */
      const state = {
        ...layer.getRestParameters_(),
        ...layer.getRestVectorParameters_?.(),
        name: layer.name,
        legend: layer.legend,
        visibility: read(() => layer.isVisible()),
        opacity: read(() => layer.getOpacity()),
        displayInLayerSwitcher: layer.displayInLayerSwitcher,
      };
      /* eslint-enable no-underscore-dangle */
      delete state.url;
      Object.keys(state).forEach((key) => {
        if (state[key] === undefined) delete state[key];
      });
      tables[tableName] = { ...tables[tableName], ...state };
    });
    const restricted = Array.isArray(tableNames) || restrictedTables !== null;
    return `${this.type_}*${this.serializeUrlParams_({
      url: this.toRestURL_(url),
      name,
      legend: legend !== name ? legend : undefined,
      options: {
        ...serializableOptions,
        tables,
        tableNames: restricted ? sharedTables : undefined,
      },
    })}`;
  }
}

export default GeoPackageSerializer;
