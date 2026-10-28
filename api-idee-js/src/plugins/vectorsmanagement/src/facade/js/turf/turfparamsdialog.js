import template from '../../../templates/turfparams';
import fieldsTemplate from '../../../templates/turfparamfields';
import { getValue } from '../i18n/language';
import { OptionsKey, ParamType, Step } from './turftypes';

/** @typedef {import('./turftypes').TurfOperation} TurfOperation */

const RUN_BUTTON_ID = 'm-vectorsmanagement-turf-run';

/**
 * Prefijo de los identificadores de los campos del formulario.
 * @const
 * @type {String}
 */
const FIELD_ID_PREFIX = 'm-vectorsmanagement-turf-param-';

/**
 * @classdesc
 * Formulario de parámetros de una operación de Turf.js
 */
export default class TurfParamsDialog {
  /**
   * @constructor
   * @param {Number} order Orden de tabulación de los elementos del diálogo.
   * @api stable
   */
  constructor(order) {
    this.order_ = order;
    this.op_ = null;
    this.form_ = null;
    this.closeButton_ = null;
    this.resolve_ = null;
    this.resolved_ = false;
  }

  /**
   * Prepara los parámetros de la operación para la plantilla.
   *
   * @param {TurfOperation|LayerOperation} op Operación del catálogo.
   * @param {Object} [values] Valores actuales; por defecto, los de cada parámetro.
   * @param {Object<ParamName, Array<String>>} [available] Opciones que se
   * muestran en cada desplegable; por defecto, todas.
   * @returns {Array<Object>}
   */
  static getTemplateParams(op, values = {}, available = {}) {
    return op.params.map((param) => {
      const value = this.getOptionalValue_(values[param.name], param.default);
      return {
        id: `${FIELD_ID_PREFIX}${param.name}`,
        name: param.name,
        label: getValue(`turf.params.${param.name}`),
        help: param.help ? getValue(`turf.paramsHelp.${param.help}`) : '',
        isSelect: param.type === ParamType.SELECT,
        isNumber: param.type === ParamType.NUMBER,
        isCheckbox: param.type === ParamType.CHECKBOX,
        default: value,
        step: this.getOptionalValue_(param.step, Step.ANY),
        required: param.required !== false,
        hasMin: param.min !== undefined,
        min: param.min,
        hasMax: param.max !== undefined,
        max: param.max,
        options: (available[param.name] || param.options || []).map((option) => ({
          value: option,
          label: getValue(`turf.${this.getOptionalValue_(param.optionsKey, OptionsKey.UNITS)}.${option}`),
          selected: option === value,
        })),
      };
    });
  }

  /**
   * Genera el HTML de los campos de los parámetros.
   *
   * @param {TurfOperation|LayerOperation} op Operación del catálogo.
   * @param {Number} order Orden de tabulación.
   * @param {Object} [values] Valores actuales.
   * @param {Object<ParamName, Array<String>>} [available] Opciones de los desplegables.
   * @param {Boolean} [showHelp=true] false para no mostrar los textos de ayuda
   * (el formulario del panel los muestra en un modal).
   * @returns {String} HTML.
   */
  static renderFields(op, order, values, available, showHelp = true) {
    const params = this.getTemplateParams(op, values, available)
      .map((param) => (showHelp ? param : { ...param, help: '' }));
    return IDEE.template.compileSync(fieldsTemplate, {
      parseToHtml: false,
      vars: { params, order },
    });
  }

  /**
   * Lee el valor de un campo con el tipo de su parámetro.
   *
   * @param {TurfParam} param Parámetro.
   * @param {HTMLInputElement|HTMLSelectElement} input Campo.
   * @returns {*} Valor.
   */
  static readValue(param, input) {
    if (param.type === ParamType.NUMBER) {
      return input.value === '' ? undefined : parseFloat(input.value);
    }
    return param.type === ParamType.CHECKBOX ? input.checked : input.value;
  }

  /**
   * Abre el formulario de la operación.
   *
   * @param {TurfOperation} op Operación del catálogo.
   * @returns {Promise<Object|null>} Valores del formulario o null si se cancela.
   */
  open(op) {
    return new Promise((resolve) => {
      const message = IDEE.template.compileSync(template, {
        parseToHtml: false,
        vars: {
          desc: getValue(`turf.ops.${op.id}.desc`),
          fields: TurfParamsDialog.renderFields(op, this.order_),
        },
      });

      this.op_ = op;
      this.resolve_ = resolve;
      this.resolved_ = false;

      const dialog = IDEE.dialog.info(message, getValue(`turf.ops.${op.id}.name`), this.order_, {
        intelligence: false,
        actions: [{
          id: RUN_BUTTON_ID,
          label: getValue('turf.run'),
          onClick: () => this.submit_(),
          order: this.order_,
        }],
      });

      this.form_ = dialog.querySelector('#m-vectorsmanagement-turf-form');
      this.closeButton_ = IDEE.dialog.getCloseButton(dialog);
      const runButton = dialog.querySelector(`#${RUN_BUTTON_ID}`);

      this.closeButton_.textContent = getValue('cancel');
      this.closeButton_.addEventListener('click', () => this.finish_(null));

      this.form_.addEventListener('input', () => {
        runButton.disabled = !this.form_.checkValidity();
      });
      this.form_.addEventListener('submit', (evt) => {
        evt.preventDefault();
        this.submit_();
      });
      this.form_.addEventListener('keydown', (evt) => {
        if (evt.key === 'Escape') {
          this.closeButton_.click();
        }
      });

      const firstField = this.form_.querySelector('input, select');
      if (firstField) firstField.focus();
    });
  }

  /**
   * Lee los valores del formulario con el tipo de cada parámetro.
   *
   * @param {TurfOperation} op Operación del catálogo.
   * @param {HTMLFormElement} form Formulario.
   * @returns {Object} Valores por nombre de parámetro.
   */
  static readValues(op, form) {
    return op.params.reduce((values, param) => ({
      ...values,
      [param.name]: this.readValue(param, form.elements.namedItem(param.name)),
    }), {});
  }

  /**
   * Devuelve el valor indicado o, si no está definido, el valor por defecto.
   *
   * @private
   * @template T
   * @param {T | undefined} value Valor.
   * @param {T} fallback Valor por defecto.
   * @returns {T} Valor indicado o valor por defecto.
   */
  static getOptionalValue_(value, fallback) {
    return value === undefined ? fallback : value;
  }

  /**
   * Resuelve la promesa de open().
   *
   * @private
   * @param {Object|null} values Valores del formulario o null si se cancela.
   */
  finish_(values) {
    if (!this.resolved_) {
      this.resolved_ = true;
      this.resolve_(values);
    }
  }

  /**
   * Valida el formulario y, si es válido, resuelve con sus valores y cierra el diálogo.
   *
   * @private
   */
  submit_() {
    if (this.form_.checkValidity()) {
      this.finish_(TurfParamsDialog.readValues(this.op_, this.form_));
      this.closeButton_.click();
    } else {
      this.form_.reportValidity();
    }
  }
}
