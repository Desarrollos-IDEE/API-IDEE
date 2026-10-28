import AttributeSchema from './attributes/attributeschema';
import LayerCatalog from './layers/layercatalog';
import SelectionRegistry from './layers/selectionregistry';
import { layerTitle } from './layers/inputresolver';
import { TURF_PROJECTION } from './layers/resultlayers';
import {
  ErrorKey, InputScope, OperationError, ParamType,
} from './turftypes';

/**
 * Configuración de una ejecución de una operación de capas.
 * @typedef {Object} LayerOperationConfig
 * @property {Object<InputRole, Array<InputEntry>>} inputs Entradas por papel.
 * @property {Object} [params] Valores de los parámetros; los que falten toman
 * su valor por defecto.
 * @property {Object<InputRole, {fields: (Array<String>|undefined), prefix: String}>}
 * [attributes] Campos y prefijo por papel; si no se indican los campos, se
 * copian todos.
 * @property {String} [outputName] Nombre de la capa de salida.
 */

/**
 * Diagnóstico de una entrada configurada.
 * @typedef {Object} EntryReport
 * @property {InputEntry} entry Entrada.
 * @property {LayerInfo|null} info Descripción de sus elementos (null si no se pueden obtener).
 * @property {Number} omitted Elementos que se omitirán por su geometría.
 */

/**
 * Diagnóstico de una configuración, calculado sin convertir geometrías.
 * @typedef {Object} CheckReport
 * @property {Array<OperationError>} errors Errores que impiden ejecutar.
 * @property {Object<InputRole, Array<EntryReport>>} entries Entradas por papel.
 * @property {Object<InputRole, RoleMeta>} meta Resumen de cada papel.
 * @property {Object} params Valores de los parámetros.
 * @property {Object<ParamName, Array<String>>} options Opciones válidas de los desplegables.
 * @property {Object<InputRole, {available: Array<String>, excluded: Array<Object>}>} fields
 * Campos de cada papel.
 * @property {AttributeSchema} schema Esquema de la salida.
 */

/**
 * Resultado de una ejecución.
 * @typedef {Object} RunResult
 * @property {IDEE.layer.Vector|null} layer Capa creada o null si no hay resultados.
 * @property {Number} count Número de elementos de la capa.
 * @property {Array<Object>} skipped Elementos de entrada sin resultado.
 */

/**
 * Valores únicos conservando el orden.
 *
 * @param {Array<*>} values Valores.
 * @returns {Array<*>} Valores sin repetir.
 */
const unique = (values) => [...new Set(values)];

/**
 * Resumen de los elementos de cada papel ya resueltos.
 *
 * @param {Object<InputRole, Array<InputFeature>>} inputs Elementos por papel.
 * @returns {Object<InputRole, RoleMeta>} Resumen.
 */
const metaOfInputs = (inputs) => Object.keys(inputs).reduce((meta, role) => ({
  ...meta,
  [role]: {
    types: unique(inputs[role].map((feature) => feature.geometry.type)),
    count: inputs[role].length,
  },
}), {});

/**
 * Comprueba el valor de un parámetro.
 *
 * @param {TurfParam} param Parámetro.
 * @param {*} value Valor.
 * @param {Array<String>} [available] Opciones válidas (desplegables).
 * @returns {OperationError|null} Error o null si es válido.
 */
const checkParam = (param, value, available) => {
  const invalid = new OperationError(ErrorKey.PARAM, { param: param.name });
  if (param.type === ParamType.NUMBER) {
    if (value === undefined || value === null) return param.required === false ? null : invalid;
    if (typeof value !== 'number' || Number.isNaN(value)) return invalid;
    if ((param.min !== undefined && value < param.min)
      || (param.max !== undefined && value > param.max)) return invalid;
    return null;
  }
  if (param.type === ParamType.CHECKBOX) return typeof value === 'boolean' ? null : invalid;
  if (!param.options.includes(value)) return invalid;
  if (available && !available.includes(value)) {
    return new OperationError(ErrorKey.OPTION_UNAVAILABLE, { param: param.name });
  }
  return null;
};

/**
 * Comprueba el número de capas de un papel y que no se repitan.
 *
 * @param {InputRoleSpec} spec Papel.
 * @param {Array<InputEntry>} entries Entradas.
 * @param {Array<OperationError>} errors Errores (se completa).
 */
const checkRoleEntries = (spec, entries, errors) => {
  const maxLayers = spec.maxLayers || 1;
  if (entries.length === 0) {
    errors.push(new OperationError(ErrorKey.NO_LAYER, { role: spec.role }));
  } else if (entries.length > maxLayers) {
    errors.push(new OperationError(ErrorKey.MAX_LAYERS, { role: spec.role, n: maxLayers }));
  }
  const ids = entries.map((entry) => entry.layerId);
  if (unique(ids).length !== ids.length) {
    errors.push(new OperationError(ErrorKey.DUPLICATED_LAYER, { role: spec.role }));
  }
};

/**
 * @classdesc
 * Ejecuta las operaciones de capas: comprueba la configuración, resuelve las
 * entradas, calcula los resultados con su procedencia, construye sus
 * atributos y crea la capa de salida. No muestra mensajes: devuelve el
 * resultado o lanza OperationError.
 */
export default class LayerOperationRunner {
  /**
   * @constructor
   * @param {Object} deps Dependencias.
   * @param {IDEE.Map} deps.map Mapa.
   * @param {LayerCatalog} deps.catalog Capas candidatas.
   * @param {SelectionRegistry} deps.selections Selecciones guardadas.
   * @param {InputResolver} deps.resolver Resolución de las entradas.
   * @param {ResultLayerWriter} deps.writer Creación de la capa de salida.
   * @param {function(): Boolean} deps.isAvailable Indica si Turf.js está cargado.
   */
  constructor({
    map, catalog, selections, resolver, writer, isAvailable,
  }) {
    this.map_ = map;
    this.catalog_ = catalog;
    this.selections_ = selections;
    this.resolver_ = resolver;
    this.writer_ = writer;
    this.isAvailable_ = isAvailable;
  }

  /**
   * Comprueba una configuración sin convertir geometrías. Lo usan el
   * formulario, para mostrar opciones y errores, y la ejecución.
   *
   * @param {LayerOperation} op Operación.
   * @param {LayerOperationConfig} config Configuración.
   * @returns {CheckReport} Diagnóstico.
   */
  check(op, config = {}) {
    const errors = [];
    if (!this.isAvailable_()) errors.push(new OperationError(ErrorKey.NOT_LOADED));
    const entries = {};
    const meta = {};
    const fields = {};
    op.inputs.forEach((spec) => {
      const roleEntries = (config.inputs && config.inputs[spec.role]) || [];
      const reports = roleEntries.map((entry) => this.checkEntry_(spec, entry, errors));
      checkRoleEntries(spec, roleEntries, errors);
      const infos = reports.filter((report) => report.info !== null && !report.issue)
        .map((report) => report.info);
      entries[spec.role] = reports;
      meta[spec.role] = {
        types: unique(infos.flatMap((info) => LayerCatalog.admittedTypes(info, spec))),
        count: reports.reduce((sum, r) => sum + (r.info ? r.info.count - r.omitted : 0), 0),
      };
      fields[spec.role] = {
        available: unique(infos.flatMap((info) => info.fields)),
        excluded: infos.flatMap((info) => info.excludedFields)
          .filter((field, i, all) => all.findIndex((f) => f.name === field.name) === i),
      };
    });
    const params = LayerOperationRunner.normalizeParams(op, config.params);
    const options = op.params.filter((param) => param.availableOptions)
      .reduce((acc, param) => ({ ...acc, [param.name]: param.availableOptions(meta) }), {});
    op.params.map((param) => checkParam(param, params[param.name], options[param.name]))
      .filter((error) => error !== null)
      .forEach((error) => errors.push(error));
    const complete = op.inputs.every((spec) => meta[spec.role].types.length > 0);
    const validation = complete && op.validate ? op.validate(meta, params) : null;
    if (validation) errors.push(new OperationError(validation));
    const schema = this.buildSchema_(op, params, fields, config.attributes || {}, errors);
    return {
      errors, entries, meta, params, options, fields, schema,
    };
  }

  /**
   * Ejecuta una operación y crea su capa de resultado.
   *
   * @param {LayerOperation} op Operación.
   * @param {LayerOperationConfig} config Configuración.
   * @returns {RunResult} Resultado.
   * @throws {OperationError} Si la configuración no es válida o el cálculo falla.
   */
  run(op, config) {
    const report = this.check(op, config);
    if (report.errors.length > 0) throw report.errors[0];
    const { inputs, skipped } = this.resolver_.resolve(op, config.inputs);
    const validation = op.validate ? op.validate(metaOfInputs(inputs), report.params) : null;
    if (validation) throw new OperationError(validation);
    const output = op.execute({ inputs, params: report.params });
    const features = output.records.map((record) => this.toOutputFeature_(record, report.schema));
    const layer = this.writer_.write(op.id, features, config.outputName);
    return {
      layer,
      count: layer === null ? 0 : features.length,
      skipped: [...skipped, ...(output.skipped || [])],
    };
  }

  /**
   * Completa los parámetros con sus valores por defecto.
   *
   * @param {LayerOperation} op Operación.
   * @param {Object} [values] Valores indicados.
   * @returns {Object} Valores de todos los parámetros.
   */
  static normalizeParams(op, values = {}) {
    return op.params.reduce((acc, param) => ({
      ...acc,
      [param.name]: values[param.name] === undefined ? param.default : values[param.name],
    }), {});
  }

  /**
   * Comprueba una entrada y describe sus elementos según su ámbito.
   *
   * @private
   * @param {InputRoleSpec} spec Papel.
   * @param {InputEntry} entry Entrada.
   * @param {Array<OperationError>} errors Errores (se completa).
   * @returns {EntryReport} Diagnóstico.
   */
  checkEntry_(spec, entry, errors) {
    const layer = entry.layerId ? this.catalog_.findLayer(entry.layerId) : null;
    if (layer === null) {
      errors.push(entry.layerId
        ? new OperationError(ErrorKey.LAYER_NOT_FOUND, { layer: entry.layerId })
        : new OperationError(ErrorKey.NO_LAYER, { role: spec.role }));
      return { entry, info: null, omitted: 0 };
    }
    let features;
    if (entry.scope === InputScope.SELECTION) {
      const snapshot = this.selections_.get(layer.idLayer);
      if (!snapshot) {
        errors.push(new OperationError(ErrorKey.NO_SELECTION, { layer: layerTitle(layer) }));
        return { entry, info: null, omitted: 0 };
      }
      const state = SelectionRegistry.check(snapshot);
      if (state.missing > 0) {
        errors.push(new OperationError(ErrorKey.STALE_SELECTION, {
          layer: layerTitle(layer), n: state.missing,
        }));
      }
      features = state.features;
    } else if (entry.scope === InputScope.RESULT && !LayerCatalog.isResult(layer)) {
      errors.push(new OperationError(ErrorKey.NOT_RESULT, { layer: layerTitle(layer) }));
    }
    const info = this.catalog_.describe(layer, features);
    const issue = LayerCatalog.issueFor(info, spec);
    if (issue) {
      errors.push(new OperationError(ErrorKey.LAYER_INCOMPATIBLE, {
        layer: info.title, role: spec.role, reason: issue.issue, types: issue.types,
      }));
    }
    return {
      entry, info, issue, omitted: issue ? 0 : LayerCatalog.omittedFor(info, spec),
    };
  }

  /**
   * Construye el esquema de la salida con los campos elegidos de cada papel,
   * en el orden en que aparecen en sus capas.
   *
   * @private
   * @param {LayerOperation} op Operación.
   * @param {Object} params Parámetros.
   * @param {Object<InputRole, Object>} fields Campos de cada papel.
   * @param {Object<InputRole, Object>} attributes Configuración de atributos.
   * @param {Array<OperationError>} errors Errores (se completa).
   * @returns {AttributeSchema} Esquema.
   */
  buildSchema_(op, params, fields, attributes, errors) {
    const roleFields = op.attributeRoles(params).map((role) => {
      const available = fields[role] ? fields[role].available : [];
      const config = attributes[role] || {};
      if (!Array.isArray(config.fields)) {
        return { role, fields: available, prefix: config.prefix || '' };
      }
      config.fields.filter((field) => !available.includes(field)).forEach((field) => {
        errors.push(new OperationError(ErrorKey.UNKNOWN_FIELD, { field, role }));
      });
      return {
        role,
        fields: available.filter((field) => config.fields.includes(field)),
        prefix: config.prefix || '',
      };
    });
    return AttributeSchema.build(roleFields, op.aggregates ? op.aggregates(params) : []);
  }

  /**
   * Construye un elemento de salida a partir de un resultado.
   *
   * @private
   * @param {ProvenanceRecord} record Resultado.
   * @param {AttributeSchema} schema Esquema.
   * @returns {OutputFeature} Elemento.
   */
  toOutputFeature_(record, schema) {
    const properties = schema.project(record.sources);
    if (record.keepGeometryOf) {
      return {
        geometry: record.sources[record.keepGeometryOf][0].getSourceGeometry(),
        properties,
        projection: this.map_.getProjection().code,
      };
    }
    return { geometry: record.geometry, properties, projection: TURF_PROJECTION };
  }
}
