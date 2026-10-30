import {
  Category,
  Display,
  GeometryGroup,
  GeometryType,
  InputRole,
  InputScope,
  OperationId,
  Output,
  ParamName,
  ParamType,
  SpatialPredicate,
  ValueType,
} from '../turftypes';
import { PREDICATES, validateContainsTypes } from '../geometry/predicates';
import { guard, singleFeatureRole } from './common';

/**
 * Operación que comprueba una relación entre dos entidades, de la misma capa
 * o de capas distintas. Por defecto compara la primera y la segunda entidad
 * seleccionadas de la capa activa.
 *
 * @param {Object} definition Definición.
 * @param {OperationId} definition.id Identificador.
 * @param {Array<GeometryType>} definition.first Tipos admitidos de la primera entidad.
 * @param {Array<GeometryType>} definition.second Tipos admitidos de la segunda entidad.
 * @param {Array<TurfParam>} [definition.params] Parámetros.
 * @param {function(Object<InputRole, RoleMeta>, Object): (ErrorKey|null)}
 * [definition.validate] Validación de los tipos.
 * @param {function(Object, Object, Object): Boolean} definition.test Comprueba la
 * relación entre dos geometrías GeoJSON en EPSG:4326.
 * @returns {LayerOperation} Operación.
 */
const relationOperation = ({
  id, first, second, params = [], validate, test,
}) => Object.freeze({
  id,
  category: Category.RELATION,
  output: Output.VALUE,
  valueType: ValueType.BOOLEAN,
  display: Display.TOAST,
  inputs: [
    singleFeatureRole(InputRole.FIRST, first, { defaultScope: InputScope.FEATURE }),
    singleFeatureRole(InputRole.SECOND, second, { defaultScope: InputScope.FEATURE }),
  ],
  params,
  validate,
  execute: ({ inputs, params: p }) => {
    const [a] = inputs[InputRole.FIRST];
    const [b] = inputs[InputRole.SECOND];
    return { value: guard(a, () => test(a.geometry, b.geometry, p)) };
  },
});

/**
 * Punto en polígono.
 * @const
 * @type {LayerOperation}
 */
export const booleanPointInPolygon = relationOperation({
  id: OperationId.BOOLEAN_POINT_IN_POLYGON,
  first: [GeometryType.POINT],
  second: GeometryGroup.POLYGONS,
  params: [{ name: ParamName.IGNORE_BOUNDARY, type: ParamType.CHECKBOX, default: false }],
  test: (point, polygon, p) => turf.booleanPointInPolygon(point, polygon, {
    ignoreBoundary: p.ignoreBoundary,
  }),
});

/**
 * Las dos entidades se tocan o se cruzan.
 * @const
 * @type {LayerOperation}
 */
export const booleanIntersects = relationOperation({
  id: OperationId.BOOLEAN_INTERSECTS,
  first: GeometryGroup.ANY,
  second: GeometryGroup.ANY,
  params: [{ name: ParamName.IGNORE_SELF_INTERSECTIONS, type: ParamType.CHECKBOX, default: true }],
  test: (a, b, p) => turf.booleanIntersects(a, b, {
    ignoreSelfIntersections: p.ignoreSelfIntersections,
  }),
});

/**
 * La primera entidad contiene a la segunda.
 * @const
 * @type {LayerOperation}
 */
export const booleanContains = relationOperation({
  id: OperationId.BOOLEAN_CONTAINS,
  first: GeometryGroup.ANY,
  second: GeometryGroup.ANY,
  validate: (meta) => validateContainsTypes(
    meta[InputRole.FIRST].types,
    meta[InputRole.SECOND].types,
  ),
  test: PREDICATES[SpatialPredicate.CONTAINS].test,
});

/**
 * La primera entidad está dentro de la segunda.
 * @const
 * @type {LayerOperation}
 */
export const booleanWithin = relationOperation({
  id: OperationId.BOOLEAN_WITHIN,
  first: GeometryGroup.ANY,
  second: GeometryGroup.ANY,
  validate: (meta) => validateContainsTypes(
    meta[InputRole.SECOND].types,
    meta[InputRole.FIRST].types,
  ),
  test: PREDICATES[SpatialPredicate.WITHIN].test,
});
