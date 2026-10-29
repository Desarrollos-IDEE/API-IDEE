import template from '../../../../templates/turfform';
import { getValue } from '../../i18n/language';
import LayerCatalog, { TECHNICAL_FIELDS } from '../layers/layercatalog';
import SelectionRegistry from '../layers/selectionregistry';
import { InputScope, Output, ParamType } from '../turftypes';
import { showOperationHelp } from './helpdialog';
import {
  errorMessage, layerIssueText, roleLabel, translate,
} from './messages';
import { readValue, renderFields } from './paramfields';

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
 * Opción del selector de entidades de una entrada (ámbito FEATURE).
 * @typedef {Object} FeatureOption
 * @property {String} key Clave del elemento (SelectionRegistry.keyOf).
 * @property {String} text Texto de la opción.
 */

/**
 * Texto que identifica una entidad: su posición en la selección, su
 * identificador y el primer valor de sus campos distinto de él.
 *
 * @param {IDEE.Feature} feature Elemento.
 * @param {Number} position Posición en la selección (desde 1).
 * @returns {String} Texto.
 */
const featureLabel = (feature, position) => {
  const id = feature.getId();
  const attributes = feature.getAttributes() || {};
  const value = Object.keys(attributes)
    .filter((name) => !TECHNICAL_FIELDS.includes(name))
    .map((name) => attributes[name])
    .find((v) => v !== null && v !== undefined && v !== '' && typeof v !== 'object' && v !== id);
  const parts = [id, value].filter((part) => part !== undefined && part !== null);
  return parts.length > 0 ? `${position}. ${parts.join(' · ')}` : `${position}.`;
};

/**
 * Texto con lo que se va a procesar en una entrada.
 *
 * @param {EntryReport} report Diagnóstico de la entrada.
 * @param {String} [feature] Texto de la entidad elegida (ámbito FEATURE).
 * @returns {String} Texto (vacío si la entrada no tiene capa válida).
 */
const entrySummary = (report, feature = '') => {
  if (!report || !report.info) return '';
  const { entry, info, omitted } = report;
  const summary = translate(`turf.form.summary.${entry.scope}`, {
    layer: info.title,
    n: info.count - omitted,
    types: Object.keys(info.typeCounts).join(', '),
    feature,
  });
  return omitted > 0 ? `${summary} ${translate('turf.form.omitted', { n: omitted })}` : summary;
};

/**
 * @classdesc
 * Formulario de una operación en el panel Turf. Se genera a partir de la
 * declaración de la operación: un grupo por papel de entrada (ámbito, capa,
 * entidad y resumen de lo que se va a procesar), los parámetros y, si la
 * operación crea una capa, sus campos y su nombre. No contiene reglas: los
 * errores, los avisos, las opciones disponibles y el esquema de salida los
 * calcula LayerOperationRunner#check.
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
   * @param {function(): Boolean} options.isSelecting Indica si la herramienta de
   * selección del plugin está activa.
   * @param {function(LayerOperation, LayerOperationConfig): void} options.onRun Ejecuta.
   * @param {function(): void} options.onClose Cierra el formulario.
   */
  constructor({
    runner, catalog, selections, order, getActiveLayer, isSelecting, onRun, onClose,
  }) {
    this.runner_ = runner;
    this.catalog_ = catalog;
    this.selections_ = selections;
    this.order_ = order;
    this.getActiveLayer_ = getActiveLayer;
    this.isSelecting_ = isSelecting;
    this.onRun_ = onRun;
    this.onClose_ = onClose;
    this.op_ = null;
    this.config_ = null;
    this.report_ = null;
    this.container_ = null;
  }

  /**
   * Abre el formulario de una operación con su configuración inicial (ver
   * getDefaultConfig_).
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
   * Configuración inicial, que reproduce el comportamiento de las
   * herramientas del plugin: el primer papel usa la capa activa (su
   * selección si la herramienta de selección está activa, o todas sus
   * entidades) y el resto, otras capas compatibles. Los papeles con
   * defaultScope usan la capa activa con ese ámbito; con FEATURE, cada papel
   * toma la siguiente entidad de la selección (p. ej. la primera y la segunda
   * entidad que se comparan).
   *
   * @private
   * @param {LayerOperation} op Operación.
   * @returns {LayerOperationConfig} Configuración.
   */
  getDefaultConfig_(op) {
    const used = [];
    const cache = new Map();
    const active = this.getActiveLayer_();
    const snapshot = active ? this.selections_.get(active.idLayer) : undefined;
    const selected = snapshot ? SelectionRegistry.check(snapshot).features : [];
    let next = 0;
    const inputs = op.inputs.reduce((acc, spec, i) => {
      const scope = spec.defaultScope || (i === 0 ? this.firstScope_(spec) : null);
      let entry = null;
      if (active && scope === InputScope.FEATURE) {
        entry = next < selected.length
          ? this.featureEntry_(active, selected[next])
          : this.otherFeatureEntry_(spec, active, cache);
        if (next < selected.length) next += 1;
      } else if (active && scope === InputScope.SELECTION && selected.length > 0) {
        entry = { layerId: active.idLayer, scope };
      } else if (active && (scope === InputScope.ALL || i === 0)) {
        entry = { layerId: active.idLayer, scope: InputScope.ALL };
      }
      if (entry && !this.isUsable_(spec, entry, cache)) entry = null;
      if (!entry) {
        const candidates = this.getLayerOptions_(spec, InputScope.ALL, cache)
          .filter((option) => !option.disabled);
        const choice = (i === 0 && active && candidates.find((o) => o.id === active.idLayer))
          || candidates.find((o) => !used.includes(o.id)) || candidates[0];
        entry = { layerId: choice ? choice.id : '', scope: InputScope.ALL };
      }
      used.push(entry.layerId);
      return { ...acc, [spec.role]: [entry] };
    }, {});
    return {
      inputs, params: {}, attributes: {}, outputName: '',
    };
  }

  /**
   * Ámbito del primer papel al abrir el formulario.
   *
   * @private
   * @param {InputRoleSpec} spec Papel.
   * @returns {InputScope} Ámbito.
   */
  firstScope_(spec) {
    if (spec.maxFeatures === 1) return InputScope.FEATURE;
    return this.isSelecting_() ? InputScope.SELECTION : InputScope.ALL;
  }

  /**
   * Entrada con una entidad concreta de una capa.
   *
   * @private
   * @param {IDEE.layer.Vector} layer Capa.
   * @param {IDEE.Feature} feature Entidad de la selección guardada de la capa.
   * @returns {InputEntry} Entrada.
   */
  featureEntry_(layer, feature) {
    return {
      layerId: layer.idLayer,
      scope: InputScope.FEATURE,
      featureKey: SelectionRegistry.keyOf(layer, feature),
    };
  }

  /**
   * Entrada con la primera entidad de la selección guardada de otra capa
   * compatible con el papel.
   *
   * @private
   * @param {InputRoleSpec} spec Papel.
   * @param {IDEE.layer.Vector} active Capa activa, que se descarta.
   * @param {Map<String, Array<LayerOption>>} cache Opciones ya calculadas.
   * @returns {InputEntry|null} Entrada o null si no hay ninguna.
   */
  otherFeatureEntry_(spec, active, cache) {
    const option = this.getLayerOptions_(spec, InputScope.FEATURE, cache)
      .find((o) => !o.disabled && o.id !== active.idLayer);
    if (!option) return null;
    const [first] = this.getFeatureOptions_(option.id);
    return first ? { layerId: option.id, scope: InputScope.FEATURE, featureKey: first.key } : null;
  }

  /**
   * Indica si una entrada se puede usar en un papel.
   *
   * @private
   * @param {InputRoleSpec} spec Papel.
   * @param {InputEntry} entry Entrada.
   * @param {Map<String, Array<LayerOption>>} cache Opciones ya calculadas.
   * @returns {Boolean}
   */
  isUsable_(spec, entry, cache) {
    return spec.scopes.includes(entry.scope) && this.getLayerOptions_(spec, entry.scope, cache)
      .some((option) => option.id === entry.layerId && !option.disabled);
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
      const fromSelection = scope === InputScope.SELECTION || scope === InputScope.FEATURE;
      cache.set(key, this.catalog_.getLayers()
        .filter((layer) => this.isInScope_(layer, scope))
        .map((layer) => {
          const features = fromSelection
            ? SelectionRegistry.check(this.selections_.get(layer.idLayer)).features : undefined;
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
   * Entidades de la selección guardada de una capa.
   *
   * @private
   * @param {String} layerId Identificador de la capa.
   * @returns {Array<FeatureOption>} Opciones (vacío si no tiene selección).
   */
  getFeatureOptions_(layerId) {
    const snapshot = this.selections_.get(layerId);
    if (!snapshot) return [];
    return SelectionRegistry.check(snapshot).features.map((feature, i) => ({
      key: SelectionRegistry.keyOf(snapshot.layer, feature),
      text: featureLabel(feature, i + 1),
    }));
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
    if (scope === InputScope.SELECTION || scope === InputScope.FEATURE) {
      return this.selections_.get(layer.idLayer) !== undefined;
    }
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
    const roles = op.inputs.map((spec) => this.getRoleVars_(spec, report, cache));
    const createsLayer = op.output === Output.GEOMETRY;
    const policy = report.combines && report.params.fieldPolicy
      ? getValue(`turf.fieldPolicies.${report.params.fieldPolicy}`) : '';
    return {
      order,
      name: getValue(`turf.ops.${op.id}.name`),
      desc: getValue(`turf.ops.${op.id}.desc`),
      roles,
      hasParams: op.params.length > 0,
      params: renderFields(op, order, report.params, report.options),
      createsLayer,
      attributes: createsLayer ? op.attributeRoles(report.params)
        .map((role) => this.getAttributeVars_(role, report)) : [],
      schema: report.schema.columns.map((column) => ({
        name: column.name,
        renamed: column.renamed,
        source: this.columnSource_(column, policy),
      })),
      outputName: this.config_.outputName,
      outputPlaceholder: getValue('turf.form.outputPlaceholder'),
      processSummary: roles.flatMap((role) => role.entries
        .filter((entry) => entry.summary !== '')
        .map((entry) => `${role.label}: ${entry.summary}`)),
      notices: report.notices.map((notice) => getValue(`turf.notices.${notice}`)),
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
        help: getValue('turf.help.opButton'),
      },
    };
  }

  /**
   * Texto que explica de dónde procede una columna de la salida.
   *
   * @private
   * @param {SchemaColumn} column Columna.
   * @param {String} policy Nombre de la política de combinación ('' si no se combinan).
   * @returns {String} Texto.
   */
  columnSource_(column, policy) {
    const role = roleLabel(this.op_, column.role);
    if (column.aggregate) return translate(`turf.aggregates.${column.aggregate}`, { role });
    const vars = { role, field: column.field, policy };
    if (column.renamed) return translate('turf.form.columnRenamed', vars);
    return translate(policy ? 'turf.form.columnCombined' : 'turf.form.column', vars);
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
      entries: entries.map((entry, index) => {
        const prefix = `${ID_PREFIX}-${role}-${index}`;
        const isFeature = entry.scope === InputScope.FEATURE;
        const features = isFeature ? this.getFeatureOptions_(entry.layerId)
          .map((option) => ({ ...option, selected: option.key === entry.featureKey })) : [];
        const chosen = features.find((option) => option.selected);
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
          isFeature,
          featureSelectId: `${prefix}-feature`,
          featureLabel: getValue('turf.form.feature'),
          features,
          summary: entrySummary(report.entries[role][index], chosen ? chosen.text : ''),
          removable: entries.length > 1,
          removeId: `${prefix}-remove`,
          removeText: getValue('turf.form.removeLayer'),
        };
      }),
      canAdd: entries.length < (spec.maxLayers ?? Number.POSITIVE_INFINITY) && available.length > 0,
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
    const chosen = report.chosenFields[role] || [];
    const layers = report.entries[role]
      .filter((entryReport) => entryReport.info)
      .map((entryReport) => entryReport.info.title);
    return {
      title: translate('turf.form.fieldsOf', {
        role: roleLabel(this.op_, role), layers: [...new Set(layers)].join(', '),
      }),
      combinedNote: report.combines ? getValue('turf.form.combinedFields') : '',
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
        this.config_.params[param.name] = readValue(param, target);
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
      const entry = this.config_.inputs[role][index];
      entry.layerId = target.value;
      if (entry.scope === InputScope.FEATURE) this.chooseFirstFeature_(entry);
      this.resetFields_(role);
    } else if (input === 'feature') {
      this.config_.inputs[role][index].featureKey = target.value;
    } else if (input === 'field') {
      this.toggleField_(role, target.value, target.checked);
    } else {
      const param = this.getParam_(target, ParamType.SELECT)
        || this.getParam_(target, ParamType.CHECKBOX);
      if (!param) return;
      this.config_.params[param.name] = readValue(param, target);
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
    } else if (action === 'help') {
      showOperationHelp(this.op_, this.order_);
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
    if (scope === InputScope.FEATURE) {
      this.chooseFirstFeature_(entry);
    } else {
      delete entry.featureKey;
    }
    this.resetFields_(role);
  }

  /**
   * Elige la primera entidad de la selección guardada de la capa de una
   * entrada, salvo que la entidad elegida siga en ella.
   *
   * @private
   * @param {InputEntry} entry Entrada con ámbito FEATURE.
   */
  chooseFirstFeature_(entry) {
    const options = this.getFeatureOptions_(entry.layerId);
    if (!options.some((option) => option.key === entry.featureKey)) {
      // eslint-disable-next-line no-param-reassign
      entry.featureKey = options.length > 0 ? options[0].key : '';
    }
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
    const current = this.report_.chosenFields[role] || [];
    this.getAttributeConfig_(role).fields = checked
      ? available.filter((name) => current.includes(name) || name === field)
      : current.filter((name) => name !== field);
  }

  /**
   * Vuelve a la selección de campos por defecto de un papel (al cambiar sus
   * capas).
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
