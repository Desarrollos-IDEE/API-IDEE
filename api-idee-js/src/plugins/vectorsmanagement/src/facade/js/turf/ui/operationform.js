import template from '../../../../templates/turfform';
import { getValue } from '../../i18n/language';
import LayerCatalog from '../layers/layercatalog';
import SelectionRegistry from '../layers/selectionregistry';
import TurfParamsDialog from '../turfparamsdialog';
import { InputScope, ParamType } from '../turftypes';
import {
  errorMessage, layerIssueText, roleLabel, translate,
} from './messages';

/**
 * Prefijo de los identificadores de los elementos del formulario.
 * @const
 * @type {String}
 */
const ID_PREFIX = 'm-vectorsmanagement-turf-opform';

/**
 * Opción del selector de capas de una entrada.
 * @typedef {Object} LayerOption
 * @property {String} id Identificador de la capa.
 * @property {String} title Nombre visible.
 * @property {Boolean} disabled Indica si no se puede usar en el papel.
 * @property {String} text Texto de la opción (con el número de elementos o el motivo).
 */

/**
 * Texto con lo que se va a procesar en una entrada.
 *
 * @param {EntryReport} report Diagnóstico de la entrada.
 * @returns {String} Texto (vacío si la entrada no tiene capa válida).
 */
const entrySummary = (report) => {
  if (!report || !report.info) return '';
  const { entry, info, omitted } = report;
  const summary = translate(`turf.form.summary.${entry.scope}`, {
    layer: info.title,
    n: info.count - omitted,
    types: Object.keys(info.typeCounts).join(', '),
  });
  return omitted > 0 ? `${summary} ${translate('turf.form.omitted', { n: omitted })}` : summary;
};

/**
 * @classdesc
 * Formulario de una operación de capas en el panel Turf. Se genera a partir
 * de la declaración de la operación: un grupo por papel de entrada (ámbito,
 * capa y resumen de lo que se va a procesar), los parámetros, los campos de
 * salida y el nombre de la capa resultante. No contiene reglas: los errores,
 * las opciones disponibles y el esquema de salida los calcula
 * LayerOperationRunner#check.
 */
export default class OperationForm {
  /**
   * @constructor
   * @param {Object} options Opciones.
   * @param {LayerOperationRunner} options.runner Comprobación de la configuración.
   * @param {LayerCatalog} options.catalog Capas candidatas.
   * @param {SelectionRegistry} options.selections Selecciones guardadas.
   * @param {Number} options.order Orden de tabulación.
   * @param {function(): (IDEE.layer.Vector|null)} options.getActiveLayer Capa activa del plugin.
   * @param {function(LayerOperation, LayerOperationConfig): void} options.onRun Ejecuta.
   * @param {function(): void} options.onClose Cierra el formulario.
   */
  constructor({
    runner, catalog, selections, order, getActiveLayer, onRun, onClose,
  }) {
    this.runner_ = runner;
    this.catalog_ = catalog;
    this.selections_ = selections;
    this.order_ = order;
    this.getActiveLayer_ = getActiveLayer;
    this.onRun_ = onRun;
    this.onClose_ = onClose;
    this.op_ = null;
    this.config_ = null;
    this.report_ = null;
    this.container_ = null;
  }

  /**
   * Abre el formulario de una operación con su configuración inicial: la
   * capa activa del plugin en la primera entrada y todos sus elementos.
   *
   * @param {LayerOperation} op Operación.
   * @param {HTMLElement} container Contenedor.
   */
  open(op, container) {
    this.op_ = op;
    this.container_ = container;
    this.config_ = this.getDefaultConfig_(op);
    this.render();
    const back = container.querySelector('#m-vectorsmanagement-turf-back');
    if (back) back.focus();
  }

  /**
   * Indica si el formulario está abierto.
   *
   * @returns {Boolean}
   */
  isOpen() {
    return this.op_ !== null;
  }

  /**
   * Cierra el formulario.
   */
  close() {
    if (this.container_) this.container_.replaceChildren();
    this.op_ = null;
    this.config_ = null;
    this.report_ = null;
  }

  /**
   * Devuelve una copia de la configuración actual.
   *
   * @returns {LayerOperationConfig} Configuración.
   */
  getConfig() {
    return JSON.parse(JSON.stringify(this.config_));
  }

  /**
   * Vuelve a generar el formulario (p. ej., al cambiar las capas del mapa o
   * las selecciones guardadas) conservando el elemento con el foco.
   */
  render() {
    if (!this.isOpen()) return;
    const focusedId = this.container_.contains(document.activeElement)
      ? document.activeElement.id : '';
    const html = this.compile_();
    this.container_.replaceChildren(html);
    this.bind_(html);
    const focused = focusedId ? html.querySelector(`[id="${focusedId}"]`) : null;
    if (focused) focused.focus();
  }

  /**
   * Actualiza solo el esquema, el resumen y el botón Ejecutar, sin tocar los
   * campos que se están editando.
   *
   * @private
   */
  renderStatus_() {
    const html = this.compile_();
    html.querySelectorAll('[data-live]').forEach((node) => {
      const current = this.container_.querySelector(`[data-live="${node.dataset.live}"]`);
      if (current) current.replaceWith(node);
    });
  }

  /**
   * Comprueba la configuración y genera el HTML del formulario.
   *
   * @private
   * @returns {HTMLElement} Formulario.
   */
  compile_() {
    this.report_ = this.runner_.check(this.op_, this.config_);
    return IDEE.template.compileSync(template, { vars: this.getTemplateVars_(this.report_) });
  }

  /**
   * Configuración inicial: una entrada por papel con todos sus elementos; la
   * primera usa la capa activa del plugin si es compatible y el resto, capas
   * compatibles distintas.
   *
   * @private
   * @param {LayerOperation} op Operación.
   * @returns {LayerOperationConfig} Configuración.
   */
  getDefaultConfig_(op) {
    const used = [];
    const active = this.getActiveLayer_();
    const cache = new Map();
    const inputs = op.inputs.reduce((acc, spec, i) => {
      const candidates = this.getLayerOptions_(spec, InputScope.ALL, cache)
        .filter((option) => !option.disabled);
      const choice = (i === 0 && active && candidates.find((o) => o.id === active.idLayer))
        || candidates.find((o) => !used.includes(o.id)) || candidates[0];
      if (choice) used.push(choice.id);
      return {
        ...acc,
        [spec.role]: [{ layerId: choice ? choice.id : '', scope: InputScope.ALL }],
      };
    }, {});
    return {
      inputs, params: {}, attributes: {}, outputName: '',
    };
  }

  /**
   * Capas que se pueden elegir en una entrada con un ámbito.
   *
   * @private
   * @param {InputRoleSpec} spec Papel.
   * @param {InputScope} scope Ámbito.
   * @param {Map<String, Array<LayerOption>>} cache Opciones ya calculadas.
   * @returns {Array<LayerOption>} Opciones.
   */
  getLayerOptions_(spec, scope, cache) {
    const key = `${spec.role}|${scope}`;
    if (!cache.has(key)) {
      cache.set(key, this.catalog_.getLayers()
        .filter((layer) => this.isInScope_(layer, scope))
        .map((layer) => {
          const snapshot = this.selections_.get(layer.idLayer);
          const features = scope === InputScope.SELECTION
            ? SelectionRegistry.check(snapshot).features : undefined;
          const info = this.catalog_.describe(layer, features);
          const issue = LayerCatalog.issueFor(info, spec);
          return {
            id: info.id,
            title: info.title,
            disabled: issue !== null,
            text: issue
              ? `${info.title} — ${layerIssueText(issue.issue, issue.types)}`
              : translate('turf.form.layerOption', { layer: info.title, n: info.count }),
          };
        }));
    }
    return cache.get(key);
  }

  /**
   * Indica si una capa se puede elegir con un ámbito.
   *
   * @private
   * @param {IDEE.layer.Vector} layer Capa.
   * @param {InputScope} scope Ámbito.
   * @returns {Boolean}
   */
  isInScope_(layer, scope) {
    if (scope === InputScope.SELECTION) return this.selections_.get(layer.idLayer) !== undefined;
    if (scope === InputScope.RESULT) return LayerCatalog.isResult(layer);
    return true;
  }

  /**
   * Variables de la plantilla.
   *
   * @private
   * @param {CheckReport} report Diagnóstico de la configuración.
   * @returns {Object} Variables.
   */
  getTemplateVars_(report) {
    const op = this.op_;
    const order = this.order_;
    const cache = new Map();
    const aggregates = op.aggregates ? op.aggregates(report.params) : [];
    return {
      order,
      name: getValue(`turf.ops.${op.id}.name`),
      desc: getValue(`turf.ops.${op.id}.desc`),
      roles: op.inputs.map((spec) => this.getRoleVars_(spec, report, cache)),
      hasParams: op.params.length > 0,
      params: TurfParamsDialog.renderFields(op, order, report.params, report.options),
      aggregatesNote: aggregates.length > 0 ? getValue(`turf.ops.${op.id}.aggregatesNote`) : '',
      attributes: op.attributeRoles(report.params)
        .map((role) => this.getAttributeVars_(role, report)),
      schema: report.schema.columns.map((column) => ({
        name: column.name,
        renamed: column.renamed,
        source: column.aggregate
          ? translate(`turf.aggregates.${column.aggregate}`, { role: roleLabel(op, column.role) })
          : translate(column.renamed ? 'turf.form.columnRenamed' : 'turf.form.column', {
            role: roleLabel(op, column.role), field: column.field,
          }),
      })),
      outputName: this.config_.outputName,
      outputPlaceholder: getValue('turf.form.outputPlaceholder'),
      processSummary: op.inputs.flatMap((spec) => report.entries[spec.role]
        .map((entryReport) => entrySummary(entryReport))
        .filter((text) => text !== '')
        .map((text) => `${roleLabel(op, spec.role)}: ${text}`)),
      errors: [...new Set(report.errors.map((error) => errorMessage(op, error)))],
      canRun: report.errors.length === 0,
      translations: {
        back: getValue('turf.form.back'),
        params: getValue('turf.form.params'),
        attributes: getValue('turf.form.attributes'),
        schema: getValue('turf.form.schema'),
        noColumns: getValue('turf.form.noColumns'),
        output: getValue('turf.form.output'),
        willProcess: getValue('turf.form.willProcess'),
        run: getValue('turf.run'),
      },
    };
  }

  /**
   * Variables de la plantilla de un papel de entrada.
   *
   * @private
   * @param {InputRoleSpec} spec Papel.
   * @param {CheckReport} report Diagnóstico.
   * @param {Map<String, Array<LayerOption>>} cache Opciones de capas ya calculadas.
   * @returns {Object} Variables.
   */
  getRoleVars_(spec, report, cache) {
    const { role } = spec;
    const order = this.order_;
    const entries = this.config_.inputs[role];
    const available = this.getLayerOptions_(spec, InputScope.ALL, cache)
      .filter((option) => !option.disabled && !entries.some((e) => e.layerId === option.id));
    return {
      label: roleLabel(this.op_, role),
      help: getValue(`turf.ops.${this.op_.id}.roles.${role}.help`),
      entries: entries.map((entry, index) => {
        const prefix = `${ID_PREFIX}-${role}-${index}`;
        return {
          role,
          index,
          order,
          scopeLabel: getValue('turf.form.scope'),
          scopes: spec.scopes.map((scope) => ({
            id: `${prefix}-scope-${scope}`,
            name: `${prefix}-scope`,
            value: scope,
            label: getValue(`turf.scopes.${scope}`),
            checked: entry.scope === scope,
            disabled: entry.scope !== scope
              && this.getLayerOptions_(spec, scope, cache).length === 0,
            role,
            index,
            order,
          })),
          layerSelectId: `${prefix}-layer`,
          layerLabel: getValue('turf.form.layer'),
          layers: this.getLayerOptions_(spec, entry.scope, cache)
            .map((option) => ({ ...option, selected: option.id === entry.layerId })),
          emptyText: getValue(`turf.form.noLayers.${entry.scope}`),
          summary: entrySummary(report.entries[role][index]),
          removable: entries.length > 1,
          removeId: `${prefix}-remove`,
          removeText: getValue('turf.form.removeLayer'),
        };
      }),
      canAdd: entries.length < (spec.maxLayers || 1) && available.length > 0,
      addId: `${ID_PREFIX}-${role}-add`,
      addText: getValue('turf.form.addLayer'),
      role,
      order,
    };
  }

  /**
   * Variables de la plantilla de los campos de un papel.
   *
   * @private
   * @param {InputRole} role Papel.
   * @param {CheckReport} report Diagnóstico.
   * @returns {Object} Variables.
   */
  getAttributeVars_(role, report) {
    const order = this.order_;
    const fields = report.fields[role] || { available: [], excluded: [] };
    const config = this.config_.attributes[role] || {};
    const chosen = Array.isArray(config.fields) ? config.fields : fields.available;
    const layers = report.entries[role]
      .filter((entryReport) => entryReport.info)
      .map((entryReport) => entryReport.info.title);
    return {
      title: translate('turf.form.fieldsOf', {
        role: roleLabel(this.op_, role), layers: layers.join(', '),
      }),
      fields: fields.available.map((name, i) => ({
        id: `${ID_PREFIX}-${role}-field-${i}`, name, checked: chosen.includes(name), role, order,
      })),
      noFieldsText: getValue('turf.form.noFields'),
      excluded: fields.excluded
        .map(({ name, issue }) => translate(`turf.fieldIssues.${issue}`, { field: name })),
      prefixId: `${ID_PREFIX}-${role}-prefix`,
      prefixLabel: getValue('turf.form.prefix'),
      prefix: config.prefix || '',
      role,
      order,
    };
  }

  /**
   * Asocia los eventos del formulario.
   *
   * @private
   * @param {HTMLFormElement} form Formulario.
   */
  bind_(form) {
    form.addEventListener('input', (evt) => this.onInput_(evt.target));
    form.addEventListener('change', (evt) => this.onChange_(evt.target));
    form.addEventListener('click', (evt) => {
      const button = evt.target.closest('button[data-action]');
      if (button) this.onAction_(button);
    });
    form.addEventListener('submit', (evt) => {
      evt.preventDefault();
      if (this.report_.errors.length === 0) this.onRun_(this.op_, this.getConfig());
    });
    form.addEventListener('keydown', (evt) => {
      if (evt.key === 'Escape') this.onClose_();
    });
  }

  /**
   * Campos que se editan escribiendo: se guarda el valor y se actualiza el
   * resumen sin regenerar el formulario.
   *
   * @private
   * @param {HTMLElement} target Campo.
   */
  onInput_(target) {
    const { input, role } = target.dataset;
    if (input === 'output') {
      this.config_.outputName = target.value;
    } else if (input === 'prefix') {
      this.getAttributeConfig_(role).prefix = target.value;
      this.renderStatus_();
    } else {
      const param = this.getParam_(target, ParamType.NUMBER);
      if (param) {
        this.config_.params[param.name] = TurfParamsDialog.readValue(param, target);
        this.renderStatus_();
      }
    }
  }

  /**
   * Campos de elección: se guarda el valor y se regenera el formulario,
   * porque pueden cambiar las capas, los campos o las opciones disponibles.
   *
   * @private
   * @param {HTMLElement} target Campo.
   */
  onChange_(target) {
    const { input, role } = target.dataset;
    const index = Number(target.dataset.index);
    if (input === 'scope') {
      this.setScope_(role, index, target.value);
    } else if (input === 'layer') {
      this.config_.inputs[role][index].layerId = target.value;
      this.resetFields_(role);
    } else if (input === 'field') {
      this.toggleField_(role, target.value, target.checked);
    } else {
      const param = this.getParam_(target, ParamType.SELECT)
        || this.getParam_(target, ParamType.CHECKBOX);
      if (!param) return;
      this.config_.params[param.name] = TurfParamsDialog.readValue(param, target);
    }
    this.render();
  }

  /**
   * Botones del formulario.
   *
   * @private
   * @param {HTMLButtonElement} button Botón.
   */
  onAction_(button) {
    const { action, role } = button.dataset;
    if (action === 'back') {
      this.onClose_();
    } else if (action === 'add-entry') {
      const spec = this.op_.inputs.find((s) => s.role === role);
      const entries = this.config_.inputs[role];
      const option = this.getLayerOptions_(spec, InputScope.ALL, new Map())
        .find((o) => !o.disabled && !entries.some((e) => e.layerId === o.id));
      entries.push({ layerId: option ? option.id : '', scope: InputScope.ALL });
      this.resetFields_(role);
      this.render();
    } else if (action === 'remove-entry') {
      this.config_.inputs[role].splice(Number(button.dataset.index), 1);
      this.resetFields_(role);
      this.render();
    }
  }

  /**
   * Cambia el ámbito de una entrada; si su capa no está disponible con el
   * nuevo ámbito, elige la primera compatible.
   *
   * @private
   * @param {InputRole} role Papel.
   * @param {Number} index Posición de la entrada.
   * @param {InputScope} scope Ámbito.
   */
  setScope_(role, index, scope) {
    const spec = this.op_.inputs.find((s) => s.role === role);
    const entry = this.config_.inputs[role][index];
    const options = this.getLayerOptions_(spec, scope, new Map());
    entry.scope = scope;
    if (!options.some((o) => o.id === entry.layerId && !o.disabled)) {
      const option = options.find((o) => !o.disabled) || options[0];
      entry.layerId = option ? option.id : '';
    }
    this.resetFields_(role);
  }

  /**
   * Marca o desmarca un campo de salida.
   *
   * @private
   * @param {InputRole} role Papel.
   * @param {String} field Campo.
   * @param {Boolean} checked Indica si se copia a la salida.
   */
  toggleField_(role, field, checked) {
    const available = (this.report_.fields[role] || { available: [] }).available;
    const config = this.getAttributeConfig_(role);
    const current = Array.isArray(config.fields) ? config.fields : available;
    config.fields = checked
      ? available.filter((name) => current.includes(name) || name === field)
      : current.filter((name) => name !== field);
  }

  /**
   * Vuelve a copiar todos los campos de un papel (al cambiar sus capas).
   *
   * @private
   * @param {InputRole} role Papel.
   */
  resetFields_(role) {
    if (this.config_.attributes[role]) delete this.config_.attributes[role].fields;
  }

  /**
   * Configuración de atributos de un papel.
   *
   * @private
   * @param {InputRole} role Papel.
   * @returns {{fields: (Array<String>|undefined), prefix: String}} Configuración.
   */
  getAttributeConfig_(role) {
    if (!this.config_.attributes[role]) this.config_.attributes[role] = { prefix: '' };
    return this.config_.attributes[role];
  }

  /**
   * Parámetro asociado a un campo, si es del tipo indicado.
   *
   * @private
   * @param {HTMLElement} target Campo.
   * @param {ParamType} type Tipo.
   * @returns {TurfParam|undefined} Parámetro.
   */
  getParam_(target, type) {
    return this.op_.params.find((param) => param.name === target.name && param.type === type);
  }
}
