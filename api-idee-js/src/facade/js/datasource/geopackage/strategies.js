/**
 * Registro de las estrategias de carga de las tablas de un GeoPackage.
 *
 * @module IDEE/datasource/geopackage/strategies
 */
import FullLoadStrategy from '../strategy/FullLoadStrategy';
import BBoxLoadStrategy from '../strategy/BBoxLoadStrategy';
import DownloadAccess from './DownloadAccess';
import RangeAccess from './RangeAccess';

/**
 * Valores admitidos del parámetro loadStrategy.
 * @const
 * @type {Array<String>}
 */
export const LOAD_STRATEGY_NAMES = Object.freeze(['full', 'bbox', 'range']);

/**
 * Estrategias de carga por nombre. Para añadir una basta con registrarla.
 */
export class LoadStrategyRegistry {
  /**
   * @param {Object<String, LoadStrategy>} [strategies] Estrategias iniciales.
   */
  constructor(strategies = {}) {
    this.strategies_ = new Map(Object.entries(strategies));
  }

  /**
   * Registra una estrategia.
   * @param {String} name Nombre.
   * @param {LoadStrategy} strategy Estrategia.
   * @returns {LoadStrategyRegistry} El propio registro.
   */
  register(name, strategy) {
    this.strategies_.set(name, strategy);
    return this;
  }

  /**
   * Devuelve una estrategia registrada.
   * @param {String} name Nombre.
   * @returns {LoadStrategy} Estrategia.
   */
  get(name) {
    if (!this.strategies_.has(name)) {
      throw new Error(`GeoPackage: estrategia de carga desconocida (${name})`);
    }
    return this.strategies_.get(name);
  }
}

/**
 * Nombre de la estrategia de carga de una tabla. Un valor booleano de tiled en sus
 * opciones prevalece; si no, 'bbox' y 'range' cargan por extensión.
 * @param {Object} tableOptions Opciones de la capa de la tabla.
 * @param {String} [loadStrategy] Estrategia del paquete.
 * @returns {String} 'bbox' si la tabla carga por extensión; 'full' en otro caso.
 */
export const getTableStrategyName = (tableOptions, loadStrategy) => {
  if (tableOptions.tiled === true) return 'bbox';
  if (tableOptions.tiled === false) return 'full';
  return loadStrategy === 'bbox' || loadStrategy === 'range' ? 'bbox' : 'full';
};

/**
 * Nombre del acceso al paquete según la estrategia.
 * @param {String} loadStrategy Estrategia del paquete.
 * @returns {String} 'range' o 'download'.
 */
export const getAccessName = (loadStrategy) => (loadStrategy === 'range' ? 'range' : 'download');

/**
 * Crea el acceso predeterminado de un paquete.
 * @param {String} name Nombre devuelto por getAccessName.
 * @param {Object} [options] Opciones del acceso por rangos ({ blockSize }).
 * @returns {PackageAccess} Acceso.
 */
export const createDefaultAccess = (name, options = {}) => (
  name === 'range' ? new RangeAccess(options) : new DownloadAccess()
);

/**
 * Crea el registro con las estrategias predeterminadas.
 * @returns {LoadStrategyRegistry} Registro.
 */
export const createDefaultStrategies = () => new LoadStrategyRegistry({
  full: new FullLoadStrategy(),
  bbox: new BBoxLoadStrategy(),
});
