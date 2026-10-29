import {
  Category,
  GeometryGroup,
  GeometryType,
  HelpKey,
  InputRole,
  InputScope,
  OperationId,
  Output,
  ParamName,
  ParamType,
} from '../turftypes';
import { dissolvePolygons, subtractGeometry } from '../geometry/clipping';
import {
  ALL_SCOPES, combineAll, geometriesOf, guard, inputRole,
} from './common';
import { fieldPolicyParam, sourceLayerParam } from './params';

/**
 * Polígonos simples (coordenadas) de un Polygon o MultiPolygon.
 *
 * @param {Object} geometry Polygon o MultiPolygon.
 * @returns {Array<Array>} Coordenadas de cada polígono.
 */
const polygonParts = (geometry) => (geometry.type === GeometryType.POLYGON
  ? [geometry.coordinates] : geometry.coordinates);

/**
 * Divide la unión en sus partes separadas y asigna a cada una los elementos
 * que la forman: los que tienen alguna de sus partes dentro de ella. Cada
 * parte de un elemento se localiza por un punto de su interior.
 *
 * @param {Object} union MultiPolygon resultante de la unión.
 * @param {Array<InputFeature>} features Elementos unidos.
 * @returns {Array<ProvenanceRecord>} Un resultado por parte.
 */
const separateParts = (union, features) => {
  const parts = polygonParts(union).map((coordinates) => turf.polygon(coordinates));
  const owners = parts.map(() => new Set());
  features.forEach((feature) => polygonParts(feature.geometry).forEach((coordinates) => {
    const inside = guard(feature, () => turf.pointOnFeature(turf.polygon(coordinates)));
    const index = parts.findIndex((part) => turf.booleanPointInPolygon(inside, part));
    if (index >= 0) owners[index].add(feature);
  }));
  return parts.map((part, i) => ({
    geometry: part.geometry,
    sources: { [InputRole.INPUT]: features.filter((feature) => owners[i].has(feature)) },
  }));
};

/**
 * Propiedades comunes de las operaciones que combinan polígonos: cada
 * resultado reúne varios elementos de entrada, cuyos campos se combinan.
 * @const
 * @type {Object}
 */
const COMBINED_ATTRIBUTES = Object.freeze({
  category: Category.COMBINE,
  output: Output.GEOMETRY,
  attributeRoles: () => [InputRole.INPUT],
  combines: () => true,
});

/**
 * Fusionar polígonos: une (disuelve) en una geometría los polígonos de una o
 * varias capas. Las partes desconectadas forman un MultiPolygon o, si se
 * pide, una entidad cada una.
 * @const
 * @type {LayerOperation}
 */
export const union = Object.freeze({
  ...COMBINED_ATTRIBUTES,
  id: OperationId.UNION,
  inputs: [inputRole(GeometryGroup.POLYGONS)],
  params: [
    {
      name: ParamName.SEPARATE_PARTS,
      type: ParamType.CHECKBOX,
      default: false,
      help: HelpKey.SEPARATE_PARTS,
    },
    fieldPolicyParam(),
    sourceLayerParam(),
  ],
  execute: ({ inputs, params }) => {
    const features = inputs[InputRole.INPUT];
    const geometry = guard(null, () => dissolvePolygons(geometriesOf(features)));
    if (geometry === null) return { records: [] };
    if (params.separateParts && geometry.type === GeometryType.MULTI_POLYGON) {
      return { records: separateParts(geometry, features) };
    }
    return { records: [{ geometry, sources: { [InputRole.INPUT]: features } }] };
  },
});

/**
 * Parte común de los polígonos: la zona que comparten todos ellos.
 * @const
 * @type {LayerOperation}
 */
export const intersect = Object.freeze({
  ...COMBINED_ATTRIBUTES,
  id: OperationId.INTERSECT,
  inputs: [inputRole(GeometryGroup.POLYGONS, { minFeatures: 2 })],
  params: [fieldPolicyParam(), sourceLayerParam()],
  execute: ({ inputs }) => combineAll(
    inputs[InputRole.INPUT],
    (collection) => turf.intersect(collection),
  ),
});

/**
 * Restar polígonos: la unión de los polígonos de partida menos la de los que
 * se restan. Los elementos que también son de partida no se restan, de modo
 * que «la primera entidad seleccionada menos el resto de la selección» se
 * expresa con la misma selección en las dos entradas.
 * @const
 * @type {LayerOperation}
 */
export const difference = Object.freeze({
  ...COMBINED_ATTRIBUTES,
  id: OperationId.DIFFERENCE,
  inputs: [
    inputRole(GeometryGroup.POLYGONS, { defaultScope: InputScope.FEATURE }),
    {
      role: InputRole.OVERLAY,
      types: GeometryGroup.POLYGONS,
      scopes: ALL_SCOPES,
      defaultScope: InputScope.SELECTION,
    },
  ],
  params: [fieldPolicyParam(), sourceLayerParam()],
  execute: ({ inputs }) => {
    const base = inputs[InputRole.INPUT];
    const baseIds = new Set(base.map((feature) => feature.uid));
    const subtracted = inputs[InputRole.OVERLAY].filter((feature) => !baseIds.has(feature.uid));
    const geometry = guard(null, () => {
      const dissolved = dissolvePolygons(geometriesOf(base));
      return dissolved && subtractGeometry(dissolved, geometriesOf(subtracted));
    });
    return {
      records: geometry === null ? [] : [{ geometry, sources: { [InputRole.INPUT]: base } }],
    };
  },
});
