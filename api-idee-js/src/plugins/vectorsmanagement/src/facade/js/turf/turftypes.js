/**
 * Requisitos de los elementos de entrada de una operación.
 * @typedef {Object} TurfInput
 * @property {Number} [min=1] Número mínimo de elementos.
 * @property {Number} [max] Número máximo de elementos.
 * @property {Array<GeometryType>} types Tipos de geometría admitidos.
 * @property {function(Object): (ErrorKey|null)} [validate] Validación adicional sobre el
 * FeatureCollection; devuelve la clave del error.
 */

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
 * @property {HelpKey} [help] Texto de ayuda.
 */

/**
 * Operación del catálogo.
 * @typedef {Object} TurfOperation
 * @property {OperationId} id Identificador.
 * @property {Category} category Categoría del panel.
 * @property {TurfInput} input Requisitos de los elementos de entrada.
 * @property {Array<TurfParam>} params Parámetros del formulario.
 * @property {Mode} mode Modo de ejecución.
 * @property {Output} output Tipo de resultado.
 * @property {Display} [display] Forma de mostrar el resultado.
 * @property {function(Object, Object): *} run Ejecuta la operacion Turf
 * con el FeatureCollection (o el Feature, en Mode.EACH) en EPSG:4326 y
 * los valores del formulario.
 * @property {function(*, Object): String} [format] Texto del resultado.
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
  MEASUREMENT: 'measurement',
  CENTER: 'center',
  TRANSFORMATION: 'transformation',
  OVERLAY: 'overlay',
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
});

/**
 * Modo de ejecución de una operación.
 * @readonly
 * @enum {String}
 */
export const Mode = Object.freeze({
  ALL: 'all',
  EACH: 'each',
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
 * Nombres de los parámetros del formulario. Son también las
 * propiedades del objeto de valores que reciben run y format.
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
  TYPES: 'types',
  POINT_POLYGON: 'pointPolygon',
  UNSUPPORTED_GEOMETRIES: 'unsupportedGeometries',
  PIVOT: 'pivot',
  EMPTY: 'empty',
  ERROR: 'error',
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
  LAYER_CREATED: 'layerCreated',
});
