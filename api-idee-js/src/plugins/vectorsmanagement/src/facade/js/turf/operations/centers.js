import {
  Category,
  GeometryGroup,
  InputRole,
  OperationId,
  Output,
} from '../turftypes';
import { eachFeature, inputRole } from './common';
import { sourceLayerParam } from './params';

/**
 * Operación que crea un punto por elemento, con los campos del elemento.
 *
 * @param {OperationId} id Identificador.
 * @param {function(Object): Object} compute Calcula el punto a partir de un
 * Feature GeoJSON en EPSG:4326.
 * @returns {LayerOperation} Operación.
 */
const centerOperation = (id, compute) => Object.freeze({
  id,
  category: Category.CENTER,
  output: Output.GEOMETRY,
  inputs: [inputRole(GeometryGroup.ANY)],
  params: [sourceLayerParam()],
  attributeRoles: () => [InputRole.INPUT],
  execute: ({ inputs }) => eachFeature(inputs[InputRole.INPUT], compute),
});

/**
 * Centro de la extensión de cada elemento.
 * @const
 * @type {LayerOperation}
 */
export const center = centerOperation(OperationId.CENTER, (feature) => turf.center(feature));

/**
 * Centroide (media de los vértices) de cada elemento.
 * @const
 * @type {LayerOperation}
 */
export const centroid = centerOperation(OperationId.CENTROID, (feature) => turf.centroid(feature));

/**
 * Centro de masas de cada elemento.
 * @const
 * @type {LayerOperation}
 */
export const centerOfMass = centerOperation(
  OperationId.CENTER_OF_MASS,
  (feature) => turf.centerOfMass(feature),
);

/**
 * Punto situado siempre sobre cada elemento.
 * @const
 * @type {LayerOperation}
 */
export const pointOnFeature = centerOperation(
  OperationId.POINT_ON_FEATURE,
  (feature) => turf.pointOnFeature(feature),
);
