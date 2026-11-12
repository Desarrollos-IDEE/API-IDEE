/**
 * @module IDEE/VectorProvider
 */
import { BoundingBox } from '@ngageoint/geopackage';
import AbstractProvider from './AbstractProvider';
import RTreeIndex from '../datasource/sqlite/RTreeIndex';
import Exception from '../exception/exception';
import { getValue } from '../i18n/language';

/**
 * @classdesc
 * Proveedor de datos para una capa de tipo vectorial dentro de un archivo GeoPackage.
 *
 * @api
 * @extends {IDEE.AbstractProvider}
 */
class GeoPackageVector extends AbstractProvider {
  /**
   * Guarda las geometrías linealizadas durante la inicialización del conector.
   * Conserva getGeoJSON síncrono y los atributos originales de la base de datos.
   * @param {Map<Number, Object>} geometries Geometrías por FID.
   */
  setLinearGeometries(geometries) {
    this.linearGeometries_ = geometries;
  }

  /**
   * Devuelve el índice R*Tree de la tabla (extensión gpkg_rtree_index), leído desde sus
   * tablas de nodos porque sql.js no incluye el módulo rtree; null si no lo tiene.
   * @private
   * @returns {RTreeIndex|null} Índice.
   */
  getRTreeIndex_() {
    if (this.rtreeIndex_ === undefined) {
      this.rtreeIndex_ = null;
      const tableName = this.getTableName();
      const { connection } = this.connector_;
      const column = this.connector_.getFeatureDao(tableName).geometryColumns.column_name;
      const nodeTable = `rtree_${tableName}_${column}_node`;
      const exists = (name) => !!connection.get(
        'SELECT 1 FROM sqlite_master WHERE type = \'table\' AND name = ?',
        [name],
      );
      if (exists('gpkg_extensions') && exists(nodeTable) && connection.get(
        'SELECT 1 FROM gpkg_extensions WHERE table_name = ? AND column_name = ? AND extension_name = ?',
        [tableName, column, 'gpkg_rtree_index'],
      )) {
        const quoted = `"${nodeTable.replace(/"/g, '""')}"`;
        this.rtreeIndex_ = new RTreeIndex((numbers) => new Map(connection.all(
          `SELECT nodeno, data FROM ${quoted} WHERE nodeno IN (${numbers.map(() => '?').join(',')})`,
          numbers,
        ).map(({ nodeno, data }) => [nodeno, data])), { sync: true });
      }
    }
    return this.rtreeIndex_;
  }

  /**
   * Prepara el índice espacial utilizado por las consultas por extensión.
   * Si el GeoPackage ya contiene un índice compatible (R*Tree o NGA), se reutiliza.
   *
   * @function
   * @public
   * @returns {Promise<Boolean>} Resultado de la preparación del índice.
   * @api
   */
  async prepareForBoundingBox() {
    if (this.getRTreeIndex_()) return true;
    const { featureTableIndex } = this.connector_.getFeatureDao(this.getTableName());
    if (featureTableIndex.isIndexed(true)) return true;
    featureTableIndex.getOrCreateExtension();
    const tableIndex = featureTableIndex.getOrCreateTableIndex();
    featureTableIndex.createOrClearGeometryIndicies();
    const featureDao = this.connector_.getFeatureDao(this.getTableName());
    featureDao.queryForAll().forEach((row) => {
      const feature = featureDao.getRow(row);
      featureTableIndex.indexRow(tableIndex, feature.id, feature.geometry);
    });
    return featureTableIndex.updateLastIndexed(tableIndex) === 1;
  }

  /**
   * Convierte una fila vectorial del GeoPackage en una entidad GeoJSON.
   *
   * @function
   * @private
   * @param {Object} feature Fila vectorial.
   * @param {Boolean} includeId Incluye el identificador para evitar duplicados entre extensiones.
   * @returns {Object} Entidad GeoJSON.
   */
  getFeature_(feature, includeId = false) {
    const properties = { ...feature.values };
    delete properties[feature.geometryColumn.name];
    const data = feature.geometry;
    let geometry;
    if (!data) {
      geometry = null;
    } else if (data.geometry) {
      // Las geometrías ya compatibles conservan exactamente su conversión habitual.
      geometry = data.toGeoJSON();
    } else if (this.linearGeometries_ && this.linearGeometries_.get(feature.id)) {
      geometry = this.linearGeometries_.get(feature.id);
    } else {
      Exception(`${getValue('exception').geopackage_geometry} (${this.getTableName()}, ${feature.id}): ${data.geometryError || ''}`);
    }
    return {
      type: 'Feature',
      ...(includeId ? { id: String(feature.id) } : {}),
      geometry,
      properties,
    };
  }

  /**
   * Construye una colección GeoJSON a partir de filas de una tabla vectorial.
   *
   * @function
   * @private
   * @param {Object} featureDao DAO de la tabla vectorial.
   * @param {Iterable<Object>} features Entidades que se incluirán en la colección.
   * @param {Boolean} includeId Incluye identificadores estables en las entidades.
   * @returns {Object} Colección GeoJSON.
   */
  createGeoJSON_(featureDao, features, includeId = false) {
    return {
      type: 'FeatureCollection',
      features: Array.from(features, (feature) => this.getFeature_(feature, includeId)),
      crs: {
        type: 'name',
        properties: {
          name: `${featureDao.srs.organization}:${featureDao.srs.srs_id}`,
        },
      },
    };
  }

  /**
   * Este método genera un objeto GeoJSON con todas las entidades de la capa vectorial.
   *
   * @function
   * @public
   * @returns {Object} GeoJSON
   * @api
   */
  getGeoJSON() {
    const featureDao = this.connector_.getFeatureDao(this.getTableName());
    const features = featureDao.queryForAll().map((row) => featureDao.getRow(row));
    return this.createGeoJSON_(featureDao, features);
  }

  /**
   * Genera una colección vacía con el sistema de referencia de la tabla.
   *
   * @function
   * @public
   * @returns {Object} Colección GeoJSON vacía.
   * @api
   */
  getEmptyGeoJSON() {
    const { srs } = this.connector_.getFeatureDao(this.getTableName());
    return {
      type: 'FeatureCollection',
      features: [],
      crs: {
        type: 'name',
        properties: {
          name: `${srs.organization}:${srs.srs_id}`,
        },
      },
    };
  }

  /**
   * Consulta las entidades que intersectan una extensión expresada en la proyección del mapa.
   *
   * @function
   * @public
   * @param {Array<Number>} extent Extensión [minX, minY, maxX, maxY].
   * @param {String} projection Proyección de la extensión.
   * @returns {Object} Colección GeoJSON con las entidades de la extensión.
   * @api
   */
  getGeoJSONByBoundingBox(extent, projection) {
    const featureDao = this.connector_.getFeatureDao(this.getTableName());
    const boundingBox = new BoundingBox(extent[0], extent[2], extent[1], extent[3]);
    const index = this.getRTreeIndex_();
    if (!index) {
      const rows = featureDao.fastQueryBoundingBox(boundingBox, projection);
      return this.createGeoJSON_(featureDao, rows, true);
    }
    const projected = boundingBox.projectBoundingBox(projection, featureDao.projection);
    const ids = index.search([
      projected.minLongitude, projected.minLatitude, projected.maxLongitude, projected.maxLatitude,
    ]);
    const rows = ids.map((id) => featureDao.queryForId(id)).filter((row) => !!row)
      .map((row) => featureDao.getRow(row));
    return this.createGeoJSON_(featureDao, rows, true);
  }
}

export default GeoPackageVector;
