import {
  ErrorKey, GeometryDimension, InputRole, InputScope, OperationError, SkipReason,
} from '../turftypes';
import { bboxOverlap } from '../geometry/predicates';

/**
 * Ámbitos que admiten las entradas: todos los elementos de la capa, los de
 * su selección guardada, uno de esa selección o el resultado de una
 * operación anterior.
 * @const
 * @type {Array<InputScope>}
 */
export const ALL_SCOPES = Object.freeze(Object.values(InputScope));

/**
 * Indica si Turf.js está cargado.
 *
 * @returns {Boolean}
 */
export const isTurfAvailable = () => typeof turf !== 'undefined';

/**
 * Papel de entrada habitual: elementos de una o varias capas.
 *
 * @param {Array<GeometryType>} types Tipos de geometría admitidos.
 * @param {Object} [options] Resto de propiedades del papel (InputRoleSpec).
 * @returns {InputRoleSpec} Papel.
 */
export const inputRole = (types, options = {}) => Object.freeze({
  role: InputRole.INPUT, types, scopes: ALL_SCOPES, ...options,
});

/**
 * Papel que contiene exactamente un elemento, de cualquier capa.
 *
 * @param {InputRole} role Papel.
 * @param {Array<GeometryType>} types Tipos de geometría admitidos.
 * @param {Object} [options] Resto de propiedades del papel (InputRoleSpec).
 * @returns {InputRoleSpec} Papel.
 */
export const singleFeatureRole = (role, types, options = {}) => Object.freeze({
  role, types, scopes: ALL_SCOPES, maxLayers: 1, minFeatures: 1, maxFeatures: 1, ...options,
});

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

/**
 * Geometría de un resultado de Turf (Feature o geometría) o null si está vacío.
 *
 * @param {Object|null|undefined} result Resultado.
 * @returns {Object|null} Geometría GeoJSON.
 */
export const geometryOf = (result) => {
  const geometry = result && result.geometry !== undefined ? result.geometry : result;
  return geometry && geometry.coordinates && geometry.coordinates.length > 0 ? geometry : null;
};

/**
 * Un resultado por elemento de entrada, con su procedencia. Los elementos
 * cuyo cálculo no produce geometría se cuentan como omitidos.
 *
 * @param {Array<InputFeature>} features Elementos del papel de entrada.
 * @param {function(Object): (Object|null)} compute Calcula, a partir de la
 * geometría del elemento (Feature GeoJSON en EPSG:4326), su geometría resultante.
 * @param {SkipReason} [reason=SkipReason.NO_RESULT] Motivo de los omitidos.
 * @returns {OperationOutput} Resultados.
 */
export const eachFeature = (features, compute, reason = SkipReason.NO_RESULT) => {
  const computed = features.map((feature) => ({
    feature,
    geometry: geometryOf(guard(feature, () => compute(turf.feature(feature.geometry)))),
  }));
  const records = computed.filter(({ geometry }) => geometry !== null)
    .map(({ feature, geometry }) => ({ geometry, sources: { [feature.role]: [feature] } }));
  const omitted = features.length - records.length;
  return { records, skipped: omitted > 0 ? [{ reason, count: omitted }] : [] };
};

/**
 * Un único resultado calculado a partir de todos los elementos de un papel.
 *
 * @param {Array<InputFeature>} features Elementos del papel.
 * @param {function(Object): (Object|null)} compute Calcula la geometría a partir
 * de un FeatureCollection GeoJSON en EPSG:4326 con todos los elementos.
 * @returns {OperationOutput} Un resultado o ninguno si el cálculo no produce geometría.
 */
export const combineAll = (features, compute) => {
  const collection = turf.featureCollection(features.map((f) => turf.feature(f.geometry)));
  const geometry = geometryOf(guard(null, () => compute(collection)));
  return {
    records: geometry === null ? [] : [{ geometry, sources: { [features[0].role]: features } }],
  };
};

/**
 * Indica si los tipos de un papel mezclan puntos, líneas y polígonos.
 *
 * @param {Array<GeometryType>} types Tipos de geometría.
 * @returns {Boolean}
 */
export const mixesDimensions = (types) => new Set(types
  .map((type) => GeometryDimension[type])).size > 1;
