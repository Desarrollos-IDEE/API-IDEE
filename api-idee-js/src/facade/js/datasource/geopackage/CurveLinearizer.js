/**
 * Linealización de las tablas con geometrías curvas de un GeoPackage.
 *
 * @module IDEE/datasource/geopackage/CurveLinearizer
 */
import { GeometryLinearizer } from '../contracts';

/**
 * Tipos de geometría curva que la lectura habitual no convierte a GeoJSON.
 * @const
 * @type {Array<String>}
 */
const CURVED_TYPES = ['CIRCULARSTRING', 'COMPOUNDCURVE'];

/**
 * Detecta las tablas curvas y entrega a sus proveedores las geometrías lineales.
 * La conversión se inyecta (por defecto, GDAL) y solo se invoca si hay tablas curvas.
 */
class CurveLinearizer extends GeometryLinearizer {
  /**
   * @param {Object} dependencies Dependencias.
   * @param {function(Uint8Array, Array<Object>): Promise<Map>} dependencies.linearize
   * Conversión de las geometrías de las tablas indicadas.
   */
  constructor({ linearize }) {
    super();
    this.linearize_ = linearize;
  }

  /**
   * Devuelve la descripción de las tablas curvas.
   * @param {Object} pack Paquete abierto.
   * @param {Array<String>} features Tablas vectoriales.
   * @returns {Array<{name: String, idColumn: String, geometryColumn: String}>} Tablas curvas.
   */
  getCurvedTables(pack, features) {
    return features.filter((name) => {
      const type = pack.getFeatureDao(name).geometryColumns.geometry_type_name;
      return CURVED_TYPES.includes(type.toUpperCase());
    }).map((name) => {
      const dao = pack.getFeatureDao(name);
      return {
        name,
        idColumn: dao.table.getIdColumn().name,
        geometryColumn: dao.geometryColumns.column_name,
      };
    });
  }

  linearize(bytes, tables) {
    return this.linearize_(bytes, tables);
  }

  /**
   * Linealiza las tablas curvas del paquete y asigna el resultado a sus proveedores.
   * @param {Object} pack Paquete abierto.
   * @param {Uint8Array} bytes Contenido completo del paquete.
   * @param {Array<String>} features Tablas vectoriales.
   * @param {Array<Object>} vectorProviders Proveedores vectoriales.
   * @returns {Promise<void>} Finalización.
   */
  async apply(pack, bytes, features, vectorProviders) {
    const tables = this.getCurvedTables(pack, features);
    if (tables.length === 0) return;
    const geometries = await this.linearize(bytes, tables);
    vectorProviders.forEach((provider) => {
      if (geometries.has(provider.getTableName())) {
        provider.setLinearGeometries(geometries.get(provider.getTableName()));
      }
    });
  }
}

export default CurveLinearizer;
