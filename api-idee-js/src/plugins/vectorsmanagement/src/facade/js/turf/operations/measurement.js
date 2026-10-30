import {
  AreaUnit,
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
  Step,
  ValueType,
} from '../turftypes';
import {
  eachFeature, guard, inputRole, singleFeatureRole,
} from './common';
import { AREA_UNITS_PARAM, sourceLayerParam, unitsParam } from './params';

/**
 * FeatureCollection GeoJSON (EPSG:4326) con los elementos indicados.
 *
 * @param {Array<InputFeature>} features Elementos.
 * @returns {Object} FeatureCollection.
 */
const collectionOf = (features) => turf.featureCollection(features
  .map((feature) => turf.feature(feature.geometry)));

/**
 * Área total de los polígonos: suma la de cada elemento, de modo que las
 * superficies solapadas se cuentan varias veces.
 * @const
 * @type {LayerOperation}
 */
export const area = Object.freeze({
  id: OperationId.AREA,
  category: Category.MEASUREMENT,
  output: Output.VALUE,
  valueType: ValueType.AREA,
  display: Display.TOAST,
  inputs: [inputRole(GeometryGroup.POLYGONS)],
  params: [AREA_UNITS_PARAM],
  execute: ({ inputs, params }) => ({
    value: turf.convertArea(
      guard(null, () => turf.area(collectionOf(inputs[InputRole.INPUT]))),
      AreaUnit.METERS,
      params.areaUnits,
    ),
  }),
});

/**
 * Longitud total de las líneas.
 * @const
 * @type {LayerOperation}
 */
export const length = Object.freeze({
  id: OperationId.LENGTH,
  category: Category.MEASUREMENT,
  output: Output.VALUE,
  valueType: ValueType.LENGTH,
  display: Display.TOAST,
  inputs: [inputRole(GeometryGroup.LINES)],
  params: [unitsParam()],
  execute: ({ inputs, params }) => ({
    value: guard(null, () => turf.length(collectionOf(inputs[InputRole.INPUT]), {
      units: params.units,
    })),
  }),
});

/**
 * Distancia entre dos puntos, de la misma capa o de capas distintas.
 * @const
 * @type {LayerOperation}
 */
export const distance = Object.freeze({
  id: OperationId.DISTANCE,
  category: Category.MEASUREMENT,
  output: Output.VALUE,
  valueType: ValueType.LENGTH,
  display: Display.TOAST,
  inputs: [
    singleFeatureRole(InputRole.FIRST, [GeometryType.POINT], { defaultScope: InputScope.FEATURE }),
    singleFeatureRole(InputRole.SECOND, [GeometryType.POINT], { defaultScope: InputScope.FEATURE }),
  ],
  params: [unitsParam()],
  execute: ({ inputs, params }) => {
    const [from] = inputs[InputRole.FIRST];
    const [to] = inputs[InputRole.SECOND];
    return {
      value: guard(from, () => turf.distance(from.geometry, to.geometry, { units: params.units })),
    };
  },
});

/**
 * Extensión (bbox) de todos los elementos en EPSG:4326.
 * @const
 * @type {LayerOperation}
 */
export const bbox = Object.freeze({
  id: OperationId.BBOX,
  category: Category.MEASUREMENT,
  output: Output.VALUE,
  valueType: ValueType.BBOX,
  display: Display.DIALOG,
  inputs: [inputRole(GeometryGroup.ANY)],
  params: [],
  execute: ({ inputs }) => ({
    value: guard(null, () => turf.bbox(collectionOf(inputs[InputRole.INPUT]))),
  }),
});

/**
 * Punto a una distancia desde el inicio de cada línea, con los campos de la
 * línea.
 * @const
 * @type {LayerOperation}
 */
export const along = Object.freeze({
  id: OperationId.ALONG,
  category: Category.MEASUREMENT,
  output: Output.GEOMETRY,
  inputs: [inputRole([GeometryType.LINE_STRING])],
  params: [
    {
      name: ParamName.DISTANCE,
      type: ParamType.NUMBER,
      min: 0,
      step: Step.ANY,
      default: 100,
    },
    unitsParam(),
    sourceLayerParam(),
  ],
  attributeRoles: () => [InputRole.INPUT],
  execute: ({ inputs, params }) => eachFeature(
    inputs[InputRole.INPUT],
    (line) => turf.along(line, params.distance, { units: params.units }),
  ),
});
