/**
 * Contratos de las fuentes de datos. No dependen de bibliotecas de terceros ni de
 * implementaciones de OpenLayers o Cesium: las clases concretas dependen de ellos.
 *
 * @module IDEE/datasource/contracts
 */

/**
 * Lanza el error de un método abstracto sin implementar.
 * @param {String} contract Nombre del contrato.
 * @param {String} method Nombre del método.
 */
const notImplemented = (contract, method) => {
  throw new Error(`${contract}.${method}: método abstracto no implementado`);
};

/**
 * Impide instanciar directamente un contrato.
 * @param {Function} target Constructor invocado (new.target).
 * @param {Function} contract Contrato abstracto.
 * @param {String} name Nombre del contrato.
 */
const assertAbstract = (target, contract, name) => {
  if (target === contract) {
    throw new Error(`${name}: clase abstracta`);
  }
};

/**
 * Origen de bytes con acceso aleatorio (p. ej. un fichero remoto leído por rangos HTTP).
 * @abstract
 */
export class ByteSource {
  constructor() {
    assertAbstract(new.target, ByteSource, 'ByteSource');
  }

  /**
   * Lee un intervalo de bytes.
   * @abstract
   * @param {Number} offset Posición inicial.
   * @param {Number} length Número de bytes.
   * @returns {Promise<Uint8Array>} Bytes leídos.
   */
  read(offset, length) {
    return notImplemented('ByteSource', 'read');
  }

  /** Libera los recursos del origen. */
  dispose() {}
}

/**
 * Lector de un tipo de origen binario completo (URL, Response, File, ArrayBuffer...).
 * @abstract
 */
export class SourceReader {
  constructor() {
    assertAbstract(new.target, SourceReader, 'SourceReader');
  }

  /**
   * Indica si el lector admite el origen.
   * @abstract
   * @param {*} input Origen.
   * @returns {Boolean} Verdadero si puede leerlo.
   */
  canRead(input) {
    return notImplemented('SourceReader', 'canRead');
  }

  /**
   * Lee el origen completo.
   * @abstract
   * @param {*} input Origen.
   * @returns {Promise<ArrayBuffer|Uint8Array|Response|File>} Contenido o un origen que
   * otro lector puede seguir leyendo.
   */
  read(input) {
    return notImplemented('SourceReader', 'read');
  }
}

/**
 * Base de datos de un paquete abierta en memoria.
 * @abstract
 */
export class PackageDatabase {
  constructor() {
    assertAbstract(new.target, PackageDatabase, 'PackageDatabase');
  }

  /**
   * Abre la base de datos.
   * @abstract
   * @param {Uint8Array} bytes Contenido completo del paquete.
   * @returns {Promise<Object>} Paquete abierto.
   */
  open(bytes) {
    return notImplemented('PackageDatabase', 'open');
  }

  /**
   * Cierra la base de datos abierta.
   * @abstract
   * @param {Object} pack Paquete abierto.
   */
  close(pack) {
    notImplemented('PackageDatabase', 'close');
  }
}

/**
 * Convierte geometrías curvas en lineales.
 * @abstract
 */
export class GeometryLinearizer {
  constructor() {
    assertAbstract(new.target, GeometryLinearizer, 'GeometryLinearizer');
  }

  /**
   * Linealiza las geometrías de las tablas indicadas.
   * @abstract
   * @param {Uint8Array} bytes Contenido completo del paquete.
   * @param {Array<{name: String, idColumn: String, geometryColumn: String}>} tables Tablas.
   * @returns {Promise<Map<String, Map<Number, Object>>>} Geometrías GeoJSON por tabla e id.
   */
  linearize(bytes, tables) {
    return notImplemented('GeometryLinearizer', 'linearize');
  }
}

/**
 * Lector de un paquete con varias tablas, que entrega proveedores por tabla.
 * @abstract
 */
export class PackageReader {
  constructor() {
    assertAbstract(new.target, PackageReader, 'PackageReader');
  }

  /**
   * @abstract
   * @returns {Promise<Array<VectorDataProvider>>} Proveedores vectoriales.
   */
  getVectorProviders() {
    return notImplemented('PackageReader', 'getVectorProviders');
  }

  /**
   * @abstract
   * @returns {Promise<Array<Object>>} Proveedores de teselas.
   */
  getTileProviders() {
    return notImplemented('PackageReader', 'getTileProviders');
  }

  /**
   * @abstract
   * @returns {Promise<Object>} Metadatos estructurados del paquete.
   */
  getMetadata() {
    return notImplemented('PackageReader', 'getMetadata');
  }

  /**
   * Libera los recursos cuando ya no se usan.
   * @abstract
   */
  dispose() {
    notImplemented('PackageReader', 'dispose');
  }
}

/**
 * Forma de acceder a un paquete (descarga completa, rangos HTTP...).
 * @abstract
 */
export class PackageAccess {
  constructor() {
    assertAbstract(new.target, PackageAccess, 'PackageAccess');
  }

  /**
   * Crea un lector del paquete.
   * @abstract
   * @param {Object} source Origen: { source } o { url }.
   * @param {Object} options Opciones de proveedores ({ tile, vector }).
   * @returns {PackageReader} Lector del paquete.
   */
  createReader(source, options) {
    return notImplemented('PackageAccess', 'createReader');
  }
}

/**
 * Forma de cargar las entidades de una tabla vectorial en su capa.
 * @abstract
 */
export class LoadStrategy {
  constructor() {
    assertAbstract(new.target, LoadStrategy, 'LoadStrategy');
  }

  /**
   * Prepara el proveedor antes de crear la capa.
   * @abstract
   * @param {VectorDataProvider} provider Proveedor de la tabla.
   * @returns {Promise<*>|*} Finalización de la preparación.
   */
  prepare(provider) {
    return notImplemented('LoadStrategy', 'prepare');
  }

  /**
   * Devuelve la colección inicial de la capa.
   * @abstract
   * @param {VectorDataProvider} provider Proveedor de la tabla.
   * @returns {Object} Colección GeoJSON.
   */
  getInitialSource(provider) {
    return notImplemented('LoadStrategy', 'getInitialSource');
  }

  /**
   * Devuelve las funciones de carga que recibe la capa.
   * @abstract
   * @param {Function} getProvider Devuelve el proveedor vigente de la tabla.
   * @returns {Object} Cargadores ({ bboxLoader, fullLoader }) o un objeto vacío.
   */
  getLoaders(getProvider) {
    return notImplemented('LoadStrategy', 'getLoaders');
  }

  /**
   * Obtiene los datos de una recarga.
   * @abstract
   * @param {VectorDataProvider} provider Proveedor nuevo de la tabla.
   * @param {Array<Number>} [extent] Extensión visible, si la capa carga por extensión.
   * @param {String} [projection] Proyección de la extensión.
   * @returns {Promise<Object>} Colección GeoJSON.
   */
  refresh(provider, extent, projection) {
    return notImplemented('LoadStrategy', 'refresh');
  }
}

/**
 * Serializa una capa a configuración JSON y a cadena REST.
 * @abstract
 */
export class LayerSerializer {
  constructor() {
    assertAbstract(new.target, LayerSerializer, 'LayerSerializer');
  }

  /**
   * @abstract
   * @param {Object} layer Capa.
   * @returns {Object} Configuración que puede reconstruir la capa.
   */
  toJSON(layer) {
    return notImplemented('LayerSerializer', 'toJSON');
  }

  /**
   * @abstract
   * @param {Object} layer Capa.
   * @param {Array<String>} [keys] Partes de la capa que se comparten.
   * @returns {String|null} Cadena REST o null si no es representable.
   */
  getRestLayer(layer, keys) {
    return notImplemented('LayerSerializer', 'getRestLayer');
  }
}

/**
 * Proveedor de una tabla vectorial.
 * @typedef {Object} VectorDataProvider
 * @property {function(): String} getTableName Nombre original de la tabla.
 * @property {function(): (Object|Promise<Object>)} getGeoJSON Todas las entidades.
 * @property {function(): Object} getEmptyGeoJSON Colección vacía con el CRS de la tabla.
 * @property {function(Array<Number>, String): (Object|Promise<Object>)} getGeoJSONByBoundingBox
 * Entidades que intersecan una extensión.
 * @property {function(): Promise<Boolean>} prepareForBoundingBox Prepara el índice espacial.
 */

/**
 * Capa que puede volver a pedir sus datos.
 * @typedef {Object} Refreshable
 * @property {function(): (Promise<void>|void)} refresh Recarga los datos.
 * @property {function(Number): void} updateRefreshInterval Cambia el intervalo de recarga.
 */

/**
 * Capa con visibilidad, opacidad y orden de dibujo.
 * @typedef {Object} LayerDisplay
 * @property {function(Boolean): void} setVisible Cambia la visibilidad.
 * @property {function(): Boolean} isVisible Indica si es visible.
 * @property {function(Number): void} setOpacity Cambia la opacidad.
 * @property {function(): Number} getOpacity Devuelve la opacidad.
 * @property {function(Number): void} setZIndex Cambia el orden de dibujo.
 * @property {function(): Number} getZIndex Devuelve el orden de dibujo.
 */

/**
 * Capa con extensión.
 * @typedef {Object} ExtentProvider
 * @property {function(): Array<Number>} getMaxExtent Extensión máxima, síncrona.
 * @property {function(): Promise<Array<Number>>} calculateMaxExtent Extensión de los datos.
 */

/**
 * Capa representable mediante la API-REST.
 * @typedef {Object} RestSerializable
 * @property {function(Array<String>=): (String|null)} getRestLayer Cadena REST.
 */
