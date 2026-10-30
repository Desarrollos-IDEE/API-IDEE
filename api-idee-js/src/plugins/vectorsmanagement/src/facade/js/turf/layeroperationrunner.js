import AttributeSchema from './attributes/attributeschema';
import { COUNT_FIELD, SOURCE_LAYER_FIELD, distinct } from './attributes/fieldpolicies';
import LayerCatalog from './layers/layercatalog';
import { lookupEntry } from './layers/inputresolver';
import { TURF_PROJECTION } from './layers/resultlayers';
import {
  Aggregate, ErrorKey, InputScope, OperationError, Output, ParamType,
} from './turftypes';

/**
 * Configuración de una ejecución de una operación.
 * @typedef {Object} LayerOperationConfig
 * @property {Object<InputRole, Array<InputEntry>>} inputs Entradas por papel.
 * @property {Object} [params] Valores de los parámetros; los que falten toman
 * su valor por defecto.
 * @property {Object<InputRole, {fields: (Array<String>|undefined), prefix: String}>}
 * [attributes] Campos y prefijo por papel; si no se indican los campos, se
 * copian todos (ninguno si cada resultado combina varios elementos).
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
 * @property {Array<NoticeKey>} notices Avisos que no impiden ejecutar.
 * @property {Object<InputRole, Array<EntryReport>>} entries Entradas por papel.
 * @property {Object<InputRole, RoleMeta>} meta Resumen de cada papel.
 * @property {Object} params Valores de los parámetros.
 * @property {Object<ParamName, Array<String>>} options Opciones válidas de los desplegables.
 * @property {Object<InputRole, {available: Array<String>, excluded: Array<Object>}>} fields
 * Campos de cada papel.
 * @property {Object<InputRole, Array<String>>} chosenFields Campos que se copian de
 * cada papel.
 * @property {Boolean} combines Indica si cada resultado puede reunir varios elementos.
 * @property {AttributeSchema} schema Esquema de la salida.
 */

/**
 * Resultado de una ejecución.
 * @typedef {Object} RunResult
 * @property {IDEE.layer.Vector|null} [layer] Capa creada o null si no hay
 * resultados (Output.GEOMETRY).
 * @property {Number} [count] Número de elementos de la capa (Output.GEOMETRY).
 * @property {*} [value] Valor calculado (Output.VALUE).
 * @property {Object} params Valores de los parámetros usados.
 * @property {Array<Object>} skipped Elementos de entrada sin resultado.
 */

/**
 * Resumen de los elementos de cada papel ya resueltos.
 *
 * @param {Object<InputRole, Array<InputFeature>>} inputs Elementos por papel.
 * @returns {Object<InputRole, RoleMeta>} Resumen.
 */
const metaOfInputs = (inputs) => Object.keys(inputs).reduce((meta, role) => ({
  ...meta,
  [role]: {
    types: distinct(inputs[role].map((feature) => feature.geometry.type)),
    count: inputs[role].length,
  },
}), {});

/**
 * Indica si un parámetro se aplica con los valores indicados.
 *
 * @param {TurfParam} param Parámetro.
 * @param {Object} params Valores de los parámetros.
 * @returns {Boolean}
 */
export const isApplicable = (param, params) => !param.when || param.when(params);

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
 * Comprueba el número de capas de un papel y que sus entradas no se
 * repitan: una capa solo puede aparecer varias veces con entidades
 * concretas distintas.
 *
 * @param {InputRoleSpec} spec Papel.
 * @param {Array<InputEntry>} entries Entradas.
 * @param {Array<OperationError>} errors Errores (se completa).
 */
const checkRoleEntries = (spec, entries, errors) => {
  const maxLayers = spec.maxLayers ?? Number.POSITIVE_INFINITY;
  const layerIds = distinct(entries.map((entry) => entry.layerId));
  if (entries.length === 0) {
    errors.push(new OperationError(ErrorKey.NO_LAYER, { role: spec.role }));
  } else if (layerIds.length > maxLayers) {
    errors.push(new OperationError(ErrorKey.MAX_LAYERS, { role: spec.role, n: maxLayers }));
  }
  const repeated = layerIds.some((id) => {
    const same = entries.filter((entry) => entry.layerId === id);
    if (same.length < 2) return false;
    return !same.every((entry) => entry.scope === InputScope.FEATURE)
      || distinct(same.map((entry) => entry.featureKey)).length !== same.length;
  });
  if (repeated) errors.push(new OperationError(ErrorKey.DUPLICATED_LAYER, { role: spec.role }));
};

/**
 * Comprueba el número de elementos de cada papel.
 *
 * @param {LayerOperation} op Operación.
 * @param {Object<InputRole, RoleMeta>} meta Resumen de cada papel.
 * @returns {Array<OperationError>} Errores.
 */
const checkFeatureCounts = (op, meta) => op.inputs.flatMap((spec) => {
  const { role, minFeatures = 1, maxFeatures } = spec;
  const { count } = meta[role];
  if (count === 0) return [];
  if (minFeatures === maxFeatures && count !== minFeatures) {
    return [new OperationError(ErrorKey.EXACT, { role, n: minFeatures, count })];
  }
  if (count < minFeatures) {
    return [new OperationError(ErrorKey.MIN, { role, n: minFeatures, count })];
  }
  if (maxFeatures !== undefined && count > maxFeatures) {
    return [new OperationError(ErrorKey.MAX, { role, n: maxFeatures, count })];
  }
  return [];
});

/**
 * Columnas agregadas de la salida: el número de elementos si cada resultado
 * combina varios y, si se pide, la capa de origen.
 *
 * @param {Array<InputRole>} roles Papeles que aportan campos.
 * @param {Boolean} combines Indica si los resultados combinan varios elementos.
 * @param {Object} params Parámetros.
 * @returns {Array<AggregateSpec>} Columnas.
 */
const aggregatesOf = (roles, combines, params) => [
  ...(combines
    ? roles.map((role) => ({ role, aggregate: Aggregate.COUNT, name: COUNT_FIELD })) : []),
  ...(params.sourceLayer === true
    ? roles.map((role) => ({ role, aggregate: Aggregate.LAYERS, name: SOURCE_LAYER_FIELD })) : []),
];

/**
 * @classdesc
 * Ejecuta las operaciones del catálogo: comprueba la configuración, resuelve
 * las entradas, calcula los resultados con su procedencia y entrega una capa
 * (con sus atributos) o un valor. No muestra mensajes: devuelve el
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

    /**
     * Forma de entregar el resultado de cada tipo de operación.
     * @private
     * @type {Object<Output, function(Object): Object>}
     */
    this.outputHandlers_ = {
      [Output.GEOMETRY]: (context) => this.writeLayer_(context),
      [Output.VALUE]: ({ output }) => ({ value: output.value }),
    };
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
    let entriesValid = true;
    op.inputs.forEach((spec) => {
      const roleEntries = (config.inputs && config.inputs[spec.role]) || [];
      const before = errors.length;
      const reports = roleEntries.map((entry) => this.checkEntry_(spec, entry, errors));
      checkRoleEntries(spec, roleEntries, errors);
      entriesValid = entriesValid && errors.length === before;
      const infos = reports.filter((report) => report.info !== null && !report.issue)
        .map((report) => report.info);
      entries[spec.role] = reports;
      meta[spec.role] = {
        types: distinct(infos.flatMap((info) => LayerCatalog.admittedTypes(info, spec))),
        count: reports.reduce((sum, r) => sum + (r.info ? r.info.count - r.omitted : 0), 0),
      };
      fields[spec.role] = {
        available: distinct(infos.flatMap((info) => info.fields)),
        excluded: infos.flatMap((info) => info.excludedFields)
          .filter((field, i, all) => all.findIndex((f) => f.name === field.name) === i),
      };
    });
    if (entriesValid) errors.push(...checkFeatureCounts(op, meta));
    const params = LayerOperationRunner.normalizeParams(op, config.params);
    const options = op.params.filter((param) => param.availableOptions)
      .reduce((acc, param) => ({ ...acc, [param.name]: param.availableOptions(meta) }), {});
    op.params.filter((param) => isApplicable(param, params))
      .map((param) => checkParam(param, params[param.name], options[param.name]))
      .filter((error) => error !== null)
      .forEach((error) => errors.push(error));
    const complete = op.inputs.every((spec) => meta[spec.role].types.length > 0);
    const validation = complete && op.validate ? op.validate(meta, params) : null;
    if (validation) errors.push(new OperationError(validation));
    const notices = complete && op.notices ? op.notices(meta, params) : [];
    const combines = op.combines ? op.combines(params) : false;
    const attributes = config.attributes || {};
    const { schema, chosenFields } = this.buildSchema_(op, params, fields, attributes, errors);
    return {
      errors, notices, entries, meta, params, options, fields, chosenFields, combines, schema,
    };
  }

  /**
   * Ejecuta una operación y entrega su resultado: una capa nueva o un valor.
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
    const meta = metaOfInputs(inputs);
    const [countError] = checkFeatureCounts(op, meta);
    if (countError) throw countError;
    const validation = op.validate ? op.validate(meta, report.params) : null;
    if (validation) throw new OperationError(validation);
    const output = op.execute({ inputs, params: report.params });
    return {
      ...this.outputHandlers_[op.output]({
        op, output, report, config,
      }),
      params: report.params,
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
    if (!entry.layerId) {
      errors.push(new OperationError(ErrorKey.NO_LAYER, { role: spec.role }));
      return { entry, info: null, omitted: 0 };
    }
    const { layer, features, error } = lookupEntry(entry, this.catalog_, this.selections_);
    if (error) errors.push(error);
    if (layer === null || features === undefined) return { entry, info: null, omitted: 0 };
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
   * en el orden en que aparecen en sus capas. Si no se eligen, se copian
   * todos, salvo que cada resultado combine varios elementos.
   *
   * @private
   * @param {LayerOperation} op Operación.
   * @param {Object} params Parámetros.
   * @param {Object<InputRole, Object>} fields Campos de cada papel.
   * @param {Object<InputRole, Object>} attributes Configuración de atributos.
   * @param {Array<OperationError>} errors Errores (se completa).
   * @returns {{schema: AttributeSchema, chosenFields: Object<InputRole, Array<String>>}}
   * Esquema y campos elegidos de cada papel.
   */
  buildSchema_(op, params, fields, attributes, errors) {
    if (op.output !== Output.GEOMETRY) {
      return { schema: AttributeSchema.build([]), chosenFields: {} };
    }
    const roles = op.attributeRoles(params);
    const combines = op.combines ? op.combines(params) : false;
    const roleFields = roles.map((role) => {
      const available = fields[role] ? fields[role].available : [];
      const config = attributes[role] || {};
      if (!Array.isArray(config.fields)) {
        return { role, fields: combines ? [] : available, prefix: config.prefix || '' };
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
    return {
      schema: AttributeSchema.build(
        roleFields,
        aggregatesOf(roles, combines, params),
        combines ? params.fieldPolicy : undefined,
      ),
      chosenFields: roleFields.reduce((acc, { role, fields: chosen }) => ({
        ...acc, [role]: chosen,
      }), {}),
    };
  }

  /**
   * Crea la capa de salida con los resultados y sus atributos.
   *
   * @private
   * @param {Object} context Ejecución: op, output (OperationOutput), report y config.
   * @returns {{layer: (IDEE.layer.Vector|null), count: Number}} Capa y número de elementos.
   */
  writeLayer_({
    op, output, report, config,
  }) {
    const features = output.records.map((record) => this.toOutputFeature_(record, report.schema));
    const layer = this.writer_.write(op.id, features, config.outputName);
    return { layer, count: layer === null ? 0 : features.length };
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
