import {
  Category,
  ErrorKey,
  GeometryGroup,
  HelpKey,
  InputRole,
  OperationId,
  Output,
  ParamName,
  ParamType,
  SkipReason,
  Step,
} from '../turftypes';
import { dissolvePolygons } from '../geometry/clipping';
import { eachFeature, guard, inputRole } from './common';
import { fieldPolicyParam, sourceLayerParam, unitsParam } from './params';

/**
 * Indica si se disuelven las áreas en una sola entidad.
 *
 * @param {Object} p Parámetros.
 * @returns {Boolean}
 */
const dissolves = (p) => p.dissolve === true;

/**
 * Área de influencia (buffer): un polígono por elemento, con sus campos, o
 * un único polígono disuelto con los campos combinados de todos.
 * @const
 * @type {LayerOperation}
 */
export default Object.freeze({
  id: OperationId.BUFFER,
  category: Category.PROXIMITY,
  output: Output.GEOMETRY,
  inputs: [inputRole(GeometryGroup.ANY)],
  params: [
    {
      name: ParamName.RADIUS,
      type: ParamType.NUMBER,
      step: Step.ANY,
      default: 100,
      help: HelpKey.RADIUS,
    },
    unitsParam({ linear: true }),
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
    fieldPolicyParam(dissolves),
    sourceLayerParam(),
  ],
  attributeRoles: () => [InputRole.INPUT],
  combines: dissolves,
  validate: (meta, p) => {
    if (p.radius === 0) return ErrorKey.RADIUS_ZERO;
    if (p.radius < 0 && meta[InputRole.INPUT].types
      .some((type) => !GeometryGroup.POLYGONS.includes(type))) {
      return ErrorKey.NEGATIVE_RADIUS;
    }
    return null;
  },
  execute: ({ inputs, params }) => {
    // Un radio negativo puede hacer desaparecer un polígono.
    const buffered = eachFeature(inputs[InputRole.INPUT], (feature) => turf.buffer(
      feature,
      params.radius,
      { units: params.units, steps: params.steps },
    ), SkipReason.COLLAPSED);
    if (!dissolves(params)) return buffered;
    const geometry = guard(null, () => dissolvePolygons(buffered.records.map((r) => r.geometry)));
    return {
      records: geometry === null ? [] : [{
        geometry,
        sources: { [InputRole.INPUT]: buffered.records.map((r) => r.sources[InputRole.INPUT][0]) },
      }],
      skipped: buffered.skipped,
    };
  },
});
