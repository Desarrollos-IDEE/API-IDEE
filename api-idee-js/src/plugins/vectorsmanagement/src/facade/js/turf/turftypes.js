/**
 * Parámetro del formulario de una operación.
 * @typedef {Object} TurfParam
 * @property {ParamName} name Nombre del parámetro.
 * @property {ParamType} type Tipo de campo.
 * @property {*} [default] Valor por defecto.
 * @property {Number} [min] Valor mínimo (campos numéricos).
 * @property {Number} [max] Valor máximo (campos numéricos).
 * @property {Number|Step} [step=Step.ANY] Incremento (campos numéricos).
 * @property {Boolean} [required=true] false para un número opcional (vacío es undefined).
 * @property {Array<String>} [options] Valores del desplegable.
 * @property {OptionsKey} [optionsKey=OptionsKey.UNITS] Traducciones de las opciones.
 * @property {function(Object<InputRole, RoleMeta>): Array<String>} [availableOptions]
 * Opciones válidas para los tipos de geometría de las entradas.
 * @property {function(Object): Boolean} [when] Indica, según los valores de los
 * demás parámetros, si el parámetro se aplica; si no, no se muestra ni se valida.
 * @property {HelpKey} [help] Texto de ayuda.
 */

/**
 * Papel de una entrada de una operación.
 * @typedef {Object} InputRoleSpec
 * @property {InputRole} role Papel.
 * @property {Array<GeometryType>} types Tipos de geometría admitidos.
 * @property {Array<InputScope>} scopes Ámbitos que se pueden elegir.
 * @property {Number} [maxLayers=Infinity] Número máximo de capas.
 * @property {Number} [minFeatures=1] Número mínimo de elementos del papel.
 * @property {Number} [maxFeatures] Número máximo de elementos del papel.
 * @property {InputScope} [defaultScope] Cómo usa el papel, al abrir el
 * formulario, la capa activa: todos sus elementos (ALL), su selección
 * guardada (SELECTION) o la siguiente entidad de esa selección (FEATURE).
 * Si no se indica, el primer papel usa la selección si la herramienta de
 * selección está activa (o todos los elementos si no) y el resto, otra capa.
 */

/**
 * Resumen de una entrada calculado sin convertir sus elementos.
 * @typedef {Object} RoleMeta
 * @property {Array<GeometryType>} types Tipos de geometría admitidos presentes.
 * @property {Number} count Número de elementos.
 */

/**
 * Agregado de una columna de salida que resume los elementos de origen.
 * @typedef {Object} AggregateSpec
 * @property {InputRole} role Papel cuyos elementos se resumen.
 * @property {Aggregate} aggregate Agregado.
 * @property {String} name Nombre de la columna.
 */

/**
 * Operación del catálogo de Turf. Cada entrada tiene un papel y una o varias
 * capas, cada una con su ámbito; la operación calcula geometrías con su
 * procedencia (Output.GEOMETRY) o un valor (Output.VALUE).
 * @typedef {Object} LayerOperation
 * @property {OperationId} id Identificador.
 * @property {Category} category Categoría del panel.
 * @property {Output} output Tipo de resultado.
 * @property {Array<InputRoleSpec>} inputs Papeles de las entradas, en el orden
 * en que se resuelven los conflictos de nombres de campo.
 * @property {Array<TurfParam>} params Parámetros.
 * @property {function(Object<InputRole, RoleMeta>, Object): (ErrorKey|null)} [validate]
 * Validación propia de la operación.
 * @property {function(Object<InputRole, RoleMeta>, Object): Array<NoticeKey>} [notices]
 * Avisos que no impiden ejecutar.
 * @property {function(Object): (OperationOutput|ValueOutput)} execute Calcula el
 * resultado a partir de `{ inputs: Object<InputRole, Array<InputFeature>>, params }`.
 *
 * Solo las de Output.GEOMETRY:
 * @property {function(Object): Array<InputRole>} [attributeRoles] Papeles cuyos
 * campos se pueden copiar a la salida según los parámetros.
 * @property {function(Object): Boolean} [combines] Indica si cada resultado
 * puede reunir varios elementos de un papel (disolver, unir...). Entonces se
 * añade el número de elementos, los campos no se copian salvo que se elijan y
 * sus valores se combinan según el parámetro FIELD_POLICY.
 *
 * Solo las de Output.VALUE:
 * @property {ValueType} [valueType] Tipo del valor, que decide cómo se muestra.
 * @property {Display} [display] Forma de mostrar el valor.
 */

/**
 * Elemento de entrada normalizado. No se modifica.
 * @typedef {Object} InputFeature
 * @property {String} key Clave única dentro de la ejecución.
 * @property {String} uid Identidad del elemento en su capa (capa y posición):
 * es la misma aunque el elemento aparezca en varios papeles.
 * @property {InputRole} role Papel.
 * @property {{id: String, name: String, legend: String}} layer Capa de procedencia.
 * @property {String} featureId Identificador del elemento en su capa.
 * @property {Number} index Posición del elemento en su capa.
 * @property {InputScope} scope Ámbito por el que se ha incluido.
 * @property {Object} geometry Geometría GeoJSON en EPSG:4326.
 * @property {Object} properties Copia de los atributos.
 * @property {Array<Number>} bbox Extensión de la geometría en EPSG:4326.
 * @property {function(): Object} getSourceGeometry Copia de la geometría GeoJSON
 * en la proyección del mapa.
 */

/**
 * Resultado de una operación con su procedencia. Indica la geometría
 * calculada (EPSG:4326) o el papel cuya geometría original se conserva.
 * @typedef {Object} ProvenanceRecord
 * @property {Object} [geometry] Geometría GeoJSON calculada en EPSG:4326.
 * @property {InputRole} [keepGeometryOf] Papel cuya geometría se conserva.
 * @property {Object<InputRole, Array<InputFeature>>} sources Elementos que
 * originan el resultado, por papel.
 */

/**
 * Salida de una operación de tipo Output.GEOMETRY.
 * @typedef {Object} OperationOutput
 * @property {Array<ProvenanceRecord>} records Resultados.
 * @property {Array<{reason: SkipReason, count: Number}>} [skipped] Elementos sin resultado.
 */

/**
 * Salida de una operación de tipo Output.VALUE.
 * @typedef {Object} ValueOutput
 * @property {*} value Valor, ya en las unidades elegidas.
 * @property {Array<{reason: SkipReason, count: Number}>} [skipped] Elementos sin resultado.
 */

/**
 * Tipos de geometría GeoJSON.
 * @readonly
 * @enum {String}
 */
export const GeometryType = Object.freeze({
  POINT: 'Point',
  MULTI_POINT: 'MultiPoint',
  LINE_STRING: 'LineString',
  MULTI_LINE_STRING: 'MultiLineString',
  POLYGON: 'Polygon',
  MULTI_POLYGON: 'MultiPolygon',
});

/**
 * Grupos de tipos de geometría.
 * @readonly
 * @enum {Array<GeometryType>}
 */
export const GeometryGroup = Object.freeze({
  POINTS: Object.freeze([GeometryType.POINT, GeometryType.MULTI_POINT]),
  LINES: Object.freeze([GeometryType.LINE_STRING, GeometryType.MULTI_LINE_STRING]),
  POLYGONS: Object.freeze([GeometryType.POLYGON, GeometryType.MULTI_POLYGON]),
  ANY: Object.freeze(Object.values(GeometryType)),
});

/**
 * Dimensión de cada tipo de geometría: 0 punto, 1 línea, 2 polígono.
 * @readonly
 * @enum {Number}
 */
export const GeometryDimension = Object.freeze({
  [GeometryType.POINT]: 0,
  [GeometryType.MULTI_POINT]: 0,
  [GeometryType.LINE_STRING]: 1,
  [GeometryType.MULTI_LINE_STRING]: 1,
  [GeometryType.POLYGON]: 2,
  [GeometryType.MULTI_POLYGON]: 2,
});

/**
 * Tipos de objeto GeoJSON.
 * @readonly
 * @enum {String}
 */
export const GeoJSONType = Object.freeze({
  FEATURE: 'Feature',
  FEATURE_COLLECTION: 'FeatureCollection',
});

/**
 * Categorías del panel, en el orden en que se muestran.
 * @readonly
 * @enum {String}
 */
export const Category = Object.freeze({
  PROXIMITY: 'proximity',
  EXTRACTION: 'extraction',
  OVERLAY: 'overlay',
  JOIN: 'join',
  COMBINE: 'combine',
  MEASUREMENT: 'measurement',
  CENTER: 'center',
  TRANSFORMATION: 'transformation',
  RELATION: 'relation',
});

/**
 * Identificadores de las operaciones.
 * @readonly
 * @enum {String}
 */
export const OperationId = Object.freeze({
  AREA: 'area',
  LENGTH: 'length',
  DISTANCE: 'distance',
  BBOX: 'bbox',
  ALONG: 'along',
  CENTER: 'center',
  CENTROID: 'centroid',
  CENTER_OF_MASS: 'centerOfMass',
  POINT_ON_FEATURE: 'pointOnFeature',
  BUFFER: 'buffer',
  SIMPLIFY: 'simplify',
  CONVEX: 'convex',
  ENVELOPE: 'envelope',
  BEZIER_SPLINE: 'bezierSpline',
  TRANSFORM_ROTATE: 'transformRotate',
  TRANSFORM_SCALE: 'transformScale',
  TRANSFORM_TRANSLATE: 'transformTranslate',
  UNION: 'union',
  INTERSECT: 'intersect',
  DIFFERENCE: 'difference',
  BOOLEAN_POINT_IN_POLYGON: 'booleanPointInPolygon',
  BOOLEAN_INTERSECTS: 'booleanIntersects',
  BOOLEAN_CONTAINS: 'booleanContains',
  BOOLEAN_WITHIN: 'booleanWithin',
  MERGE_FEATURES: 'mergeFeatures',
  EXCLUDE_FEATURES: 'excludeFeatures',
  EXTRACT_BY_LOCATION: 'extractByLocation',
  LAYER_INTERSECTION: 'layerIntersection',
  LAYER_UNION: 'layerUnion',
  LAYER_DIFFERENCE: 'layerDifference',
  SPATIAL_JOIN: 'spatialJoin',
});

/**
 * Papel de una entrada de una operación.
 * @readonly
 * @enum {String}
 */
export const InputRole = Object.freeze({
  INPUT: 'input',
  OVERLAY: 'overlay',
  CONDITION: 'condition',
  TARGET: 'target',
  JOIN: 'join',
  EXCLUDE: 'exclude',
  FIRST: 'first',
  SECOND: 'second',
});

/**
 * Ámbito de los elementos de una entrada.
 * @readonly
 * @enum {String}
 */
export const InputScope = Object.freeze({
  ALL: 'all',
  SELECTION: 'selection',
  FEATURE: 'feature',
  RESULT: 'result',
});

/**
 * Relaciones espaciales entre un elemento de entrada y otro de referencia.
 * @readonly
 * @enum {String}
 */
export const SpatialPredicate = Object.freeze({
  INTERSECTS: 'intersects',
  DISJOINT: 'disjoint',
  WITHIN: 'within',
  CONTAINS: 'contains',
});

/**
 * Política para los elementos con varias coincidencias espaciales.
 * @readonly
 * @enum {String}
 */
export const MatchPolicy = Object.freeze({
  ONE_TO_MANY: 'oneToMany',
  LARGEST_OVERLAP: 'largestOverlap',
});

/**
 * Agregados de las columnas que resumen los elementos de origen.
 * @readonly
 * @enum {String}
 */
export const Aggregate = Object.freeze({
  COUNT: 'count',
  LAYERS: 'layers',
});

/**
 * Forma de combinar los valores de un campo cuando varios elementos forman
 * un único resultado.
 * @readonly
 * @enum {String}
 */
export const FieldPolicy = Object.freeze({
  DISTINCT: 'distinct',
  COMMON: 'common',
});

/**
 * Motivos por los que una capa no se puede usar en una entrada.
 * @readonly
 * @enum {String}
 */
export const LayerIssue = Object.freeze({
  TILED: 'tiled',
  NO_FEATURES: 'noFeatures',
  TYPES: 'types',
});

/**
 * Motivos por los que un campo no se puede copiar a la salida.
 * @readonly
 * @enum {String}
 */
export const FieldIssue = Object.freeze({
  TECHNICAL: 'technical',
  COMPLEX: 'complex',
});

/**
 * Motivos por los que un elemento de entrada no genera resultado.
 * @readonly
 * @enum {String}
 */
export const SkipReason = Object.freeze({
  NO_GEOMETRY: 'noGeometry',
  UNSUPPORTED_TYPE: 'unsupportedType',
  COLLAPSED: 'collapsed',
  UNMATCHED: 'unmatched',
  NO_RESULT: 'noResult',
});

/**
 * Avisos de una configuración que no impiden ejecutarla.
 * @readonly
 * @enum {String}
 */
export const NoticeKey = Object.freeze({
  MIXED_DIMENSIONS: 'mixedDimensions',
});

/**
 * Tipo de resultado de una operación.
 * @readonly
 * @enum {String}
 */
export const Output = Object.freeze({
  GEOMETRY: 'geometry',
  VALUE: 'value',
});

/**
 * Tipo de un resultado de tipo valor: decide cómo se muestra.
 * @readonly
 * @enum {String}
 */
export const ValueType = Object.freeze({
  AREA: 'area',
  LENGTH: 'length',
  BBOX: 'bbox',
  BOOLEAN: 'boolean',
});

/**
 * Forma de mostrar un resultado de tipo valor.
 * @readonly
 * @enum {String}
 */
export const Display = Object.freeze({
  TOAST: 'toast',
  DIALOG: 'dialog',
});

/**
 * Tipo de campo del formulario de parámetros.
 * @readonly
 * @enum {String}
 */
export const ParamType = Object.freeze({
  NUMBER: 'number',
  SELECT: 'select',
  CHECKBOX: 'checkbox',
});

/**
 * Valores especiales del atributo step de los campos numéricos.
 * @readonly
 * @enum {String}
 */
export const Step = Object.freeze({
  ANY: 'any',
});

/**
 * Nombres de los parámetros del formulario. Son también las propiedades del
 * objeto de valores que reciben las operaciones.
 * @readonly
 * @enum {String}
 */
export const ParamName = Object.freeze({
  UNITS: 'units',
  AREA_UNITS: 'areaUnits',
  DISTANCE: 'distance',
  RADIUS: 'radius',
  STEPS: 'steps',
  TOLERANCE: 'tolerance',
  HIGH_QUALITY: 'highQuality',
  CONCAVITY: 'concavity',
  RESOLUTION: 'resolution',
  SHARPNESS: 'sharpness',
  ANGLE: 'angle',
  PIVOT_LON: 'pivotLon',
  PIVOT_LAT: 'pivotLat',
  FACTOR: 'factor',
  ORIGIN: 'origin',
  DIRECTION: 'direction',
  IGNORE_BOUNDARY: 'ignoreBoundary',
  IGNORE_SELF_INTERSECTIONS: 'ignoreSelfIntersections',
  DISSOLVE: 'dissolve',
  SEPARATE_PARTS: 'separateParts',
  PREDICATE: 'predicate',
  MATCH_POLICY: 'matchPolicy',
  KEEP_UNMATCHED: 'keepUnmatched',
  FIELD_POLICY: 'fieldPolicy',
  SOURCE_LAYER: 'sourceLayer',
});

/**
 * Bloque de traducciones de las opciones de un desplegable.
 * @readonly
 * @enum {String}
 */
export const OptionsKey = Object.freeze({
  UNITS: 'units',
  AREA_UNITS: 'areaUnits',
  ORIGINS: 'origins',
  PREDICATES: 'predicates',
  MATCH_POLICIES: 'matchPolicies',
  FIELD_POLICIES: 'fieldPolicies',
});

/**
 * Textos de ayuda de los parámetros.
 * @readonly
 * @enum {String}
 */
export const HelpKey = Object.freeze({
  TOLERANCE: 'tolerance',
  DIRECTION: 'direction',
  RADIUS: 'radius',
  CONCAVITY: 'concavity',
  PIVOT: 'pivot',
  DISSOLVE: 'dissolve',
  SEPARATE_PARTS: 'separateParts',
  PREDICATE_EXTRACT: 'predicateExtract',
  PREDICATE_JOIN: 'predicateJoin',
  MATCH_POLICY: 'matchPolicy',
  KEEP_UNMATCHED: 'keepUnmatched',
  FIELD_POLICY: 'fieldPolicy',
  SOURCE_LAYER: 'sourceLayer',
});

/**
 * Unidades de longitud de Turf.
 * @readonly
 * @enum {String}
 */
export const LengthUnit = Object.freeze({
  METERS: 'meters',
  MILLIMETERS: 'millimeters',
  CENTIMETERS: 'centimeters',
  KILOMETERS: 'kilometers',
  MILES: 'miles',
  NAUTICAL_MILES: 'nauticalmiles',
  INCHES: 'inches',
  YARDS: 'yards',
  FEET: 'feet',
  RADIANS: 'radians',
  DEGREES: 'degrees',
});

// Unidades de longitud lineales.
// eslint-disable-next-line no-unused-vars
const { RADIANS, DEGREES, ...LINEAR_UNITS } = LengthUnit;

/**
 * Unidades de longitud de Turf sin las angulares (radianes y grados).
 * @readonly
 * @enum {String}
 */
export const LinearUnit = Object.freeze(LINEAR_UNITS);

/**
 * Unidades de área de Turf.
 * @readonly
 * @enum {String}
 */
export const AreaUnit = Object.freeze({
  ...LINEAR_UNITS,
  ACRES: 'acres',
  HECTARES: 'hectares',
});

/**
 * Puntos de origen de turf.transformScale.
 * @readonly
 * @enum {String}
 */
export const ScaleOrigin = Object.freeze({
  CENTROID: 'centroid',
  CENTER: 'center',
  SW: 'sw',
  SE: 'se',
  NW: 'nw',
  NE: 'ne',
});

/**
 * Claves de los mensajes de error.
 * @readonly
 * @enum {String}
 */
export const ErrorKey = Object.freeze({
  NOT_LOADED: 'notLoaded',
  MIN: 'min',
  MAX: 'max',
  EXACT: 'exact',
  UNSUPPORTED_GEOMETRIES: 'unsupportedGeometries',
  PIVOT: 'pivot',
  ERROR: 'error',
  NO_LAYER: 'noLayer',
  MAX_LAYERS: 'maxLayers',
  DUPLICATED_LAYER: 'duplicatedLayer',
  LAYER_NOT_FOUND: 'layerNotFound',
  LAYER_INCOMPATIBLE: 'layerIncompatible',
  NOT_RESULT: 'notResult',
  NO_SELECTION: 'noSelection',
  STALE_SELECTION: 'staleSelection',
  FEATURE_NOT_SELECTED: 'featureNotSelected',
  NO_FEATURES: 'noFeatures',
  PARAM: 'param',
  OPTION_UNAVAILABLE: 'optionUnavailable',
  UNKNOWN_FIELD: 'unknownField',
  RADIUS_ZERO: 'radiusZero',
  NEGATIVE_RADIUS: 'negativeRadius',
  GEOMETRY: 'geometry',
});

/**
 * Claves de los textos de resultado.
 * @readonly
 * @enum {String}
 */
export const ResultKey = Object.freeze({
  YES: 'yes',
  NO: 'no',
  MIN_X: 'minX',
  MIN_Y: 'minY',
  MAX_X: 'maxX',
  MAX_Y: 'maxY',
  FEATURES_CREATED: 'featuresCreated',
  EMPTY_RESULT: 'emptyResult',
});

/**
 * Error controlado de una operación. Su clave identifica el texto del
 * bloque turf.exception y sus variables lo completan.
 */
export class OperationError extends Error {
  /**
   * @constructor
   * @param {ErrorKey} key Clave del mensaje.
   * @param {Object} [vars] Variables del mensaje.
   */
  constructor(key, vars = {}) {
    super(key);
    this.name = 'OperationError';
    this.key = key;
    this.vars = vars;
  }
}
