import template from '../../../templates/turfparams';
import { getValue } from '../i18n/language';
import { OptionsKey, ParamType, Step } from './turftypes';

/** @typedef {import('./turftypes').TurfOperation} TurfOperation */

const RUN_BUTTON_ID = 'm-vectorsmanagement-turf-run';

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
   * @param {TurfOperation} op Operación del catálogo.
   * @returns {Array<Object>}
   */
  static getTemplateParams(op) {
    return op.params.map((param) => ({
      name: param.name,
      label: getValue(`turf.params.${param.name}`),
      help: param.help ? getValue(`turf.paramsHelp.${param.help}`) : '',
      isSelect: param.type === ParamType.SELECT,
      isNumber: param.type === ParamType.NUMBER,
      isCheckbox: param.type === ParamType.CHECKBOX,
      default: param.default,
      step: this.getOptionalValue_(param.step, Step.ANY),
      required: param.required !== false,
      hasMin: param.min !== undefined,
      min: param.min,
      hasMax: param.max !== undefined,
      max: param.max,
      options: (param.options || []).map((value) => ({
        value,
        label: getValue(`turf.${this.getOptionalValue_(param.optionsKey, OptionsKey.UNITS)}.${value}`),
        selected: value === param.default,
      })),
    }));
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
          params: TurfParamsDialog.getTemplateParams(op),
          order: this.order_,
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
    return op.params.reduce((values, param) => {
      const input = form.elements.namedItem(param.name);
      let value = input.value;
      if (param.type === ParamType.NUMBER) {
        value = input.value === '' ? undefined : parseFloat(input.value);
      } else if (param.type === ParamType.CHECKBOX) {
        value = input.checked;
      }
      return { ...values, [param.name]: value };
    }, {});
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
