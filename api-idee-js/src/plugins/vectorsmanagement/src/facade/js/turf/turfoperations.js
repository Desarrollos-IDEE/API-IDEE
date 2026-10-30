import { Category } from './turftypes';
import buffer from './operations/buffer';
import {
  center, centerOfMass, centroid, pointOnFeature,
} from './operations/centers';
import { difference, intersect, union } from './operations/combine';
import extractByLocation from './operations/extractbylocation';
import { excludeFeatures, mergeFeatures } from './operations/features';
import {
  along, area, bbox, distance, length,
} from './operations/measurement';
import { layerDifference, layerIntersection, layerUnion } from './operations/overlay';
import {
  booleanContains, booleanIntersects, booleanPointInPolygon, booleanWithin,
} from './operations/relation';
import spatialJoin from './operations/spatialjoin';
import {
  bezierSpline, convex, envelope, simplify, transformRotate, transformScale, transformTranslate,
} from './operations/transformation';

/** @typedef {import('./turftypes').LayerOperation} LayerOperation */

/**
 * Categorías del panel, en el orden en que se muestran.
 * @const
 * @type {Array<Category>}
 */
export const CATEGORIES = Object.values(Category);

/**
 * Catálogo de operaciones de Turf, en el orden en que se muestran dentro de
 * cada categoría. Todas comparten el contrato LayerOperation (turftypes.js):
 * cada una se define en un módulo de ./operations, agrupado por categoría,
 * con sus papeles de entrada, sus parámetros y su cálculo. Para añadir una
 * basta con definirla allí, añadirla a esta lista y añadir sus traducciones
 * (turf.ops.<id>, incluidos los papeles de sus entradas).
 *
 * @const
 * @type {Array<LayerOperation>}
 */
export const OPERATIONS = Object.freeze([
  buffer,
  mergeFeatures,
  excludeFeatures,
  extractByLocation,
  layerIntersection,
  layerUnion,
  layerDifference,
  spatialJoin,
  union,
  intersect,
  difference,
  area,
  length,
  distance,
  bbox,
  along,
  center,
  centroid,
  centerOfMass,
  pointOnFeature,
  simplify,
  convex,
  envelope,
  bezierSpline,
  transformRotate,
  transformScale,
  transformTranslate,
  booleanPointInPolygon,
  booleanIntersects,
  booleanContains,
  booleanWithin,
]);

/**
 * Devuelve la operación del catálogo con el identificador indicado.
 *
 * @param {OperationId} id Identificador de la operación.
 * @returns {LayerOperation|undefined} Operación o undefined si no existe.
 */
export const getOperation = (id) => OPERATIONS.find((op) => op.id === id);
