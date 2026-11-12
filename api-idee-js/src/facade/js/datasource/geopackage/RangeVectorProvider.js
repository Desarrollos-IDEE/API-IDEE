/**
 * Proveedor de una tabla vectorial de un GeoPackage leído por rangos.
 *
 * @module IDEE/datasource/geopackage/RangeVectorProvider
 */
import { GeometryData } from '@ngageoint/geopackage';
import AbstractProvider from '../../provider/AbstractProvider';
import SqliteReader from '../sqlite/SqliteReader';
import Exception from '../../exception/exception';
import { getValue } from '../../i18n/language';

/**
 * Calcula la extensión de una geometría GeoJSON.
 * @param {Object} geometry Geometría.
 * @returns {Array<Number>|null} [minX, minY, maxX, maxY].
 */
const geometryExtent = (geometry) => {
  const extent = [Infinity, Infinity, -Infinity, -Infinity];
  const visit = (coordinates) => {
    if (typeof coordinates[0] === 'number') {
      extent[0] = Math.min(extent[0], coordinates[0]);
      extent[1] = Math.min(extent[1], coordinates[1]);
      extent[2] = Math.max(extent[2], coordinates[0]);
      extent[3] = Math.max(extent[3], coordinates[1]);
    } else {
      coordinates.forEach(visit);
    }
  };
  if (geometry?.type === 'GeometryCollection') {
    geometry.geometries.forEach((item) => visit(item.coordinates));
  } else if (geometry?.coordinates) {
    visit(geometry.coordinates);
  }
  return extent[0] <= extent[2] ? extent : null;
};

/**
 * Lee las entidades de una tabla pidiendo solo las páginas necesarias: el índice R*Tree
 * y las filas que intersecan la extensión.
 */
class RangeVectorProvider extends AbstractProvider {
  /**
   * @param {Object} pack Paquete por rangos (RangeGeoPackage).
   * @param {String} tableName Nombre de la tabla.
   * @param {Object} options Opciones del proveedor.
   * @param {Object} context Contexto de lectura.
   * @param {SqliteReader} context.reader Lector SQLite.
   * @param {Object} context.table Tabla descrita por SqliteReader.getTable.
   * @param {String} context.geometryColumn Columna de geometría.
   * @param {Object} context.srs Fila de gpkg_spatial_ref_sys de la tabla.
   * @param {RTreeIndex|null} context.index Índice espacial; null recorre la tabla.
   * @param {function(Array<Number>, String, String): Array<Number>} context.transformExtent
   * Transforma una extensión entre dos códigos de proyección.
   */
  constructor(pack, tableName, options, {
    reader, table, geometryColumn, srs, index, transformExtent,
  }) {
    super(pack, tableName, options);
    this.reader_ = reader;
    this.table_ = table;
    this.geometryColumn_ = geometryColumn;
    this.srs_ = srs;
    this.index_ = index;
    this.transformExtent_ = transformExtent;
  }

  /**
   * Código de la proyección de la tabla.
   * @returns {String} Código (p. ej. EPSG:4326).
   */
  getProjectionCode() {
    return `${this.srs_.organization}:${this.srs_.organization_coordsys_id ?? this.srs_.srs_id}`;
  }

  /**
   * Indica si la tabla tiene índice espacial.
   * @returns {Boolean} Verdadero si se consulta el R*Tree.
   */
  hasSpatialIndex() {
    return this.index_ !== null;
  }

  prepareForBoundingBox() {
    return Promise.resolve(true);
  }

  /**
   * Indica que las entidades se leen bajo demanda: obtener todas implica leer la tabla
   * completa por rangos.
   * @returns {Boolean} Verdadero.
   */
  loadsOnDemand() {
    return true;
  }

  /**
   * Convierte una fila en una entidad GeoJSON.
   * @private
   * @param {Number} rowid Rowid.
   * @param {Array<*>} values Valores.
   * @param {Boolean} includeId Incluye el identificador.
   * @returns {Object} Entidad GeoJSON.
   */
  toFeature_(rowid, values, includeId) {
    const properties = SqliteReader.toObject(this.table_, rowid, values);
    const blob = properties[this.geometryColumn_];
    delete properties[this.geometryColumn_];
    let geometry = null;
    if (blob instanceof Uint8Array) {
      const data = new GeometryData(blob);
      if (data.geometry) {
        geometry = data.toGeoJSON();
      } else {
        Exception(`${getValue('exception').geopackage_geometry} (${this.getTableName()}, ${rowid}): ${data.geometryError || ''}`);
      }
    }
    return {
      type: 'Feature',
      ...(includeId ? { id: String(rowid) } : {}),
      geometry,
      properties,
    };
  }

  /**
   * Crea una colección GeoJSON con el CRS de la tabla.
   * @private
   * @param {Array<Object>} features Entidades.
   * @returns {Object} Colección.
   */
  createGeoJSON_(features) {
    return {
      type: 'FeatureCollection',
      features,
      crs: {
        type: 'name',
        properties: { name: `${this.srs_.organization}:${this.srs_.srs_id}` },
      },
    };
  }

  getEmptyGeoJSON() {
    return this.createGeoJSON_([]);
  }

  /**
   * Lee todas las entidades de la tabla (todas sus páginas, no el fichero completo).
   * @returns {Promise<Object>} Colección GeoJSON.
   */
  async getGeoJSON() {
    const rows = await this.reader_.scanTable(this.table_.rootPage);
    return this.createGeoJSON_(rows.map(({ rowid, values }) => this.toFeature_(rowid, values)));
  }

  /**
   * Lee las entidades que intersecan una extensión expresada en otra proyección.
   * @param {Array<Number>} extent Extensión [minX, minY, maxX, maxY].
   * @param {String} projection Proyección de la extensión.
   * @returns {Promise<Object>} Colección GeoJSON con identificadores.
   */
  async getGeoJSONByBoundingBox(extent, projection) {
    const code = this.getProjectionCode();
    const tableExtent = projection && projection !== code
      ? this.transformExtent_(extent, projection, code) : extent;
    if (this.index_) {
      const ids = await this.index_.search(tableExtent);
      const rows = await this.reader_.getRows(this.table_.rootPage, ids);
      return this.createGeoJSON_(ids.filter((id) => rows.has(id))
        .map((id) => this.toFeature_(id, rows.get(id), true)));
    }
    const [minX, minY, maxX, maxY] = tableExtent;
    const rows = await this.reader_.scanTable(this.table_.rootPage);
    return this.createGeoJSON_(rows.map(({ rowid, values }) => this.toFeature_(rowid, values, true))
      .filter(({ geometry }) => {
        const bounds = geometryExtent(geometry);
        return bounds && bounds[0] <= maxX && bounds[2] >= minX
          && bounds[1] <= maxY && bounds[3] >= minY;
      }));
  }
}

export default RangeVectorProvider;
