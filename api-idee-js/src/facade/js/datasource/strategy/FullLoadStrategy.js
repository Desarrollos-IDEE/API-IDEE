/**
 * Carga completa de una tabla vectorial.
 *
 * @module IDEE/datasource/strategy/FullLoadStrategy
 */
import { LoadStrategy } from '../contracts';

/**
 * La capa recibe todas las entidades de la tabla al crearse y en cada recarga.
 */
class FullLoadStrategy extends LoadStrategy {
  prepare() {
    return undefined;
  }

  getInitialSource(provider) {
    return provider.getGeoJSON();
  }

  getLoaders() {
    return {};
  }

  refresh(provider) {
    return Promise.resolve(provider.getGeoJSON());
  }
}

export default FullLoadStrategy;
