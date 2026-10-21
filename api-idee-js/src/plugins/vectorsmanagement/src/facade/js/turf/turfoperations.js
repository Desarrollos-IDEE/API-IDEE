import { getValue } from '../i18n/language';
import {
  AreaUnit,
  Category,
  Display,
  ErrorKey,
  GeometryGroup,
  GeometryType,
  HelpKey,
  LengthUnit,
  Mode,
  OperationId,
  OptionsKey,
  Output,
  ParamName,
  ParamType,
  ResultKey,
  ScaleOrigin,
  Step,
} from './turftypes';

/** @typedef {import('./turftypes').TurfOperation} TurfOperation */
/** @typedef {import('./turftypes').TurfParam} TurfParam */

/**
 * Combinaciones contenedor
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
 * Categorías del panel, en el orden en que se muestran.
 * @const
 * @type {Array<Category>}
 */
export const CATEGORIES = Object.values(Category);

/**
 * Unidades de longitud de Turf (Units).
 * @const
 * @type {Array<LengthUnit>}
 */
const LENGTH_UNITS = Object.values(LengthUnit);

/**
 * Unidades de área de Turf (AreaUnits).
 * @const
 * @type {Array<AreaUnit>}
 */
const AREA_UNITS = Object.values(AreaUnit);

/**
 * Puntos de origen de turf.transformScale (Corners).
 * @const
 * @type {Array<ScaleOrigin>}
 */
const SCALE_ORIGINS = Object.values(ScaleOrigin);

/**
 * Crea el parámetro de unidades de longitud del formulario.
 *
 * @param {LengthUnit} defaultValue Unidad seleccionada por defecto.
 * @returns {TurfParam} Parámetro de tipo select.
 */
const unitsParam = (defaultValue = LengthUnit.METERS) => ({
  name: ParamName.UNITS,
  type: ParamType.SELECT,
  options: LENGTH_UNITS,
  optionsKey: OptionsKey.UNITS,
  default: defaultValue,
});

/**
 * Crea el parámetro de unidades de área del formulario.
 *
 * @param {AreaUnit} defaultValue Unidad seleccionada por defecto.
 * @returns {TurfParam} Parámetro de tipo select.
 */
const areaUnitsParam = (defaultValue = AreaUnit.METERS) => ({
  name: ParamName.AREA_UNITS,
  type: ParamType.SELECT,
  options: AREA_UNITS,
  optionsKey: OptionsKey.AREA_UNITS,
  default: defaultValue,
});

/**
 * Formatea un número con el idioma de la API (máximo 3 decimales).
 *
 * @param {Number} value Número.
 * @returns {String} Número formateado.
 */
const formatNumber = (value) => value.toLocaleString(IDEE.language.getLang(), {
  maximumFractionDigits: 3,
});

/**
 * Formatea una longitud con la abreviatura de su unidad.
 *
 * @param {Number} value Longitud.
 * @param {LengthUnit} units Unidad de Turf.
 * @returns {String} Longitud formateada.
 */
const formatLength = (value, units) => `${formatNumber(value)} ${getValue(`turf.unitsShort.${units}`)}`;

/**
 * Formatea un área (en m²) convertida a la unidad indicada.
 *
 * @param {Number} area Área en metros cuadrados.
 * @param {AreaUnit} units Unidad de salida.
 * @returns {String} Área formateada.
 */
const formatArea = (area, units) => `${formatNumber(turf.convertArea(area, AreaUnit.METERS, units))} ${getValue(`turf.areaUnitsShort.${units}`)}`;

/**
 * Obtiene el punto de giro de turf.transformRotate a partir del formulario.
 *
 * @param {Object} p Valores del formulario.
 * @returns {Array<Number>|undefined} [lon, lat] o undefined para girar sobre el centroide.
 * @throws {Error} Si solo se ha indicado la longitud o la latitud.
 */
const getPivot = (p) => {
  const hasLon = p.pivotLon !== undefined;
  const hasLat = p.pivotLat !== undefined;
  if (hasLon !== hasLat) {
    throw new Error(getValue(`turf.exception.${ErrorKey.PIVOT}`));
  }
  return hasLon ? [p.pivotLon, p.pivotLat] : undefined;
};

/**
 * Traduce un resultado booleano a Sí / No.
 *
 * @param {Boolean} value Resultado.
 * @returns {String} Texto traducido.
 */
const formatBoolean = (value) => getValue(`turf.results.${value ? ResultKey.YES : ResultKey.NO}`);

/**
 * Tabla HTML con la extensión [minX, minY, maxX, maxY].
 *
 * @param {Array<Number>} bbox Extensión.
 * @returns {String} HTML de la tabla.
 */
const formatBbox = ([minX, minY, maxX, maxY]) => `<table class="m-vectorsmanagement-turf-result">
        <tr><th>${getValue(`turf.results.${ResultKey.MIN_X}`)}</th><td>${minX}</td></tr>
        <tr><th>${getValue(`turf.results.${ResultKey.MIN_Y}`)}</th><td>${minY}</td></tr>
        <tr><th>${getValue(`turf.results.${ResultKey.MAX_X}`)}</th><td>${maxX}</td></tr>
        <tr><th>${getValue(`turf.results.${ResultKey.MAX_Y}`)}</th><td>${maxY}</td></tr>
      </table>`;

/**
 * Indica si el elemento es un punto (Point).
 *
 * @param {Object} feature Feature GeoJSON.
 * @returns {Boolean}
 */
const isPoint = (feature) => feature.geometry.type === GeometryType.POINT;

/**
 * Indica si el elemento es un polígono (Polygon o MultiPolygon).
 *
 * @param {Object} feature Feature GeoJSON.
 * @returns {Boolean}
 */
const isPolygon = (feature) => GeometryGroup.POLYGONS.includes(feature.geometry.type);

/**
 * Devuelve la dimensión de la geometría del elemento.
 *
 * @param {Object} feature Feature GeoJSON.
 * @returns {Number} 0 punto, 1 línea, 2 polígono.
 */
const getDimension = (feature) => {
  const { type } = feature.geometry;
  if (GeometryGroup.POINTS.includes(type)) return 0;
  if (GeometryGroup.LINES.includes(type)) return 1;
  return 2;
};

/**
 * Indica si el contenido no puede estar contenido en el contenedor por tener
 * mayor dimensión (evita errores internos de Turf).
 *
 * @param {Object} container Feature GeoJSON contenedor.
 * @param {Object} contained Feature GeoJSON contenido.
 * @returns {Boolean}
 */
const isTrivialNotContained = (container, contained) => (
  getDimension(contained) > getDimension(container)
);

/**
 * Comprueba si el contenedor contiene al contenido. Devuelve false sin
 * consultar a Turf cuando el contenido tiene mayor dimensión.
 *
 * @param {Object} container Feature GeoJSON contenedor.
 * @param {Object} contained Feature GeoJSON contenido.
 * @returns {Boolean}
 */
const contains = (container, contained) => (isTrivialNotContained(container, contained)
  ? false : turf.booleanContains(container, contained));

/**
 * Valida que Turf admite la combinación de geometrías de contains / within.
 *
 * @param {Object} container Feature GeoJSON contenedor.
 * @param {Object} contained Feature GeoJSON contenido.
 * @returns {ErrorKey|null} Clave del error o null si es válida.
 */
const validateContains = (container, contained) => (
  isTrivialNotContained(container, contained)
  || (CONTAINS_SUPPORTED[container.geometry.type] || []).includes(contained.geometry.type)
    ? null : ErrorKey.UNSUPPORTED_GEOMETRIES);

/**
 * Valida que la entrada contiene un punto y un polígono.
 *
 * @param {Object} fc FeatureCollection GeoJSON.
 * @returns {ErrorKey|null} Clave del error o null si es válida.
 */
const validatePointPolygon = (fc) => (fc.features.some(isPoint) && fc.features.some(isPolygon)
  ? null : ErrorKey.POINT_POLYGON);

/**
 * Catálogo de operaciones de Turf.js disponibles en el control Turf.
 *
 * La forma de cada entrada se describe en el typedef TurfOperation
 * (turftypes.js) y todos sus valores de configuración se toman de los
 * enumerados de ese módulo. Cada entrada se organiza en tres partes:
 *
 * **Identificación**
 * - `id` (OperationId): identificador de la operación.
 * - `category` (Category): categoría en la que se agrupa en el panel.
 *
 * **Entrada**
 * - `input`: requisitos de los elementos necesarios:
 *   - `min` / `max`: número mínimo y máximo de elementos.
 *   - `types` (GeometryType / GeometryGroup): tipos de geometría admitidos.
 *   - `validate`: validación adicional; devuelve un ErrorKey o `null`.
 * - `params` (TurfParam): parámetros solicitados en el formulario. Cada uno
 *   define `name` (ParamName) y `type` (ParamType), y puede definir `help`
 *   (HelpKey), `required: false` (número opcional; vacío es `undefined`) y,
 *   en los select, `optionsKey` (OptionsKey).
 *
 * **Ejecución y resultado**
 * - `mode` (Mode): `ALL` procesa la colección completa; `EACH` procesa cada
 *   elemento por separado.
 * - `run`: ejecuta Turf con un `FeatureCollection` en EPSG:4326 (o un `Feature`
 *   si `mode` es `EACH`) y los valores del formulario.
 * - `output` (Output): `GEOMETRY` para dibujar el resultado en el mapa o
 *   `VALUE` para mostrarlo como un valor.
 * - `display` (Display): `TOAST` o `DIALOG`; se aplica cuando `output` es `VALUE`.
 * - `format`: convierte el resultado en el texto que se muestra; se aplica
 *   cuando `output` es `VALUE`.
 *
 * Para añadir una operación basta con añadir su identificador a OperationId,
 * una entrada a este catálogo y sus traducciones.
 *
 * @const
 * @type {Array<TurfOperation>}
 */
export const OPERATIONS = [
  // Medición
  {
    id: OperationId.AREA,
    category: Category.MEASUREMENT,
    input: { min: 1, types: GeometryGroup.POLYGONS },
    params: [areaUnitsParam()],
    mode: Mode.ALL,
    output: Output.VALUE,
    display: Display.TOAST,
    run: (fc) => turf.area(fc),
    format: (area, p) => formatArea(area, p.areaUnits),
  },
  {
    id: OperationId.LENGTH,
    category: Category.MEASUREMENT,
    input: { min: 1, types: GeometryGroup.LINES },
    params: [unitsParam()],
    mode: Mode.ALL,
    output: Output.VALUE,
    display: Display.TOAST,
    run: (fc, p) => turf.length(fc, { units: p.units }),
    format: (length, p) => formatLength(length, p.units),
  },
  {
    id: OperationId.DISTANCE,
    category: Category.MEASUREMENT,
    input: { min: 2, max: 2, types: [GeometryType.POINT] },
    params: [unitsParam()],
    mode: Mode.ALL,
    output: Output.VALUE,
    display: Display.TOAST,
    run: (fc, p) => turf.distance(fc.features[0], fc.features[1], { units: p.units }),
    format: (distance, p) => formatLength(distance, p.units),
  },
  {
    id: OperationId.BBOX,
    category: Category.MEASUREMENT,
    input: { min: 1, types: GeometryGroup.ANY },
    params: [],
    mode: Mode.ALL,
    output: Output.VALUE,
    display: Display.DIALOG,
    run: (fc) => turf.bbox(fc),
    format: formatBbox,
  },
  {
    id: OperationId.ALONG,
    category: Category.MEASUREMENT,
    input: { min: 1, max: 1, types: [GeometryType.LINE_STRING] },
    params: [
      {
        name: ParamName.DISTANCE,
        type: ParamType.NUMBER,
        min: 0,
        step: Step.ANY,
        default: 100,
      },
      unitsParam(),
    ],
    mode: Mode.EACH,
    output: Output.GEOMETRY,
    run: (line, p) => turf.along(line, p.distance, { units: p.units }),
  },

  // Centros
  {
    id: OperationId.CENTER,
    category: Category.CENTER,
    input: { min: 1, types: GeometryGroup.ANY },
    params: [],
    mode: Mode.EACH,
    output: Output.GEOMETRY,
    run: (feature) => turf.center(feature),
  },
  {
    id: OperationId.CENTROID,
    category: Category.CENTER,
    input: { min: 1, types: GeometryGroup.ANY },
    params: [],
    mode: Mode.EACH,
    output: Output.GEOMETRY,
    run: (feature) => turf.centroid(feature),
  },
  {
    id: OperationId.CENTER_OF_MASS,
    category: Category.CENTER,
    input: { min: 1, types: GeometryGroup.ANY },
    params: [],
    mode: Mode.EACH,
    output: Output.GEOMETRY,
    run: (feature) => turf.centerOfMass(feature),
  },
  {
    id: OperationId.POINT_ON_FEATURE,
    category: Category.CENTER,
    input: { min: 1, types: GeometryGroup.ANY },
    params: [],
    mode: Mode.EACH,
    output: Output.GEOMETRY,
    run: (feature) => turf.pointOnFeature(feature),
  },

  // Transformación
  {
    id: OperationId.BUFFER,
    category: Category.TRANSFORMATION,
    input: { min: 1, types: GeometryGroup.ANY },
    params: [
      {
        name: ParamName.RADIUS,
        type: ParamType.NUMBER,
        step: Step.ANY,
        default: 100,
        help: HelpKey.RADIUS,
      },
      unitsParam(),
      {
        name: ParamName.STEPS,
        type: ParamType.NUMBER,
        min: 1,
        step: 1,
        default: 8,
      },
    ],
    mode: Mode.ALL,
    output: Output.GEOMETRY,
    run: (fc, p) => turf.buffer(fc, p.radius, { units: p.units, steps: p.steps }),
  },
  {
    id: OperationId.SIMPLIFY,
    category: Category.TRANSFORMATION,
    input: { min: 1, types: [...GeometryGroup.LINES, ...GeometryGroup.POLYGONS] },
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
    mode: Mode.ALL,
    output: Output.GEOMETRY,
    run: (fc, p) => turf.simplify(fc, { tolerance: p.tolerance, highQuality: p.highQuality }),
  },
  {
    id: OperationId.CONVEX,
    category: Category.TRANSFORMATION,
    input: { min: 1, types: GeometryGroup.ANY },
    params: [
      {
        name: ParamName.CONCAVITY,
        type: ParamType.NUMBER,
        min: 1,
        step: Step.ANY,
        required: false,
        help: HelpKey.CONCAVITY,
      },
    ],
    mode: Mode.ALL,
    output: Output.GEOMETRY,
    run: (fc, p) => turf.convex(fc, { concavity: p.concavity }),
  },
  {
    id: OperationId.ENVELOPE,
    category: Category.TRANSFORMATION,
    input: { min: 1, types: GeometryGroup.ANY },
    params: [],
    mode: Mode.ALL,
    output: Output.GEOMETRY,
    run: (fc) => turf.envelope(fc),
  },
  {
    id: OperationId.BEZIER_SPLINE,
    category: Category.TRANSFORMATION,
    input: { min: 1, types: [GeometryType.LINE_STRING] },
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
    mode: Mode.EACH,
    output: Output.GEOMETRY,
    run: (line, p) => turf.bezierSpline(line, {
      resolution: p.resolution, sharpness: p.sharpness,
    }),
  },
  {
    id: OperationId.TRANSFORM_ROTATE,
    category: Category.TRANSFORMATION,
    input: { min: 1, types: GeometryGroup.ANY },
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
    mode: Mode.EACH,
    output: Output.GEOMETRY,
    run: (feature, p) => turf.transformRotate(feature, p.angle, { pivot: getPivot(p) }),
  },
  {
    id: OperationId.TRANSFORM_SCALE,
    category: Category.TRANSFORMATION,
    input: { min: 1, types: GeometryGroup.ANY },
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
        options: SCALE_ORIGINS,
        optionsKey: OptionsKey.ORIGINS,
        default: ScaleOrigin.CENTROID,
      },
    ],
    mode: Mode.EACH,
    output: Output.GEOMETRY,
    run: (feature, p) => turf.transformScale(feature, p.factor, { origin: p.origin }),
  },
  {
    id: OperationId.TRANSFORM_TRANSLATE,
    category: Category.TRANSFORMATION,
    input: { min: 1, types: GeometryGroup.ANY },
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
    mode: Mode.EACH,
    output: Output.GEOMETRY,
    run: (feature, p) => turf.transformTranslate(feature, p.distance, p.direction, {
      units: p.units,
    }),
  },

  // Superposición
  {
    id: OperationId.UNION,
    category: Category.OVERLAY,
    input: { min: 2, types: GeometryGroup.POLYGONS },
    params: [],
    mode: Mode.ALL,
    output: Output.GEOMETRY,
    run: (fc) => turf.union(fc),
  },
  {
    id: OperationId.INTERSECT,
    category: Category.OVERLAY,
    input: { min: 2, types: GeometryGroup.POLYGONS },
    params: [],
    mode: Mode.ALL,
    output: Output.GEOMETRY,
    run: (fc) => turf.intersect(fc),
  },
  {
    id: OperationId.DIFFERENCE,
    category: Category.OVERLAY,
    input: { min: 2, types: GeometryGroup.POLYGONS },
    params: [],
    mode: Mode.ALL,
    output: Output.GEOMETRY,
    run: (fc) => turf.difference(fc),
  },

  // Relación
  {
    id: OperationId.BOOLEAN_POINT_IN_POLYGON,
    category: Category.RELATION,
    input: {
      min: 2,
      max: 2,
      types: [GeometryType.POINT, ...GeometryGroup.POLYGONS],
      validate: validatePointPolygon,
    },
    params: [
      {
        name: ParamName.IGNORE_BOUNDARY,
        type: ParamType.CHECKBOX,
        default: false,
      },
    ],
    mode: Mode.ALL,
    output: Output.VALUE,
    display: Display.TOAST,
    run: (fc, p) => turf.booleanPointInPolygon(
      fc.features.find(isPoint),
      fc.features.find(isPolygon),
      { ignoreBoundary: p.ignoreBoundary },
    ),
    format: formatBoolean,
  },
  {
    id: OperationId.BOOLEAN_INTERSECTS,
    category: Category.RELATION,
    input: { min: 2, max: 2, types: GeometryGroup.ANY },
    params: [
      {
        name: ParamName.IGNORE_SELF_INTERSECTIONS,
        type: ParamType.CHECKBOX,
        default: true,
      },
    ],
    mode: Mode.ALL,
    output: Output.VALUE,
    display: Display.TOAST,
    run: (fc, p) => turf.booleanIntersects(fc.features[0], fc.features[1], {
      ignoreSelfIntersections: p.ignoreSelfIntersections,
    }),
    format: formatBoolean,
  },
  {
    id: OperationId.BOOLEAN_CONTAINS,
    category: Category.RELATION,
    input: {
      min: 2,
      max: 2,
      types: GeometryGroup.ANY,
      validate: (fc) => validateContains(fc.features[0], fc.features[1]),
    },
    params: [],
    mode: Mode.ALL,
    output: Output.VALUE,
    display: Display.TOAST,
    run: (fc) => contains(fc.features[0], fc.features[1]),
    format: formatBoolean,
  },
  {
    id: OperationId.BOOLEAN_WITHIN,
    category: Category.RELATION,
    input: {
      min: 2,
      max: 2,
      types: GeometryGroup.ANY,
      validate: (fc) => validateContains(fc.features[1], fc.features[0]),
    },
    params: [],
    mode: Mode.ALL,
    output: Output.VALUE,
    display: Display.TOAST,
    run: (fc) => contains(fc.features[1], fc.features[0]),
    format: formatBoolean,
  },
];

/**
 * Devuelve la operación del catálogo con el identificador indicado.
 *
 * @param {OperationId} id Identificador de la operación.
 * @returns {TurfOperation|undefined} Operación o undefined si no existe.
 */
export const getOperation = (id) => OPERATIONS.find((op) => op.id === id);
