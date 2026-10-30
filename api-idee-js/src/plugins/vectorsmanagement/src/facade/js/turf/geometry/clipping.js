import { GeometryDimension, GeometryType } from '../turftypes';

/**
 * Diferencia mínima entre dos posiciones de corte sobre un segmento (en
 * fracción del segmento) para considerarlas distintas.
 * @const
 * @type {Number}
 */
const CUT_EPSILON = 1e-12;

/**
 * Crea un FeatureCollection con las geometrías indicadas.
 *
 * @param {Array<Object>} geometries Geometrías GeoJSON.
 * @returns {Object} FeatureCollection GeoJSON.
 */
const collection = (geometries) => turf.featureCollection(geometries.map((g) => turf.feature(g)));

/**
 * Devuelve la geometría de un resultado de Turf o null si está vacío.
 *
 * @param {Object|null|undefined} feature Feature GeoJSON.
 * @returns {Object|null} Geometría GeoJSON.
 */
const geometryOrNull = (feature) => (feature && feature.geometry
  && feature.geometry.coordinates.length > 0 ? feature.geometry : null);

/**
 * Parte común de dos polígonos.
 *
 * @param {Object} a Polygon o MultiPolygon.
 * @param {Object} b Polygon o MultiPolygon.
 * @returns {Object|null} Geometría o null si solo se tocan o no se cortan.
 */
const intersectPolygons = (a, b) => geometryOrNull(turf.intersect(collection([a, b])));

/**
 * Parte de un polígono que queda fuera de otros polígonos.
 *
 * @param {Object} polygon Polygon o MultiPolygon.
 * @param {Array<Object>} others Polygon o MultiPolygon que se restan.
 * @returns {Object|null} Geometría o null si no queda nada.
 */
const subtractPolygons = (polygon, others) => (others.length === 0
  ? polygon : geometryOrNull(turf.difference(collection([polygon, ...others]))));

/**
 * Posiciones (fracción de 0 a 1) en que un segmento cruza el borde de un
 * polígono, ordenadas e incluyendo los extremos.
 *
 * @param {Array<Number>} start Inicio del segmento.
 * @param {Array<Number>} end Fin del segmento.
 * @param {Object} polygon Polygon o MultiPolygon.
 * @returns {Array<Number>} Posiciones.
 */
const cutPositions = (start, end, polygon) => {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const length2 = (dx * dx) + (dy * dy);
  const crossings = length2 === 0 ? [] : turf.lineIntersect(turf.lineString([start, end]), polygon)
    .features
    .map(({ geometry: { coordinates: [x, y] } }) => (((x - start[0]) * dx) + ((y - start[1]) * dy))
      / length2)
    .filter((t) => t > CUT_EPSILON && t < 1 - CUT_EPSILON);
  return [0, ...crossings.sort((a, b) => a - b), 1]
    .filter((t, i, all) => i === 0 || t - all[i - 1] > CUT_EPSILON);
};

/**
 * Punto de un segmento en la posición indicada.
 *
 * @param {Array<Number>} start Inicio del segmento.
 * @param {Array<Number>} end Fin del segmento.
 * @param {Number} t Posición (fracción de 0 a 1).
 * @returns {Array<Number>} Coordenadas.
 */
const pointAt = (start, end, t) => {
  if (t === 0) return start;
  if (t === 1) return end;
  return [start[0] + ((end[0] - start[0]) * t), start[1] + ((end[1] - start[1]) * t)];
};

/**
 * Tramos de una línea simple que quedan dentro (o fuera) de un polígono.
 * Cada segmento se corta por los cruces con el borde y cada tramo se
 * clasifica por su punto medio; el borde cuenta como dentro.
 *
 * @param {Array<Array<Number>>} coordinates Coordenadas de un LineString.
 * @param {Object} polygon Polygon o MultiPolygon.
 * @param {Boolean} keepInside true para quedarse con los tramos interiores.
 * @returns {Array<Array<Array<Number>>>} Coordenadas de las líneas resultantes.
 */
const clipLineString = (coordinates, polygon, keepInside) => {
  const lines = [];
  let current = null;
  coordinates.slice(1).forEach((end, i) => {
    const start = coordinates[i];
    const cuts = cutPositions(start, end, polygon);
    cuts.slice(1).forEach((t, j) => {
      const from = pointAt(start, end, cuts[j]);
      const to = pointAt(start, end, t);
      const middle = pointAt(start, end, (cuts[j] + t) / 2);
      if (turf.booleanPointInPolygon(middle, polygon) === keepInside) {
        if (current === null) {
          current = [from];
          lines.push(current);
        }
        current.push(to);
      } else {
        current = null;
      }
    });
  });
  return lines;
};

/**
 * Líneas simples (coordenadas) de un LineString o MultiLineString.
 *
 * @param {Object} geometry LineString o MultiLineString.
 * @returns {Array<Array<Array<Number>>>} Coordenadas de cada línea.
 */
const lineParts = (geometry) => (geometry.type === GeometryType.LINE_STRING
  ? [geometry.coordinates] : geometry.coordinates);

/**
 * Construye una geometría lineal a partir de las coordenadas de sus partes.
 *
 * @param {Array<Array<Array<Number>>>} parts Coordenadas de cada línea.
 * @returns {Object|null} LineString, MultiLineString o null si no hay partes.
 */
const toLineGeometry = (parts) => {
  if (parts.length === 0) return null;
  return parts.length === 1
    ? { type: GeometryType.LINE_STRING, coordinates: parts[0] }
    : { type: GeometryType.MULTI_LINE_STRING, coordinates: parts };
};

/**
 * Parte de una línea que queda dentro (o fuera) de un polígono.
 *
 * @param {Object} line LineString o MultiLineString.
 * @param {Object} polygon Polygon o MultiPolygon.
 * @param {Boolean} keepInside true para quedarse con la parte interior.
 * @returns {Object|null} Geometría o null si no queda nada.
 */
const clipLine = (line, polygon, keepInside) => toLineGeometry(lineParts(line)
  .flatMap((coordinates) => clipLineString(coordinates, polygon, keepInside)));

/**
 * Puntos que quedan dentro (o fuera) de los polígonos; el borde cuenta como
 * dentro.
 *
 * @param {Object} geometry Point o MultiPoint.
 * @param {Array<Object>} polygons Polygon o MultiPolygon.
 * @param {Boolean} keepInside true para quedarse con los puntos interiores.
 * @returns {Object|null} Geometría o null si no queda ninguno.
 */
const clipPoints = (geometry, polygons, keepInside) => {
  const points = geometry.type === GeometryType.POINT
    ? [geometry.coordinates] : geometry.coordinates;
  const kept = points.filter((point) => polygons
    .some((polygon) => turf.booleanPointInPolygon(point, polygon)) === keepInside);
  if (kept.length === 0) return null;
  return geometry.type === GeometryType.POINT
    ? geometry : { type: GeometryType.MULTI_POINT, coordinates: kept };
};

/**
 * Parte común de una geometría (punto, línea o polígono) y un polígono. El
 * resultado conserva la dimensión de la geometría.
 *
 * @param {Object} geometry Geometría GeoJSON en EPSG:4326.
 * @param {Object} polygon Polygon o MultiPolygon en EPSG:4326.
 * @returns {Object|null} Geometría o null si no hay parte común.
 */
export const intersectGeometry = (geometry, polygon) => {
  const dimension = GeometryDimension[geometry.type];
  if (dimension === 2) return intersectPolygons(geometry, polygon);
  if (dimension === 1) return clipLine(geometry, polygon, true);
  return clipPoints(geometry, [polygon], true);
};

/**
 * Parte de una geometría (punto, línea o polígono) que queda fuera de los
 * polígonos. El resultado conserva la dimensión de la geometría.
 *
 * @param {Object} geometry Geometría GeoJSON en EPSG:4326.
 * @param {Array<Object>} polygons Polygon o MultiPolygon en EPSG:4326.
 * @returns {Object|null} Geometría o null si no queda nada.
 */
export const subtractGeometry = (geometry, polygons) => {
  const dimension = GeometryDimension[geometry.type];
  if (dimension === 2) return subtractPolygons(geometry, polygons);
  if (dimension === 1) {
    return polygons.reduce((rest, polygon) => rest && clipLine(rest, polygon, false), geometry);
  }
  return clipPoints(geometry, polygons, false);
};

/**
 * Une (disuelve) polígonos en una sola geometría.
 *
 * @param {Array<Object>} polygons Polygon o MultiPolygon en EPSG:4326.
 * @returns {Object|null} Geometría o null si no hay polígonos.
 */
export const dissolvePolygons = (polygons) => {
  if (polygons.length < 2) return polygons[0] || null;
  return geometryOrNull(turf.union(collection(polygons)));
};

/**
 * Tamaño de la parte común de una geometría y un polígono: área (m²) para
 * polígonos y longitud (km) para líneas.
 *
 * @param {Object} geometry LineString, Polygon o sus múltiples, en EPSG:4326.
 * @param {Object} polygon Polygon o MultiPolygon en EPSG:4326.
 * @returns {Number} Tamaño o 0 si no hay parte común.
 */
export const overlapSize = (geometry, polygon) => {
  const common = intersectGeometry(geometry, polygon);
  if (common === null) return 0;
  return GeometryDimension[common.type] === 2 ? turf.area(common) : turf.length(common);
};
