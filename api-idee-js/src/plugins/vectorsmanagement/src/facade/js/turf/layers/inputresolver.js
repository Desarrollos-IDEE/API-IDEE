import {
  ErrorKey, InputScope, OperationError, SkipReason,
} from '../turftypes';
import LayerCatalog from './layercatalog';
import SelectionRegistry from './selectionregistry';

/**
 * Entrada configurada de un papel: capa y ámbito de sus elementos.
 * @typedef {Object} InputEntry
 * @property {String} layerId Identificador de la capa (idLayer).
 * @property {InputScope} scope Ámbito.
 * @property {String} [featureKey] Elemento de la selección guardada de la
 * capa (ámbito InputScope.FEATURE). Ver SelectionRegistry.keyOf.
 */

/**
 * Capa y elementos de una entrada.
 * @typedef {Object} EntryLookup
 * @property {IDEE.layer.Vector|null} layer Capa o null si no existe.
 * @property {Array<IDEE.Feature>|undefined} features Elementos según el ámbito;
 * undefined si no se pueden obtener.
 * @property {OperationError|null} error Motivo por el que la entrada no es válida.
 */

/**
 * Elementos de entrada sin resultado, agrupados por capa y motivo.
 * @typedef {Object} SkippedInput
 * @property {InputRole} role Papel.
 * @property {String} layer Nombre visible de la capa.
 * @property {SkipReason} reason Motivo.
 * @property {Number} count Número de elementos.
 */

/**
 * Indica si una geometría GeoJSON tiene coordenadas.
 *
 * @param {Object|null} geometry Geometría GeoJSON.
 * @returns {Boolean}
 */
const hasCoordinates = (geometry) => {
  if (!geometry) return false;
  if (geometry.geometries) return geometry.geometries.length > 0;
  return Array.isArray(geometry.coordinates) && geometry.coordinates.length > 0;
};

/**
 * Nombre visible de una capa.
 *
 * @param {IDEE.layer.Vector} layer Capa.
 * @returns {String} Nombre.
 */
export const layerTitle = (layer) => layer.legend || layer.name || layer.idLayer;

/**
 * Busca la capa de una entrada y sus elementos según el ámbito. Si la
 * entrada no es válida, devuelve el error y, cuando se pueden obtener, los
 * elementos que siguen siendo válidos (para describirlos).
 *
 * @param {InputEntry} entry Entrada.
 * @param {LayerCatalog} catalog Capas candidatas.
 * @param {SelectionRegistry} selections Selecciones guardadas.
 * @returns {EntryLookup} Capa, elementos y error.
 */
export const lookupEntry = (entry, catalog, selections) => {
  const layer = entry.layerId ? catalog.findLayer(entry.layerId) : null;
  const invalid = (key, vars) => ({
    layer, features: undefined, error: new OperationError(key, vars),
  });
  if (layer === null) return invalid(ErrorKey.LAYER_NOT_FOUND, { layer: entry.layerId });
  const title = layerTitle(layer);
  if (entry.scope === InputScope.SELECTION || entry.scope === InputScope.FEATURE) {
    const snapshot = selections.get(layer.idLayer);
    if (!snapshot) return invalid(ErrorKey.NO_SELECTION, { layer: title });
    if (entry.scope === InputScope.FEATURE) {
      const feature = SelectionRegistry.findByKey(snapshot, entry.featureKey);
      return feature === null
        ? invalid(ErrorKey.FEATURE_NOT_SELECTED, { layer: title })
        : { layer, features: [feature], error: null };
    }
    const { features, missing } = SelectionRegistry.check(snapshot);
    const error = missing > 0
      ? new OperationError(ErrorKey.STALE_SELECTION, { layer: title, n: missing }) : null;
    return { layer, features, error };
  }
  if (entry.scope === InputScope.RESULT && !LayerCatalog.isResult(layer)) {
    return invalid(ErrorKey.NOT_RESULT, { layer: title });
  }
  return { layer, features: layer.getFeatures(), error: null };
};

/**
 * @classdesc
 * Convierte la configuración de las entradas de una operación (capa y
 * ámbito de cada papel) en elementos normalizados en EPSG:4326 que
 * conservan su procedencia. No modifica los elementos de origen.
 */
export default class InputResolver {
  /**
   * @constructor
   * @param {LayerCatalog} catalog Capas candidatas.
   * @param {SelectionRegistry} selections Selecciones guardadas.
   * @param {{toGeoJSON: function(Array<IDEE.Feature>): Object}} converter Conversión
   * de elementos a un FeatureCollection GeoJSON en EPSG:4326.
   */
  constructor(catalog, selections, converter) {
    this.catalog_ = catalog;
    this.selections_ = selections;
    this.converter_ = converter;
  }

  /**
   * Devuelve la capa y los elementos de una entrada según su ámbito.
   *
   * @param {InputEntry} entry Entrada.
   * @returns {{layer: IDEE.layer.Vector, features: Array<IDEE.Feature>}} Capa y elementos.
   * @throws {OperationError} Si la capa no existe o el ámbito no es válido.
   */
  featuresOf(entry) {
    const { layer, features, error } = lookupEntry(entry, this.catalog_, this.selections_);
    if (error) throw error;
    return { layer, features };
  }

  /**
   * Resuelve las entradas de todos los papeles de una operación.
   *
   * @param {LayerOperation} op Operación.
   * @param {Object<InputRole, Array<InputEntry>>} entriesByRole Entradas por papel.
   * @returns {{inputs: Object<InputRole, Array<InputFeature>>, skipped: Array<SkippedInput>}}
   * Elementos por papel y elementos omitidos.
   * @throws {OperationError} Si alguna entrada no es válida o se queda sin elementos.
   */
  resolve(op, entriesByRole) {
    const skipped = [];
    const inputs = op.inputs.reduce((byRole, spec) => {
      const features = (entriesByRole[spec.role] || [])
        .flatMap((entry, entryIndex) => this.normalize_(spec, entry, entryIndex, skipped));
      if (features.length === 0) {
        throw new OperationError(ErrorKey.NO_FEATURES, { role: spec.role });
      }
      return { ...byRole, [spec.role]: features };
    }, {});
    return { inputs, skipped };
  }

  /**
   * Normaliza los elementos de una entrada. Los que no tienen geometría o la
   * tienen de un tipo no admitido se cuentan como omitidos.
   *
   * @private
   * @param {InputRoleSpec} spec Papel.
   * @param {InputEntry} entry Entrada.
   * @param {Number} entryIndex Posición de la entrada en el papel.
   * @param {Array<SkippedInput>} skipped Omitidos (se completa).
   * @returns {Array<InputFeature>} Elementos.
   */
  normalize_(spec, entry, entryIndex, skipped) {
    const { layer, features } = this.featuresOf(entry);
    const positions = new Map(layer.getFeatures().map((feature, i) => [feature, i]));
    const layerRef = Object.freeze({
      id: layer.idLayer, name: layer.name, legend: layerTitle(layer),
    });
    const counts = { [SkipReason.NO_GEOMETRY]: 0, [SkipReason.UNSUPPORTED_TYPE]: 0 };
    const { features: geojsonFeatures } = this.converter_.toGeoJSON(features);
    const normalized = geojsonFeatures.flatMap(({ geometry, properties }, i) => {
      if (!hasCoordinates(geometry)) {
        counts[SkipReason.NO_GEOMETRY] += 1;
        return [];
      }
      if (!spec.types.includes(geometry.type)) {
        counts[SkipReason.UNSUPPORTED_TYPE] += 1;
        return [];
      }
      const feature = features[i];
      const index = positions.has(feature) ? positions.get(feature) : i;
      return [Object.freeze({
        key: `${spec.role}:${entryIndex}:${i}`,
        uid: `${layerRef.id}#${index}`,
        role: spec.role,
        layer: layerRef,
        featureId: feature.getId(),
        index,
        scope: entry.scope,
        geometry,
        properties: Object.freeze({ ...(properties || {}) }),
        bbox: turf.bbox(geometry),
        getSourceGeometry: () => JSON.parse(JSON.stringify(feature.getGeoJSON().geometry)),
      })];
    });
    Object.keys(counts).filter((reason) => counts[reason] > 0).forEach((reason) => {
      skipped.push({
        role: spec.role, layer: layerRef.legend, reason, count: counts[reason],
      });
    });
    return normalized;
  }
}
