/**
 * Lectura de los metadatos estructurados de un GeoPackage abierto.
 *
 * @module IDEE/datasource/geopackage/MetadataReader
 */
import { GeoPackageDataType } from '@ngageoint/geopackage';

/**
 * Convierte los datos de una tabla en una estructura independiente de los DAO internos.
 * @param {Object} gpkg GeoPackage abierto.
 * @param {String} tableName Nombre original de la tabla.
 * @param {String} type Tipo de contenido GeoPackage.
 * @returns {Object} Metadatos de la tabla.
 */
const getTableMetadata = (gpkg, tableName, type) => {
  let dao;
  if (type === 'features') {
    dao = gpkg.getFeatureDao(tableName);
  } else if (type === 'tiles') {
    dao = gpkg.getTileDao(tableName);
  } else {
    dao = gpkg.getAttributeDao(tableName);
  }
  const contents = gpkg.getTableContents(tableName);
  const srs = contents.srs_id === null || contents.srs_id === undefined
    ? null : gpkg.getSrs(contents.srs_id);
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
};

/**
 * Lee una tabla opcional del estándar sin crearla ni modificar el GeoPackage.
 * @param {Object} dao DAO de la tabla opcional.
 * @param {Function} mapper Normalizador de cada fila.
 * @returns {Array<Object>} Filas normalizadas o una colección vacía.
 */
const getOptionalRows = (dao, mapper) => {
  return dao.isTableExists() ? dao.queryForAll().map(mapper) : [];
};

/**
 * Extrae la información estructurada del contenedor y de sus tablas.
 * @param {Object} gpkg GeoPackage abierto.
 * @param {Object} tables Tablas del paquete por tipo.
 * @param {Array<String>} tables.features Tablas vectoriales.
 * @param {Array<String>} tables.tiles Tablas de teselas.
 * @param {Array<String>} tables.attributes Tablas de atributos.
 * @returns {Object} Metadatos serializables del GeoPackage.
 */
const readMetadata = (gpkg, { features, tiles, attributes }) => {
  const tables = Object.create(null);
  features.forEach((name) => { tables[name] = getTableMetadata(gpkg, name, 'features'); });
  tiles.forEach((name) => { tables[name] = getTableMetadata(gpkg, name, 'tiles'); });
  attributes.forEach((name) => {
    tables[name] = getTableMetadata(gpkg, name, 'attributes');
  });
  return {
    applicationId: gpkg.getApplicationId(),
    featureTables: [...features],
    tileTables: [...tiles],
    attributeTables: [...attributes],
    tables,
    extensions: getOptionalRows(gpkg.extensionDao, (extension) => ({
      tableName: extension.table_name,
      columnName: extension.column_name,
      name: extension.extension_name,
      definition: extension.definition,
      scope: extension.scope,
    })),
    metadata: getOptionalRows(gpkg.metadataDao, (metadata) => ({
      id: metadata.id,
      scope: metadata.md_scope,
      standardUri: metadata.md_standard_uri,
      mimeType: metadata.mime_type,
      value: metadata.metadata,
    })),
    metadataReferences: getOptionalRows(gpkg.metadataReferenceDao, (reference) => ({
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
};

export default readMetadata;
