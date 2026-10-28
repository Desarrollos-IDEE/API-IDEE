import {
  Category,
  GeometryGroup,
  InputRole,
  OperationId,
  OperationKind,
} from '../turftypes';
import { intersectGeometry, subtractGeometry } from '../geometry/clipping';
import {
  ALL_SCOPES, geometriesOf, guard, touching,
} from './common';

/**
 * Entrada de superposición: polígonos de una capa.
 * @const
 * @type {InputRoleSpec}
 */
const POLYGON_OVERLAY = Object.freeze({
  role: InputRole.OVERLAY, types: GeometryGroup.POLYGONS, scopes: ALL_SCOPES, maxLayers: 1,
});

/**
 * Partes comunes de un elemento con cada elemento de superposición que lo
 * corta, con la procedencia de ambos.
 *
 * @param {InputFeature} feature Elemento de entrada.
 * @param {Array<InputFeature>} overlays Elementos de superposición que lo tocan.
 * @returns {Array<ProvenanceRecord>} Resultados.
 */
const commonParts = (feature, overlays) => overlays
  .map((overlay) => ({
    overlay,
    geometry: guard(feature, () => intersectGeometry(feature.geometry, overlay.geometry)),
  }))
  .filter(({ geometry }) => geometry !== null)
  .map(({ overlay, geometry }) => ({
    geometry,
    sources: { [InputRole.INPUT]: [feature], [InputRole.OVERLAY]: [overlay] },
  }));

/**
 * Parte de un elemento que queda fuera de los elementos que lo tocan.
 *
 * @param {InputFeature} feature Elemento.
 * @param {Array<InputFeature>} others Elementos que se restan.
 * @returns {Object|null} Geometría GeoJSON o null si no queda nada.
 */
const outsidePart = (feature, others) => guard(
  feature,
  () => subtractGeometry(feature.geometry, geometriesOf(touching(feature, others))),
);

/**
 * Intersección: la parte común de cada pareja de elementos de entrada y de
 * superposición, con la dimensión de la entrada y los campos de ambos.
 * @const
 * @type {LayerOperation}
 */
export const layerIntersection = Object.freeze({
  id: OperationId.LAYER_INTERSECTION,
  kind: OperationKind.LAYERS,
  category: Category.OVERLAY,
  inputs: [
    {
      role: InputRole.INPUT, types: GeometryGroup.ANY, scopes: ALL_SCOPES, maxLayers: 1,
    },
    POLYGON_OVERLAY,
  ],
  params: [],
  attributeRoles: () => [InputRole.INPUT, InputRole.OVERLAY],
  execute: ({ inputs }) => ({
    records: inputs[InputRole.INPUT].flatMap((feature) => commonParts(
      feature,
      touching(feature, inputs[InputRole.OVERLAY]),
    )),
  }),
});

/**
 * Unión de capas (como la de QGIS): las partes comunes de cada pareja, con
 * los campos de ambos elementos, y las partes de cada elemento que no se
 * solapan con la otra capa, con los campos de la otra capa vacíos. Los
 * solapes entre elementos de una misma capa no se dividen.
 * @const
 * @type {LayerOperation}
 */
export const layerUnion = Object.freeze({
  id: OperationId.LAYER_UNION,
  kind: OperationKind.LAYERS,
  category: Category.OVERLAY,
  inputs: [
    {
      role: InputRole.INPUT, types: GeometryGroup.POLYGONS, scopes: ALL_SCOPES, maxLayers: 1,
    },
    POLYGON_OVERLAY,
  ],
  params: [],
  attributeRoles: () => [InputRole.INPUT, InputRole.OVERLAY],
  execute: ({ inputs }) => {
    const features = inputs[InputRole.INPUT];
    const overlays = inputs[InputRole.OVERLAY];
    const fromInput = features.flatMap((feature) => {
      const rest = outsidePart(feature, overlays);
      const restRecord = rest === null ? [] : [{
        geometry: rest, sources: { [InputRole.INPUT]: [feature], [InputRole.OVERLAY]: [] },
      }];
      return [...commonParts(feature, touching(feature, overlays)), ...restRecord];
    });
    const fromOverlay = overlays
      .map((overlay) => ({ overlay, geometry: outsidePart(overlay, features) }))
      .filter(({ geometry }) => geometry !== null)
      .map(({ overlay, geometry }) => ({
        geometry, sources: { [InputRole.INPUT]: [], [InputRole.OVERLAY]: [overlay] },
      }));
    return { records: [...fromInput, ...fromOverlay] };
  },
});

/**
 * Diferencia: la parte de cada elemento de entrada que queda fuera de todos
 * los polígonos de superposición, con los campos de la entrada.
 * @const
 * @type {LayerOperation}
 */
export const layerDifference = Object.freeze({
  id: OperationId.LAYER_DIFFERENCE,
  kind: OperationKind.LAYERS,
  category: Category.OVERLAY,
  inputs: [
    {
      role: InputRole.INPUT, types: GeometryGroup.ANY, scopes: ALL_SCOPES, maxLayers: 1,
    },
    { ...POLYGON_OVERLAY, maxLayers: Number.POSITIVE_INFINITY },
  ],
  params: [],
  attributeRoles: () => [InputRole.INPUT],
  execute: ({ inputs }) => ({
    records: inputs[InputRole.INPUT]
      .map((feature) => ({ feature, geometry: outsidePart(feature, inputs[InputRole.OVERLAY]) }))
      .filter(({ geometry }) => geometry !== null)
      .map(({ feature, geometry }) => ({ geometry, sources: { [InputRole.INPUT]: [feature] } })),
  }),
});
