import {
  Category,
  GeometryDimension,
  GeometryGroup,
  HelpKey,
  InputRole,
  MatchPolicy,
  OperationId,
  OptionsKey,
  Output,
  ParamName,
  ParamType,
  SkipReason,
  SpatialPredicate,
} from '../turftypes';
import { overlapSize } from '../geometry/clipping';
import { PREDICATES, relate } from '../geometry/predicates';
import { ALL_SCOPES, guard } from './common';
import { sourceLayerParam } from './params';

/**
 * Relaciones que se pueden elegir.
 * @const
 * @type {Array<SpatialPredicate>}
 */
const PREDICATE_OPTIONS = Object.freeze([
  SpatialPredicate.INTERSECTS,
  SpatialPredicate.WITHIN,
  SpatialPredicate.CONTAINS,
]);

/**
 * Política para los elementos de destino con varias coincidencias.
 * @typedef {Object} MatchPolicyStrategy
 * @property {function(Object<InputRole, RoleMeta>): Boolean} supports Indica si
 * se puede aplicar con los tipos de las entradas.
 * @property {function(InputFeature, Array<InputFeature>): Array<InputFeature>} choose
 * Elige, entre las coincidencias (en el orden de su capa), las que aportan campos.
 */

/**
 * Políticas de coincidencias múltiples.
 * @const
 * @type {Object<MatchPolicy, MatchPolicyStrategy>}
 */
const MATCH_POLICIES = Object.freeze({
  [MatchPolicy.ONE_TO_MANY]: Object.freeze({
    supports: () => true,
    choose: (target, matches) => matches,
  }),
  // La coincidencia con más superficie (o longitud) común; si empatan, la
  // primera en el orden de las entradas de unión.
  [MatchPolicy.LARGEST_OVERLAP]: Object.freeze({
    supports: (meta) => meta[InputRole.TARGET].types
      .every((type) => GeometryDimension[type] > 0)
      && meta[InputRole.JOIN].types.every((type) => GeometryGroup.POLYGONS.includes(type)),
    choose: (target, matches) => {
      if (matches.length < 2) return matches;
      const sizes = matches
        .map((match) => guard(target, () => overlapSize(target.geometry, match.geometry)));
      return [matches[sizes.indexOf(Math.max(...sizes))]];
    },
  }),
});

/**
 * Unión espacial de atributos: conserva la geometría y los campos de cada
 * elemento de destino y le añade los campos de los elementos de unión con
 * los que cumple la relación, según la política de coincidencias.
 * @const
 * @type {LayerOperation}
 */
export default Object.freeze({
  id: OperationId.SPATIAL_JOIN,
  category: Category.JOIN,
  output: Output.GEOMETRY,
  inputs: [
    { role: InputRole.TARGET, types: GeometryGroup.ANY, scopes: ALL_SCOPES },
    { role: InputRole.JOIN, types: GeometryGroup.ANY, scopes: ALL_SCOPES },
  ],
  params: [
    {
      name: ParamName.PREDICATE,
      type: ParamType.SELECT,
      options: PREDICATE_OPTIONS,
      optionsKey: OptionsKey.PREDICATES,
      default: SpatialPredicate.INTERSECTS,
      help: HelpKey.PREDICATE_JOIN,
      availableOptions: (meta) => PREDICATE_OPTIONS.filter((id) => PREDICATES[id]
        .supports(meta[InputRole.TARGET].types, meta[InputRole.JOIN].types)),
    },
    {
      name: ParamName.MATCH_POLICY,
      type: ParamType.SELECT,
      options: Object.values(MatchPolicy),
      optionsKey: OptionsKey.MATCH_POLICIES,
      default: MatchPolicy.ONE_TO_MANY,
      help: HelpKey.MATCH_POLICY,
      availableOptions: (meta) => Object.keys(MATCH_POLICIES)
        .filter((id) => MATCH_POLICIES[id].supports(meta)),
    },
    {
      name: ParamName.KEEP_UNMATCHED,
      type: ParamType.CHECKBOX,
      default: true,
      help: HelpKey.KEEP_UNMATCHED,
    },
    sourceLayerParam(),
  ],
  attributeRoles: () => [InputRole.TARGET, InputRole.JOIN],
  execute: ({ inputs, params }) => {
    const predicate = PREDICATES[params.predicate];
    const policy = MATCH_POLICIES[params.matchPolicy];
    let unmatched = 0;
    const records = inputs[InputRole.TARGET].flatMap((target) => {
      const matches = inputs[InputRole.JOIN]
        .filter((join) => guard(target, () => relate(predicate, target, join)));
      const chosen = policy.choose(target, matches);
      if (chosen.length === 0 && !params.keepUnmatched) {
        unmatched += 1;
        return [];
      }
      const joins = chosen.length === 0 ? [[]] : chosen.map((join) => [join]);
      return joins.map((join) => ({
        keepGeometryOf: InputRole.TARGET,
        sources: { [InputRole.TARGET]: [target], [InputRole.JOIN]: join },
      }));
    });
    return {
      records,
      skipped: unmatched > 0 ? [{ reason: SkipReason.UNMATCHED, count: unmatched }] : [],
    };
  },
});
