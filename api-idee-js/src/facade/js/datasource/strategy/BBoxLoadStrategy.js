/**
 * Carga de una tabla vectorial por la extensión visible.
 *
 * @module IDEE/datasource/strategy/BBoxLoadStrategy
 */
import { LoadStrategy } from '../contracts';

/**
 * La capa empieza vacía y pide al proveedor las entidades de cada extensión visible.
 * Las implementaciones sin carga por extensión usan la carga completa (fullLoader).
 */
class BBoxLoadStrategy extends LoadStrategy {
  prepare(provider) {
    return provider.prepareForBoundingBox();
  }

  getInitialSource(provider) {
    return provider.getEmptyGeoJSON();
  }

  getLoaders(getProvider) {
    return {
      bboxLoader: (extent, projection) => getProvider().getGeoJSONByBoundingBox(extent, projection),
      fullLoader: () => getProvider().getGeoJSON(),
    };
  }

  async refresh(provider, extent, projection) {
    if (!extent) {
      return provider.getGeoJSON();
    }
    await provider.prepareForBoundingBox();
    return provider.getGeoJSONByBoundingBox(extent, projection);
  }
}

export default BBoxLoadStrategy;
