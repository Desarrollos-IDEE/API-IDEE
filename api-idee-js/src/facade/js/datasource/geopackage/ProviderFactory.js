/**
 * Creación de los proveedores de las tablas de un GeoPackage abierto.
 *
 * @module IDEE/datasource/geopackage/ProviderFactory
 */

/**
 * Crea un proveedor por tabla. Las clases de proveedor se inyectan.
 */
class GeoPackageProviderFactory {
  /**
   * @param {Object} providerClasses Clases de los proveedores.
   * @param {Function} providerClasses.VectorProvider Proveedor vectorial.
   * @param {Function} providerClasses.TileProvider Proveedor de teselas.
   */
  constructor({ VectorProvider, TileProvider }) {
    this.VectorProvider_ = VectorProvider;
    this.TileProvider_ = TileProvider;
  }

  /**
   * Crea los proveedores de las tablas vectoriales y de teselas.
   * @param {Object} pack Paquete abierto.
   * @param {Object} tables Tablas por tipo ({ features, tiles }).
   * @param {Object} options Opciones por tipo e indexadas por tabla ({ vector, tile }).
   * @returns {{vectorProviders: Array<Object>, tileProviders: Array<Object>}} Proveedores.
   */
  createProviders(pack, { features, tiles }, { vector = {}, tile = {} } = {}) {
    return {
      tileProviders: tiles.map((name) => new this.TileProvider_(pack, name, tile[name])),
      vectorProviders: features.map((name) => new this.VectorProvider_(pack, name, vector[name])),
    };
  }
}

export default GeoPackageProviderFactory;
