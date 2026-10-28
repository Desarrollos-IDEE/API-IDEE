/**
 * Selección guardada de una capa.
 * @typedef {Object} SelectionSnapshot
 * @property {IDEE.layer.Vector} layer Capa.
 * @property {Array<{feature: IDEE.Feature, id: String}>} entries Elementos y sus identificadores.
 * @property {Number} capturedAt Fecha de la captura (ms).
 */

/**
 * Estado actual de una selección guardada.
 * @typedef {Object} SnapshotState
 * @property {Array<IDEE.Feature>} features Elementos que siguen en la capa.
 * @property {Number} missing Elementos que ya no están en la capa.
 */

/**
 * @classdesc
 * Selecciones guardadas por capa para las operaciones de Turf. Cada capa
 * tiene como mucho una selección, que solo se sustituye con otra selección
 * de esa misma capa o se elimina de forma explícita. Es independiente de la
 * selección del plugin, que solo existe para la capa activa.
 */
export default class SelectionRegistry {
  /**
   * @constructor
   */
  constructor() {
    this.snapshots_ = new Map();
    this.listeners_ = [];
  }

  /**
   * Guarda los elementos seleccionados de una capa, sustituyendo su selección
   * anterior. Solo se guardan los que pertenecen a la capa; si no queda
   * ninguno, se elimina la selección de esa capa.
   *
   * @param {IDEE.layer.Vector} layer Capa.
   * @param {Array<IDEE.Feature>} features Elementos seleccionados.
   */
  capture(layer, features) {
    const members = new Set(layer.getFeatures());
    const entries = features.filter((feature) => members.has(feature))
      .map((feature) => ({ feature, id: feature.getId() }));
    if (entries.length > 0) {
      this.snapshots_.set(layer.idLayer, { layer, entries, capturedAt: Date.now() });
      this.notify_();
    } else {
      this.remove(layer.idLayer);
    }
  }

  /**
   * Devuelve la selección guardada de una capa.
   *
   * @param {String} layerId Identificador de la capa (idLayer).
   * @returns {SelectionSnapshot|undefined} Selección.
   */
  get(layerId) {
    return this.snapshots_.get(layerId);
  }

  /**
   * Devuelve las selecciones guardadas, en el orden en que se guardaron.
   *
   * @returns {Array<SelectionSnapshot>} Selecciones.
   */
  list() {
    return [...this.snapshots_.values()];
  }

  /**
   * Elimina la selección guardada de una capa.
   *
   * @param {String} layerId Identificador de la capa (idLayer).
   */
  remove(layerId) {
    if (this.snapshots_.delete(layerId)) {
      this.notify_();
    }
  }

  /**
   * Elimina todas las selecciones guardadas.
   */
  clear() {
    if (this.snapshots_.size > 0) {
      this.snapshots_.clear();
      this.notify_();
    }
  }

  /**
   * Elimina las selecciones de las capas que ya no están en el mapa.
   *
   * @param {Array<IDEE.Layer>} layers Capas del mapa.
   */
  prune(layers) {
    const present = new Set(layers);
    this.list().filter(({ layer }) => !present.has(layer))
      .forEach(({ layer }) => this.remove(layer.idLayer));
  }

  /**
   * Comprueba qué elementos de una selección guardada siguen en su capa. Se
   * buscan por referencia y, si la capa se ha recargado, por identificador.
   *
   * @param {SelectionSnapshot} snapshot Selección.
   * @returns {SnapshotState} Estado.
   */
  static check(snapshot) {
    const members = new Set(snapshot.layer.getFeatures());
    const found = snapshot.entries.map(({ feature, id }) => {
      if (members.has(feature)) return feature;
      const byId = id === undefined || id === null ? null : snapshot.layer.getFeatureById(id);
      return byId && members.has(byId) ? byId : null;
    });
    return {
      features: found.filter((feature) => feature !== null),
      missing: found.filter((feature) => feature === null).length,
    };
  }

  /**
   * Suscribe una función a los cambios de las selecciones.
   *
   * @param {function(): void} listener Función.
   * @returns {function(): void} Función que cancela la suscripción.
   */
  onChange(listener) {
    this.listeners_.push(listener);
    return () => {
      this.listeners_ = this.listeners_.filter((l) => l !== listener);
    };
  }

  /**
   * Avisa a los suscriptores de un cambio.
   *
   * @private
   */
  notify_() {
    this.listeners_.forEach((listener) => listener());
  }
}
