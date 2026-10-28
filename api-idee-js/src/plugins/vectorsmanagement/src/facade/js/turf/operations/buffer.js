import {
  Aggregate,
  Category,
  ErrorKey,
  GeometryGroup,
  HelpKey,
  InputRole,
  LinearUnit,
  OperationId,
  OperationKind,
  OptionsKey,
  ParamName,
  ParamType,
  SkipReason,
  Step,
} from '../turftypes';
import { dissolvePolygons } from '../geometry/clipping';
import { ALL_SCOPES, guard } from './common';

/**
 * Columna con el número de elementos que forman el área disuelta.
 * @const
 * @type {String}
 */
export const COUNT_FIELD = 'num_entidades';

/**
 * Área de influencia de un elemento.
 *
 * @param {InputFeature} feature Elemento.
 * @param {Object} p Parámetros.
 * @returns {Object|null} Polígono o null si desaparece (radio negativo).
 */
const bufferOf = (feature, p) => guard(feature, () => {
  const result = turf.buffer(turf.feature(feature.geometry), p.radius, {
    units: p.units,
    steps: p.steps,
  });
  return result && result.geometry ? result.geometry : null;
});

/**
 * Área de influencia (buffer): un polígono por elemento, con sus campos, o
 * un único polígono disuelto que indica cuántos elementos lo forman.
 * @const
 * @type {LayerOperation}
 */
export default Object.freeze({
  id: OperationId.BUFFER,
  kind: OperationKind.LAYERS,
  category: Category.PROXIMITY,
  inputs: [
    {
      role: InputRole.INPUT, types: GeometryGroup.ANY, scopes: ALL_SCOPES, maxLayers: 1,
    },
  ],
  params: [
    {
      name: ParamName.RADIUS,
      type: ParamType.NUMBER,
      step: Step.ANY,
      default: 100,
      help: HelpKey.RADIUS,
    },
    {
      name: ParamName.UNITS,
      type: ParamType.SELECT,
      options: Object.values(LinearUnit),
      optionsKey: OptionsKey.UNITS,
      default: LinearUnit.METERS,
    },
    {
      name: ParamName.STEPS,
      type: ParamType.NUMBER,
      min: 1,
      step: 1,
      default: 8,
    },
    {
      name: ParamName.DISSOLVE,
      type: ParamType.CHECKBOX,
      default: false,
      help: HelpKey.DISSOLVE,
    },
  ],
  attributeRoles: (p) => (p.dissolve ? [] : [InputRole.INPUT]),
  aggregates: (p) => (p.dissolve
    ? [{ role: InputRole.INPUT, aggregate: Aggregate.COUNT, name: COUNT_FIELD }] : []),
  validate: (meta, p) => {
    if (p.radius === 0) return ErrorKey.RADIUS_ZERO;
    if (p.radius < 0 && meta[InputRole.INPUT].types
      .some((type) => !GeometryGroup.POLYGONS.includes(type))) {
      return ErrorKey.NEGATIVE_RADIUS;
    }
    return null;
  },
  execute: ({ inputs, params }) => {
    const buffered = inputs[InputRole.INPUT]
      .map((feature) => ({ feature, geometry: bufferOf(feature, params) }));
    const produced = buffered.filter(({ geometry }) => geometry !== null);
    const collapsed = buffered.length - produced.length;
    const skipped = collapsed > 0 ? [{ reason: SkipReason.COLLAPSED, count: collapsed }] : [];
    if (!params.dissolve) {
      return {
        records: produced.map(({ feature, geometry }) => ({
          geometry, sources: { [InputRole.INPUT]: [feature] },
        })),
        skipped,
      };
    }
    const geometry = guard(null, () => dissolvePolygons(produced.map((b) => b.geometry)));
    return {
      records: geometry === null ? [] : [{
        geometry, sources: { [InputRole.INPUT]: produced.map((b) => b.feature) },
      }],
      skipped,
    };
  },
});
