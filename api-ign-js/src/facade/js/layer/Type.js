/**
 * @module M/layer/type
 */
import { isString, normalize } from '../util/Utils';

/**
 * Tipo KML (Keyhole Markup Language). Es un lenguaje de
 * marca basado en XML para representar datos geográficos.
 * @const
 * @type {string}
 * @public
 * @api
 */
export const KML = 'KML';

/**
 * Tipo WMS (Web Map Service). Definido por una url,
 * el servicio puede ofrecer una o muchas capas, individuales
 * o agrupadas, cada una con un nombre propio.
 * @const
 * @type {string}
 * @public
 * @api
 */
export const WMS = 'WMS';

/**
 * Tipo GeoTIFF (). Definido por una url,
 * @const
 * @type {string}
 * @public
 * @api
 */
export const GeoTIFF = 'GeoTIFF';

/**
 * Tipo WFS (Web Feature Service). Estándar OGC para la
 * transferencia de información geográfica, donde los elementos o
 * características geográficas se transmiten en su totalidad al cliente.
 * @const
 * @type {string}
 * @public
 * @api
 */
export const WFS = 'WFS';

/**
 * OGCAPIFeatures(OGC API - Features) es un estándar que ofrece la
 * capacidad de crear, modificar y consultar datos
 * espaciales en la Web y especifica requisitos y recomendaciones para las API que desean seguir una
 * forma estándar de compartir datos de entidades.
 * @const
 * @type {string}
 * @public
 * @api
 */
export const OGCAPIFeatures = 'OGCAPIFeatures';

/**
 * Tipo WMTS (Web Map Tile Service). Es un estándar OGC para servir
 * información geográfica en forma de mosaicos pregenerados en
 * resoluciones específicas.
 * @const
 * @type {string}
 * @public
 * @api
 */
export const WMTS = 'WMTS';

/**
 * Tipo OSM (Open Street Map).
 * @const
 * @type {string}
 * @public
 * @api
 */
export const OSM = 'OSM';

/**
 * Tipo XYZ. Es un servicio de información geográfica en forma de
 * mosaicos donde cada uno representa una combinación de tres
 * parámetros.
 * @const
 * @type {string}
 * @public
 * @api
 */
export const XYZ = 'XYZ';

/**
 * Tipo TMS (Tile Map Service). Servicio de información
 * geográfica en forma de mosaicos muy similar a las capas XYZ.
 * @const
 * @type {string}
 * @public
 * @api
 */
export const TMS = 'TMS';

/**
 * Tipo GeoJSON. Es un formato de intercambio de información
 * geográfica muy extendido que permite que todos los elementos
 * estén en el cliente.
 * @const
 * @type {string}
 * @public
 * @api
 */
export const GeoJSON = 'GeoJSON';

/**
 * Tipo Vector. El cliente dispone de los elementos o características
 * geográficas que forman la capa, y de cada uno de ellos posee a su vez
 * todos sus atributos.
 * @const
 * @type {string}
 * @public
 * @api
 */
export const Vector = 'Vector';

/**
 * Tipo Vector Tile. Se sirven en forma de teselas que contienen
 * la información vectorial del área que delimitan.
 * @const
 * @type {string}
 * @public
 * @api
 */
export const MVT = 'MVT';

/**
 * MapLibre. Se sirven en forma de teselas que contienen
 * la información vectorial del área que delimitan.
 * @const
 * @type {string}
 * @public
 * @api
 */
export const MapLibre = 'MapLibre';

/**
 * Tipo MBTiles. Es un formato de archivo para contener conjuntos
 * de imágenes (tilesets) bajo una estructura de base de datos SQLite.
 * @const
 * @type {string}
 * @public
 * @api
 */
export const MBTiles = 'MBTiles';

/**
 * Tipo Vector Tile. Es un formato de archivo para contener conjuntos
 * de imágenes (tilesets) en forma de puntos, líneas y polígonos bajo
 * una estructura de base de datos SQLite.
 * @const
 * @type {string}
 * @public
 * @api
 */
export const MBTilesVector = 'MBTilesVector';

/**
 * Tipo GenericVector. Es un tipo de capa que permite cualquier tipo de servicio.
 * @const
 * @type {string}
 * @public
 * @api
 */
export const GenericVector = 'GenericVector';

/**
 * Tipo GenericRaster. Es un tipo de capa que permite cualquier tipo de servicio.
 * @const
 * @type {string}
 * @public
 * @api
 */
export const GenericRaster = 'GenericRaster';

/**
 * Tipo LayerGroup. Es un tipo de capa que permite agrupas capas.
 * @const
 * @type {string}
 * @public
 * @api
 */
export const LayerGroup = 'LayerGroup';

/**
 * Todos los tipos de capas
 * @const
 * @type {object}
 *
 */
const layertypes = {
  KML,
  WMS,
  GeoTIFF,
  WFS,
  WMTS,
  OSM,
  GeoJSON,
  Vector,
  MVT,
  MapLibre,
  XYZ,
  TMS,
  MBTiles,
  MBTilesVector,
  OGCAPIFeatures,
  GenericRaster,
  GenericVector,
  LayerGroup,
};

/**
 * Transforma el tipo de capa a un tipo de capa soportado por API-CNIG.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 *
 * @public
 * @function
 * @param {string} rawType Tipo de capa.
 * @returns {string} Tipo de capa soportado por API-CNIG.
 */
export const parse = (rawType) => {
  let type = normalize(rawType, true);
  if (type === 'WMS_FULL') {
    type = WMS;
  } else if (type === 'WFST') {
    type = WFS;
  } else {
    type = Object.keys(layertypes).find((knowType) => {
      const knowTypeVal = layertypes[knowType];
      return (isString(knowTypeVal) && (normalize(knowTypeVal, true) === type));
    });
  }
  return layertypes[type];
};

/**
 * Devuelve los tipos de capa soportados por API-CNIG.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 * @public
 * @function
 * @param {string} type Tipo de capa.
 */
export const know = (type) => {
  const knowTypes = [
    KML,
    WMS,
    GeoTIFF,
    WFS,
    WMTS,
    MVT,
    MapLibre,
    XYZ,
    TMS,
    MBTiles,
    MBTilesVector,
    OGCAPIFeatures,
    LayerGroup,
  ];
  return (knowTypes.indexOf(parse(type)) !== -1);
};

/**
 * Este comentario no se verá, es necesario incluir
 * una exportación por defecto para que el compilador
 * muestre las funciones.
 *
 * Esto se produce por al archivo normaliza-exports.js
 * @api stable
 */
export default {};
