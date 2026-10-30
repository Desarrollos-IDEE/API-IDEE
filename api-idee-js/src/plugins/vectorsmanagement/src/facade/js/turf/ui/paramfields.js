import fieldsTemplate from '../../../../templates/turfparamfields';
import { getValue } from '../../i18n/language';
import { isApplicable } from '../layeroperationrunner';
import { OptionsKey, ParamType, Step } from '../turftypes';

/**
 * Prefijo de los identificadores de los campos de los parámetros.
 * @const
 * @type {String}
 */
const FIELD_ID_PREFIX = 'm-vectorsmanagement-turf-param-';

/**
 * Prepara para la plantilla los parámetros que se aplican con los valores
 * actuales. Sus textos de ayuda se muestran en la ayuda de la operación.
 *
 * @param {LayerOperation} op Operación.
 * @param {Object} values Valores de todos los parámetros.
 * @param {Object<ParamName, Array<String>>} [available] Opciones que se
 * muestran en cada desplegable; por defecto, todas.
 * @returns {Array<Object>} Parámetros.
 */
export const getTemplateParams = (op, values, available = {}) => op.params
  .filter((param) => isApplicable(param, values))
  .map((param) => {
    const value = values[param.name];
    return {
      id: `${FIELD_ID_PREFIX}${param.name}`,
      name: param.name,
      label: getValue(`turf.params.${param.name}`),
      isSelect: param.type === ParamType.SELECT,
      isNumber: param.type === ParamType.NUMBER,
      isCheckbox: param.type === ParamType.CHECKBOX,
      default: value,
      step: param.step === undefined ? Step.ANY : param.step,
      required: param.required !== false,
      hasMin: param.min !== undefined,
      min: param.min,
      hasMax: param.max !== undefined,
      max: param.max,
      options: (available[param.name] || param.options || []).map((option) => ({
        value: option,
        label: getValue(`turf.${param.optionsKey || OptionsKey.UNITS}.${option}`),
        selected: option === value,
      })),
    };
  });

/**
 * Genera el HTML de los campos de los parámetros.
 *
 * @param {LayerOperation} op Operación.
 * @param {Number} order Orden de tabulación.
 * @param {Object} values Valores de todos los parámetros.
 * @param {Object<ParamName, Array<String>>} [available] Opciones de los desplegables.
 * @returns {String} HTML.
 */
export const renderFields = (op, order, values, available) => IDEE.template
  .compileSync(fieldsTemplate, {
    parseToHtml: false,
    vars: { params: getTemplateParams(op, values, available), order },
  });

/**
 * Lee el valor de un campo con el tipo de su parámetro.
 *
 * @param {TurfParam} param Parámetro.
 * @param {HTMLInputElement|HTMLSelectElement} input Campo.
 * @returns {*} Valor.
 */
export const readValue = (param, input) => {
  if (param.type === ParamType.NUMBER) {
    return input.value === '' ? undefined : parseFloat(input.value);
  }
  return param.type === ParamType.CHECKBOX ? input.checked : input.value;
};
