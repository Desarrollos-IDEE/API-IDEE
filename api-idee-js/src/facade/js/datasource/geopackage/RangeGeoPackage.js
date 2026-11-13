/**
 * GeoPackage leído por rangos: tablas del sistema, metadatos y proveedores por tabla.
 *
 * @module IDEE/datasource/geopackage/RangeGeoPackage
 */
import { BoundingBox } from '@ngageoint/geopackage';
import { PackageReader } from '../contracts';
import SqliteReader from '../sqlite/SqliteReader';
import RTreeIndex from '../sqlite/RTreeIndex';
import RangeVectorProvider from './RangeVectorProvider';
import { createRangeTileProvider } from './RangeTileProvider';
import { RangeUnsupportedError } from './errors';

/**
 * Tipos de geometría curva, que necesitan GDAL y el fichero completo.
 * @const
 * @type {Array<String>}
 */
const CURVED_TYPES = ['CIRCULARSTRING', 'COMPOUNDCURVE'];

export { RangeUnsupportedError };

/**
 * Transforma una extensión con las proyecciones de @ngageoint/geopackage, las mismas que
 * usa la consulta por extensión del modo de descarga.
 * @param {Array<Number>} extent [minX, minY, maxX, maxY].
 * @param {String} from Código de origen.
 * @param {String} to Código de destino.
 * @returns {Array<Number>} Extensión transformada.
 */
export const transformExtentWithGeoPackage = ([minX, minY, maxX, maxY], from, to) => {
  const projected = new BoundingBox(minX, maxX, minY, maxY).projectBoundingBox(from, to);
  return [
    projected.minLongitude, projected.minLatitude, projected.maxLongitude, projected.maxLatitude,
  ];
};

/**
 * Tipo base declarado de una columna (sin tamaño) y tamaño máximo.
 * @param {String} type Tipo declarado.
 * @returns {Array} [tipo, tamaño].
 */
const splitType = (type) => {
  const match = /^\s*([^(]*?)\s*(?:\(\s*(\d+)\s*\))?\s*$/.exec(type || '');
  if (!match) return [type, undefined];
  return [match[1].toUpperCase(), match[2] ? Number(match[2]) : undefined];
};

/**
 * Valor por defecto de una columna a partir de su literal SQL.
 * @param {String} literal Literal.
 * @returns {*} Valor.
 */
const parseDefault = (literal) => {
  if (literal === undefined) return undefined;
  if (/^'.*'$/s.test(literal)) return literal.slice(1, -1).replace(/''/g, '\'');
  if (/^NULL$/i.test(literal)) return null;
  const number = Number(literal);
  return Number.isNaN(number) ? literal : number;
};

/**
 * Lee un GeoPackage por rangos e implementa PackageReader.
 */
class RangeGeoPackage extends PackageReader {
  /**
   * @param {ByteSource} source Origen de bytes del fichero.
   * @param {Object} [options] Opciones de proveedores por tipo ({ vector, tile }).
   * @param {Object} [dependencies] Dependencias.
   * @param {Function} [dependencies.transformExtent] Transformación de extensiones.
   * @param {Function} [dependencies.createTileProvider] Crea el proveedor de una tabla de
   * teselas; null hace que las tablas de teselas no se admitan por rangos.
   */
  constructor(source, { vector = {}, tile = {} } = {}, {
    transformExtent = transformExtentWithGeoPackage,
    createTileProvider = createRangeTileProvider,
  } = {}) {
    super();
    this.source_ = source;
    this.reader_ = new SqliteReader(source);
    this.vectorOptions_ = vector || {};
    this.tileOptions_ = tile || {};
    this.transformExtent_ = transformExtent;
    this.createTileProvider_ = createTileProvider;
    this.initPromise_ = this.init_();
    this.initPromise_.catch(() => undefined);
  }

  /**
   * Devuelve el lector SQLite del paquete.
   * @returns {SqliteReader} Lector.
   */
  getReader() {
    return this.reader_;
  }

  /**
   * Lee las tablas del sistema y crea los proveedores.
   * @private
   * @returns {Promise<Object>} Proveedores y metadatos.
   */
  async init_() {
    const reader = this.reader_;
    const header = await reader.open();
    if (!await reader.getTable('gpkg_contents')) {
      throw new RangeUnsupportedError('sin tabla gpkg_contents');
    }
    const [contents, geometryColumns, srsRows, extensions, metadataRows, references, counts,
      tileMatrixSets, tileMatrices] = await Promise.all([
      'gpkg_contents', 'gpkg_geometry_columns', 'gpkg_spatial_ref_sys', 'gpkg_extensions',
      'gpkg_metadata', 'gpkg_metadata_reference', 'gpkg_ogr_contents', 'gpkg_tile_matrix_set',
      'gpkg_tile_matrix',
    ].map((name) => reader.readAll(name)));
    const byType = (type) => contents.filter((row) => row.data_type === type)
      .map((row) => row.table_name);
    const features = byType('features');
    const tiles = byType('tiles');
    const attributes = byType('attributes');
    const srsById = new Map(srsRows.map((row) => [row.srs_id, row]));
    const geometryByTable = new Map(geometryColumns.map((row) => [row.table_name, row]));
    const curved = features.filter((name) => CURVED_TYPES
      .includes(String(geometryByTable.get(name)?.geometry_type_name).toUpperCase()));
    if (curved.length > 0) {
      throw new RangeUnsupportedError(`geometrías curvas (${curved.join(', ')})`);
    }
    if (tiles.length > 0 && !this.createTileProvider_) {
      throw new RangeUnsupportedError('tablas de teselas');
    }
    const tableDescriptions = new Map(await Promise.all([...features, ...tiles, ...attributes]
      .map(async (name) => [name, await reader.getTable(name)])));
    const vectorProviders = await Promise.all(features.map(async (name) => {
      const geometry = geometryByTable.get(name);
      const hasIndex = extensions.some((row) => row.table_name === name
        && row.column_name === geometry.column_name && row.extension_name === 'gpkg_rtree_index');
      const nodeTable = hasIndex
        ? await reader.getTable(`rtree_${name}_${geometry.column_name}_node`) : null;
      const index = nodeTable ? new RTreeIndex(async (numbers) => {
        const rows = await reader.getRows(nodeTable.rootPage, numbers);
        return new Map([...rows].map(([number, values]) => [number, values[1]]));
      }) : null;
      return new RangeVectorProvider(this, name, this.vectorOptions_[name], {
        reader,
        table: tableDescriptions.get(name),
        geometryColumn: geometry.column_name,
        srs: srsById.get(geometry.srs_id),
        index,
        transformExtent: this.transformExtent_,
      });
    }));
    const tileProviders = await Promise.all(tiles.map((name) => this.createTileProvider_({
      pack: this,
      reader,
      name,
      table: tableDescriptions.get(name),
      tileMatrixSet: tileMatrixSets.find((row) => row.table_name === name),
      tileMatrices: tileMatrices.filter((row) => row.table_name === name),
      options: this.tileOptions_[name],
    })));
    const describeTable = (name, type) => {
      const content = contents.find((row) => row.table_name === name);
      const srs = srsById.get(content.srs_id);
      const table = {
        tableName: name,
        type,
        identifier: content.identifier,
        description: content.description,
        lastChange: content.last_change,
        bounds: [content.min_x, content.min_y, content.max_x, content.max_y],
        srs: srs ? {
          name: srs.srs_name,
          id: srs.srs_id,
          organization: srs.organization,
          organizationCoordsysId: srs.organization_coordsys_id,
          definition: srs.definition,
          description: srs.description,
        } : null,
        columns: tableDescriptions.get(name).columns.map((column, index) => {
          const [dataType, max] = splitType(column.type);
          return {
            index,
            name: column.name,
            dataType,
            max,
            notNull: column.notNull,
            primaryKey: column.primaryKey,
            defaultValue: parseDefault(column.defaultValue),
          };
        }),
        count: counts.find((row) => row.table_name === name)?.feature_count ?? null,
      };
      if (type === 'features') {
        const geometry = geometryByTable.get(name);
        table.geometry = {
          column: geometry.column_name,
          type: geometry.geometry_type_name,
          z: geometry.z,
          m: geometry.m,
        };
      } else if (type === 'tiles') {
        const set = tileMatrixSets.find((row) => row.table_name === name);
        table.tileMatrixSet = {
          srsId: set.srs_id,
          bounds: [set.min_x, set.min_y, set.max_x, set.max_y],
        };
        table.tileMatrices = tileMatrices.filter((row) => row.table_name === name)
          .map((matrix) => ({
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
    };
    const tables = Object.create(null);
    features.forEach((name) => { tables[name] = describeTable(name, 'features'); });
    tiles.forEach((name) => { tables[name] = describeTable(name, 'tiles'); });
    attributes.forEach((name) => { tables[name] = describeTable(name, 'attributes'); });
    const metadata = {
      applicationId: header.applicationId,
      featureTables: features,
      tileTables: tiles,
      attributeTables: attributes,
      tables,
      extensions: extensions.map((row) => ({
        tableName: row.table_name,
        columnName: row.column_name,
        name: row.extension_name,
        definition: row.definition,
        scope: row.scope,
      })),
      metadata: metadataRows.map((row) => ({
        id: row.id,
        scope: row.md_scope,
        standardUri: row.md_standard_uri,
        mimeType: row.mime_type,
        value: row.metadata,
      })),
      metadataReferences: references.map((row) => ({
        scope: row.reference_scope,
        tableName: row.table_name,
        columnName: row.column_name,
        rowId: row.row_id_value,
        timestamp: row.timestamp,
        metadataId: row.md_file_id,
        parentMetadataId: row.md_parent_id,
      })),
    };
    return { vectorProviders, tileProviders, metadata };
  }

  getVectorProviders() {
    return this.initPromise_.then(({ vectorProviders }) => vectorProviders);
  }

  getTileProviders() {
    return this.initPromise_.then(({ tileProviders }) => tileProviders);
  }

  getMetadata() {
    return this.initPromise_.then(({ metadata }) => metadata);
  }

  dispose() {
    this.initPromise_.then(({ tileProviders }) => Promise.all(tileProviders
      .map((provider) => provider.whenIdle?.()))).catch(() => undefined)
      .then(() => this.source_.dispose());
  }
}

export default RangeGeoPackage;
