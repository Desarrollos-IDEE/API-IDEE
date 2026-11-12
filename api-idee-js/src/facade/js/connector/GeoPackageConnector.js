/**
 * @module IDEE/GeoPackageConnector
 */
import GeoPackageTile from '../provider/TileProvider';
import GeoPackageVector from '../provider/VectorProvider';
import { linearizeGeoPackage } from '../util/Gdal';
import { PackageReader } from '../datasource/contracts';
import { readSource, DEFAULT_SOURCE_READERS } from '../datasource/geopackage/sourceReaders';
import GeoPackageDatabase from '../datasource/geopackage/Database';
import CurveLinearizer from '../datasource/geopackage/CurveLinearizer';
import GeoPackageProviderFactory from '../datasource/geopackage/ProviderFactory';
import readMetadata from '../datasource/geopackage/MetadataReader';

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
 * @extends {PackageReader}
 */
class GeoPackageConnector extends PackageReader {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {File|Response|ArrayBuffer|Uint8Array|Object} data Fuente binaria o parámetros
   * con una única propiedad source o url.
   * @param {Object} options Opciones por tipo de capa.
   * - tile: Opciones especificadas para capas ráster.
   * - vector: Opciones especificadas para capas vectoriales.
   * @param {Object} [dependencies] Colaboradores de lectura, sustituibles en pruebas:
   * readers, database, linearizer, providerFactory y metadataReader.
   *
   * @api
   */
  constructor(data, { tile, vector } = {}, dependencies = {}) {
    super();
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

    const {
      readers = DEFAULT_SOURCE_READERS,
      database = new GeoPackageDatabase(),
      linearizer = new CurveLinearizer({ linearize: linearizeGeoPackage }),
      providerFactory = new GeoPackageProviderFactory({
        VectorProvider: GeoPackageVector,
        TileProvider: GeoPackageTile,
      }),
      metadataReader = readMetadata,
    } = dependencies;
    this.readers_ = readers;
    this.database_ = database;
    this.linearizer_ = linearizer;
    this.providerFactory_ = providerFactory;
    this.metadataReader_ = metadataReader;

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
    this.initPromise_ = readSource(data, this.readers_).then(async (bytes) => {
      const pack = await this.database_.open(bytes);
      try {
        this.gpkg_ = pack;
        const tables = pack.getTables();
        const { vectorProviders, tileProviders } = this.providerFactory_.createProviders(
          pack,
          tables,
          { vector: this.vectorOpts_, tile: this.tileOpts_ },
        );
        this.tileProviders_ = tileProviders;
        this.vectorProviders_ = vectorProviders;
        await this.linearizer_.apply(pack, bytes, tables.features, vectorProviders);
        this.metadata_ = this.metadataReader_(pack, tables);
        return {
          tileProviders: this.tileProviders_,
          vectorProviders: this.vectorProviders_,
          metadata: this.metadata_,
        };
      } catch (error) {
        this.database_.close(pack);
        this.gpkg_ = null;
        throw error;
      }
    });
    // La promesa original conserva el rechazo aunque el consumidor se suscriba más tarde.
    this.initPromise_.catch(() => undefined);
    return this.initPromise_;
  }

  /** Libera SQLite cuando ya no hay tablas ni teselas en vuelo que lo utilicen. */
  dispose() {
    this.initPromise_.then(async () => {
      await Promise.all(this.tileProviders_.map((provider) => provider.whenIdle()));
      this.database_.close(this.gpkg_);
      this.gpkg_ = null;
    }).catch(() => undefined);
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
