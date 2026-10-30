import {
  Category,
  ErrorKey,
  GeometryGroup,
  GeometryType,
  HelpKey,
  InputRole,
  OperationId,
  OptionsKey,
  Output,
  ParamName,
  ParamType,
  ScaleOrigin,
  Step,
} from '../turftypes';
import { combineAll, eachFeature, inputRole } from './common';
import { fieldPolicyParam, sourceLayerParam, unitsParam } from './params';

/**
 * Operación que transforma cada elemento por separado y conserva sus campos.
 *
 * @param {Object} definition Definición.
 * @param {OperationId} definition.id Identificador.
 * @param {Array<GeometryType>} definition.types Tipos de geometría admitidos.
 * @param {Array<TurfParam>} definition.params Parámetros propios.
 * @param {function(Object, Object): Object} definition.compute Calcula la
 * geometría a partir de un Feature GeoJSON en EPSG:4326 y los parámetros.
 * @param {function(Object<InputRole, RoleMeta>, Object): (ErrorKey|null)}
 * [definition.validate] Validación de los parámetros.
 * @returns {LayerOperation} Operación.
 */
const eachFeatureOperation = ({
  id, types, params, compute, validate,
}) => Object.freeze({
  id,
  category: Category.TRANSFORMATION,
  output: Output.GEOMETRY,
  inputs: [inputRole(types)],
  params: [...params, sourceLayerParam()],
  attributeRoles: () => [InputRole.INPUT],
  validate,
  execute: ({ inputs, params: p }) => eachFeature(
    inputs[InputRole.INPUT],
    (feature) => compute(feature, p),
  ),
});

/**
 * Operación que crea una única geometría a partir de todos los elementos;
 * sus campos se combinan.
 *
 * @param {OperationId} id Identificador.
 * @param {Array<TurfParam>} params Parámetros propios.
 * @param {function(Object, Object): Object} compute Calcula la geometría a
 * partir de un FeatureCollection GeoJSON en EPSG:4326 y los parámetros.
 * @returns {LayerOperation} Operación.
 */
const combinedOperation = (id, params, compute) => Object.freeze({
  id,
  category: Category.TRANSFORMATION,
  output: Output.GEOMETRY,
  inputs: [inputRole(GeometryGroup.ANY)],
  params: [...params, fieldPolicyParam(), sourceLayerParam()],
  attributeRoles: () => [InputRole.INPUT],
  combines: () => true,
  execute: ({ inputs, params: p }) => combineAll(
    inputs[InputRole.INPUT],
    (collection) => compute(collection, p),
  ),
});

/**
 * Simplificación (Douglas-Peucker) de cada línea o polígono.
 * @const
 * @type {LayerOperation}
 */
export const simplify = eachFeatureOperation({
  id: OperationId.SIMPLIFY,
  types: [...GeometryGroup.LINES, ...GeometryGroup.POLYGONS],
  params: [
    {
      name: ParamName.TOLERANCE,
      type: ParamType.NUMBER,
      min: 0,
      step: Step.ANY,
      default: 0.001,
      help: HelpKey.TOLERANCE,
    },
    {
      name: ParamName.HIGH_QUALITY,
      type: ParamType.CHECKBOX,
      default: false,
    },
  ],
  compute: (feature, p) => turf.simplify(feature, {
    tolerance: p.tolerance, highQuality: p.highQuality,
  }),
});

/**
 * Envolvente convexa (o cóncava) de todos los elementos.
 * @const
 * @type {LayerOperation}
 */
export const convex = combinedOperation(OperationId.CONVEX, [
  {
    name: ParamName.CONCAVITY,
    type: ParamType.NUMBER,
    min: 1,
    step: Step.ANY,
    required: false,
    help: HelpKey.CONCAVITY,
  },
], (collection, p) => turf.convex(collection, { concavity: p.concavity }));

/**
 * Rectángulo que contiene todos los elementos.
 * @const
 * @type {LayerOperation}
 */
export const envelope = combinedOperation(
  OperationId.ENVELOPE,
  [],
  (collection) => turf.envelope(collection),
);

/**
 * Curva de Bézier de cada línea.
 * @const
 * @type {LayerOperation}
 */
export const bezierSpline = eachFeatureOperation({
  id: OperationId.BEZIER_SPLINE,
  types: [GeometryType.LINE_STRING],
  params: [
    {
      name: ParamName.RESOLUTION,
      type: ParamType.NUMBER,
      min: 1,
      step: 1,
      default: 10000,
    },
    {
      name: ParamName.SHARPNESS,
      type: ParamType.NUMBER,
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.85,
    },
  ],
  compute: (line, p) => turf.bezierSpline(line, {
    resolution: p.resolution, sharpness: p.sharpness,
  }),
});

/**
 * Indica si se ha indicado el punto de giro (longitud y latitud).
 *
 * @param {Object} p Parámetros.
 * @returns {Boolean}
 */
const hasPivot = (p) => p.pivotLon !== undefined && p.pivotLat !== undefined;

/**
 * Rotación de cada elemento sobre su centroide o sobre un punto de giro común.
 * @const
 * @type {LayerOperation}
 */
export const transformRotate = eachFeatureOperation({
  id: OperationId.TRANSFORM_ROTATE,
  types: GeometryGroup.ANY,
  params: [
    {
      name: ParamName.ANGLE,
      type: ParamType.NUMBER,
      min: -360,
      max: 360,
      step: Step.ANY,
      default: 45,
    },
    {
      name: ParamName.PIVOT_LON,
      type: ParamType.NUMBER,
      min: -180,
      max: 180,
      step: Step.ANY,
      required: false,
      help: HelpKey.PIVOT,
    },
    {
      name: ParamName.PIVOT_LAT,
      type: ParamType.NUMBER,
      min: -90,
      max: 90,
      step: Step.ANY,
      required: false,
    },
  ],
  validate: (meta, p) => ((p.pivotLon === undefined) !== (p.pivotLat === undefined)
    ? ErrorKey.PIVOT : null),
  compute: (feature, p) => turf.transformRotate(feature, p.angle, {
    pivot: hasPivot(p) ? [p.pivotLon, p.pivotLat] : undefined,
  }),
});

/**
 * Escalado de cada elemento respecto a un punto de origen.
 * @const
 * @type {LayerOperation}
 */
export const transformScale = eachFeatureOperation({
  id: OperationId.TRANSFORM_SCALE,
  types: GeometryGroup.ANY,
  params: [
    {
      name: ParamName.FACTOR,
      type: ParamType.NUMBER,
      min: 0,
      step: Step.ANY,
      default: 2,
    },
    {
      name: ParamName.ORIGIN,
      type: ParamType.SELECT,
      options: Object.values(ScaleOrigin),
      optionsKey: OptionsKey.ORIGINS,
      default: ScaleOrigin.CENTROID,
    },
  ],
  compute: (feature, p) => turf.transformScale(feature, p.factor, { origin: p.origin }),
});

/**
 * Desplazamiento de cada elemento una distancia en una dirección.
 * @const
 * @type {LayerOperation}
 */
export const transformTranslate = eachFeatureOperation({
  id: OperationId.TRANSFORM_TRANSLATE,
  types: GeometryGroup.ANY,
  params: [
    {
      name: ParamName.DISTANCE,
      type: ParamType.NUMBER,
      step: Step.ANY,
      default: 100,
    },
    unitsParam(),
    {
      name: ParamName.DIRECTION,
      type: ParamType.NUMBER,
      min: -360,
      max: 360,
      step: Step.ANY,
      default: 0,
      help: HelpKey.DIRECTION,
    },
  ],
  compute: (feature, p) => turf.transformTranslate(feature, p.distance, p.direction, {
    units: p.units,
  }),
});
