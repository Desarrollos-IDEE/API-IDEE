/**
 * @module IDEE/GeoPackageConnector
 */
import sqljs from 'sql.js';
import {
  GeoPackageConnection, GeoPackage, GeoPackageDataType, setSqljsWasmLocateFile,
} from '@ngageoint/geopackage';
import GeoPackageTile from '../provider/TileProvider';
import GeoPackageVector from '../provider/VectorProvider';
import Exception from '../exception/exception';
import { getValue } from '../i18n/language';
import { linearizeGeoPackage } from '../util/Gdal';

/**
 * @classdesc
 * Esta clase permite leer y procesar un archivo GeoPackage (.gpkg).
 * Obtiene proveedores para caps vectoriales y ráster.
 *
 * @property {Object} tileOpts_ Opciones específicas para capas ráster.
 * @property {Object} vectorOpts_ Opciones específicas para capas vectoriales.
 * @property {Array<GeoPackageVector>} vectorProviders_  Proveedores de capas vectoriales.
 * @property {Array<GeoPackageTile>} tileProviders_ Proveedores de capas ráster.
 * @property {GeoPackage} gpkg_ GeoPackage.
 *
 * @api
 */
class GeoPackageConnector {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {File|Response|ArrayBuffer|Uint8Array|Object} data Fuente binaria o parámetros
   * con una única propiedad source o url.
   * @param {Object} options Opciones por tipo de capa.
   * - tile: Opciones especificadas para capas ráster.
   * - vector: Opciones especificadas para capas vectoriales.
   *
   * @api
   */
  constructor(data, { tile, vector } = {}) {
    /**
     * Opciones para capas ráster.
     * @private
     * @type {Object}
     */
    this.tileOpts_ = tile || {};

    /**
     * Opciones para capas vectoriales.
     * @private
     * @type {Object}
     */
    this.vectorOpts_ = vector || {};

    /**
      * Proveedores de capas vectoriales.
      * @private
      * @type {Array<GeoPackageVector>}
      */
    this.vectorProviders_ = [];

    /**
      * Proveedores de capas ráster.
      * @private
      * @type {Array<GeoPackageTile>}
      */
    this.tileProviders_ = [];

    /**
    * GeoPackage
    * @private
    * @type {GeoPackage}
    */
    this.gpkg_ = null;

    /**
     * Metadatos estructurados del GeoPackage.
     * @private
     * @type {Object|null}
     */
    this.metadata_ = null;

    setSqljsWasmLocateFile((file) => `${IDEE.config.SQL_WASM_URL}${file}`);

    this.init(data);
  }

  /**
   * Este método carga el archivo GeoPackage, crea la base de datos
   * y genera los proveedores de capas vectoriales y de teselas.
   *
   * @function
   * @public
   * @param {File|Response|ArrayBuffer|Uint8Array|Object} data Fuente binaria o parámetros.
   * @returns {Promise<Object>} Proveedores del paquete o rechazo de la carga.
   * @api
   */
  init(data) {
    this.initPromise_ = this.readSource_(data).then(async (uint8Array) => {
      const SQL = await sqljs({
        locateFile: (file) => `${IDEE.config.SQL_WASM_URL}${file}`,
      });
      const db = new SQL.Database(uint8Array);
      try {
        const conn = await GeoPackageConnection.connectWithDatabase(db);
        this.gpkg_ = new GeoPackage('', '', conn);
        const { features, tiles, attributes } = this.gpkg_.getTables();
        this.tileProviders_ = tiles
          .map((name) => new GeoPackageTile(this.gpkg_, name, this.tileOpts_[name]));
        this.vectorProviders_ = features
          .map((name) => new GeoPackageVector(this.gpkg_, name, this.vectorOpts_[name]));
        const curvedTables = features.filter((name) => {
          const type = this.gpkg_.getFeatureDao(name).geometryColumns.geometry_type_name;
          return ['CIRCULARSTRING', 'COMPOUNDCURVE'].includes(type.toUpperCase());
        });
        if (curvedTables.length > 0) {
          const tables = curvedTables.map((name) => {
            const dao = this.gpkg_.getFeatureDao(name);
            return {
              name,
              idColumn: dao.table.getIdColumn().name,
              geometryColumn: dao.geometryColumns.column_name,
            };
          });
          const geometries = await linearizeGeoPackage(uint8Array, tables);
          this.vectorProviders_.forEach((provider) => {
            if (geometries.has(provider.getTableName())) {
              provider.setLinearGeometries(geometries.get(provider.getTableName()));
            }
          });
        }
        this.metadata_ = this.createMetadata_(features, tiles, attributes);
        return {
          tileProviders: this.tileProviders_,
          vectorProviders: this.vectorProviders_,
          metadata: this.metadata_,
        };
      } catch (error) {
        db.close();
        this.gpkg_ = null;
        throw error;
      }
    });
    // La promesa original conserva el rechazo aunque el consumidor se suscriba más tarde.
    this.initPromise_.catch(() => undefined);
    return this.initPromise_;
  }

  /**
   * Convierte los datos de una tabla en una estructura independiente de los DAO internos.
   * @private
   * @param {String} tableName Nombre original de la tabla.
   * @param {String} type Tipo de contenido GeoPackage.
   * @returns {Object} Metadatos de la tabla.
   */
  getTableMetadata_(tableName, type) {
    let dao;
    if (type === 'features') {
      dao = this.gpkg_.getFeatureDao(tableName);
    } else if (type === 'tiles') {
      dao = this.gpkg_.getTileDao(tableName);
    } else {
      dao = this.gpkg_.getAttributeDao(tableName);
    }
    const contents = this.gpkg_.getTableContents(tableName);
    const srs = contents.srs_id === null || contents.srs_id === undefined
      ? null : this.gpkg_.getSrs(contents.srs_id);
    const table = {
      tableName,
      type,
      identifier: contents.identifier,
      description: contents.description,
      lastChange: contents.last_change,
      bounds: [contents.min_x, contents.min_y, contents.max_x, contents.max_y],
      srs: srs ? {
        name: srs.srs_name,
        id: srs.srs_id,
        organization: srs.organization,
        organizationCoordsysId: srs.organization_coordsys_id,
        definition: srs.definition,
        description: srs.description,
      } : null,
      columns: dao.table.getUserColumns().getColumns().map((column) => ({
        index: column.index,
        name: column.name,
        dataType: GeoPackageDataType.nameFromType(column.dataType),
        max: column.max,
        notNull: column.notNull,
        primaryKey: column.primaryKey,
        defaultValue: column.defaultValue,
      })),
      count: dao.getCount(),
    };
    if (type === 'features') {
      table.geometry = {
        column: dao.geometryColumns.column_name,
        type: dao.geometryColumns.geometry_type_name,
        z: dao.geometryColumns.z,
        m: dao.geometryColumns.m,
      };
    } else if (type === 'tiles') {
      table.tileMatrixSet = {
        srsId: dao.tileMatrixSet.srs_id,
        bounds: [
          dao.tileMatrixSet.min_x,
          dao.tileMatrixSet.min_y,
          dao.tileMatrixSet.max_x,
          dao.tileMatrixSet.max_y,
        ],
      };
      table.tileMatrices = dao.tileMatrices.map((matrix) => ({
        zoomLevel: matrix.zoom_level,
        matrixWidth: matrix.matrix_width,
        matrixHeight: matrix.matrix_height,
        tileWidth: matrix.tile_width,
        tileHeight: matrix.tile_height,
        pixelXSize: matrix.pixel_x_size,
        pixelYSize: matrix.pixel_y_size,
      }));
    }
    return table;
  }

  /**
   * Lee una tabla opcional del estándar sin crearla ni modificar el GeoPackage.
   * @private
   * @param {Object} dao DAO de la tabla opcional.
   * @param {Function} mapper Normalizador de cada fila.
   * @returns {Array<Object>} Filas normalizadas o una colección vacía.
   */
  getOptionalRows_(dao, mapper) {
    return dao.isTableExists() ? dao.queryForAll().map(mapper) : [];
  }

  /**
   * Extrae la información estructurada del contenedor y de sus tablas.
   * @private
   * @param {Array<String>} features Tablas vectoriales.
   * @param {Array<String>} tiles Tablas de teselas.
   * @param {Array<String>} attributes Tablas de atributos.
   * @returns {Object} Metadatos serializables del GeoPackage.
   */
  createMetadata_(features, tiles, attributes) {
    const tables = Object.create(null);
    features.forEach((name) => { tables[name] = this.getTableMetadata_(name, 'features'); });
    tiles.forEach((name) => { tables[name] = this.getTableMetadata_(name, 'tiles'); });
    attributes.forEach((name) => {
      tables[name] = this.getTableMetadata_(name, 'attributes');
    });
    return {
      applicationId: this.gpkg_.getApplicationId(),
      featureTables: [...features],
      tileTables: [...tiles],
      attributeTables: [...attributes],
      tables,
      extensions: this.getOptionalRows_(this.gpkg_.extensionDao, (extension) => ({
        tableName: extension.table_name,
        columnName: extension.column_name,
        name: extension.extension_name,
        definition: extension.definition,
        scope: extension.scope,
      })),
      metadata: this.getOptionalRows_(this.gpkg_.metadataDao, (metadata) => ({
        id: metadata.id,
        scope: metadata.md_scope,
        standardUri: metadata.md_standard_uri,
        mimeType: metadata.mime_type,
        value: metadata.metadata,
      })),
      metadataReferences: this.getOptionalRows_(this.gpkg_.metadataReferenceDao, (reference) => ({
        scope: reference.reference_scope,
        tableName: reference.table_name,
        columnName: reference.column_name,
        rowId: reference.row_id_value,
        timestamp: reference.timestamp instanceof Date
          ? reference.timestamp.toISOString() : reference.timestamp,
        metadataId: reference.md_file_id,
        parentMetadataId: reference.md_parent_id,
      })),
    };
  }

  /**
   * Lee una fuente binaria o descarga el fichero completo indicado por url.
   * No modifica la fuente ni interpreta respuestas binarias como texto.
   * @private
   * @param {File|Response|ArrayBuffer|Uint8Array|Object} data Fuente o parámetros.
   * @returns {Promise<Uint8Array>} Bytes del fichero GeoPackage.
   */
  async readSource_(data) {
    let source = data;
    if (data && Object.getPrototypeOf(data) === Object.prototype) {
      const hasSource = data.source !== undefined;
      const hasURL = data.url !== undefined;
      if (hasSource === hasURL) {
        Exception(getValue('exception').geopackage_source);
      }
      if (hasURL) {
        if (typeof data.url !== 'string' || data.url.trim().length === 0) {
          Exception(getValue('exception').geopackage_source);
        }
        source = await window.fetch(data.url);
      } else {
        source = data.source;
      }
    }
    if (source instanceof Response) {
      if (!source.ok) {
        Exception(`${getValue('exception').geopackage_response} (${source.status})`);
      }
      source = await source.arrayBuffer();
    } else if (source instanceof File) {
      source = await source.arrayBuffer();
    }
    if (!(source instanceof ArrayBuffer) && !(source instanceof Uint8Array)) {
      Exception(getValue('exception').geopackage_source);
    }
    if (source.byteLength === 0) {
      Exception(getValue('exception').geopackage_source);
    }
    return new Uint8Array(source);
  }

  /**
   * Este método obtiene los proveedores de capas vectoriales.
   *
   * @function
   * @public
   * @returns {Array<GeoPackageVector>} Proveedores de capas vectoriales.
   * @api
   */
  getVectorProviders() {
    return this.initPromise_.then(({ vectorProviders }) => vectorProviders);
  }

  /**
   * Este método obtiene los proveedores de capas ráster.
   *
   * @function
   * @public
   * @returns {Array<GeoPackageTile>} Proveedores de capas ráster.
   * @api
   */
  getTileProviders() {
    return this.initPromise_.then(({ tileProviders }) => tileProviders);
  }

  /**
   * Este método obtiene los metadatos estructurados del GeoPackage.
   *
   * @function
   * @public
   * @returns {Promise<Object>} Metadatos del contenedor y sus tablas.
   * @api
   */
  getMetadata() {
    return this.initPromise_.then(({ metadata }) => metadata);
  }
}

export default GeoPackageConnector;
