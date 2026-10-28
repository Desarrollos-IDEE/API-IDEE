import {
  Category,
  GeometryGroup,
  HelpKey,
  InputRole,
  OperationId,
  OperationKind,
  OptionsKey,
  ParamName,
  ParamType,
  SpatialPredicate,
} from '../turftypes';
import { PREDICATES, relate } from '../geometry/predicates';
import { ALL_SCOPES, guard } from './common';

/**
 * Relaciones que se pueden elegir.
 * @const
 * @type {Array<SpatialPredicate>}
 */
const PREDICATE_OPTIONS = Object.freeze([
  SpatialPredicate.INTERSECTS,
  SpatialPredicate.DISJOINT,
  SpatialPredicate.WITHIN,
  SpatialPredicate.CONTAINS,
]);

/**
 * Extraer por localización: copia, sin modificar su geometría, los elementos
 * de entrada que cumplen la relación con alguno de los elementos de
 * condición (con todos, si la relación es «disjunto»).
 * @const
 * @type {LayerOperation}
 */
export default Object.freeze({
  id: OperationId.EXTRACT_BY_LOCATION,
  kind: OperationKind.LAYERS,
  category: Category.EXTRACTION,
  inputs: [
    {
      role: InputRole.INPUT, types: GeometryGroup.ANY, scopes: ALL_SCOPES, maxLayers: 1,
    },
    {
      role: InputRole.CONDITION,
      types: GeometryGroup.ANY,
      scopes: ALL_SCOPES,
      maxLayers: Number.POSITIVE_INFINITY,
    },
  ],
  params: [
    {
      name: ParamName.PREDICATE,
      type: ParamType.SELECT,
      options: PREDICATE_OPTIONS,
      optionsKey: OptionsKey.PREDICATES,
      default: SpatialPredicate.INTERSECTS,
      help: HelpKey.PREDICATE_EXTRACT,
      availableOptions: (meta) => PREDICATE_OPTIONS.filter((id) => PREDICATES[id]
        .supports(meta[InputRole.INPUT].types, meta[InputRole.CONDITION].types)),
    },
  ],
  attributeRoles: () => [InputRole.INPUT],
  execute: ({ inputs, params }) => {
    const predicate = PREDICATES[params.predicate];
    const conditions = inputs[InputRole.CONDITION];
    const matches = (feature) => {
      const test = (condition) => guard(feature, () => relate(predicate, feature, condition));
      return predicate.all ? conditions.every(test) : conditions.some(test);
    };
    return {
      records: inputs[InputRole.INPUT].filter(matches).map((feature) => ({
        keepGeometryOf: InputRole.INPUT, sources: { [InputRole.INPUT]: [feature] },
      })),
    };
  },
});
