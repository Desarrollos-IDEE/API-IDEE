import { FieldIssue, LayerIssue } from '../turftypes';

/**
 * Tipos de capa cuyos elementos están recortados por teselas y solo existen
 * para las teselas cargadas.
 * @const
 * @type {Array<String>}
 */
const TILED_TYPES = Object.freeze(['MVT', 'MBTilesVector']);

/**
 * Propiedades técnicas que añaden API-IDEE o el plugin a los elementos y no
 * se copian a la salida.
 * @const
 * @type {Array<String>}
 */
export const TECHNICAL_FIELDS = Object.freeze(['geometry', 'vendor', 'parentID']);

/**
 * Prefijo del nombre interno de las capas de resultado de Turf
 * (turf_<operación>_<n>_<aleatorio>).
 * @const
 * @type {String}
 */
export const RESULT_NAME_PREFIX = 'turf_';

/**
 * Nombre interno de una capa de resultado de Turf.
 * @const
 * @type {RegExp}
 */
const RESULT_NAME = new RegExp(`^${RESULT_NAME_PREFIX}[A-Za-z]+_\\d+_`);

/**
 * Resumen de una capa (o de una parte de sus elementos) calculado sin
 * convertir sus geometrías.
 * @typedef {Object} LayerInfo
 * @property {IDEE.layer.Vector} layer Capa.
 * @property {String} id Identificador (idLayer).
 * @property {String} title Nombre visible.
 * @property {Boolean} isResult Indica si es el resultado de una operación de Turf.
 * @property {Boolean} tiled Indica si es una capa teselada.
 * @property {Number} count Número de elementos.
 * @property {Object<GeometryType, Number>} typeCounts Elementos por tipo de geometría.
 * @property {Array<String>} fields Campos que se pueden copiar a la salida.
 * @property {Array<{name: String, issue: FieldIssue}>} excludedFields Campos que no.
 */

/**
 * Indica si el valor de un atributo es simple (texto, número o booleano).
 *
 * @param {*} value Valor.
 * @returns {Boolean}
 */
const isSimpleValue = (value) => value === null || value === undefined || typeof value !== 'object';

/**
 * Recorre los atributos de los elementos y clasifica sus campos, en el orden
 * en que aparecen.
 *
 * @param {Array<IDEE.Feature>} features Elementos.
 * @returns {{fields: Array<String>, excludedFields: Array<Object>}} Campos.
 */
const classifyFields = (features) => {
  const issues = new Map();
  features.forEach((feature) => {
    const attributes = feature.getAttributes() || {};
    Object.keys(attributes).forEach((name) => {
      if (!issues.has(name)) {
        issues.set(name, TECHNICAL_FIELDS.includes(name) ? FieldIssue.TECHNICAL : null);
      }
      if (issues.get(name) === null && !isSimpleValue(attributes[name])) {
        issues.set(name, FieldIssue.COMPLEX);
      }
    });
  });
  const names = [...issues.keys()];
  return {
    fields: names.filter((name) => issues.get(name) === null),
    excludedFields: names.filter((name) => issues.get(name) !== null)
      .map((name) => ({ name, issue: issues.get(name) })),
  };
};

/**
 * Cuenta los elementos por tipo de geometría.
 *
 * @param {Array<IDEE.Feature>} features Elementos.
 * @returns {Object<GeometryType, Number>} Elementos por tipo.
 */
const countTypes = (features) => features.reduce((counts, feature) => {
  const geometry = feature.getGeometry();
  return geometry && geometry.type
    ? { ...counts, [geometry.type]: (counts[geometry.type] || 0) + 1 } : counts;
}, {});

/**
 * @classdesc
 * Capas del mapa que pueden usarse como entrada de las operaciones de capas,
 * con independencia de cómo se hayan añadido: capas vectoriales (y sus
 * subtipos GeoJSON, KML, WFS, OGCAPIFeatures...) visibles en el árbol de
 * capas. Describe sus elementos sin modificarlos ni convertirlos.
 */
export default class LayerCatalog {
  /**
   * @constructor
   * @param {function(): Array<IDEE.Layer>} listLayers Devuelve las capas del
   * mapa, incluidas las de los grupos.
   */
  constructor(listLayers) {
    this.listLayers_ = listLayers;
  }

  /**
   * Devuelve las capas vectoriales candidatas.
   *
   * @returns {Array<IDEE.layer.Vector>} Capas.
   */
  getLayers() {
    return this.listLayers_().filter((layer) => (layer instanceof IDEE.layer.Vector
      || layer instanceof IDEE.layer.GenericVector) && layer.displayInLayerSwitcher);
  }

  /**
   * Busca una capa candidata por su identificador.
   *
   * @param {String} id Identificador (idLayer).
   * @returns {IDEE.layer.Vector|null} Capa.
   */
  findLayer(id) {
    return this.getLayers().find((layer) => layer.idLayer === id) || null;
  }

  /**
   * Describe una capa o una parte de sus elementos.
   *
   * @param {IDEE.layer.Vector} layer Capa.
   * @param {Array<IDEE.Feature>} [features] Elementos; por defecto, todos los de la capa.
   * @returns {LayerInfo} Descripción.
   */
  describe(layer, features) {
    const tiled = TILED_TYPES.includes(layer.type);
    let described = [];
    if (!tiled) described = features || layer.getFeatures();
    return {
      layer,
      id: layer.idLayer,
      title: layer.legend || layer.name || layer.idLayer,
      isResult: LayerCatalog.isResult(layer),
      tiled,
      count: described.length,
      typeCounts: countTypes(described),
      ...classifyFields(described),
    };
  }

  /**
   * Indica si la capa es el resultado de una operación de Turf.
   *
   * @param {IDEE.Layer} layer Capa.
   * @returns {Boolean}
   */
  static isResult(layer) {
    return typeof layer.name === 'string' && RESULT_NAME.test(layer.name);
  }

  /**
   * Comprueba si una capa descrita se puede usar en un papel.
   *
   * @param {LayerInfo} info Descripción de la capa.
   * @param {InputRoleSpec} spec Papel.
   * @returns {{issue: LayerIssue, types: Array<GeometryType>}|null} Motivo o null.
   */
  static issueFor(info, spec) {
    if (info.tiled) return { issue: LayerIssue.TILED, types: [] };
    if (info.count === 0) return { issue: LayerIssue.NO_FEATURES, types: [] };
    const types = Object.keys(info.typeCounts);
    if (!types.some((type) => spec.types.includes(type))) {
      return { issue: LayerIssue.TYPES, types };
    }
    return null;
  }

  /**
   * Número de elementos que se omitirán en un papel por no tener geometría
   * o tenerla de un tipo no admitido.
   *
   * @param {LayerInfo} info Descripción de la capa.
   * @param {InputRoleSpec} spec Papel.
   * @returns {Number} Elementos omitidos.
   */
  static omittedFor(info, spec) {
    const admitted = Object.keys(info.typeCounts)
      .filter((type) => spec.types.includes(type))
      .reduce((sum, type) => sum + info.typeCounts[type], 0);
    return info.count - admitted;
  }

  /**
   * Tipos de geometría de la capa admitidos en un papel.
   *
   * @param {LayerInfo} info Descripción de la capa.
   * @param {InputRoleSpec} spec Papel.
   * @returns {Array<GeometryType>} Tipos.
   */
  static admittedTypes(info, spec) {
    return Object.keys(info.typeCounts).filter((type) => spec.types.includes(type));
  }
}
