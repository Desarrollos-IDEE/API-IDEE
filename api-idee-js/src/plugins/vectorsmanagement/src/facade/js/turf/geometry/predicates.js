import {
  ErrorKey, GeometryDimension, GeometryType, SpatialPredicate,
} from '../turftypes';

/**
 * Combinaciones contenedor / contenido que admite turf.booleanContains.
 * @const
 * @type {Object<GeometryType, Array<GeometryType>>}
 */
const CONTAINS_SUPPORTED = Object.freeze({
  [GeometryType.POINT]: [GeometryType.POINT],
  [GeometryType.MULTI_POINT]: [
    GeometryType.POINT,
    GeometryType.MULTI_POINT,
  ],
  [GeometryType.LINE_STRING]: [
    GeometryType.POINT,
    GeometryType.LINE_STRING,
    GeometryType.MULTI_POINT,
  ],
  [GeometryType.POLYGON]: [
    GeometryType.POINT,
    GeometryType.LINE_STRING,
    GeometryType.POLYGON,
    GeometryType.MULTI_POINT,
    GeometryType.MULTI_POLYGON,
  ],
  [GeometryType.MULTI_POLYGON]: [
    GeometryType.POINT,
    GeometryType.MULTI_POINT,
    GeometryType.LINE_STRING,
    GeometryType.MULTI_LINE_STRING,
    GeometryType.POLYGON,
    GeometryType.MULTI_POLYGON,
  ],
});

/**
 * Tipo simple de las partes de cada tipo múltiple.
 * @const
 * @type {Object<GeometryType, GeometryType>}
 */
const PART_TYPE = Object.freeze({
  [GeometryType.MULTI_POINT]: GeometryType.POINT,
  [GeometryType.MULTI_LINE_STRING]: GeometryType.LINE_STRING,
  [GeometryType.MULTI_POLYGON]: GeometryType.POLYGON,
});

/**
 * Devuelve la geometría de un Feature o la propia geometría.
 *
 * @param {Object} geojson Feature o geometría GeoJSON.
 * @returns {Object} Geometría GeoJSON.
 */
const geometryOf = (geojson) => (geojson.geometry ? geojson.geometry : geojson);

/**
 * Indica si el contenido no puede estar contenido en el contenedor por tener
 * mayor dimensión (evita errores internos de Turf).
 *
 * @param {GeometryType} containerType Tipo del contenedor.
 * @param {GeometryType} containedType Tipo del contenido.
 * @returns {Boolean}
 */
const isTrivialNotContainedType = (containerType, containedType) => (
  GeometryDimension[containedType] > GeometryDimension[containerType]
);

/**
 * Indica si Turf comprueba directamente la combinación de tipos.
 *
 * @param {GeometryType} containerType Tipo del contenedor.
 * @param {GeometryType} containedType Tipo del contenido.
 * @returns {Boolean}
 */
const isDirectlySupported = (containerType, containedType) => (
  CONTAINS_SUPPORTED[containerType] || []).includes(containedType);

/**
 * Indica si se puede comprobar que el contenedor contiene al contenido. Si
 * Turf no admite el tipo múltiple del contenido, basta con que admita el de
 * sus partes, que se comprueban una a una.
 *
 * @param {GeometryType} containerType Tipo del contenedor.
 * @param {GeometryType} containedType Tipo del contenido.
 * @returns {Boolean}
 */
export const supportsContains = (containerType, containedType) => (
  isTrivialNotContainedType(containerType, containedType)
  || isDirectlySupported(containerType, containedType)
  || isDirectlySupported(containerType, PART_TYPE[containedType]));

/**
 * Comprueba si el contenedor contiene al contenido. Devuelve false sin
 * consultar a Turf cuando el contenido tiene mayor dimensión.
 *
 * @param {Object} container Feature o geometría GeoJSON contenedor.
 * @param {Object} contained Feature o geometría GeoJSON contenido.
 * @returns {Boolean}
 */
export const contains = (container, contained) => (
  isTrivialNotContainedType(geometryOf(container).type, geometryOf(contained).type)
    ? false : turf.booleanContains(container, contained));

/**
 * Comprueba si el contenedor contiene al contenido aunque Turf no admita el
 * tipo múltiple del contenido: en ese caso, el contenedor debe contener
 * cada una de sus partes.
 *
 * @param {Object} container Geometría GeoJSON contenedor.
 * @param {Object} contained Geometría GeoJSON contenido.
 * @returns {Boolean}
 */
const containsParts = (container, contained) => (
  isDirectlySupported(container.type, contained.type)
  || isTrivialNotContainedType(container.type, contained.type)
    ? contains(container, contained)
    : turf.flatten(contained).features.every((part) => contains(container, part)));

/**
 * Valida que Turf admite la combinación de geometrías de contains / within.
 *
 * @param {Object} container Feature GeoJSON contenedor.
 * @param {Object} contained Feature GeoJSON contenido.
 * @returns {ErrorKey|null} Clave del error o null si es válida.
 */
export const validateContains = (container, contained) => (
  isTrivialNotContainedType(container.geometry.type, contained.geometry.type)
  || isDirectlySupported(container.geometry.type, contained.geometry.type)
    ? null : ErrorKey.UNSUPPORTED_GEOMETRIES);

/**
 * Indica si tiene sentido comprobar contains con los tipos de las entradas:
 * Turf debe admitir todas las combinaciones y al menos una no puede ser
 * falsa por dimensión (un punto nunca contiene un polígono).
 *
 * @param {Array<GeometryType>} containerTypes Tipos de los contenedores.
 * @param {Array<GeometryType>} containedTypes Tipos de los contenidos.
 * @returns {Boolean}
 */
const supportsContainsTypes = (containerTypes, containedTypes) => {
  const pairs = containerTypes.flatMap((a) => containedTypes.map((b) => [a, b]));
  return pairs.every(([a, b]) => supportsContains(a, b))
    && pairs.some(([a, b]) => !isTrivialNotContainedType(a, b));
};

/**
 * Relación espacial entre un elemento (a) y otro de referencia (b).
 * @typedef {Object} PredicateStrategy
 * @property {function(Object, Object): Boolean} test Comprueba la relación
 * entre dos geometrías GeoJSON en EPSG:4326.
 * @property {function(Array<GeometryType>, Array<GeometryType>): Boolean} supports
 * Indica si la relación se puede comprobar con los tipos de las entradas.
 * @property {Boolean} whenApart Resultado cuando las extensiones no se tocan.
 * @property {Boolean} all Indica si el elemento debe cumplir la relación con
 * todos los de referencia (en vez de con alguno).
 */

/**
 * Relaciones espaciales disponibles.
 * @const
 * @type {Object<SpatialPredicate, PredicateStrategy>}
 */
export const PREDICATES = Object.freeze({
  [SpatialPredicate.INTERSECTS]: Object.freeze({
    test: (a, b) => turf.booleanIntersects(a, b),
    supports: () => true,
    whenApart: false,
    all: false,
  }),
  [SpatialPredicate.DISJOINT]: Object.freeze({
    test: (a, b) => !turf.booleanIntersects(a, b),
    supports: () => true,
    whenApart: true,
    all: true,
  }),
  [SpatialPredicate.WITHIN]: Object.freeze({
    test: (a, b) => containsParts(b, a),
    supports: (typesA, typesB) => supportsContainsTypes(typesB, typesA),
    whenApart: false,
    all: false,
  }),
  [SpatialPredicate.CONTAINS]: Object.freeze({
    test: (a, b) => containsParts(a, b),
    supports: supportsContainsTypes,
    whenApart: false,
    all: false,
  }),
});

/**
 * Indica si dos extensiones [minX, minY, maxX, maxY] se tocan.
 *
 * @param {Array<Number>} a Extensión.
 * @param {Array<Number>} b Extensión.
 * @returns {Boolean}
 */
export const bboxOverlap = (a, b) => a[0] <= b[2] && b[0] <= a[2] && a[1] <= b[3] && b[1] <= a[3];

/**
 * Comprueba la relación entre dos elementos de entrada, descartando antes por
 * su extensión los que no se tocan.
 *
 * @param {PredicateStrategy} predicate Relación.
 * @param {InputFeature} a Elemento.
 * @param {InputFeature} b Elemento de referencia.
 * @returns {Boolean}
 */
export const relate = (predicate, a, b) => (bboxOverlap(a.bbox, b.bbox)
  ? predicate.test(a.geometry, b.geometry) : predicate.whenApart);
