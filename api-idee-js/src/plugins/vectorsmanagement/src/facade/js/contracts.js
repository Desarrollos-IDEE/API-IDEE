/**
 * Contratos entre VectorsManagement y cada plataforma.
 */
import { getValue } from './i18n/language';

/**
 * Factoría de controles por plataforma. Las entradas ausentes indican capacidades no disponibles.
 *
 * @typedef {Object} ImplementationFactory
 * @property {function():IDEE.impl.Control} [vectorsManagement] Control principal.
 * @property {function(IDEE.Map):Object} [selection] Implementación de selección.
 * @property {function(IDEE.Map):Object} [creation] Implementación de dibujo.
 * @property {function(IDEE.Map):Object} [edition] Implementación de edición.
 * @property {function(IDEE.Map):Object} [analysis] Implementación de análisis.
 * @property {function(IDEE.Map):Object} [turf] Conversión GeoJSON.
 */

const contract = (...methods) => Object.freeze(methods);

/**
 * Realce de objetos seleccionados.
 * - getApiIdeeFeatureClone(feature: IDEE.Feature): IDEE.Feature. Devuelve una copia.
 * - getExtentFeature(feature: IDEE.Feature): IDEE.Feature. Devuelve su extensión.
 * @const
 * @type {Array<String>}
 */
export const FEATURE_EMPHASIS = contract('getApiIdeeFeatureClone', 'getExtentFeature');

/**
 * Ajuste opcional de la interacción activa.
 * - updateSnap(options: Object): void. Actualiza el ajuste.
 * @const
 * @type {Array<String>}
 */
export const SNAPPING = contract('updateSnap');

/**
 * Selección de objetos de la capa gestionada.
 * - activateSelection(): void. Selecciona y notifica `onSelect({ features })`.
 * - removeSelectInteraction(): void.
 * @const
 * @type {Array<String>}
 */
export const SELECT_INTERACTION = contract('activateSelection', 'removeSelectInteraction');

/**
 * Dibujo de objetos en la capa gestionada.
 * - setLayer(layer: IDEE.layer.Vector): void. Define la capa de dibujo.
 * - addDrawInteraction(geometry: String, snapOptions: Object): void. Inicia el dibujo.
 * - removeDrawInteraction(): void.
 * - addFigureInteraction(snapOptions: Object): void. Inicia el dibujo de figuras.
 * - removeFigureDrawInteraction(): void.
 * - changeFigure(evt: Event): void. Actualiza la figura seleccionada.
 * - clearVectorSource(): void. Vacía el origen de dibujo.
 * - hasFeature(feature: IDEE.Feature): Boolean. Indica si la capa de dibujo ha
 * incorporado el objeto.
 * - getFeatureCoordinates(feature: IDEE.Feature): Array. Obtiene coordenadas del mapa.
 * - createMultiGeometryFeature(type: String, coordinates: Array): IDEE.Feature.
 * - createPointFeature(coordinates: Array, srs: String): IDEE.Feature. Crea un punto.
 * @const
 * @type {Array<String>}
 */
export const DRAWING = contract(
  'setLayer',
  'addDrawInteraction',
  'removeDrawInteraction',
  'addFigureInteraction',
  'removeFigureDrawInteraction',
  'changeFigure',
  'clearVectorSource',
  'hasFeature',
  'getFeatureCoordinates',
  'createMultiGeometryFeature',
  'createPointFeature',
);

/**
 * Selección y edición de vértices.
 * - activateSelection(snapOptions: Object): void. Selecciona y habilita la edición.
 * - removeSelectInteraction(): void.
 * - removeEditInteraction(): void.
 * @const
 * @type {Array<String>}
 */
export const MODIFY_INTERACTION = contract('activateSelection', 'removeSelectInteraction', 'removeEditInteraction');

/**
 * Dibujo de agujeros en polígonos.
 * - addHoleDrawInteraction(snapOptions: Object): void. Inicia el dibujo.
 * - removeDrawHoleInteraction(): void.
 * @const
 * @type {Array<String>}
 */
export const HOLE_INTERACTION = contract('addHoleDrawInteraction', 'removeDrawHoleInteraction');

/**
 * Rotación, desplazamiento y escalado de objetos.
 * @const
 * @type {Array<String>}
 */
export const TRANSFORM_INTERACTIONS = contract(
  'addRotateInteraction',
  'refreshRotateSelection',
  'removeRotateInteraction',
  'addMoveInteraction',
  'refreshMoveSelection',
  'removeMoveInteraction',
  'addScaleInteraction',
  'refreshScaleSelection',
  'removeScaleInteraction',
);

/**
 * Operaciones sobre datos de objetos.
 * - getFeatureExtent(feature: IDEE.Feature): Array<Number>. Obtiene la extensión.
 * - unsetAttribute(feature: IDEE.Feature, name: String): void. Elimina un atributo.
 * @const
 * @type {Array<String>}
 */
export const FEATURE_DATA = contract('getFeatureExtent', 'unsetAttribute');

/**
 * Medición de objetos geográficos.
 * - getFeatureCoordinates(feature: IDEE.Feature): Array. Obtiene coordenadas.
 * - calculateFeatureLengthEllipsoidal(feature: IDEE.Feature): Number. Longitud en metros.
 * - getFeatureArea(feature: IDEE.Feature): Number. Área en metros cuadrados.
 * - getAreaGeoJSON(features: Array<IDEE.Feature>): Array<Object>. GeoJSON con áreas.
 * @const
 * @type {Array<String>}
 */
export const MEASUREMENT = contract(
  'getFeatureCoordinates',
  'calculateFeatureLengthEllipsoidal',
  'getFeatureArea',
  'getAreaGeoJSON',
);

/**
 * Cálculo de altitudes y perfiles.
 * - calculatePoint(feature: IDEE.Feature): Promise<Object|undefined>.
 * Devuelve coordenadas y altitud.
 * - calculateProfile(feature: IDEE.Feature): Promise<Array|undefined>.
 * Devuelve puntos [x, y, altitud].
 * - showProfile(profile: Array, graphs: Array<String>|String): void. Muestra el perfil
 * con las gráficas indicadas ('profile' y/o 'elevationGain'), sustituyendo al anterior.
 * - closeProfile(): void. Cierra el perfil mostrado, si lo hay.
 * - get3DLength(profile: Array): Number. Devuelve la longitud 3D en metros.
 * @const
 * @type {Array<String>}
 */
export const ELEVATION = contract('calculatePoint', 'calculateProfile', 'showProfile', 'closeProfile', 'get3DLength');

/**
 * Áreas de influencia (buffer).
 * - createBufferFeature(feature: IDEE.Feature, distance: Number, parentId): IDEE.Feature.
 * Crea un buffer en metros.
 * - getLayerId(layer: IDEE.layer.Vector): Identificador de capa.
 * - getParentId(feature: IDEE.Feature): Identificador de la capa de origen.
 * @const
 * @type {Array<String>}
 */
export const BUFFER = contract('createBufferFeature', 'getLayerId', 'getParentId');

/**
 * Información de proyecciones.
 * - getProjectionInfo(code: String): Object. Devuelve códigos, unidades, datum y proyección.
 * @const
 * @type {Array<String>}
 */
export const PROJECTION_INFO = contract('getProjectionInfo');

/**
 * Conversión GeoJSON para Turf.js.
 * - toGeoJSON(features: Array<IDEE.Feature>): Object. Convierte a EPSG:4326.
 * - fromGeoJSON(geojson: Object, dataProjection: String): Array<IDEE.Feature>.
 * Convierte a features.
 * @const
 * @type {Array<String>}
 */
export const GEOJSON_CONVERSION = contract('toGeoJSON', 'fromGeoJSON');

/**
 * Zona de edición fija por sesión.
 * - getViewExtent(): Array<Number>. Obtiene la extensión en EPSG:4326.
 * - addEditingBoundary(bbox: Array<Number>): void. Muestra el contorno.
 * - removeEditingBoundary(): void.
 * @const
 * @type {Array<String>}
 */
export const EDITING_AREA = contract('getViewExtent', 'addEditingBoundary', 'removeEditingBoundary');

/**
 * Comprueba si una implementación cumple los contratos.
 *
 * @public
 * @function
 * @param {Object} impl Implementación.
 * @param {...Array<String>} contracts Contratos requeridos.
 * @return {Boolean} Indica si cumple los contratos.
 * @api
 */
export const implementsContracts = (impl, ...contracts) => Boolean(impl)
  && contracts.every((methods) => methods.every((method) => typeof impl[method] === 'function'));

/**
 * Valida los contratos requeridos por un control.
 *
 * @public
 * @function
 * @param {Object} impl Implementación.
 * @param {Array<Array<String>>} contracts Contratos requeridos.
 * @param {String} errorKey Clave i18n del error.
 * @return {Object} Implementación validada.
 * @throws {String} Si no cumple los contratos.
 * @api
 */
export const requireImplementation = (impl, contracts, errorKey) => {
  if (!implementsContracts(impl, ...contracts)) {
    IDEE.exception(getValue(errorKey));
  }
  return impl;
};
