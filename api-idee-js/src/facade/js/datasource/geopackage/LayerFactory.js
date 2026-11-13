/**
 * Creación de las capas hijas de un GeoPackage.
 *
 * @module IDEE/datasource/geopackage/LayerFactory
 */
import { copyOptions } from './parameters';

/**
 * Crea las capas hijas a partir de los proveedores de cada tabla. Las clases de capa se
 * inyectan para no depender de las implementaciones de OpenLayers o Cesium.
 */
class GeoPackageLayerFactory {
  /**
   * @param {Object} layerClasses Clases de las capas hijas.
   * @param {Function} layerClasses.VectorLayer Capa vectorial (IDEE.layer.GeoJSON).
   * @param {Function} layerClasses.TileLayer Capa de teselas (IDEE.layer.GeoPackageTile).
   */
  constructor({ VectorLayer, TileLayer }) {
    this.VectorLayer_ = VectorLayer;
    this.TileLayer_ = TileLayer;
  }

  /**
   * Crea la capa de una tabla vectorial.
   * @param {Object} options Opciones de la capa.
   * @param {Object} source Colección GeoJSON inicial.
   * @param {Function} refreshLoader Recarga de la tabla.
   * @param {Object} [loaders] Cargadores de la estrategia ({ bboxLoader, fullLoader }).
   * @returns {Object} Capa vectorial.
   */
  createVectorLayer(options, source, refreshLoader, loaders = {}) {
    return new this.VectorLayer_({
      ...options,
      source,
      refreshLoader,
      ...loaders,
    }, copyOptions(options));
  }

  /**
   * Crea la capa de una tabla de teselas.
   * @param {Object} options Opciones de la capa.
   * @param {Object} provider Proveedor de teselas.
   * @param {Function} refreshLoader Recarga de la tabla.
   * @returns {Object} Capa de teselas.
   */
  createTileLayer(options, provider, refreshLoader) {
    return new this.TileLayer_({ ...options, refreshLoader }, provider);
  }
}

export default GeoPackageLayerFactory;
