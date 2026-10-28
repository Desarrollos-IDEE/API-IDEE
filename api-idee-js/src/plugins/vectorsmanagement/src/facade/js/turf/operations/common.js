import { ErrorKey, InputScope, OperationError } from '../turftypes';
import { bboxOverlap } from '../geometry/predicates';

/**
 * Ámbitos que admiten todas las entradas de las operaciones de capas.
 * @const
 * @type {Array<InputScope>}
 */
export const ALL_SCOPES = Object.freeze(Object.values(InputScope));

/**
 * Ejecuta un cálculo y convierte los errores internos de Turf en un error
 * controlado que identifica, si se indica, el elemento y su capa.
 *
 * @template T
 * @param {InputFeature|null} feature Elemento o null si el cálculo afecta a varios.
 * @param {function(): T} compute Cálculo.
 * @returns {T} Resultado del cálculo.
 * @throws {OperationError}
 */
export const guard = (feature, compute) => {
  try {
    return compute();
  } catch (e) {
    if (e instanceof OperationError) throw e;
    if (feature === null) throw new OperationError(ErrorKey.ERROR, { msg: e.message });
    throw new OperationError(ErrorKey.GEOMETRY, {
      layer: feature.layer.legend,
      feature: feature.featureId ?? feature.index,
      msg: e.message,
    });
  }
};

/**
 * Elementos de referencia que se tocan o se cortan con el elemento.
 *
 * @param {InputFeature} feature Elemento.
 * @param {Array<InputFeature>} others Elementos de referencia.
 * @returns {Array<InputFeature>} Elementos que se tocan con él, en su orden.
 */
export const touching = (feature, others) => others.filter((other) => bboxOverlap(
  feature.bbox,
  other.bbox,
) && guard(feature, () => turf.booleanIntersects(feature.geometry, other.geometry)));

/**
 * Geometrías de los elementos.
 *
 * @param {Array<InputFeature>} features Elementos.
 * @returns {Array<Object>} Geometrías GeoJSON en EPSG:4326.
 */
export const geometriesOf = (features) => features.map((feature) => feature.geometry);
