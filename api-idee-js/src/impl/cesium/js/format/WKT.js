/**
 * @module IDEE/impl/format/WKT
 */
import MObject from 'IDEE/Object';
import Feature from 'IDEE/feature/Feature';
import { isNullOrEmpty } from 'IDEE/util/Utils';
import proj4 from 'proj4';

/**
  * Tipos de geometría WKT y su equivalente GeoJSON.
  * @const
  * @private
  */
const WKT_TYPES = {
  POINT: 'Point',
  LINESTRING: 'LineString',
  POLYGON: 'Polygon',
  MULTIPOINT: 'MultiPoint',
  MULTILINESTRING: 'MultiLineString',
  MULTIPOLYGON: 'MultiPolygon',
  GEOMETRYCOLLECTION: 'GeometryCollection',
};

/**
  * Cabecera de un WKT: prefijo SRID opcional, tipo, dimensión opcional y
  * "EMPTY" o inicio de las coordenadas.
  * @const
  * @private
  */
const WKT_HEADER = /^\s*(?:SRID=\d+;)?\s*([A-Z]+)\s*(?:ZM|Z|M)?\s*(EMPTY|\()/i;

const NUMBER = '-?(?:\\d+\\.?\\d*|\\.\\d+)(?:e[-+]?\\d+)?';
const COORDINATE = new RegExp(`${NUMBER}(?:\\s+${NUMBER})+`, 'gi');

/**
  * Cesium trabaja siempre en grados, por lo que EPSG:4979 (WGS84 3D)
  * se trata como EPSG:4326.
  *
  * @function
  * @param {string|Object} projection Código o proyección.
  * @returns {string|null} Código de la proyección.
  * @private
  */
const getCode = (projection) => {
  let code = null;
  if (typeof projection === 'string') {
    code = projection;
  } else if (!isNullOrEmpty(projection)) {
    code = projection.code || (projection.getCode && projection.getCode());
  }
  return code === 'EPSG:4979' ? 'EPSG:4326' : code;
};

/**
  * Reproyecta las coordenadas de una geometría GeoJSON conservando la altura.
  *
  * @function
  * @param {Object} geometry Geometría GeoJSON.
  * @param {string} from Proyección de origen.
  * @param {string} to Proyección de destino.
  * @returns {Object} Geometría reproyectada.
  * @private
  */
const reproject = (geometry, from, to) => {
  if (geometry.type === 'GeometryCollection') {
    return {
      type: geometry.type,
      geometries: geometry.geometries.map((geom) => reproject(geom, from, to)),
    };
  }
  const transform = (coordinates) => {
    if (typeof coordinates[0] === 'number') {
      return proj4(from, to, coordinates.slice(0, 2)).concat(coordinates.slice(2));
    }
    return coordinates.map(transform);
  };
  return { type: geometry.type, coordinates: transform(geometry.coordinates) };
};

/**
  * Divide un texto por las comas que no están entre paréntesis.
  *
  * @function
  * @param {string} text Texto a dividir.
  * @returns {Array<string>} Partes.
  * @private
  */
const splitTopLevel = (text) => {
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === '(') {
      depth += 1;
    } else if (text[i] === ')') {
      depth -= 1;
    } else if (text[i] === ',' && depth === 0) {
      parts.push(text.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(text.slice(start));
  return parts;
};

/**
  * Convierte un WKT en una geometría GeoJSON.
  *
  * @function
  * @param {string} wkt Geometría en formato WKT.
  * @returns {Object|null} Geometría GeoJSON, nulo si está vacía (EMPTY).
  * @throws {Error} Si el WKT no se puede interpretar.
  * @private
  */
const wktToGeometry = (wkt) => {
  const header = typeof wkt === 'string' ? wkt.match(WKT_HEADER) : null;
  const type = header === null ? undefined : WKT_TYPES[header[1].toUpperCase()];
  if (type === undefined) {
    throw new Error(`WKT no válido: ${wkt}`);
  }
  if (header[2].toUpperCase() === 'EMPTY') {
    return null;
  }
  const body = wkt.slice(wkt.indexOf('(')).trim();

  if (type === 'GeometryCollection') {
    const geometries = splitTopLevel(body.slice(1, -1))
      .map((part) => wktToGeometry(part))
      .filter((geometry) => geometry !== null);
    return { type, geometries };
  }

  // "1 2, 3 4" -> "[1,2],[3,4]" y los paréntesis pasan a corchetes
  const json = body
    .replace(COORDINATE, (coord) => `[${coord.trim().split(/\s+/).map(Number).join(',')}]`)
    .replace(/\(/g, '[')
    .replace(/\)/g, ']');
  let coordinates;
  try {
    coordinates = JSON.parse(json);
  } catch (err) {
    throw new Error(`WKT no válido: ${wkt}`);
  }
  if (type === 'Point') {
    // POINT (1 2) -> [[1,2]] -> [1,2]
    [coordinates] = coordinates;
  } else if (type === 'MultiPoint') {
    // MULTIPOINT ((1 2), (3 4)) -> [[[1,2]],[[3,4]]] -> [[1,2],[3,4]]
    coordinates = coordinates.map((point) => (Array.isArray(point[0]) ? point[0] : point));
  }
  return { type, coordinates };
};

/**
  * Indica si un anillo está orientado en sentido antihorario.
  *
  * @function
  * @param {Array<Array<number>>} ring Anillo.
  * @returns {boolean} Verdadero si es antihorario.
  * @private
  */
const isCounterClockwise = (ring) => {
  let area = 0;
  for (let i = 0; i < ring.length - 1; i += 1) {
    area += (ring[i][0] * ring[i + 1][1]) - (ring[i + 1][0] * ring[i][1]);
  }
  return area > 0;
};

/**
  * Convierte una geometría GeoJSON en WKT (sin altura, como hace OL).
  *
  * @function
  * @param {Object} geometry Geometría GeoJSON.
  * @param {Object} options Opciones.
  * - decimals: Número máximo de decimales de las coordenadas.
  * - rightHanded: Indica si se sigue la regla de la mano derecha.
  * @returns {string} Geometría en formato WKT.
  * @private
  */
const geometryToWkt = (geometry, options = {}) => {
  const { decimals, rightHanded } = options;
  const round = (value) => (decimals == null
    ? value
    : Math.round(value * (10 ** decimals)) / (10 ** decimals));
  const point = (coord) => coord.slice(0, 2).map(round).join(' ');
  const line = (coords) => coords.map(point).join(',');
  const polygon = (rings) => rings.map((ring, index) => {
    let oriented = ring;
    if (rightHanded === true || rightHanded === false) {
      // con la mano derecha el exterior es antihorario y los interiores horarios
      const wantCCW = (index === 0) === rightHanded;
      oriented = isCounterClockwise(ring) === wantCCW ? ring : ring.slice().reverse();
    }
    return `(${line(oriented)})`;
  }).join(',');

  const coordinates = geometry.coordinates;
  switch (geometry.type) {
    case 'Point':
      return `POINT(${point(coordinates)})`;
    case 'LineString':
      return `LINESTRING(${line(coordinates)})`;
    case 'Polygon':
      return `POLYGON(${polygon(coordinates)})`;
    case 'MultiPoint':
      return `MULTIPOINT(${coordinates.map((coord) => `(${point(coord)})`).join(',')})`;
    case 'MultiLineString':
      return `MULTILINESTRING(${coordinates.map((coords) => `(${line(coords)})`).join(',')})`;
    case 'MultiPolygon':
      return `MULTIPOLYGON(${coordinates.map((rings) => `(${polygon(rings)})`).join(',')})`;
    case 'GeometryCollection':
      return `GEOMETRYCOLLECTION(${geometry.geometries.map((geom) => geometryToWkt(geom, options)).join(',')})`;
    default:
      throw new Error(`Tipo de geometría no soportado: ${geometry.type}`);
  }
};

/**
  * Reproyecta una geometría GeoJSON leída de la proyección de los datos
  * a la de los objetos geográficos (por defecto EPSG:4326).
  *
  * @function
  * @param {Object|null} geometry Geometría GeoJSON en la proyección de los datos.
  * @param {Object} options Opciones de lectura.
  * @returns {Object|null} Geometría GeoJSON.
  * @private
  */
const toFeatureProjection = (geometry, options) => {
  const from = getCode(options.dataProjection);
  const to = getCode(options.featureProjection) || 'EPSG:4326';
  return (geometry !== null && from && from !== to) ? reproject(geometry, from, to) : geometry;
};

/**
  * Lee una geometría GeoJSON de un WKT en la proyección de los objetos geográficos.
  *
  * @function
  * @param {string} wkt Geometría en formato WKT.
  * @param {Object} options Opciones de lectura.
  * @returns {Object|null} Geometría GeoJSON.
  * @private
  */
const readGeometry = (wkt, options) => toFeatureProjection(wktToGeometry(wkt), options);

/**
  * Crea un objeto geográfico a partir de una geometría GeoJSON leída.
  *
  * @function
  * @param {Object|null} geometry Geometría GeoJSON en la proyección de los datos.
  * @param {string} id Identificador.
  * @param {Object} options Opciones de lectura.
  * @returns {IDEE.Feature} Objeto geográfico.
  * @private
  */
const createFeature = (geometry, id, options) => {
  const geojson = {
    type: 'Feature',
    geometry: toFeatureProjection(geometry, options),
    properties: {},
  };
  if (id != null) {
    geojson.id = id;
  }
  return new Feature(id, geojson);
};

/**
  * Escribe una geometría GeoJSON reproyectándola de la proyección de los
  * objetos geográficos a la de los datos.
  *
  * @function
  * @param {Object} geometry Geometría GeoJSON.
  * @param {Object} options Opciones de escritura.
  * @returns {string} Geometría en formato WKT.
  * @private
  */
const writeGeometry = (geometry, options) => {
  const from = getCode(options.featureProjection) || 'EPSG:4326';
  const to = getCode(options.dataProjection);
  const geom = (to && from !== to) ? reproject(geometry, from, to) : geometry;
  return geometryToWkt(geom, options);
};

/**
  * @classdesc
  * Implementación del formateador WKT para Cesium. Las geometrías de los
  * objetos geográficos de Cesium están siempre en grados (EPSG:4326), por
  * lo que si no se indica proyección de los objetos geográficos se
  * reproyecta a EPSG:4326 (EPSG:4979 se trata como EPSG:4326).
  *
  * @api
  * @extends {IDEE.Object}
  */
class WKT extends MObject {
  /**
    * Constructor principal de la clase. Formato de los objetos geográficos para
    * leer y escribir datos en formato WKT.
    *
    * @constructor
    * @param {Object} options Opciones del formato WKT.
    * @api
    */
  constructor(options = {}) {
    super(options);
    /**
      * Opciones del formato WKT.
      * @type {Object}
      * @private
      */
    this.options_ = options;
  }

  /**
    * Este método obtiene el formato de geometría. En Cesium no hay un
    * formateador de terceros, por lo que devuelve esta misma clase.
    *
    * @function
    * @returns {Object|IDEE.impl.format.WKT} Formateador.
    * @public
    * @api
    */
  getFormatter() {
    return this;
  }

  /**
    * Este método obtiene un objeto geográfico del texto especificado.
    *
    * @function
    * @param {string} wkt Texto del que se obtiene el objeto geográfico.
    * @param {Object} options Opciones.
    * - dataProjection: Proyección de los datos leídos.
    * - featureProjection: Proyección de las geometrías de los objetos geográficos
    * creados por el lector de formato. Por defecto EPSG:4326.
    * - id: Identificador del objeto geográfico.
    * @returns {IDEE.Feature} Objeto geográfico.
    * @public
    * @api
    */
  read(wkt, options = {}) {
    return createFeature(wktToGeometry(wkt), options.id, options);
  }

  /**
    * Este método obtiene la geometría GeoJSON del texto especificado
    * (equivalente a readGeometry de ol/format/WKT).
    *
    * @function
    * @param {string} wkt Texto del que se obtiene la geometría.
    * @param {Object} options Opciones.
    * - dataProjection: Proyección de los datos leídos.
    * - featureProjection: Proyección de la geometría devuelta. Por defecto EPSG:4326.
    * @returns {Object|null} Geometría GeoJSON, nulo si está vacía (EMPTY).
    * @public
    * @api
    */
  readGeometry(wkt, options = {}) {
    return readGeometry(wkt, options);
  }

  /**
    * Este método obtiene los objetos geográficos del texto especificado.
    * Una colección de geometrías se divide en un objeto geográfico por geometría.
    *
    * @function
    * @param {string} wktCollection Texto del que se obtienen los objetos geográficos.
    * @param {Object} options Opciones.
    * - dataProjection: Proyección de los datos leídos.
    * - featureProjection: Proyección de las geometrías de los objetos geográficos
    * creados por el lector de formato. Por defecto EPSG:4326.
    * - ids: Identificadores de los objetos geográficos.
    * @returns {Array<IDEE.Feature>} Objetos geográficos.
    * @public
    * @api
    */
  readCollection(wktCollection, options = {}) {
    const geometry = wktToGeometry(wktCollection);
    let geometries = [geometry];
    if (geometry !== null && geometry.type === 'GeometryCollection') {
      geometries = geometry.geometries;
    }
    const { ids } = options;
    const useIds = ids != null && ids.length === geometries.length;
    return geometries.map((geom, index) => createFeature(
      geom,
      useIds ? ids[index] : undefined,
      options,
    ));
  }

  /**
    * Este método escribe un objeto geográfico en formato WKT.
    *
    * @function
    * @param {IDEE.Feature} feature Objeto geográfico.
    * @param {Object} options Opciones.
    * - dataProjection: Proyección de los datos a escribir.
    * - featureProjection: Proyección de las geometrías del objeto geográfico
    * que serán serializadas por el escritor de formato. Por defecto EPSG:4326.
    * - rightHanded: Indica si se sigue la regla de la mano derecha.
    * - decimals: Número máximo de decimales para las coordenadas.
    * @returns {string} Objeto geográfico en formato WKT.
    * @public
    * @api
    */
  write(feature, options = {}) {
    return writeGeometry(feature.getGeometry(), options);
  }

  /**
    * Método auxiliar para las transformaciones y operaciones
    * geométricas que no se incorporaron en un principio en API-IDEE.
    *
    * @function
    * @param {Object} geometry Geometría GeoJSON que se desea transformar.
    * @returns {string} Geometría transformada en formato WKT.
    * @public
    * @api
    */
  writeFeature(geometry) {
    return geometryToWkt(geometry);
  }

  /**
    * Este método escribe los objetos geográficos en formato WKT.
    *
    * @function
    * @param {Array<IDEE.Feature>} features Objetos geográficos.
    * @param {Object} options Opciones.
    * - dataProjection: Proyección de los datos a escribir.
    * - featureProjection: Proyección de las geometrías del objeto geográfico
    * que serán serializadas por el escritor de formato. Por defecto EPSG:4326.
    * - rightHanded: Indica si se sigue la regla de la mano derecha.
    * - decimals: Número máximo de decimales para las coordenadas.
    * @returns {string} Objetos geográficos en formato WKT
    * @public
    * @api
    */
  writeCollection(features, options = {}) {
    return writeGeometry({
      type: 'GeometryCollection',
      geometries: features.map((feature) => feature.getGeometry()),
    }, options);
  }
}

export default WKT;
